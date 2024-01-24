import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { timeFormat } from '../view/util';
import { Bulk, BulkId, Game, Player } from '../model';
import { Stream, readStream } from '../ndJsonStream';
import { href } from '../routing';
import { bulkPairing } from '../endpoints';
import { sleep, ucfirst } from '../util';

interface BulkGame {
  id: string;
  moves: number;
  result: string;
  players: { white: Player; black: Player };
}

export class BulkShow {
  lichessUrl: string;
  bulk?: Bulk;
  games: BulkGame[] = [];
  gameStream?: Stream;
  liveUpdate = true;
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
    this.gameStream?.close();
    if (this.bulk) {
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/games/export/_ids`, {
        method: 'POST',
        body: this.bulk.games.map(game => game.id).join(','),
        headers: { Accept: 'application/x-ndjson' },
      });
      const handler = (g: Game) => {
        const game = {
          id: g.id,
          players: g.players,
          moves: g.moves ? g.moves.split(' ').length : 0,
          result:
            g.status == 'created' || g.status == 'started'
              ? '*'
              : g.winner == 'white'
                ? '1-0'
                : g.winner == 'black'
                  ? '0-1'
                  : '½-½',
        };
        const exists = this.games.findIndex(g => g.id === game.id);
        if (exists >= 0) this.games[exists] = game;
        else this.games.push(game);
        this.sortGames();
        this.redraw();
      };
      this.gameStream = readStream(res, handler);
      await this.gameStream.closePromise;
      const empty = this.games.length == 0;
      await sleep((empty ? 1 : 5) * 1000);
      this.liveUpdate = this.liveUpdate && (empty || !!this.games.find(g => g.result === '*'));
      if (this.liveUpdate) return await this.loadGames();
    }
  };
  static renderClock = (bulk: Bulk) => `${bulk.clock.limit / 60}+${bulk.clock.increment}`;
  private sortGames = () =>
    this.games.sort((a, b) => {
      if (a.result === '*' && b.result !== '*') return -1;
      if (a.result !== '*' && b.result === '*') return 1;
      if (a.moves !== b.moves) return a.moves < b.moves ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });
  private canStartClocks = () =>
    (!this.bulk?.startClocksAt || this.bulk.startClocksAt > Date.now()) && this.games.find(g => g.moves < 2);
  private startClocks = async () => {
    if (this.bulk && this.canStartClocks()) {
      const res = await this.me.httpClient(
        `${this.app.config.lichessHost}/api/bulk-pairing/${this.id}/start-clocks`,
        { method: 'POST' },
      );
      if (res.status === 200) this.bulk.startClocksAt = Date.now();
    }
  };
  private onDestroy = () => {
    this.gameStream?.close();
    this.liveUpdate = false;
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
        h('nav.mt-5.breadcrumb', [
          h('span.breadcrumb-item', h('a', { attrs: href(bulkPairing.path) }, 'Schedule games')),
          h('span.breadcrumb-item.active', `#${this.id}`),
        ]),
        this.bulk
          ? h(`div.card.my-5`, [
              h('h1.card-header.text-body-emphasis.py-4', `Bulk pairing #${this.id}`),
              h('div.card-body', [
                h(
                  'table.table.table-borderless',
                  h('tbody', [
                    h('tr', [
                      h('th', 'Setup'),
                      h('td', [
                        BulkShow.renderClock(this.bulk),
                        ' ',
                        ucfirst(this.bulk.variant),
                        ' ',
                        this.bulk.rated ? 'Rated' : 'Casual',
                      ]),
                    ]),
                    h('tr', [h('th', 'Created at'), h('td', timeFormat(new Date(this.bulk.scheduledAt)))]),
                    h('tr', [
                      h('th', 'Games scheduled at'),
                      h('td', this.bulk.pairAt ? timeFormat(new Date(this.bulk.pairAt)) : 'Now'),
                    ]),
                    h('tr', [
                      h('th', 'Clocks start at'),
                      h('td', [
                        this.bulk.startClocksAt
                          ? timeFormat(new Date(this.bulk.startClocksAt))
                          : 'When players make a move',
                        this.canStartClocks()
                          ? h(
                              'a.btn.btn-sm.btn-outline-warning.ms-3',
                              {
                                on: {
                                  click: () => {
                                    if (confirm('Start all clocks?')) this.startClocks();
                                  },
                                },
                              },
                              'Start all clocks now',
                            )
                          : undefined,
                      ]),
                    ]),
                    h('tr', [
                      h('th', 'Games started'),
                      h('td.mono', [
                        this.games.filter(g => g.moves > 1).length,
                        ' / ' + this.bulk.games.length,
                      ]),
                    ]),
                    h('tr', [
                      h('th', 'Games completed'),
                      h('td.mono', [
                        this.games.filter(g => g.result !== '*').length,
                        ' / ' + this.bulk.games.length,
                      ]),
                    ]),
                    this.bulk.rules
                      ? h('tr', [
                          h('th', 'Extra rules'),
                          h(
                            'td',
                            this.bulk.rules.map(r => h('span.badge.rounded-pill.text-bg-secondary.mx-1', r)),
                          ),
                        ])
                      : undefined,
                  ]),
                ),
              ]),
            ])
          : h('div.m-5', h('div.spinner-border.d-block.mx-auto', { attrs: { role: 'status' } })),
        ,
        this.bulk
          ? h(
              'table.table.table-striped.table-hover',
              {
                hook: { destroy: () => this.onDestroy() },
              },
              [
                h('thead', [
                  h('tr', [
                    h('th', this.bulk?.games.length + ' games'),
                    h('th', 'White'),
                    h('th', 'Black'),
                    h('th.text-center', 'Result'),
                    h('th.text-end', 'Moves'),
                  ]),
                ]),
                h(
                  'tbody',
                  this.games.map(g =>
                    h('tr', { key: g.id }, [
                      h('td.mono', this.lichessLink(g.id, `#${g.id}`)),
                      h('td', playerLink(g.players.white)),
                      h('td', playerLink(g.players.black)),
                      h('td.mono.text-center', g.result),
                      h('td.mono.text-end', g.moves),
                    ]),
                  ),
                ),
              ],
            )
          : undefined,
      ]),
    );
  };
  private lichessLink = (path: string, text: string) =>
    h('a', { attrs: { target: '_blank', href: `${this.lichessUrl}/${path}` } }, text);
}
