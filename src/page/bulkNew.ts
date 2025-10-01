import { h } from 'snabbdom';
import page from 'page';
import { App } from '../app';
import type { Me } from '../auth';
import { type Feedback, formData, isSuccess, responseToFeedback } from '../form';
import { gameRuleKeys, gameRules } from '../util';
import * as form from '../view/form';
import layout from '../view/layout';
import { type Pairing, getPairings, getPlayers, saveUrls } from '../scraper/scraper';
import { bulkPairing } from '../endpoints';
import { href } from '../view/util';

interface Tokens {
  [username: string]: string;
}
interface Result {
  id: string;
  games: {
    id: string;
    white: string;
    black: string;
  }[];
  pairAt: number;
  startClocksAt: number;
}

export class BulkNew {
  feedback: Feedback<Result> = undefined;
  readonly app: App;
  readonly me: Me;
  constructor(app: App, me: Me) {
    this.app = app;
    this.me = me;
  }
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div', [
        h('nav.mt-5.breadcrumb', [
          h('span.breadcrumb-item', h('a', { attrs: href(bulkPairing.path) }, 'Schedule games')),
          h('span.breadcrumb-item.active', 'New bulk pairing'),
        ]),
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
        h('p', [
          'Requires the ',
          h('strong', 'API Challenge admin'),
          ' permission to generate the player challenge tokens automatically.',
        ]),
        this.renderForm(),
      ]),
    );

  private onSubmit = async (form: FormData) => {
    const get = (key: string) => form.get(key) as string;
    const dateOf = (key: string) => get(key) && new Date(get(key)).getTime();
    try {
      const playersTxt = get('players');
      let pairingNames: [string, string][];
      try {
        pairingNames = playersTxt
          .toLowerCase()
          .split('\n')
          .map(line =>
            line
              .trim()
              .replace(/[\s,]+/g, ' ')
              .split(' '),
          )
          .map(names => [names[0].trim(), names[1].trim()]);
      } catch (err) {
        throw 'Invalid players format';
      }
      const tokens = await this.adminChallengeTokens(pairingNames.flat());
      const randomColor = !!get('randomColor');
      const sortFn = () => (randomColor ? Math.random() - 0.5 : 0);
      const pairingTokens: [string, string][] = pairingNames.map(
        duo =>
          duo
            .map(name => {
              if (!tokens[name]) throw `Missing token for ${name}, is that an active Lichess player?`;
              return tokens[name];
            })
            .sort(sortFn) as [string, string],
      );
      const rules = gameRuleKeys.filter(key => !!get(key));
      const req = this.me.httpClient(`${this.app.config.lichessHost}/api/bulk-pairing`, {
        method: 'POST',
        body: formData({
          players: pairingTokens.map(([white, black]) => `${white}:${black}`).join(','),
          'clock.limit': parseFloat(get('clockLimit')) * 60,
          'clock.increment': get('clockIncrement'),
          variant: get('variant'),
          rated: !!get('rated'),
          fen: get('fen'),
          message: get('message'),
          pairAt: dateOf('pairAt'),
          startClocksAt: dateOf('startClocksAt'),
          rules: rules.join(','),
        }),
      });
      this.feedback = await responseToFeedback(req);

      if (isSuccess(this.feedback)) {
        saveUrls(this.feedback.result.id, get('cr-pairings-url'), get('cr-players-url'));
        page(`/endpoint/schedule-games/${this.feedback.result.id}`);
      }
    } catch (err) {
      console.warn(err);
      this.feedback = {
        error: { players: JSON.stringify(err) },
      };
    }
    this.redraw();
    document.getElementById('endpoint-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  private adminChallengeTokens = async (users: string[]): Promise<Tokens> => {
    const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/token/admin-challenge`, {
      method: 'POST',
      body: formData({
        users: users.join(','),
        description: 'Tournament pairings from the Lichess team',
      }),
    });
    const json = await res.json();
    if (json.error) throw json.error;
    return json;
  };

  private renderForm = () =>
    form.form(this.onSubmit, [
      form.feedback(this.feedback),
      h('div.mb-3', [
        h('div.row', [
          h('div.col-md-6', [
            form.label('Players', 'players'),
            h('textarea#players.form-control', {
              attrs: {
                name: 'players',
                style: 'height: 100px',
                required: true,
                spellcheck: 'false',
              },
            }),
            h('p.form-text', [
              'Two usernames per line, each line is a game.',
              h('br'),
              'First username gets the white pieces, unless randomized by the switch below.',
            ]),
            h('div.form-check.form-switch', form.checkboxWithLabel('randomColor', 'Randomize colors')),
            h(
              'button.btn.btn-secondary.btn-sm.mt-2',
              {
                attrs: {
                  type: 'button',
                },
                on: {
                  click: () =>
                    this.validateUsernames(document.getElementById('players') as HTMLTextAreaElement),
                },
              },
              'Validate Lichess usernames',
            ),
          ]),
          h('div.col-md-6', [
            h('details', [
              h('summary.text-muted.form-label', 'Or load the players and pairings from another website'),
              h('div.card.card-body', [form.loadPlayersFromUrl()]),
              h(
                'button.btn.btn-secondary.btn-sm.mt-3',
                {
                  attrs: {
                    type: 'button',
                  },
                  on: {
                    click: () =>
                      this.loadPairingsFromChessResults(
                        document.getElementById('cr-pairings-url') as HTMLInputElement,
                        document.getElementById('cr-players-url') as HTMLInputElement,
                      ),
                  },
                },
                'Load pairings',
              ),
            ]),
          ]),
        ]),
      ]),
      form.clock(),
      h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('rated', 'Rated games', true)),
      form.variant(),
      form.fen(),
      h('div.mb-3', [
        form.label('Inbox message', 'message'),
        h(
          'textarea#message.form-control',
          {
            attrs: {
              name: 'message',
              style: 'height: 100px',
            },
          },
          'Your game with {opponent} is ready: {game}.',
        ),
        h('p.form-text', [
          'Message that will be sent to each player, when the game is created. It is sent from your user account.',
          h('br'),
          h('code', '{opponent}'),
          ' and ',
          h('code', '{game}'),
          ' are placeholders that will be replaced with the opponent and the game URLs.',
          h('br'),
          'The ',
          h('code', '{game}'),
          ' placeholder is mandatory.',
        ]),
      ]),
      form.specialRules(gameRules),
      h('div.mb-3', [
        form.label('When to create the games', 'pairAt'),
        h('input#pairAt.form-control', {
          attrs: {
            type: 'datetime-local',
            name: 'pairAt',
          },
        }),
        h('p.form-text', 'Leave empty to create the games immediately.'),
      ]),
      h('div.mb-3', [
        form.label('When to start the clocks', 'startClocksAt'),
        h('input#startClocksAt.form-control', {
          attrs: {
            type: 'datetime-local',
            name: 'startClocksAt',
          },
        }),
        h('p.form-text', [
          'Date at which the clocks will be automatically started.',
          h('br'),
          'Note that the clocks can start earlier than specified, if players start making moves in the game.',
          h('br'),
          'Leave empty so that the clocks only start when players make moves.',
        ]),
      ]),
      form.submit('Schedule the games'),
    ]);

  private validateUsernames = async (textarea: HTMLTextAreaElement) => {
    const usernames = textarea.value.match(/(<.*?>)|(\S+)/g);
    if (!usernames) return;

    let validUsernames: string[] = [];

    const chunkSize = 300;
    for (let i = 0; i < usernames.length; i += chunkSize) {
      const res = await this.me.httpClient(`${this.app.config.lichessHost}/api/users`, {
        method: 'POST',
        body: usernames.slice(i, i + chunkSize).join(', '),
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      const users = await res.json();
      validUsernames = validUsernames.concat(users.filter((u: any) => !u.disabled).map((u: any) => u.id));
    }

    const invalidUsernames = usernames.filter(username => !validUsernames.includes(username.toLowerCase()));
    if (invalidUsernames.length) {
      alert(`Invalid usernames: ${invalidUsernames.join(', ')}`);
    } else {
      alert('All usernames are valid!');
    }
  };

  private loadPairingsFromChessResults = async (
    pairingsInput: HTMLInputElement,
    playersInput: HTMLInputElement,
  ) => {
    try {
      const pairingsUrl = pairingsInput.value;
      const playersUrl = playersInput.value;

      const players = playersUrl ? await getPlayers(playersUrl) : undefined;
      const pairings = await getPairings(pairingsUrl, players);
      this.insertPairings(pairings);
    } catch (err) {
      alert(err);
    }
  };

  private insertPairings(pairings: Pairing[]) {
    pairings.forEach(pairing => {
      const playersTxt = (document.getElementById('players') as HTMLTextAreaElement).value;

      const white = pairing.white.lichess || `<${pairing.white.name}>`;
      const black = pairing.black.lichess || `<${pairing.black.name}>`;

      const newLine = `${white} ${black}`;
      (document.getElementById('players') as HTMLTextAreaElement).value =
        playersTxt + (playersTxt ? '\n' : '') + newLine;
    });
  }
}
