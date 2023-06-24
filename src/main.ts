import { init, attributesModule, eventListenersModule, classModule, VNode } from 'snabbdom';
import { loadingBody } from './view/util';
import '../scss/_bootstrap.scss';
import '../scss/style.scss';
import '../node_modules/bootstrap/js/dist/dropdown.js';
import '../node_modules/bootstrap/js/dist/collapse.js';
import routing from './routing';
import { App, Config } from './app';

const config: Config = {
  lichessHost: 'http://l.org',
};

export default async function (element: HTMLElement) {
  const patch = init([attributesModule, eventListenersModule, classModule]);

  const app = new App(config, redraw);

  let vnode = patch(element, loadingBody());

  function redraw(ui: VNode) {
    vnode = patch(vnode, ui);
  }

  await app.auth.init();
  routing(app);
}
