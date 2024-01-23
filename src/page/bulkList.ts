import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { timeFormat } from '../view/util';
import { Bulk } from '../model';
import { href } from '../routing';
import { bulkPairing } from '../endpoints';

export class BulkList {
  lichessUrl: string;
  bulks?: Bulk[];
  constructor(
    readonly app: App,
    readonly me: Me,
  ) {
    this.lichessUrl = app.config.lichessHost;
    this.loadBulks();
  }
  loadBulks = async () => {
    const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/bulk-pairing`);
    this.bulks = (await res.json()).bulks;
    this.redraw();
  };
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
        h(
          'a.btn.btn-primary.mt-5',
          { attrs: { href: '/endpoint/schedule-games/new' } },
          'Schedule new games',
        ),
        this.bulks
          ? h('table.table.table-striped.mt-5', [
              h('thead', [
                h('tr', [
                  h('th', 'Bulk'),
                  h('th', 'Games'),
                  h('th', 'Variant'),
                  h('th', 'Rated'),
                  h('th', 'Created'),
                  h('th', 'Pair at'),
                  h('th', 'Paired'),
                ]),
              ]),
              h(
                'tbody',
                this.bulks.map(bulk =>
                  h('tr', [
                    h('td', h('a', { attrs: href(`${bulkPairing.path}/${bulk.id}`) }, `#${bulk.id}`)),
                    h('td', bulk.games.length),
                    h('td', bulk.variant),
                    h('td', bulk.rated ? 'Rated' : 'Casual'),
                    h('td', timeFormat(new Date(bulk.scheduledAt))),
                    h('td', bulk.pairAt && timeFormat(new Date(bulk.pairAt))),
                    h('td', bulk.pairedAt && timeFormat(new Date(bulk.pairedAt))),
                  ]),
                ),
              ),
            ])
          : h('div.m-5', h('div.spinner-border.d-block.mx-auto', { attrs: { role: 'status' } })),
      ]),
    );
}
