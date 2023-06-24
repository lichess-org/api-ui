import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';
import * as form from '../view/form';
import { formData, variants } from '../util';
import { Me } from '../auth';

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
}

export class Pairing {
  feedback: form.Feedback<Result> = undefined;
  lichessUrl: string;
  constructor(readonly app: App, readonly me: Me) {
    this.lichessUrl = app.config.lichessHost;
  }
  redraw = () => this.app.redraw(this.render());
  render = () => {
    console.log(this.feedback);
    return layout(
      this.app,
      h('div.app-pairing', [
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
    try {
      const playersTxt = form.get('players') as string;
      let pairingNames: [string, string][];
      try {
        pairingNames = playersTxt
          .split('\n')
          .map(line => line.trim().replace(/\s+/g, ' ').split(' '))
          .map(names => [names[0].trim(), names[1].trim()]);
      } catch (err) {
        throw 'Invalid players format';
      }
      const tokens = await this.adminChallengeTokens(pairingNames.flat());
      const randomColor = !!form.get('randomColor');
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
      // https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate
      const res = await this.me.httpClient(`${this.lichessUrl}/api/bulk-pairing`, {
        method: 'POST',
        body: formData({
          players: pairingTokens.map(([white, black]) => `${white}:${black}`).join(','),
          'clock.limit': parseFloat(form.get('clockLimit') as string) * 60,
          'clock.increment': form.get('clockIncrement'),
          variant: form.get('variant'),
          rated: !!form.get('rated'),
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
          ? h('div.alert.alert-success', 'Games created!')
          : form.isFailure(this.feedback)
          ? h('div.alert.alert-danger', this.feedback.message)
          : null,
        form.isSuccess(this.feedback) ? this.renderResult(this.feedback.result) : null,
        h('div.mb-3', [
          form.label('Players', 'players'),
          h(
            'textarea.form-control',
            {
              attrs: {
                name: 'players',
                style: 'height: 100px',
                required: true,
              },
            },
            'lizen50 lizen51'
          ),
          h('p.form-text', [
            'Two usernames per line, each line is a game.',
            h('br'),
            'First username gets the white pieces, unless randomized by the checkbox below.',
          ]),
        ]),
        h('div.form-check.mb-3', form.checkboxWithLabel('randomColor', 'Randomize colors')),
        h('div.mb-3', [
          form.label('Clock'),
          h('div.input-group', [
            form.input('clockLimit', { tpe: 'number', placeholder: 'Initial time in minutes' }),
            h('span.input-group-text', '+'),
            form.input('clockIncrement', { tpe: 'number', placeholder: 'Increment in seconds' }),
          ]),
        ]),
        h('div.form-check.mb-3', form.checkboxWithLabel('rated', 'Rated games')),
        h('div.mb-3', [
          form.label('Variant', 'variant'),
          h(
            'select.form-select',
            { attrs: { name: 'variant' } },
            variants.map(([key, name]) => form.selectOption(key, name))
          ),
        ]),
        h('button.btn.btn-primary.btn-lg.mt-3', { type: 'submit' }, 'Create the games'),
      ]
    );

  renderResult = (result: Result) =>
    h(
      'div.mb-5',
      h('table.table.table-striped', [
        h('thead', h('tr', [h('th', 'Game'), h('th', 'White'), h('th', 'Black')])),
        h(
          'tbody',
          result.games.map(game =>
            h('tr', [
              h('td', h('a', { attrs: { href: `${this.lichessUrl}/${game.id}` } }, '#' + game.id)),
              h('td', h('a', { attrs: { href: `${this.lichessUrl}/@/${game.white}` } }, game.white)),
              h('td', h('a', { attrs: { href: `${this.lichessUrl}/@/${game.black}` } }, game.black)),
            ])
          )
        ),
      ])
    );
}
