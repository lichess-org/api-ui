import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import { Feedback, formData, isSuccess, responseToFeedback } from '../form';
import { gameRuleKeys, gameRules } from '../util';
import * as form from '../view/form';
import layout from '../view/layout';
import { card, timeFormat } from '../view/util';

interface Tokens {
  [username: string]: string;
}
interface Result {
  id: string;
  games: {
    id: string;
    white: string;
    black: string;
  }[];
  pairAt: number;
  startClocksAt: number;
}

export class ScheduleGames {
  feedback: Feedback<Result> = undefined;
  lichessUrl: string;
  constructor(
    readonly app: App,
    readonly me: Me,
  ) {
    this.lichessUrl = app.config.lichessHost;
  }
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div', [
        h('h1.mt-5', 'Schedule games'),
        h('p.lead', [
          'Uses the ',
          h(
            'a',
            { attrs: { href: 'https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate' } },
            'Lichess bulk pairing API',
          ),
          ' to create a bunch of games at once.',
        ]),
        h('p', [
          'Requires the ',
          h('strong', 'API Challenge admin'),
          ' permission to generate the player challenge tokens automatically.',
        ]),
        this.renderForm(isSuccess(this.feedback) ? this.feedback.result.id : undefined),
      ]),
    );

  private onSubmit = async (form: FormData) => {
    const get = (key: string) => form.get(key) as string;
    const dateOf = (key: string) => get(key) && new Date(get(key)).getTime();
    try {
      const playersTxt = get('players');
      let pairingNames: [string, string][];
      try {
        pairingNames = playersTxt
          .toLowerCase()
          .split('\n')
          .map(line =>
            line
              .trim()
              .replace(/[\s,]+/g, ' ')
              .split(' '),
          )
          .map(names => [names[0].trim(), names[1].trim()]);
      } catch (err) {
        throw 'Invalid players format';
      }
      const tokens = await this.adminChallengeTokens(pairingNames.flat());
      const randomColor = !!get('randomColor');
      const sortFn = () => (randomColor ? Math.random() - 0.5 : 0);
      const pairingTokens: [string, string][] = pairingNames.map(
        duo =>
          duo
            .map(name => {
              if (!tokens[name]) throw `Missing token for ${name}, is that an active Lichess player?`;
              return tokens[name];
            })
            .sort(sortFn) as [string, string],
      );
      const rules = gameRuleKeys.filter(key => !!get(key));
      const req = this.me.httpClient(`${this.lichessUrl}/api/bulk-pairing`, {
        method: 'POST',
        body: formData({
          players: pairingTokens.map(([white, black]) => `${white}:${black}`).join(','),
          'clock.limit': parseFloat(get('clockLimit')) * 60,
          'clock.increment': get('clockIncrement'),
          variant: get('variant'),
          rated: !!get('rated'),
          fen: get('fen'),
          message: get('message'),
          pairAt: dateOf('pairAt'),
          startClocksAt: dateOf('startClocksAt'),
          rules: rules.join(','),
        }),
      });
      this.feedback = await responseToFeedback(req);
    } catch (err) {
      this.feedback = {
        error: { players: err as string },
      };
    }
    this.redraw();
    document.getElementById('endpoint-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  private adminChallengeTokens = async (users: string[]): Promise<Tokens> => {
    const res = await this.me.httpClient(`${this.lichessUrl}/api/token/admin-challenge`, {
      method: 'POST',
      body: formData({
        users: users.join(','),
        description: 'Tournament pairings from the Lichess team',
      }),
    });
    const json = await res.json();
    if (json.error) throw json.error;
    return json;
  };

  private renderForm = (lastId?: string) =>
    form.form(this.onSubmit, [
      form.feedback(this.feedback),
      isSuccess(this.feedback) ? this.renderResult(this.feedback.result) : undefined,
      h('div.mb-3', [
        h('div.row', [
          h('div.col-md-6', [
            form.label('Players', 'players'),
            h(`textarea#players.form-control.${lastId || 'bulk-new'}`, {
              attrs: {
                name: 'players',
                style: 'height: 100px',
                required: true,
              },
            }),
            h('p.form-text', [
              'Two usernames per line, each line is a game.',
              h('br'),
              'First username gets the white pieces, unless randomized by the switch below.',
            ]),
            h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('randomColor', 'Randomize colors')),
          ]),
          h('div.col-md-6', [
            h('div.card.card-body', [
              h('p.text-muted.small', 'Or load the players and pairings from another website:'),
              h('div.mb-3', [
                form.label('Players URL', 'cr-players-url'),
                form.input('cr-players-url'),
                h('p.form-text', [
                  'Lichess username must be in the "Club/City" field.',
                ]),
                form.label('Pairings URL', 'cr-pairings-url'),
                form.input('cr-pairings-url'),
              ]),
              h(
                'button.btn.btn-secondary.btn-sm.mt-3',
                {
                  attrs: {
                    type: 'button',
                  },
                  on: {
                    click: () => {
                      alert('Not implemented yet');
                    },
                  },
                },
                'Load pairings',
              ),
            ]),
          ]),
        ]),
      ]),
      form.clock(),
      h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('rated', 'Rated games')),
      form.variant(),
      form.fen(),
      h('div.mb-3', [
        form.label('Inbox message', 'message'),
        h(
          'textarea#message.form-control',
          {
            attrs: {
              name: 'message',
              style: 'height: 100px',
            },
          },
          'Your game with {opponent} is ready: {game}.',
        ),
        h('p.form-text', [
          'Message that will be sent to each player, when the game is created. It is sent from your user account.',
          h('br'),
          h('code', '{opponent}'),
          ' and ',
          h('code', '{game}'),
          ' are placeholders that will be replaced with the opponent and the game URLs.',
          h('br'),
          'The ',
          h('code', '{game}'),
          ' placeholder is mandatory.',
        ]),
      ]),
      form.specialRules(gameRules),
      h('div.mb-3', [
        form.label('When to create the games', 'pairAt'),
        h('input#pairAt.form-control', {
          attrs: {
            type: 'datetime-local',
            name: 'pairAt',
          },
        }),
        h('p.form-text', 'Leave empty to create the games immediately.'),
      ]),
      h('div.mb-3', [
        form.label('When to start the clocks', 'startClocksAt'),
        h('input#startClocksAt.form-control', {
          attrs: {
            type: 'datetime-local',
            name: 'startClocksAt',
          },
        }),
        h('p.form-text', [
          'Date at which the clocks will be automatically started.',
          h('br'),
          'Note that the clocks can start earlier than specified, if players start making moves in the game.',
          h('br'),
          'Leave empty so that the clocks only start when players make moves.',
        ]),
      ]),
      form.submit('Schedule the games'),
    ]);

  private renderResult = (result: Result) =>
    card(
      result.id,
      ['Bulk #', result.id],
      [
        h('p.lead', [
          'Game scheduled at: ',
          result.pairAt ? timeFormat(new Date(result.pairAt)) : 'Now',
          h('br'),
          'Clocks start at: ',
          result.startClocksAt ? timeFormat(new Date(result.startClocksAt)) : 'Player first moves',
        ]),
        h('table.table.table-striped', [
          h('thead', h('tr', [h('th', 'Game'), h('th', 'White'), h('th', 'Black')])),
          h(
            'tbody',
            result.games.map(game => {
              const lichessLink = (path: string, text: string) =>
                h('a', { attrs: { target: '_blank', href: `${this.lichessUrl}/${path}` } }, text);
              return h('tr', [
                h('td', lichessLink(game.id, '#' + game.id)),
                h('td', lichessLink(`@/${game.white}`, game.white)),
                h('td', lichessLink(`@/${game.black}`, game.black)),
              ]);
            }),
          ),
        ]),
      ],
    );
}
