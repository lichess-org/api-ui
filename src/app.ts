import { h } from 'snabbdom';
import { Auth } from './auth';
import { Redraw } from './interfaces';
import layout from './view/layout';

export interface Config {
  lichessHost: string;
}

export class App {
  auth: Auth;

  constructor(readonly config: Config, readonly redraw: Redraw) {
    this.auth = new Auth(config.lichessHost);
  }

  notFound = () => this.redraw(layout(this, h('div', [h('h1.mt-5', 'Not Found')])));

  tooManyRequests = () =>
    this.redraw(
      layout(
        this,
        h('div', [h('h1.mt-5', 'Too many requests'), h('p.lead', 'Please wait a little then try again.')])
      )
    );
}
