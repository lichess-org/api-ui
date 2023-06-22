import { Auth } from './auth';
import { Redraw } from './interfaces';

export class App {
  auth: Auth = new Auth();

  constructor(readonly redraw: Redraw) {}
}
