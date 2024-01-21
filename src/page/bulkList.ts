import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';

export class BulkList {
  lichessUrl: string;
  constructor(
    readonly app: App,
    readonly me: Me,
  ) {
    this.lichessUrl = app.config.lichessHost;
  }
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div', [
        h('h1.mt-5', 'Schedule games'),
        h('p.lead', [
          'Uses the ',
          h(
            'a',
            { attrs: { href: 'https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate' } },
            'Lichess bulk pairing API',
          ),
          ' to create a bunch of games at once.',
        ]),
        h('p', [
          'Requires the ',
          h('strong', 'API Challenge admin'),
          ' permission to generate the player challenge tokens automatically.',
        ]),
        h('a.btn.btn-primary', { attrs: { href: '/endpoint/schedule-games/new' } }, 'Schedule new games'),
      ]),
    );
}
