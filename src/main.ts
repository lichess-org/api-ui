import { init, attributesModule, eventListenersModule, classModule, type VNode } from 'snabbdom';
import { loadingBody } from './view/util';
import '../scss/style.scss';
import 'bootstrap/js/dist/dropdown.js';
import 'bootstrap/js/dist/collapse.js';
import routing from './routing';
import { App, type Config } from './app';

const config: Config = {
  lichessHost: localStorage.getItem('lichessHost') || 'https://lichess.org',
};

async function attach (element: HTMLDivElement) {
  const patch = init([attributesModule, eventListenersModule, classModule]);

  const app = new App(config, redraw);

  let vnode = patch(element, loadingBody());

  function redraw(ui: VNode) {
    vnode = patch(vnode, ui);
  }

  await app.auth.init();
  routing(app);
}

attach(document.querySelector<HTMLDivElement>('#app')!)
