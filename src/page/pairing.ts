import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';
import * as form from '../view/form';
import { formData, variants } from '../util';
import { Me } from '../auth';

interface Tokens {
  [username: string]: string;
}

export class Pairing {
  feedback: form.Feedback = undefined;
  constructor(readonly app: App, readonly me: Me) {}
  redraw = () => this.app.redraw(this.render());
  render = () => {
    console.log(this.feedback);
    return layout(
      this.app,
      h('div.app-pairing', [
        h('h1.mt-5', 'Pair two players'),
        h('p.lead', 'Requires admin privileges.'),
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
      const sortFn = () => (form.get('randomColor') ? Math.random() - 0.5 : 0);
      const pairingTokens: [string, string][] = pairingNames.map(
        ([white, black]) => [tokens[white], tokens[black]].sort(sortFn) as [string, string]
      );
      // https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/bulk-pairing`, {
        method: 'POST',
        body: formData({
          players: pairingTokens.map(([white, black]) => `${white}:${black}`).join(','),
          'clock.limit': parseFloat(form.get('clockLimit') as string) * 60,
          'clock.increment': form.get('clockIncrement'),
          variant: form.get('variant'),
          rated: !!form.get('rated'),
        }),
      });
      const json = await res.json();
      if (res.status != 200) throw json;
      this.feedback = 'success';
    } catch (err) {
      this.feedback = {
        message: JSON.stringify(err),
      } as form.Failure;
      this.redraw();
    }
  };

  private adminChallengeTokens = async (users: string[]): Promise<Tokens> => {
    const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/token/admin-challenge`, {
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
        this.feedback == 'success'
          ? h('div.alert.alert-success', 'Pairing created!')
          : this.feedback?.message
          ? h('div.alert.alert-danger', this.feedback.message)
          : null,
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
        h('div.form-check.mb-3', [
          h('input#randomColor.form-check-input', { attrs: { type: 'checkbox', value: '' } }),
          h('label.form-check-label', { attrs: { for: 'randomColor' } }, 'Randomize colors'),
        ]),
        h('div.mb-3', [
          form.label('Clock'),
          h('div.input-group', [
            form.input('clockLimit', { tpe: 'number', placeholder: 'Initial time in minutes' }),
            h('span.input-group-text', '+'),
            form.input('clockIncrement', { tpe: 'number', placeholder: 'Increment in seconds' }),
          ]),
        ]),
        h('div.form-check.mb-3', [
          h('input#rated.form-check-input', { attrs: { type: 'checkbox', value: '' } }),
          h('label.form-check-label', { attrs: { for: 'rated' } }, 'Rated games'),
        ]),
        h('div.mb-3', [
          form.label('Variant', 'variant'),
          h(
            'select.form-select',
            { attrs: { name: 'variant' } },
            variants.map(([key, name]) => form.selectOption(key, name))
          ),
        ]),
        h('button.btn.btn-primary.btn-lg.mt-3', { type: 'submit' }, 'Create the game'),
      ]
    );
}
