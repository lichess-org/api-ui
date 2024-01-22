import { h } from 'snabbdom';
import { App } from '../app';
import { Me } from '../auth';
import layout from '../view/layout';
import { card } from '../view/util';
import { Bulk, BulkId } from '../model';

export class BulkShow {
  lichessUrl: string;
  bulk?: Bulk;
  constructor(
    readonly app: App,
    readonly me: Me,
    readonly id: BulkId,
  ) {
    this.lichessUrl = app.config.lichessHost;
    this.loadBulk();
  }
  loadBulk = async () => {
    const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/bulk-pairing/${this.id}`);
    this.bulk = await res.json();
    this.redraw();
  };
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div', [
        h('h1.mt-5', 'Schedule games'),
        this.bulk
          ? card(this.bulk.id, [`Bulk pairing #${this.id}`], ['WIP'])
          : h('div.m-5', h('div.spinner-border.d-block.mx-auto', { attrs: { role: 'status' } })),
      ]),
    );
}
