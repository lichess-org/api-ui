import { h, VNode } from 'snabbdom';
import { Me } from '../auth';
import { App } from '../app';
import { MaybeVNodes } from '../interfaces';
import { href } from '../routing';
import '../../scss/_navbar.scss';

export default function (app: App, body: MaybeVNodes): VNode {
  return h('body', [renderNavBar(app), h('div.container', body), renderFooter(app)]);
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
                attrs: href('/endpoint/bulk'),
              },
              'Schedule games'
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

const renderFooter = (app: App) =>
  h(
    'footer.bd-footer.py-4.py-md-5.mt-5.bg-body-tertiary',
    h('div.container.py-4.py-md-5.px-4.px-md-3.text-body-secondary', [
      h('div.row', [
        h('div.col.mb-3', [
          h(
            'a.d-inline-flex.align-items-center.mb-2.text-body-emphasis.text-decoration-none',
            { attrs: href('https://lichess.org') },
            [
              h('img.lichess-logo-white.me-2', {
                attrs: {
                  src: 'https://lichess1.org/assets/logo/lichess-white.svg',
                  alt: 'Lichess logo',
                },
              }),
              h('span.fs-5', 'Lichess'),
            ]
          ),
        ]),
        h('div.col.mb-3', [
          h('h5', 'Links'),
          h('ul.list-unstyled', [
            h('li.mb-2', h('a', { attrs: href('https://lichess.org/api') }, 'Lichess API documentation')),
            h(
              'li.mb-2',
              h('a', { attrs: href('https://github.com/lichess-org/api-ui') }, 'Source code of this website')
            ),
            h('li.mb-2', h('a', { attrs: href('https://lichess.org') }, 'The best chess server')),
          ]),
        ]),
        h('div.col.mb-3', [h('h5', 'Configuration'), h('code', JSON.stringify(app.config, null, 2))]),
      ]),
    ])
  );
