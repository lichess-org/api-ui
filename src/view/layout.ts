import { h, VNode } from 'snabbdom';
import { Me } from '../auth';
import { App } from '../app';
import { MaybeVNodes } from '../interfaces';
import { href } from '../routing';
import '../../scss/_navbar.scss';

export default function (app: App, body: MaybeVNodes): VNode {
  return h('body', [renderNavBar(app), h('div.container', body)]);
}

const renderNavBar = (app: App) =>
  h('header.navbar.navbar-expand-md.bg-body-tertiary', [
    h('div.container', [
      h(
        'a.navbar-brand',
        {
          attrs: href('/'),
        },
        'Lichess API UI'
      ),
      h(
        'button.navbar-toggler',
        {
          attrs: {
            type: 'button',
            'data-bs-toggle': 'collapse',
            'data-bs-target': '#navbarSupportedContent',
            'aria-controls': 'navbarSupportedContent',
            'aria-expanded': false,
            'aria-label': 'Toggle navigation',
          },
        },
        h('span.navbar-toggler-icon')
      ),
      h('div#navbarSupportedContent.collapse.navbar-collapse', [
        h('ul.navbar-nav.me-auto.mb-lg-0"', []),
        app.auth.me ? endpointNav() : null,
        h('ul.navbar-nav', [app.auth.me ? userNav(app.auth.me) : anonNav()]),
      ]),
    ]),
  ]);

const endpointNav = () =>
  h('ul.navbar-nav', [
    h('li.nav-item.dropdown', [
      h(
        'a#navbarDropdown.nav-link.dropdown-toggle',
        {
          attrs: {
            href: '#',
            role: 'button',
            'data-bs-toggle': 'dropdown',
            'aria-expanded': false,
          },
        },
        'Endpoints'
      ),
      h(
        'ul.dropdown-menu',
        {
          attrs: {
            'aria-labelledby': 'navbarDropdown',
          },
        },
        [
          h(
            'li',
            h(
              'a.dropdown-item',
              {
                attrs: href('/endpoint/pairing'),
              },
              'Pair 2 players'
            )
          ),
        ]
      ),
    ]),
  ]);

const userNav = (me: Me) =>
  h('li.nav-item.dropdown', [
    h(
      'a#navbarDropdown.nav-link.dropdown-toggle',
      {
        attrs: {
          href: '#',
          role: 'button',
          'data-bs-toggle': 'dropdown',
          'aria-expanded': false,
        },
      },
      me.username
    ),
    h(
      'ul.dropdown-menu',
      {
        attrs: {
          'aria-labelledby': 'navbarDropdown',
        },
      },
      [
        h(
          'li',
          h(
            'a.dropdown-item',
            {
              attrs: href('/logout'),
            },
            'Log out'
          )
        ),
      ]
    ),
  ]);

const anonNav = () =>
  h(
    'li.nav-item',
    h(
      'a.btn.btn-primary.text-nowrap',
      {
        attrs: href('/login'),
      },
      'Login with Lichess'
    )
  );
