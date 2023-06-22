import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';

export class Pairing {
  constructor(readonly app: App) {}
  render = () => layout(this.app, h('div', 'Pairing'));
  redraw = () => this.app.redraw(this.render());
}
