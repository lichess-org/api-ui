import { Auth } from './auth';
import { Redraw } from './interfaces';

export interface Config {
  lichessHost: string;
}

export class App {
  auth: Auth;

  constructor(readonly config: Config, readonly redraw: Redraw) {
    this.auth = new Auth(config.lichessHost);
  }
}
