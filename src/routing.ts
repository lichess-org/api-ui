import { App } from './app';
import page from 'page';
import { Home } from './page/home';
import { Pairing } from './page/pairing';

export default function (app: App) {
  page.base(BASE_PATH);
  page('/', ctx => {
    if (ctx.querystring.includes('code=liu_')) history.pushState({}, '', BASE_PATH || '/');
    new Home(app).redraw();
  });
  page('/login', async _ => {
    if (app.auth.me) return page('/');
    await app.auth.login();
  });
  page('/logout', async _ => {
    await app.auth.logout();
    location.href = BASE_PATH;
  });
  page('/endpoint/pairing', _ => {
    if (app.auth.me) new Pairing(app, app.auth.me).redraw();
    else page('/login');
  });
  page({ hashbang: true });
}

export const BASE_PATH = location.pathname.replace(/\/$/, '');

export const url = (path: string) => `${BASE_PATH}${path}`;
export const href = (path: string) => ({ href: url(path) });
