import { h } from 'snabbdom';
import { App } from '../app';
import { Feedback, formData, isSuccess } from '../form';
import { gameRules } from '../util';
import * as form from '../view/form';
import layout from '../view/layout';
import { card, copyInput } from '../view/util';

interface Result {
  challenge: {
    id: string;
    url: string;
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

  private onSubmit = async (form: FormData) => {
    const get = (key: string) => form.get(key) as string;
    try {
      const rules = gameRules.filter(key => !!get(key));
      // https://lichess.org/api#tag/Bulk-pairings/operation/bulkPairingCreate
      const res = await fetch(`${this.app.config.lichessHost}/api/challenge/open`, {
        method: 'POST',
        body: formData({
          'clock.limit': parseFloat(get('clockLimit')) * 60,
          'clock.increment': get('clockIncrement'),
          variant: get('variant'),
          rated: !!get('rated'),
          rules: rules.join(','),
        }),
      });
      const json: Result = await res.json();
      if (res.status != 200) throw json;
      this.feedback = { result: json };
    } catch (err) {
      this.feedback = {
        message: JSON.stringify(err),
      };
    }
    this.redraw();
  };

  private renderForm = () =>
    form.form(this.onSubmit, [
      form.feedback(this.feedback),
      isSuccess(this.feedback) ? this.renderResult(this.feedback.result) : undefined,
      form.clock(),
      h('div.form-check.form-switch.mb-3', form.checkboxWithLabel('rated', 'Rated game')),
      form.variant(),
      form.specialRules(),
      h('button.btn.btn-primary.btn-lg.mt-3', { type: 'submit' }, 'Create the challenge'),
    ]);

  private renderResult = (result: Result) =>
    card(
      ['Challenge #', result.challenge.id],
      [
        h('h3', 'Links'),
        copyInput('Game URL - random color', result.challenge.url),
        copyInput('Game URL for white', result.urlWhite),
        copyInput('Game URL for black', result.urlBlack),
      ]
    );
}
