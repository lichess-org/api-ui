import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';

export class Pairing {
  constructor(readonly app: App) {}
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(this.app, h('div.app-pairing', [h('h2', 'Pair two players'), h('p', 'Requires admin privileges.')]));
}
