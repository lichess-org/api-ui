import { App } from '../app';
import { h } from 'snabbdom';
import { href } from '../routing';
import layout from '../view/layout';

export class NotFound {
  constructor(readonly app: App) {}

  render = () => layout(this.app, h('div', [h('h1.mt-5', 'Not Found')]));
  redraw = () => this.app.redraw(this.render());
}
