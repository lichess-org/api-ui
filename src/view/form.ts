import { h } from 'snabbdom';

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

export interface Success<R> {
  result: R;
}
export interface Failure {
  message: string;
}

export type Feedback<R> = Success<R> | Failure | undefined;

export function isSuccess<R>(feedback: Feedback<R>): feedback is Success<R> {
  return feedback !== undefined && 'result' in feedback;
}
export function isFailure<R>(feedback: Feedback<R>): feedback is Failure {
  return feedback !== undefined && 'message' in feedback;
}
