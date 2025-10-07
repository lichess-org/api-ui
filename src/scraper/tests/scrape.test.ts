import { describe, expect, test, vi, type Mock, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import {
  getPlayers,
  getPairings,
  setResultsPerPage,
  type Player,
  getUrls,
  saveUrls,
  setCacheBuster,
  type Pairing,
  filterRound,
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

    expect(players[1]).toEqual({
      name: 'Navara, David',
      fideId: '309095',
      rating: 2679,
      lichess: 'RealDavidNavara',
    });
    expect(players).toHaveLength(71);
  });

  test('with team columns', async () => {
    const players = await getPlayers('https://example.com/players-list-without-usernames.html');

    expect(players[0]).toEqual({
      name: 'Nepomniachtchi Ian',
      fideId: '4168119',
      rating: 2789,
      lichess: undefined,
    });
    expect(players).toHaveLength(150);
  });
});

describe('fetch pairings', () => {
  test('team swiss', async () => {
    const pairings = await getPairings('https://example.com/team-swiss-pairings-with-usernames.html');

    expect(pairings).toStrictEqual([
      {
        black: {
          lichess: 'test4',
          name: 'Hris, Panagiotis',
          team: 'Team C',
          rating: 2227,
        },
        white: {
          lichess: 'test134',
          name: 'Testing, Test',
          team: 'Team B',
          rating: 1985,
        },
        reversed: false,
        board: '1.1',
      },
      {
        black: {
          lichess: 'test3',
          name: 'Someone, Else',
          team: 'Team B',
          rating: 2400,
        },
        white: {
          lichess: 'test5',
          name: 'Trevlar, Someone',
          team: 'Team C',
          rating: 0,
        },
        reversed: true,
        board: '1.2',
      },
      {
        black: {
          lichess: 'test6',
          name: 'TestPlayer, Mary',
          team: 'Team C',
          rating: 1600,
        },
        white: {
          lichess: 'test1',
          name: 'Another, Test',
          team: 'Team B',
          rating: 1900,
        },
        reversed: false,
        board: '1.3',
      },
      {
        black: {
          lichess: 'test2',
          name: 'Ignore, This',
          team: 'Team B',
          rating: 1400,
        },
        white: {
          lichess: 'test7',
          name: 'Testing, Tester',
          team: 'Team C',
          rating: 0,
        },
        reversed: true,
        board: '1.4',
      },
      {
        black: {
          lichess: 'TestAccount1',
          name: 'SomeoneElse, Michael',
          team: 'Team D',
          rating: 2230,
        },
        white: {
          lichess: 'Cynosure',
          name: 'Wait, Theophilus',
          team: 'Team A',
          rating: 0,
        },
        reversed: false,
        board: '2.1',
      },
      {
        black: {
          lichess: 'Thibault',
          name: 'Thibault, D',
          team: 'Team A',
          rating: 0,
        },
        white: {
          lichess: 'TestAccount2',
          name: 'YetSomeoneElse, Lilly',
          team: 'Team D',
          rating: 2070,
        },
        reversed: true,
        board: '2.2',
      },
      {
        black: {
          lichess: 'TestAccount3',
          name: 'Unknown, Player',
          team: 'Team D',
          rating: 1300,
        },
        white: {
          lichess: 'Puzzlingpuzzler',
          name: 'Gkizi, Konst',
          team: 'Team A',
          rating: 1270,
        },
        reversed: false,
        board: '2.3',
      },
      {
        black: {
          lichess: 'ThisAccountDoesntExist',
          name: 'Placeholder, Player',
          team: 'Team A',
          rating: 0,
        },
        white: {
          lichess: 'TestAccount4',
          name: 'Also, Unknown',
          team: 'Team D',
          rating: 1111,
        },
        reversed: true,
        board: '2.4',
      },
    ]);
    expect(pairings).toHaveLength(8);
  });

  test('team another swiss', async () => {
    const pairings = await getPairings('https://example.com/team-swiss-pairings-with-usernames-2.html');

    expect(pairings[0]).toStrictEqual({
      black: {
        lichess: 'PeterAcs',
        name: 'Acs Peter',
        team: 'Morgan Stanley',
        rating: 2582,
      },
      white: {
        lichess: 'joe1714',
        name: 'Karan J P',
        team: 'Accenture',
        rating: 1852,
      },
      reversed: false,
      board: '1.1',
    });
    expect(pairings[pairings.length - 1]).toStrictEqual({
      black: {
        lichess: 'Dimash8888',
        name: 'Jexekov Dimash',
        team: 'Freedom Holding',
        rating: 0,
      },
      white: {
        lichess: 'hhauks',
        name: 'Hauksdottir Hrund',
        team: 'Islandsbanki',
        rating: 1814,
      },
      reversed: true,
      board: '7.4',
    });
    expect(pairings).toHaveLength(28);
  });

  test('team swiss w/o lichess usernames on the same page', async () => {
    const pairings = await getPairings('https://example.com/team-swiss-pairings-without-usernames.html');

    expect(pairings[0]).toEqual({
      white: {
        name: 'Berend Elvira',
        team: 'European Investment Bank',
        rating: 2326,
        lichess: undefined,
      },
      black: {
        name: 'Nepomniachtchi Ian',
        team: 'SBER',
        rating: 2789,
        lichess: undefined,
      },
      reversed: false,
      board: '1.1',
    });
    expect(pairings[1]).toEqual({
      black: {
        name: 'Sebe-Vodislav Razvan-Alexandru',
        team: 'European Investment Bank',
        rating: 2270,
        lichess: undefined,
      },
      white: {
        name: 'Kadatsky Alexander',
        team: 'SBER',
        rating: 2368,
        lichess: undefined,
      },
      reversed: true,
      board: '1.2',
    });

    // check the next set of Teams
    expect(pairings[8]).toEqual({
      black: {
        name: 'Delchev Alexander',
        team: 'Tigar Tyres',
        rating: 2526,
        lichess: undefined,
      },
      white: {
        name: 'Chernikova Iryna',
        team: 'Airbus (FRA)',
        rating: 1509,
        lichess: undefined,
      },
      reversed: false,
      board: '3.1',
    });
    expect(pairings).toHaveLength(76);
  });

  test('individual round robin', async () => {
    const pairings = await getPairings('https://example.com/individual-round-robin-pairings.html');

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
    expect(pairings).toHaveLength(28);
  });

  test('team round robin', async () => {
    const pairings = await getPairings('https://example.com/team-round-robin-pairings.html');

    expect(pairings[0]).toEqual({
      white: {
        name: 'Kyrkjebo, Hanna B.',
        team: 'KPMG Norway',
        lichess: 'watchmecheck',
        rating: 1899,
      },
      black: {
        name: 'Liu, Zhaoqi',
        team: 'Nanjing Spark Chess Technology Co.Ltd.',
        lichess: 'lzqupup',
        rating: 2337,
      },
      reversed: false,
      board: '1.1',
    });
    expect(pairings[1]).toEqual({
      white: {
        name: 'Du, Chunhui',
        team: 'Nanjing Spark Chess Technology Co.Ltd.',
        lichess: 'duchunhui',
        rating: 2288,
      },
      black: {
        name: 'Grimsrud, Oyvind',
        team: 'KPMG Norway',
        lichess: 'Bruneratseth',
        rating: 1836,
      },
      reversed: true,
      board: '1.2',
    });
    expect(pairings).toHaveLength(8);
  });

  test('individual swiss', async () => {
    const pairings = await getPairings('https://example.com/individual-swiss-pairings.html');

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
    expect(pairings).toHaveLength(59);
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
    expect(pairings).toHaveLength(59);
  });

  test('team ko pairings w/o usernames', async () => {
    const pairings = await getPairings('https://example.com/team-ko-pairings-without-usernames.html');

    expect(pairings[0]).toEqual({
      white: {
        name: 'Andriasian, Zaven',
        rating: 2624,
        team: 'Chessify',
      },
      black: {
        name: 'Schneider, Igor',
        rating: 2206,
        team: 'Deutsche Bank',
      },
      reversed: false,
      board: '1.1',
    });

    expect(pairings[pairings.length - 1]).toEqual({
      white: {
        name: 'van Eerde, Matthew',
        rating: 0,
        team: 'Microsoft E',
      },
      black: {
        name: 'Asbjornsen, Oyvind Von Doren',
        rating: 1594,
        team: 'Von Doren Watch Company AS',
      },
      reversed: true,
      board: '3.4',
    });
    expect(pairings).toHaveLength(24);
  });

  test('team ko pairings w/ usernames', async () => {
    const pairings = await getPairings('https://example.com/team-ko-pairings-with-usernames.html');

    expect(pairings[0]).toEqual({
      white: {
        name: 'T2, P1',
        lichess: 't2pl1',
        rating: 1678,
        team: 'Team 2',
      },
      black: {
        name: 'T4, P1',
        lichess: 't4pl1',
        rating: 0,
        team: 'Team 4',
      },
      reversed: false,
      board: '1.1',
    });

    expect(pairings[pairings.length - 1]).toEqual({
      white: {
        name: 'T3, P4',
        lichess: 't3pl4',
        rating: 0,
        team: 'Team 3',
      },
      black: {
        name: 'T1, P4',
        lichess: 't1pl4',
        rating: 2453,
        team: 'Team 1',
      },
      reversed: true,
      board: '2.4',
    });
    expect(pairings).toHaveLength(16);
  });
});

