import { Auth } from './auth';
import { Page } from './interfaces';

export class Ctrl {
  auth: Auth = new Auth();
  page: Page = 'home';

  constructor(readonly redraw: () => void) {}

  openHome = async () => {
    this.page = 'home';
    this.redraw();
  };
}
