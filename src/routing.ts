import { App } from './app';
import page from 'page';
import { Home } from './page/home';
import { BulkNew } from './page/bulkNew';
import { OpenChallenge } from './page/openChallenge';
import { PuzzleRace } from './page/puzzleRace';
import { BulkList } from './page/bulkList';
import type { Me } from './auth';
import { BulkShow } from './page/bulkShow';
import { BASE_PATH } from './util';

export default function (app: App) {
  const withAuth = (f: (me: Me) => void) => {
    if (app.auth.me) f(app.auth.me);
    else page('/login');
  };

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
  page('/endpoint/open-challenge', _ => new OpenChallenge(app).redraw());
  page('/endpoint/schedule-games', _ => withAuth(me => new BulkList(app, me).redraw()));
  page('/endpoint/schedule-games/new', _ => withAuth(me => new BulkNew(app, me).redraw()));
  page('/endpoint/schedule-games/:id', ctx => withAuth(me => new BulkShow(app, me, ctx.params.id).redraw()));
  page('/endpoint/puzzle-race', _ => withAuth(me => new PuzzleRace(app, me).redraw()));
  page('/too-many-requests', _ => app.tooManyRequests());
  page('*', _ => app.notFound());
  page({ hashbang: true });
}
