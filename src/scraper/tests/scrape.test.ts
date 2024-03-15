import { describe, expect, test, vi, Mock, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import {
  getPlayers,
  getPairings,
  setResultsPerPage,
  Player,
  getUrls,
  saveUrls,
  setCacheBuster,
} from '../scraper';

global.fetch = vi.fn(proxyUrl => {
  let url = new URL(decodeURIComponent(proxyUrl.split('?')[1]));
  let path = url.pathname;

  return Promise.resolve({
    text: () => Promise.resolve(readFileSync(`src/scraper/tests/fixtures${path}`)),
  });
}) as Mock;

describe('fetch players', () => {
  test('with lichess usernames', async () => {
    const players = await getPlayers('https://example.com/players-list-with-usernames.html');

    expect(players).toHaveLength(71);
    expect(players[1]).toEqual({
      name: 'Navara, David',
      fideId: '309095',
      rating: 2679,
      lichess: 'RealDavidNavara',
    });
  });

  test('with team columns', async () => {
    const players = await getPlayers('https://example.com/players-list-without-usernames.html');

    expect(players).toHaveLength(150);
    expect(players[0]).toEqual({
      name: 'Nepomniachtchi Ian',
      fideId: '4168119',
      rating: 2789,
      lichess: undefined,
    });
  });
});

describe('fetch pairings', () => {
  test('team swiss', async () => {
    const pairings = await getPairings('https://example.com/team-swiss-pairings-with-usernames.html');

    expect(pairings).toHaveLength(8);
    expect(pairings).toStrictEqual([
      {
        black: {
          lichess: 'test4',
          name: 'Hris, Panagiotis',
          rating: 2227,
        },
        white: {
          lichess: 'test134',
          name: 'Testing, Test',
          rating: 1985,
        },
        reversed: false,
        board: '1.1',
      },
      {
        black: {
          lichess: 'test3',
          name: 'Someone, Else',
          rating: 2400,
        },
        white: {
          lichess: 'test5',
          name: 'Trevlar, Someone',
          rating: 0,
        },
        reversed: true,
        board: '1.2',
      },
      {
        black: {
          lichess: 'test6',
          name: 'TestPlayer, Mary',
          rating: 1600,
        },
        white: {
          lichess: 'test1',
          name: 'Another, Test',
          rating: 1900,
        },
        reversed: false,
        board: '1.3',
      },
      {
        black: {
          lichess: 'test2',
          name: 'Ignore, This',
          rating: 1400,
        },
        white: {
          lichess: 'test7',
          name: 'Testing, Tester',
          rating: 0,
        },
        reversed: true,
        board: '1.4',
      },
      {
        black: {
          lichess: 'TestAccount1',
          name: 'SomeoneElse, Michael',
          rating: 2230,
        },
        white: {
          lichess: 'Cynosure',
          name: 'Wait, Theophilus',
          rating: 0,
        },
        reversed: false,
        board: '2.1',
      },
      {
        black: {
          lichess: 'Thibault',
          name: 'Thibault, D',
          rating: 0,
        },
        white: {
          lichess: 'TestAccount2',
          name: 'YetSomeoneElse, Lilly',
          rating: 2070,
        },
        reversed: true,
        board: '2.2',
      },
      {
        black: {
          lichess: 'TestAccount3',
          name: 'Unknown, Player',
          rating: 1300,
        },
        white: {
          lichess: 'Puzzlingpuzzler',
          name: 'Gkizi, Konst',
          rating: 1270,
        },
        reversed: false,
        board: '2.3',
      },
      {
        black: {
          lichess: 'ThisAccountDoesntExist',
          name: 'Placeholder, Player',
          rating: 0,
        },
        white: {
          lichess: 'TestAccount4',
          name: 'Also, Unknown',
          rating: 1111,
        },
        reversed: true,
        board: '2.4',
      },
    ]);
  });

  test('team another swiss', async () => {
    const pairings = await getPairings('https://example.com/team-swiss-pairings-with-usernames-2.html');

    expect(pairings).toHaveLength(4);
    expect(pairings).toStrictEqual([
      {
        black: {
          lichess: 'ttrv',
          name: 'ttrvraw, ttrvdae',
          rating: 0,
        },
        white: {
          lichess: 'cynosure',
          name: 'cybosu, dsad',
          rating: 0,
        },
        reversed: false,
        board: '1.1',
      },
      {
        black: {
          lichess: 'e4',
          name: 'someonesalt, somealt',
          rating: 0,
        },
        white: {
          lichess: 'lovlas',
          name: 'lovlaswa, lovlasdw',
          rating: 2400,
        },
        reversed: true,
        board: '1.2',
      },
      {
        black: {
          lichess: 'carpentum',
          name: 'carpentumsaw, carpentumsad',
          rating: 0,
        },
        white: {
          lichess: 'thibault',
          name: 'thibault1, test1',
          rating: 0,
        },
        reversed: false,
        board: '2.1',
      },
      {
        black: {
          lichess: 'neio',
          name: 'neio123, neioe2qe',
          rating: 0,
        },
        white: {
          lichess: 'Puzzlingpuzzler',
          name: 'puzzlingpuzzlerpux, puzzler',
          rating: 0,
        },
        reversed: true,
        board: '2.2',
      },
    ]);
  });

  test('team swiss w/o lichess usernames on the same page', async () => {
    const pairings = await getPairings('https://example.com/team-swiss-pairings-without-usernames.html');

    expect(pairings).toHaveLength(76);
    expect(pairings[0]).toEqual({
      white: {
        name: 'Berend Elvira',
        rating: 2326,
        lichess: undefined,
      },
      black: {
        name: 'Nepomniachtchi Ian',
        rating: 2789,
        lichess: undefined,
      },
      reversed: false,
      board: '1.1',
    });
    expect(pairings[1]).toEqual({
      black: {
        name: 'Sebe-Vodislav Razvan-Alexandru',
        rating: 2270,
        lichess: undefined,
      },
      white: {
        name: 'Kadatsky Alexander',
        rating: 2368,
        lichess: undefined,
      },
      reversed: true,
      board: '1.2',
    });
  });

  test('individual round robin', async () => {
    const pairings = await getPairings('https://example.com/individual-round-robin-pairings.html');

    expect(pairings).toHaveLength(28);
    expect(pairings[0]).toEqual({
      white: {
        name: 'Ponkratov, Pavel',
      },
      black: {
        name: 'Galaktionov, Artem',
      },
      reversed: false,
      board: '1',
    });
  });

  test('team round robin', async () => {
    const pairings = await getPairings('https://example.com/team-round-robin-pairings.html');

    expect(pairings).toHaveLength(12);
    expect(pairings[0]).toEqual({
      white: {
        name: 'ANotehrnotTest, wadfaeefa',
        lichess: 'Testacct31',
        rating: 2100,
      },
      black: {
        name: 'Teambtest, sadsaf',
        lichess: 'Testacct11',
        rating: 0,
      },
      reversed: false,
      board: '1.1',
    });
    expect(pairings[1]).toEqual({
      white: {
        name: 'Teamseers, Steasdea',
        lichess: 'Testacct12',
        rating: 1670,
      },
      black: {
        name: 'czxzszcsszc, zxcszczs',
        lichess: 'Testacct33',
        rating: 0,
      },
      reversed: true,
      board: '1.2',
    });
  });

  test('individual swiss', async () => {
    const pairings = await getPairings('https://example.com/individual-swiss-pairings.html');

    expect(pairings).toHaveLength(59);
    expect(pairings[0]).toEqual({
      white: {
        name: 'Gunina, Valentina',
      },
      black: {
        name: 'Mammadzada, Gunay',
      },
      reversed: false,
      board: '1',
    });
  });

  test('individual swiss w/ player substitution', async () => {
    const players: Player[] = [
      {
        name: 'Gunina, Valentina',
        lichess: 'test-valentina',
      },
      {
        name: 'Mammadzada, Gunay',
        lichess: 'test-gunay',
      },
    ];
    const pairings = await getPairings('https://example.com/individual-swiss-pairings.html', players);

    expect(pairings).toHaveLength(59);
    expect(pairings[0]).toEqual({
      white: {
        name: 'Gunina, Valentina',
        lichess: 'test-valentina',
      },
      black: {
        name: 'Mammadzada, Gunay',
        lichess: 'test-gunay',
      },
      reversed: false,
      board: '1',
    });
  });
});

test('set results per page', () => {
  expect(setResultsPerPage('https://example.com')).toBe('https://example.com/?zeilen=99999');
  expect(setResultsPerPage('https://example.com', 10)).toBe('https://example.com/?zeilen=10');
  expect(setResultsPerPage('https://example.com/?foo=bar', 10)).toBe(
    'https://example.com/?foo=bar&zeilen=10',
  );
  expect(setResultsPerPage('https://example.com/players.aspx?zeilen=10', 20)).toBe(
    'https://example.com/players.aspx?zeilen=20',
  );
  expect(setResultsPerPage('https://example.com/players.aspx?zeilen=10', 99999)).toBe(
    'https://example.com/players.aspx?zeilen=99999',
  );
});

describe('get/set urls from local storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('get', () => {
    expect(getUrls('abc1')).toBeUndefined();
  });

  test('set', () => {
    saveUrls('abc2', 'https://example.com/pairings2.html');
    expect(getUrls('abc2')).toStrictEqual({
      pairingsUrl: 'https://example.com/pairings2.html',
    });
  });

  test('append', () => {
    saveUrls('abc3', 'https://example.com/pairings3.html');
    saveUrls('abc4', 'https://example.com/pairings4.html');

    expect(getUrls('abc3')).toStrictEqual({
      pairingsUrl: 'https://example.com/pairings3.html',
    });

    expect(getUrls('abc4')).toStrictEqual({
      pairingsUrl: 'https://example.com/pairings4.html',
    });
  });
});

describe('test cache buster', () => {
  test('set cache buster', () => {
    expect(setCacheBuster('https://example.com')).toContain('https://example.com/?cachebust=1');
  });

  test('append cache buster', () => {
    expect(setCacheBuster('https://example.com/?foo=bar')).toContain(
      'https://example.com/?foo=bar&cachebust=1',
    );
  });
});
