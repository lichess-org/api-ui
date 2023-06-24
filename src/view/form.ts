import { h } from 'snabbdom';
import { variants } from '../util';
import { MaybeVNodes } from '../interfaces';
import { Feedback, isSuccess, isFailure } from '../form';

export interface Input {
  tpe: string;
  placeholder: string;
  required: boolean;
  value?: string;
}
export const makeInput = (opts: Partial<Input>): Input => ({
  tpe: 'string',
  placeholder: '',
  required: true,
  ...opts,
});

export const input = (id: string, opts: Partial<Input> = {}) => {
  const i = makeInput(opts);
  return h(`input#${id}.form-control`, {
    attrs: {
      name: id,
      type: i.tpe,
      placeholder: i.placeholder,
      ...(i.value ? { value: i.value } : {}),
      ...(i.required ? { required: true } : {}),
    },
  });
};

export const label = (label: string, id?: string) =>
  h(`label.form-label`, id ? { attrs: { for: id } } : {}, label);

export const selectOption = (value: string, label: string) => h('option', { attrs: { value } }, label);

export const checkbox = (id: string) =>
  h(`input#${id}.form-check-input`, { attrs: { type: 'checkbox', name: id, value: 'true' } });

export const checkboxWithLabel = (id: string, label: string) => [
  checkbox(id),
  h('label.form-check-label', { attrs: { for: id } }, label),
];

export const clock = () =>
  h('div.mb-3', [
    label('Clock'),
    h('div.input-group', [
      input('clockLimit', { tpe: 'number', value: '5', placeholder: 'Initial time in minutes' }),
      h('span.input-group-text', '+'),
      input('clockIncrement', { tpe: 'number', value: '3', placeholder: 'Increment in seconds' }),
    ]),
  ]);

export const variant = () =>
  h('div.mb-3', [
    label('Variant', 'variant'),
    h(
      'select.form-select',
      { attrs: { name: 'variant' } },
      variants.map(([key, name]) => selectOption(key, name))
    ),
  ]);

export const specialRules = () =>
  h('div.mb-3', [
    h('div', label('Special rules', 'rules')),
    ...[
      ['noAbort', 'Players cannot abort the game'],
      ['noRematch', 'Players cannot offer a rematch'],
      ['noGiveTime', 'Players cannot give extra time'],
      ['noClaimWin', 'Players cannot claim the win if the opponent leaves'],
      ['noEarlyDraw', 'Players cannot offer a draw before move 30 (ply 60)'],
    ].map(([key, label]) => h('div.form-check.form-switch.mb-1', checkboxWithLabel(key, label))),
  ]);

export const form = (onSubmit: (form: FormData) => void, content: MaybeVNodes) =>
  h(
    'form.mt-5',
    {
      on: {
        submit: (e: Event) => {
          e.preventDefault();
          onSubmit(new FormData(e.target as HTMLFormElement));
        },
      },
    },
    content
  );

export const feedback = <R>(feedback: Feedback<R>) =>
  isFailure(feedback) ? h('div.alert.alert-danger', feedback.message) : undefined;
