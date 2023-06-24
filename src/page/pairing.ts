import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';
import * as form from '../view/form';
import { variants } from '../util';

export class Pairing {
  constructor(readonly app: App) {}
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div.app-pairing', [
        h('h1.mt-5', 'Pair two players'),
        h('p.lead', 'Requires admin privileges.'),
        this.renderForm(),
      ])
    );

  renderForm = () =>
    h('form.mt-5', [
      h('div.mb-3', [form.label('Player 1', 'player1'), form.input('player1')]),
      h('div.mb-3', [form.label('Player 2', 'player2'), form.input('player2')]),
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
          form.input('clock.limit', { placeholder: 'Initial time IN SECONDS' }),
          h('span.input-group-text', '+'),
          form.input('clock.increment', { placeholder: 'Increment in seconds' }),
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
    ]);
}
