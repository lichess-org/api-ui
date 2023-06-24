import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';

export class Common {
  constructor(readonly app: App) {}

  notFound = () => this.app.redraw(layout(this.app, h('div', [h('h1.mt-5', 'Not Found')])));

  tooManyRequests = () =>
    this.app.redraw(
      layout(
        this.app,
        h('div', [h('h1.mt-5', 'Too many requests'), h('p.lead', 'Please wait a little then try again.')])
      )
    );
}
