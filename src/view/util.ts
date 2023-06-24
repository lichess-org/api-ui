import { h } from 'snabbdom';

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
