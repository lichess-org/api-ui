import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { BASE_PATH } from './routing';

export const scopes = ['challenge:bulk', 'web:mod'];
export const clientId = 'lichess-api-ui';
export const clientUrl = `${location.protocol}//${location.host}${BASE_PATH || '/'}`;

type HttpClient = (url: string, options?: RequestInit) => Promise<Response>;

export interface Me {
  id: string;
  username: string;
  httpClient: HttpClient; // with pre-set Authorization header
}

export class Auth {
  constructor(readonly lichessHost: string) {}
  oauth = new OAuth2AuthCodePKCE({
    authorizationUrl: `${this.lichessHost}/oauth`,
    tokenUrl: `${this.lichessHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
    onInvalidGrant: console.warn,
  });
  me?: Me;

  async init() {
    try {
      const accessContext = await this.oauth.getAccessToken();
      if (accessContext) await this.authenticate();
    } catch (err) {
      console.error(err);
    }
    if (!this.me) {
      try {
        const hasAuthCode = await this.oauth.isReturningFromAuthServer();
        if (hasAuthCode) await this.authenticate();
      } catch (err) {
        console.error(err);
      }
    }
  }

  async login() {
    await this.oauth.fetchAuthorizationCode();
  }

  async logout() {
    if (this.me) await this.me.httpClient(`${this.lichessHost}/api/token`, { method: 'DELETE' });
    localStorage.clear();
    this.me = undefined;
  }

  private authenticate = async () => {
    const httpClient = this.oauth.decorateFetchHTTPClient(window.fetch);
    const res = await httpClient(`${this.lichessHost}/api/account`);
    const me = {
      ...(await res.json()),
      httpClient,
    };
    if (me.error) throw me.error;
    this.me = me;
  };
}
