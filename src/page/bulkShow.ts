import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { card, timeFormat } from '../view/util';
import { Bulk, BulkId, Game } from '../model';
import { readStream } from '../ndJsonStream';
import { href } from '../routing';
import { bulkPairing } from '../endpoints';
import { sleep } from '../util';

export class BulkShow {
  lichessUrl: string;
  bulk?: Bulk;
  games: Game[] = [];
  table?: JQuery<HTMLElement>;
  constructor(
    readonly app: App,
    readonly me: Me,
    readonly id: BulkId,
  ) {
    this.lichessUrl = app.config.lichessHost;
    this.loadBulk().then(() => this.loadGames());
  }
  loadBulk = async () => {
    const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/bulk-pairing/${this.id}`);
    this.bulk = await res.json();
    this.redraw();
  };
  loadGames = async (): Promise<void> => {
    if (this.bulk) {
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/games/export/_ids`, {
        method: 'POST',
        body: this.bulk.games.map(game => game.id).join(','),
        headers: { Accept: 'application/x-ndjson' },
      });
      const handler = (game: Game) => {
        const exists = this.games.findIndex(g => g.id === game.id);
        if (exists >= 0) this.games[exists] = game;
        else this.games.push(game);
        this.redraw();
      };
      const stream = readStream(res, handler);
      await stream.closePromise;
      if (this.games.find(g => g.status === 'started' || g.status === 'created')) {
        await sleep(1 * 1000);
        return this.loadGames();
      }
    }
  };
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div', [
        h('h1.mt-5.breadcrumb', [
          h('span.breadcrumb-item', h('a', { attrs: href(bulkPairing.path) }, 'Schedule games')),
          h('span.breadcrumb-item.active', `#${this.id}`),
        ]),
        this.bulk
          ? h('div', [
              card(this.bulk.id, [`Bulk pairing #${this.id}`], ['WIP']),
              h('p.lead', [
                'Game scheduled at: ',
                this.bulk.pairAt ? timeFormat(new Date(this.bulk.pairAt)) : 'Now',
                h('br'),
                'Clocks start at: ',
                this.bulk.startClocksAt
                  ? timeFormat(new Date(this.bulk.startClocksAt))
                  : 'Player first moves',
              ]),
              h('table.table.table-striped', [
                h('thead', [
                  h('tr', [
                    h(
                      'th',
                      { attrs: { 'data-field': 'id', 'data-sortable': 'true' } },
                      this.games.length + ' games',
                    ),
                    h('th', { attrs: { 'data-field': 'white', 'data-sortable': 'true' } }, 'White'),
                    h('th', { attrs: { 'data-field': 'black', 'data-sortable': 'true' } }, 'Black'),
                    h('th', { attrs: { 'data-field': 'status', 'data-sortable': 'true' } }, 'Status'),
                    h('th', { attrs: { 'data-field': 'moves', 'data-sortable': 'true' } }, 'Moves'),
                  ]),
                ]),
                h(
                  'tbody',
                  this.games.map(g =>
                    h('tr', [
                      h('td.lichess-id', this.lichessLink(g.id, `#${g.id}`)),
                      h('td', this.lichessLink('@/' + g.players.white.user.name, g.players.white.user.name)),
                      h('td', this.lichessLink('@/' + g.players.black.user.name, g.players.black.user.name)),
                      h('td', g.status),
                      h('td', g.moves ? g.moves.split(' ').length : 0),
                    ]),
                  ),
                ),
              ]),
            ])
          : h('div.m-5', h('div.spinner-border.d-block.mx-auto', { attrs: { role: 'status' } })),
      ]),
    );
  private lichessLink = (path: string, text: string) =>
    h('a', { attrs: { target: '_blank', href: `${this.lichessUrl}/${path}` } }, text);
}
