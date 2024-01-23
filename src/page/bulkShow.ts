import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { card, timeFormat } from '../view/util';
import { Bulk, BulkId, Game, Player } from '../model';
import { readStream } from '../ndJsonStream';
import { href } from '../routing';
import { bulkPairing } from '../endpoints';
import { sleep } from '../util';

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
  loadGames = async (): Promise<void> => {
    if (this.bulk) {
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/games/export/_ids`, {
        method: 'POST',
        body: this.bulk.games.map(game => game.id).join(','),
        headers: { Accept: 'application/x-ndjson' },
      });
      const handler = (game: Game) => {
        game.nbMoves = game.moves ? game.moves.split(' ').length : 0;
        const exists = this.games.findIndex(g => g.id === game.id);
        if (exists >= 0) this.games[exists] = game;
        else this.games.push(game);
        this.sortGames();
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
  private sortGames = () => {
    this.games.sort((a, b) => {
      if (a.status === 'created' && b.status !== 'created') return -1;
      if (a.status !== 'created' && b.status === 'created') return 1;
      if (a.status === 'started' && b.status !== 'started') return -1;
      if (a.status !== 'started' && b.status === 'started') return 1;
      if (a.status !== b.status) return a.status < b.status ? -1 : 1;
      if (a.nbMoves !== b.nbMoves) return a.nbMoves < b.nbMoves ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });
  };
  redraw = () => this.app.redraw(this.render());
  render = () => {
    const playerLink = (player: Player) =>
      this.lichessLink(
        '@/' + player.user.name,
        `${player.user.title ? player.user.title + ' ' : ''}${player.user.name}`,
      );
    return layout(
      this.app,
      h('div', [
        h('h1.mt-5.breadcrumb', [
          h('span.breadcrumb-item', h('a', { attrs: href(bulkPairing.path) }, 'Schedule games')),
          h('span.breadcrumb-item.active', `#${this.id}`),
        ]),
        this.bulk
          ? h('div', [
              card(
                this.bulk.id,
                [`Bulk pairing #${this.id}`],
                [
                  h('p.lead', [
                    'Created at: ',
                    timeFormat(new Date(this.bulk.scheduledAt)),
                    h('br'),
                    'Games scheduled at: ',
                    this.bulk.pairAt ? timeFormat(new Date(this.bulk.pairAt)) : 'Now',
                    h('br'),
                    'Clocks start at: ',
                    this.bulk.startClocksAt
                      ? timeFormat(new Date(this.bulk.startClocksAt))
                      : 'Player first moves',
                    h('br'),
                    'Games completed: ' +
                      this.games.filter(g => g.status != 'created' && g.status != 'started').length,
                    ' / ' + this.games.length,
                  ]),
                ],
              ),
              h('table.table.table-striped', [
                h('thead', [
                  h('tr', [
                    h('th', this.games.length + ' games'),
                    h('th', 'White'),
                    h('th', 'Black'),
                    h('th', 'Status'),
                    h('th', 'Moves'),
                  ]),
                ]),
                h(
                  'tbody',
                  this.games.map(g =>
                    h('tr', { key: g.id }, [
                      h('td.lichess-id', this.lichessLink(g.id, `#${g.id}`)),
                      h('td', playerLink(g.players.white)),
                      h('td', playerLink(g.players.black)),
                      h('td.' + g.status, g.status),
                      h('td', g.nbMoves),
                    ]),
                  ),
                ),
              ]),
            ])
          : h('div.m-5', h('div.spinner-border.d-block.mx-auto', { attrs: { role: 'status' } })),
      ]),
    );
  };
  private lichessLink = (path: string, text: string) =>
    h('a', { attrs: { target: '_blank', href: `${this.lichessUrl}/${path}` } }, text);
}
