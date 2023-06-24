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

export interface Failure {
  message: string;
}

export type Feedback = 'success' | Failure | undefined;
