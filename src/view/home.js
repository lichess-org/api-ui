import { h } from 'snabbdom';
import { href } from '../routing';
export const renderHome = ctrl => (ctrl.auth.me ? userHome(ctrl) : anonHome());
const userHome = (_ctrl) => [h('div', [h('h2.mt-5.mb-3', 'About'), renderAbout()])];
const anonHome = () => [
    h('div.login.text-center', [
        renderAbout(),
        h('div.big', [h('p', 'Please log in to continue.')]),
        h('a.btn.btn-primary.btn-lg.mt-5', {
            attrs: href('/login'),
        }, 'Login with Lichess'),
    ]),
];
const renderAbout = () => h('div.about', [
    h('p', 'This is an example for a fully client side OAuth app that uses various Lichess APIs.'),
    h('ul', [
        h('li', h('a', {
            attrs: { href: 'https://github.com/lichess-org/api-demo' },
        }, 'Source code of this demo')),
        h('li', h('a', {
            attrs: { href: 'https://github.com/lichess-org/api-demo#lichess-oauth-app-demo' },
        }, 'README')),
        h('li', h('a', {
            attrs: { href: 'https://lichess.org/api' },
        }, 'Lichess.org API documentation')),
    ]),
    h('p', [
        'Press ',
        h('code', '<Ctrl+Shift+j>'),
        ' to open your browser console and view incoming events.',
        h('br'),
        'Check out the network tab as well to view API calls.',
    ]),
]);
