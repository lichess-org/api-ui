import { h } from 'snabbdom';
import { variants } from '../util';
import { MaybeVNodes } from '../interfaces';
import { Failure, Feedback, isFailure } from '../form';
import { Rule } from '../model';

export interface Input {
  tpe: string;
  placeholder: string;
  required: boolean;
  value?: string;
}
export const makeInput = (opts: Partial<Input>): Input => ({
  tpe: 'string',
  placeholder: '',
  required: false,
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
      input('clockLimit', {
        tpe: 'number',
        // value: '5',
        required: true,
        placeholder: 'Initial time in minutes',
      }),
      h('span.input-group-text', '+'),
      input('clockIncrement', {
        tpe: 'number',
        // value: '3',
        required: true,
        placeholder: 'Increment in seconds',
      }),
    ]),
  ]);

export const variant = () =>
  h('div.mb-3', [
    label('Variant', 'variant'),
    h(
      'select.form-select',
      { attrs: { name: 'variant' } },
      variants.map(([key, name]) => selectOption(key, name)),
    ),
  ]);

export const specialRules = (rules: [Rule, string][]) =>
  h('div.mb-3', [
    h('div', label('Special rules', 'rules')),
    ...rules.map(([key, label]) => h('div.form-check.form-switch.mb-1', checkboxWithLabel(key, label))),
  ]);

export const fen = () =>
  h('div.mb-3', [
    label('FEN initial position', 'fen'),
    input('fen', { tpe: 'text' }),
    h(
      'p.form-text',
      'If set, the variant must be standard, fromPosition, or chess960 (if a valid 960 starting position), and the game cannot be rated.',
    ),
  ]);

export const form = (onSubmit: (form: FormData) => void, content: MaybeVNodes) =>
  h(
    'form#endpoint-form.mt-5',
    {
      on: {
        submit: (e: Event) => {
          e.preventDefault();
          onSubmit(new FormData(e.target as HTMLFormElement));
        },
      },
    },
    content,
  );

export const submit = (label: string) => h('button.btn.btn-primary.btn-lg.mt-3', { type: 'submit' }, label);

export const feedback = <R>(feedback: Feedback<R>) =>
  isFailure(feedback) ? h('div.alert.alert-danger', renderErrors(feedback)) : undefined;

const renderErrors = (fail: Failure) =>
  h(
    'ul.mb-0',
    Object.entries(fail.error).map(([k, v]) => h('li', `${k}: ${v}`)),
  );

export const scrollToForm = () =>
  document.getElementById('endpoint-form')?.scrollIntoView({ behavior: 'smooth' });
