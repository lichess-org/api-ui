import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';
import * as form from '../view/form';
import { formData, variants } from '../util';
import { Me } from '../auth';
import { timeFormat } from '../view/util';

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

export class BulkPairing {
  feedback: form.Feedback<Result> = undefined;
  lichessUrl: string;
  constructor(readonly app: App, readonly me: Me) {
    this.lichessUrl = app.config.lichessHost;
  }
  redraw = () => this.app.redraw(this.render());
  render = () => {
    return layout(
      this.app,
      h('div', [
        h('h1.mt-5', 'Bulk pairing'),
        h('p.lead', [
          'Uses the ',
          h(
            'a',
            { attrs: { href: 'https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate' } },
            'Lichess bulk pairing API'
          ),
          ' to create a bunch of games at once.',
        ]),
        h('p', [
          'Requires the ',
          h('strong', 'API Challenge admin'),
          ' permission to generate the player challenge tokens automatically.',
        ]),
        this.renderForm(),
      ])
    );
  };

  private onSubmit = async (form: FormData) => {
    const get = (key: string) => form.get(key) as string;
    const dateOf = (key: string) => get(key) && new Date(get(key)).getTime();
    try {
      const playersTxt = get('players');
      let pairingNames: [string, string][];
      try {
        pairingNames = playersTxt
          .split('\n')
          .map(line =>
            line
              .trim()
              .replace(/[\s,]+/g, ' ')
              .split(' ')
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
            .sort(sortFn) as [string, string]
      );
      const rules = ['noAbort', 'noRematch', 'noGiveTime', 'noClaimWin'].filter(key => !!get(key));
      // https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate
      const res = await this.me.httpClient(`${this.lichessUrl}/api/bulk-pairing`, {
        method: 'POST',
        body: formData({
          players: pairingTokens.map(([white, black]) => `${white}:${black}`).join(','),
          'clock.limit': parseFloat(get('clockLimit')) * 60,
          'clock.increment': get('clockIncrement'),
          variant: get('variant'),
          rated: !!get('rated'),
          pairAt: dateOf('pairAt'),
          startClocksAt: dateOf('startClocksAt'),
          rules: rules.join(','),
        }),
      });
      const json: Result = await res.json();
      if (res.status != 200) throw json;
      this.feedback = { result: json };
    } catch (err) {
      this.feedback = {
        message: JSON.stringify(err),
      } as form.Failure;
    }
    this.redraw();
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

  private renderForm = () =>
    h(
      'form.mt-5',
      {
        on: {
          submit: (e: Event) => {
            e.preventDefault();
            this.onSubmit(new FormData(e.target as HTMLFormElement));
          },
        },
      },
      [
        form.isSuccess(this.feedback)
          ? h('div.alert.alert-success', 'Games scheduled!')
          : form.isFailure(this.feedback)
          ? h('div.alert.alert-danger', this.feedback.message)
          : null,
        form.isSuccess(this.feedback) ? this.renderResult(this.feedback.result) : null,
        h('div.mb-3', [
          form.label('Players', 'players'),
          h('textarea.form-control', {
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
        ]),
        h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('randomColor', 'Randomize colors')),
        h('div.mb-3', [
          form.label('Clock'),
          h('div.input-group', [
            form.input('clockLimit', { tpe: 'number', placeholder: 'Initial time in minutes' }),
            h('span.input-group-text', '+'),
            form.input('clockIncrement', { tpe: 'number', placeholder: 'Increment in seconds' }),
          ]),
        ]),
        h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('rated', 'Rated games')),
        h('div.mb-3', [
          form.label('Variant', 'variant'),
          h(
            'select.form-select',
            { attrs: { name: 'variant' } },
            variants.map(([key, name]) => form.selectOption(key, name))
          ),
        ]),
        h('div.mb-3', [
          h('div', form.label('Special rules', 'rules')),
          ...[
            ['noAbort', 'Players cannot abort the game'],
            ['noRematch', 'Players cannot offer a rematch'],
            ['noGiveTime', 'Players cannot give extra time'],
            ['noClaimWin', 'Players cannot claim the win if the opponent leaves'],
          ].map(([key, label]) => h('div.form-check.form-switch.mb-1', form.checkboxWithLabel(key, label))),
        ]),
        h('div.mb-3', [
          form.label('When to create the games', 'pairAt'),
          h('input#pairAt.form-control', {
            attrs: {
              type: 'datetime-local',
              name: 'pairAt',
            },
          }),
          h('p.form-text', 'Leave empty to create the games immediately'),
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
        h('button.btn.btn-primary.btn-lg.mt-3', { type: 'submit' }, 'Schedule the games'),
      ]
    );

  renderResult = (result: Result) =>
    h('div.card.mb-5', [
      h('div.card-body', [
        h('h2.card-title', ['Bulk #', result.id]),
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
            })
          ),
        ]),
      ]),
    ]);
}