describe('round filtering', () => {
  const pairings: Pairing[] = [
    // round 1
    { board: '1.1', white: { name: 'w1' }, black: { name: 'b1' }, reversed: false },
    { board: '1.2', white: { name: 'w2' }, black: { name: 'b2' }, reversed: false },
    { board: '2.1', white: { name: 'w3' }, black: { name: 'b3' }, reversed: false },
    { board: '2.2', white: { name: 'w4' }, black: { name: 'b4' }, reversed: false },
    // round 2
    { board: '1.1', white: { name: 'w5' }, black: { name: 'b5' }, reversed: false },
    { board: '1.2', white: { name: 'w6' }, black: { name: 'b6' }, reversed: false },
    { board: '2.1', white: { name: 'w7' }, black: { name: 'b7' }, reversed: false },
    { board: '2.2', white: { name: 'w8' }, black: { name: 'b8' }, reversed: false },
  ];

  test('round 1', () => {
    expect(filterRound(pairings, 1)).toEqual([
      { board: '1.1', white: { name: 'w1' }, black: { name: 'b1' }, reversed: false },
      { board: '1.2', white: { name: 'w2' }, black: { name: 'b2' }, reversed: false },
      { board: '2.1', white: { name: 'w3' }, black: { name: 'b3' }, reversed: false },
      { board: '2.2', white: { name: 'w4' }, black: { name: 'b4' }, reversed: false },
    ]);
  });

  test('round 2', () => {
    expect(filterRound(pairings, 2)).toEqual([
      { board: '1.1', white: { name: 'w5' }, black: { name: 'b5' }, reversed: false },
      { board: '1.2', white: { name: 'w6' }, black: { name: 'b6' }, reversed: false },
      { board: '2.1', white: { name: 'w7' }, black: { name: 'b7' }, reversed: false },
      { board: '2.2', white: { name: 'w8' }, black: { name: 'b8' }, reversed: false },
    ]);
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
