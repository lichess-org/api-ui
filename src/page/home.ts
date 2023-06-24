import { App } from '../app';
import { h } from 'snabbdom';
import { href } from '../routing';
import layout from '../view/layout';

export class Home {
  constructor(readonly app: App) {}

  render = () => layout(this.app, h('div.app-home', this.app.auth.me ? this.userHome() : this.anonHome()));
  redraw = () => this.app.redraw(this.render());

  userHome = () => [h('div', [this.renderAbout()])];

  anonHome = () => [
    h('div.login.text-center', [
      this.renderAbout(),
      h('div.big', [h('p', 'Please log in to continue.')]),
      h(
        'a.btn.btn-primary.btn-lg.mt-5',
        {
          attrs: href('/login'),
        },
        'Login with Lichess'
      ),
    ]),
  ];

  renderAbout = () =>
    h('div.about', [
      h('p.lead.mt-5', [
        'This website provides a user interface to some of the ',
        h('a', { attrs: { href: 'https://lichess.org/api' } }, 'Lichess API'),
        ' endpoints.',
      ]),
    ]);
}
