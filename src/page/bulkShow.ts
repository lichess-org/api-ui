import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { card } from '../view/util';
import { Bulk, BulkId, Game } from '../model';
import { readStream } from '../ndJsonStream';
import { href } from '../routing';
import { bulkPairing } from '../endpoints';

export class BulkShow {
  lichessUrl: string;
  bulk?: Bulk;
  games: Game[] = [];
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
  loadGames = async () => {
    if (this.bulk) {
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/games/export/_ids`, {
        method: 'POST',
        body: this.bulk.games.map(game => game.id).join(','),
        headers: { Accept: 'application/x-ndjson' },
      });
      const handler = (game: Game) => {
        const i = this.games.findIndex(g => g.id === game.id);
        if (i >= 0) this.games[i] = game;
        else this.games.push(game);
        this.redraw();
      };
      const stream = readStream(res, handler);
      return await stream.closePromise;
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
              h('table.table.table-striped', [
                h('thead', [h('tr', [h('th', 'Games'), h('th', 'Moves')])]),
                h(
                  'tbody',
                  this.games.map(g =>
                    h('tr', [
                      h(
                        'td',
                        h('a.lichess-id', { attrs: { href: `${this.lichessUrl}/${g.id}` } }, `#${g.id}`),
                      ),
                      h('td', g.moves),
                    ]),
                  ),
                ),
              ]),
            ])
          : h('div.m-5', h('div.spinner-border.d-block.mx-auto', { attrs: { role: 'status' } })),
      ]),
    );
}
