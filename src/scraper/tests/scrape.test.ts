import { describe, expect, test, vi, Mock } from 'vitest';
import { readFileSync } from 'fs';
import { getPlayers, getPairings, setResultsPerPage, Player } from '../scraper';

global.fetch = vi.fn(url => {
  if (
    url ==
    'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fplayers-list-with-usernames.html%3Fzeilen%3D99999'
  ) {
    return Promise.resolve({
      text: () =>
        Promise.resolve(readFileSync('src/scraper/tests/fixtures/players-list-with-usernames.html')),
    });
  } else if (
    url ==
    'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fplayers-list-without-usernames.html%3Fzeilen%3D99999'
  ) {
    return Promise.resolve({
      text: () =>
        Promise.resolve(readFileSync('src/scraper/tests/fixtures/players-list-without-usernames.html')),
    });
  } else if (
    url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fteam-swiss-pairings-without-usernames.html'
  ) {
    return Promise.resolve({
      text: () =>
        Promise.resolve(
          readFileSync('src/scraper/tests/fixtures/team-swiss-pairings-without-usernames.html'),
        ),
    });
  } else if (
    url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Fteam-swiss-pairings-with-usernames.html'
  ) {
    return Promise.resolve({
      text: () =>
        Promise.resolve(readFileSync('src/scraper/tests/fixtures/team-swiss-pairings-with-usernames.html')),
    });
  } else if (
    url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Findividual-round-robin-pairings.html'
  ) {
    return Promise.resolve({
      text: () =>
        Promise.resolve(readFileSync('src/scraper/tests/fixtures/individual-round-robin-pairings.html')),
    });
  } else if (url == 'https://corsproxy.io/?https%3A%2F%2Fexample.com%2Findividual-swiss-pairings.html') {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/individual-swiss-pairings.html')),
    });
  }

  throw new Error(`Unexpected URL: ${url}`);
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
