import { h } from 'snabbdom';

export interface Input {
  tpe: string;
  placeholder: string;
}
export const makeInput = (opts: Partial<Input>): Input => ({
  tpe: 'string',
  placeholder: '',
  ...opts,
});

export const input = (id: string, opts: Partial<Input> = {}) => {
  const i = makeInput(opts);
  return h(`input#${id}.form-control`, { attrs: { name: id, type: i.tpe, placeholder: i.placeholder } });
};

export const label = (label: string, id?: string) =>
  h(`label.form-label`, id ? { attrs: { for: id } } : {}, label);

export const selectOption = (value: string, label: string) => h('option', { attrs: { value } }, label);
