interface Endpoint {
  name: string;
  desc: string;
  path: string;
}
export const endpoints: Endpoint[] = [
  {
    name: 'Open challenge',
    desc: 'Create a game that any two players can join',
    path: '/endpoint/open-challenge',
  },
  {
    name: 'Schedule games',
    desc: 'Requires Lichess admin permissions',
    path: '/endpoint/schedule-games',
  },
];
