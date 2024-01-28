import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { href, timeFormat } from '../view/util';
import { Bulk, BulkId, Game, Player, Username } from '../model';
import { Stream, readStream } from '../ndJsonStream';
import { bulkPairing } from '../endpoints';
import { sleep, ucfirst } from '../util';
import { loadPlayersFromUrl } from '../view/form';
import { Pairing, getPairings, getPlayers, getUrls, saveUrls } from '../scraper/scraper';

type Result = '*' | '1-0' | '0-1' | '½-½' | '+--' | '--+';
interface FormattedGame {
  id: string;
  moves: number;
  result: Result;
  players: { white: Player; black: Player };
  fullNames: { white?: string; black?: string };
}

export class BulkShow {
  lichessUrl: string;
  bulk?: Bulk;
  games: FormattedGame[] = [];
  gameStream?: Stream;
  liveUpdate = true;
  fullNames = new Map<Username, string>();
  crPairings: Pairing[] = [];
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
  loadGames = async (forceUpdate: boolean = false): Promise<void> => {
    this.gameStream?.close();
    if (this.bulk) {
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/games/export/_ids`, {
        method: 'POST',
        body: this.bulk.games.map(game => game.id).join(','),
        headers: { Accept: 'application/x-ndjson' },
      });
      const handler = (g: Game) => {
        const moves = g.moves ? g.moves.split(' ').length : 0;
        const game: FormattedGame = {
          id: g.id,
          players: g.players,
          fullNames: {
            white: this.fullNames.get(g.players.white.user.id),
            black: this.fullNames.get(g.players.black.user.id),
          },
          moves,
          result: this.gameResult(g.status, g.winner, moves),
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
      if (this.liveUpdate || forceUpdate) return await this.loadGames();
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
  private gameResult = (status: string, winner: 'white' | 'black' | undefined, moves: number): Result =>
    status == 'created' || status == 'started'
      ? '*'
      : !winner
        ? '½-½'
        : moves > 1
          ? winner == 'white'
            ? '1-0'
            : '0-1'
          : winner == 'white'
            ? '+--'
            : '--+';

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
                    h('tr', [
                      h('th.w-25', 'Created at'),
                      h('td', timeFormat(new Date(this.bulk.scheduledAt))),
                    ]),
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
                    h('tr', [
                      h('th', 'Player names'),
                      h('td', [
                        h('details', [
                          h('summary.text-muted.form-label', 'Load player names from another site'),
                          h('div.card.card-body', [loadPlayersFromUrl(getUrls(this.bulk.id))]),
                          h(
                            'button.btn.btn-secondary.btn-sm.mt-3',
                            {
                              attrs: {
                                type: 'button',
                              },
                              on: {
                                click: () => {
                                  if (!this.bulk) return;

                                  const pairingsInput = document.getElementById(
                                    'cr-pairings-url',
                                  ) as HTMLInputElement;
                                  const playersInput = document.getElementById(
                                    'cr-players-url',
                                  ) as HTMLInputElement;

                                  saveUrls(this.bulk.id, pairingsInput.value, playersInput.value);
                                  this.loadNamesFromChessResults(pairingsInput, playersInput);

                                  this.loadGames(true);
                                },
                              },
                            },
                            'Load names',
                          ),
                        ]),
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
        this.bulk ? h('div', [this.renderDefaultView(), this.renderChessResultsView()]) : undefined,
      ]),
    );
  };

  renderDefaultView = () => {
    const playerLink = (player: Player) =>
      this.lichessLink(
        '@/' + player.user.name,
        `${player.user.title ? player.user.title + ' ' : ''}${player.user.name}`,
      );
    return h(
      'table.table.table-striped.table-hover',
      {
        hook: { destroy: () => this.onDestroy() },
      },
      [
        h('thead', [
          h('tr', [
            h('th', this.bulk?.games.length + ' games'),
            h('th', 'White'),
            h('th'),
            h('th', 'Black'),
            h('th'),
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
              h('td', g.fullNames.white),
              h('td', playerLink(g.players.black)),
              h('td', g.fullNames.black),
              h('td.mono.text-center', g.result),
              h('td.mono.text-end', g.moves),
            ]),
          ),
        ),
      ],
    );
  };

  renderChessResultsView = () => {
    if (this.crPairings.length === 0) {
      return;
    }

    const results = this.crPairings.map(pairing => {
      const game = this.games.find(
        game =>
          game.players.white.user.id === pairing.white.lichess?.toLowerCase() &&
          game.players.black.user.id === pairing.black.lichess?.toLowerCase(),
      );

      if (!pairing.reversed) {
        return {
          board: pairing.board,
          name1: pairing.white.name,
          name2: pairing.black.name,
          result: game?.result,
          reversed: pairing.reversed,
        };
      } else {
        return {
          board: pairing.board,
          name1: pairing.black.name,
          name2: pairing.white.name,
          result: game?.result.split('').reverse().join(''),
          reversed: pairing.reversed,
        };
      }
    });

    return h('div.mt-5', [
      h('h4', 'Chess Results View'),
      h('table.table.table-striped.table-hover', [
        h(
          'tbody',
          results.map(result =>
            h('tr', { key: result.name1 }, [
              h('td.mono', result.board),
              h('td', result.reversed ? '' : 'w'),
              h('td', result.name1),
              h('td.mono.text-center.table-secondary', result.result),
              h('td', result.reversed ? 'w' : ''),
              h('td', result.name2),
            ]),
          ),
        ),
      ]),
    ]);
  };

  private lichessLink = (path: string, text: string) =>
    h('a', { attrs: { target: '_blank', href: `${this.lichessUrl}/${path}` } }, text);

  private loadNamesFromChessResults = async (
    pairingsInput: HTMLInputElement,
    playersInput: HTMLInputElement,
  ) => {
    try {
      const pairingsUrl = pairingsInput.value;
      const playersUrl = playersInput.value;

      const players = playersUrl ? await getPlayers(playersUrl) : undefined;
      this.crPairings = await getPairings(pairingsUrl, players);

      this.crPairings.forEach(p => {
        p.white.lichess && this.fullNames.set(p.white.lichess.toLowerCase(), p.white.name);
        p.black.lichess && this.fullNames.set(p.black.lichess.toLowerCase(), p.black.name);
      });
    } catch (err) {
      alert(err);
    }
  };
}
