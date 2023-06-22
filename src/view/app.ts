import { h, VNode } from 'snabbdom';
import { Ctrl } from '../ctrl';
import { Renderer } from '../interfaces';
import layout from './layout';
import { renderHome } from './home';

export default function view(ctrl: Ctrl): VNode {
  return layout(ctrl, selectRenderer(ctrl)(ctrl));
}

const selectRenderer = (ctrl: Ctrl): Renderer => {
  if (ctrl.page == 'home') return renderHome;
  return renderNotFound;
};

const renderNotFound: Renderer = _ => [h('h1', 'Not found')];

export const loadingBody = () => h('div.loading', spinner());

export const spinner = () =>
  h('div.spinner-border.text-primary', { attrs: { role: 'status' } }, h('span.visually-hidden', 'Loading...'));
