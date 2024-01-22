import { describe, expect, test, vi, Mock } from 'vitest';
import { readFileSync } from 'fs';
import { getPlayers, getPairings, setResultsPerPage, getPairingsForTeamSwiss, Player } from '../scraper';

global.fetch = vi.fn(url => {
  if (
    url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fplayers-with-club-city.html%3Fzeilen%3D99999'
  ) {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/players-with-club-city.html')),
    });
  } else if (
    url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fplayers-with-teams.html%3Fzeilen%3D99999'
  ) {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/players-with-teams.html')),
    });
  } else if (url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fpairings-with-teams.html') {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/pairings-with-teams.html')),
    });
  } else if (
    url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fteam-swiss-pairings-with-club-city.html'
  ) {
    return Promise.resolve({
      text: () =>
        Promise.resolve(readFileSync('src/scraper/tests/fixtures/team-swiss-pairings-with-club-city.html')),
    });
  }

  throw new Error(`Unexpected URL: ${url}`);
}) as Mock;

describe('fetch players', () => {
  test('with lichess usernames', async () => {
    const players = await getPlayers('https://example.com/players-with-club-city.html');

    expect(players).toHaveLength(71);
    expect(players[1]).toEqual({
      name: 'Navara, David',
      fideId: '309095',
      rating: 2679,
      lichess: 'RealDavidNavara',
    });
  });

  test('with team columns', async () => {
    const players = await getPlayers('https://example.com/players-with-teams.html');

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
    const pairings = await getPairingsForTeamSwiss(
      'https://example.com/team-swiss-pairings-with-club-city.html',
    );

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
      },
    ]);
  });

  test('team swiss w/o lichess usernames on the same page', async () => {
    const players: Player[] = [
      {
        name: 'Berend Elvira',
        fideId: '123',
        lichess: 'test-elvira',
      },
      {
        name: 'Nepomniachtchi Ian',
        fideId: '456',
        lichess: 'test-ian',
      },
      {
        name: 'Sebe-Vodislav Razvan-Alexandru',
        fideId: '789',
        lichess: 'test-razvan',
      },
      {
        name: 'Kadatsky Alexander',
        fideId: '012',
        lichess: 'test-alexander',
      },
    ];
    const pairings = await getPairings('https://example.com/pairings-with-teams.html', players);

    expect(pairings).toHaveLength(76);
    expect(pairings[0]).toEqual({
      white: {
        name: 'Berend Elvira',
        fideId: '123',
        lichess: 'test-elvira',
      },
      black: {
        name: 'Nepomniachtchi Ian',
        fideId: '456',
        lichess: 'test-ian',
      },
    });
    expect(pairings[1]).toEqual({
      black: {
        name: 'Sebe-Vodislav Razvan-Alexandru',
        fideId: '789',
        lichess: 'test-razvan',
      },
      white: {
        name: 'Kadatsky Alexander',
        fideId: '012',
        lichess: 'test-alexander',
      },
    });
    expect(pairings[2]).toEqual({
      white: {
        name: 'Stanic Zoran',
      },
      black: {
        name: 'Lavrov Maxim',
      },
    });
  });
});

test('set results per page', () => {
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
