import { h } from 'snabbdom';
import { App } from '../app';
import { type Feedback, isSuccess, responseToFeedback } from '../form';
import * as form from '../view/form';
import layout from '../view/layout';
import { card, copyInput } from '../view/util';
import type { Me } from '../auth';

interface Result {
  id: string;
  url: string;
}

export class PuzzleRace {
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
        h('h1.mt-5', 'Puzzle race'),
        h('p.lead', [
          'Uses the ',
          h(
            'a',
            { attrs: { href: 'https://lichess.org/api#tag/Puzzles/operation/racerPost' } },
            'Lichess puzzle race API',
          ),
          ' to create a private race with an invite link.',
        ]),
        this.renderForm(),
      ]),
    );

  private onSubmit = async () => {
    const req = this.me.httpClient(`${this.app.config.lichessHost}/api/racer`, { method: 'POST' });
    this.feedback = await responseToFeedback(req);
    this.redraw();
    form.scrollToForm();
  };

  private renderForm = () =>
    form.form(this.onSubmit, [
      form.feedback(this.feedback),
      isSuccess(this.feedback) ? this.renderResult(this.feedback.result) : undefined,
      form.submit('Create the race'),
    ]);

  private renderResult = (result: Result) => {
    return card(
      result.id,
      ['PuzzleRace #', result.id],
      [h('h3', 'Link'), copyInput('Invite URL', result.url)],
    );
  };
}
