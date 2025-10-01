import { h } from 'snabbdom';
import { Auth } from './auth';
import type { Redraw } from './interfaces';
import layout from './view/layout';

export interface Config {
  lichessHost: string;
}

export class App {
  auth: Auth;
  config: Config;
  redraw: Redraw;

  constructor(config: Config, redraw: Redraw) {
    this.config = config;
    this.redraw = redraw;
    this.auth = new Auth(config.lichessHost);
  }

  notFound = () => this.redraw(layout(this, h('div', [h('h1.mt-5', 'Not Found')])));

  tooManyRequests = () =>
    this.redraw(
      layout(
        this,
        h('div', [h('h1.mt-5', 'Too many requests'), h('p.lead', 'Please wait a little then try again.')]),
      ),
    );
}
