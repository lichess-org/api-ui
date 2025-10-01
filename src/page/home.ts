import { App } from '../app';
import { h } from 'snabbdom';
import layout from '../view/layout';
import { endpoints } from '../endpoints';
import { href } from '../view/util';

export class Home {
  readonly app: App;
  constructor(app: App) {
    this.app = app;
  }

  render = () => layout(this.app, h('div.app-home', [this.renderAbout(), this.listEndpoints()]));
  redraw = () => this.app.redraw(this.render());

  listEndpoints = () =>
    h(
      'div.list-group.mb-7',
      endpoints.map(e =>
        h('a.list-group-item.list-group-item-action', { attrs: href(e.path) }, [
          h('h3', e.name),
          h('span', e.desc),
        ]),
      ),
    );

  renderAbout = () =>
    h('div.about', [
      h('p.lead.mt-5', [
        'A user interface to some of the ',
        h('a', { attrs: { href: 'https://lichess.org/api' } }, 'Lichess API'),
        ' endpoints.',
      ]),
    ]);
}
