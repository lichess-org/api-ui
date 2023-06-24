import { h } from 'snabbdom';
import { MaybeVNodes } from '../interfaces';

export const loadingBody = () => h('div.loading', spinner());

export const spinner = () =>
  h(
    'div.spinner-border.text-primary',
    { attrs: { role: 'status' } },
    h('span.visually-hidden', 'Loading...')
  );

export const timeFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}).format;

export const card = (id: string, header: MaybeVNodes, body: MaybeVNodes) =>
  h(`div#card-${id}.card.mb-5`, [
    h('h2.card-header.bg-success.text-body-emphasis.pt-4.pb-4', header),
    h('div.card-body', body),
  ]);

export const copyInput = (label: string, value: string) => {
  const id = Math.floor(Math.random() * Date.now()).toString(36);
  return h('div.input-group.mb-3', [
    h(
      'span.input-group-text.input-copy.bg-primary.text-body-emphasis',
      {
        on: {
          click: e => {
            navigator.clipboard.writeText(value);
            (e.target as HTMLElement).classList.remove('bg-primary');
            (e.target as HTMLElement).classList.add('bg-success');
          },
        },
      },
      'Copy'
    ),
    h('div.form-floating', [
      h(`input#${id}.form-control`, {
        attrs: { type: 'text', readonly: true, value },
      }),
      h('label', { attrs: { for: id } }, label),
    ]),
  ]);
};
