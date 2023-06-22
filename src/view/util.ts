import { h } from 'snabbdom';

export const loadingBody = () => h('div.loading', spinner());

export const spinner = () =>
  h('div.spinner-border.text-primary', { attrs: { role: 'status' } }, h('span.visually-hidden', 'Loading...'));
