import { App } from '../app';
import { h } from 'snabbdom';
import { href } from '../routing';
import layout from '../view/layout';

export class Home {
  constructor(readonly app: App) {}

  render = () => layout(this.app, h('div.app-home', this.app.auth.me ? this.userHome() : this.anonHome()));
  redraw = () => this.app.redraw(this.render());

  userHome = () => [this.renderAbout(), this.listEndpoints()];

  listEndpoints = () =>
    h('div.list-group.mb-7', [
      h('a.list-group-item.list-group-item-action', { attrs: href('/endpoint/schedule-games') }, [
        h('h3', 'Schedule games'),
        h('span', 'Requires Lichess admin permissions'),
      ]),
      // h('a.list-group-item.list-group-item-action', { attrs: href('/endpoint/open-challenge') }, [
      //   h('h3', 'Open challenge'),
      //   h('span', 'Create a game that any two players can join'),
      // ]),
    ]);

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
