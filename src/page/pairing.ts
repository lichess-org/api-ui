import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';
import * as form from '../view/form';
import { formData, variants } from '../util';
import { Me } from '../auth';

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
      const playerId = form.get('player1') as string;
      const opponentId = form.get('player2') as string;
      const tokens = await this.adminChallengeTokens([playerId, opponentId]);
      const res = await fetch(`${this.app.config.lichessHost}/api/challenge/${opponentId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens[playerId]}`,
        },
        body: formData({
          'clock.limit': parseFloat(form.get('clockLimit') as string) * 60,
          'clock.increment': form.get('clockIncrement'),
          variant: form.get('variant'),
          color: form.get('color'),
          rated: !!form.get('rated'),
          acceptByToken: tokens[opponentId],
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

  private adminChallengeTokens = async (users: string[]): Promise<any> => {
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
        h('div.mb-3', [form.label('Player 1', 'player1'), form.input('player1', { value: 'neio' })]),
        h('div.mb-3', [form.label('Player 2', 'player2'), form.input('player2', { value: 'lizen2' })]),
        h('div.form-check.mb-3', [
          h('input#rated.form-check-input', { attrs: { type: 'checkbox', value: '' } }),
          h('label.form-check-label', { attrs: { for: 'rated' } }, 'Rated game'),
        ]),
        h('select.form-select.mb-3', { attrs: { name: 'color' } }, [
          form.selectOption('random', 'Random color'),
          form.selectOption('white', 'Player 1 is white'),
          form.selectOption('black', 'Player 1 is black'),
        ]),
        h('div.mb-3', [
          form.label('Clock'),
          h('div.input-group', [
            form.input('clockLimit', { tpe: 'number', placeholder: 'Initial time in minutes' }),
            h('span.input-group-text', '+'),
            form.input('clockIncrement', { tpe: 'number', placeholder: 'Increment in seconds' }),
          ]),
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
