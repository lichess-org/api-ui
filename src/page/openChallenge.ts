import { h } from 'snabbdom';
import { App } from '../app';
import { Feedback, formData, isSuccess, responseToFeedback } from '../form';
import { gameRuleKeys } from '../util';
import * as form from '../view/form';
import layout from '../view/layout';
import { card, copyInput } from '../view/util';

interface Result {
  challenge: {
    id: string;
    url: string;
    open: {
      userIds?: [string, string];
    };
  };
  urlWhite: string;
  urlBlack: string;
}

export class OpenChallenge {
  feedback: Feedback<Result> = undefined;
  constructor(readonly app: App) {}
  redraw = () => this.app.redraw(this.render());
  render = () =>
    layout(
      this.app,
      h('div', [
        h('h1.mt-5', 'Open challenge'),
        h('p.lead', [
          'Uses the ',
          h(
            'a',
            { attrs: { href: 'https://lichess.org/api#tag/Challenges/operation/challengeOpen' } },
            'Lichess open challenge API'
          ),
          ' to create a game that any two players can join.',
        ]),
        h('p', ['No OAuth token is required.']),
        this.renderForm(),
      ])
    );

  private onSubmit = async (data: FormData) => {
    const get = (key: string) => data.get(key) as string;
    const req = fetch(`${this.app.config.lichessHost}/api/challenge/open`, {
      method: 'POST',
      body: formData({
        'clock.limit': parseFloat(get('clockLimit')) * 60,
        'clock.increment': get('clockIncrement'),
        variant: get('variant'),
        rated: !!get('rated'),
        fen: get('fen'),
        name: get('name'),
        users: get('users')
          .trim()
          .replace(/[\s,]+/g, ','),
        rules: gameRuleKeys.filter(key => !!get(key)).join(','),
      }),
    });
    this.feedback = await responseToFeedback(req);
    this.redraw();
    form.scrollToForm();
  };

  private renderForm = () =>
    form.form(this.onSubmit, [
      form.feedback(this.feedback),
      isSuccess(this.feedback) ? this.renderResult(this.feedback.result) : undefined,
      form.clock(),
      h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('rated', 'Rated game')),
      form.variant(),
      form.fen(),
      h('div.mb-3', [
        form.label('Challenge name', 'name'),
        form.input('name', { tpe: 'text' }),
        h('p.form-text', 'Optional text that players will see on the challenge page.'),
      ]),
      h('div.mb-3', [
        form.label('Only allow these players to join', 'name'),
        form.input('users', { tpe: 'text' }),
        h(
          'p.form-text',
          'Optional pair of usernames, separated by a comma. If set, only these users will be allowed to join the game. The first username gets the white pieces.'
        ),
      ]),
      form.specialRules(),
      form.submit('Create the challenge'),
    ]);

  private renderResult = (result: Result) => {
    const c = result.challenge;
    return card(
      c.id,
      ['Challenge #', c.id],
      [
        h('h3', 'Links'),
        ...(c.open?.userIds
          ? [copyInput('Game URL', c.url)]
          : [
              copyInput('Game URL - random color', c.url),
              copyInput('Game URL for white', result.urlWhite),
              copyInput('Game URL for black', result.urlBlack),
            ]),
      ]
    );
  };
}
