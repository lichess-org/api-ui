import { describe, expect, test, vi, Mock } from 'vitest';
import { readFileSync } from 'fs';
import { getPlayers, getPairings, Player, Pairing, formatPairings, setResultsPerPage } from '../scraper';

global.fetch = vi.fn(url => {
  if (url == 'https://example.com/players-with-club-city.html?zeilen=99999') {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/players-with-club-city.html')),
    });
  } else if (url == 'https://example.com/players-with-teams.html?zeilen=99999') {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/players-with-teams.html')),
    });
  } else if (url == 'https://example.com/pairings-with-teams.html') {
    return Promise.resolve({
      text: () => Promise.resolve(readFileSync('src/scraper/tests/fixtures/pairings-with-teams.html')),
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
  test('with teams', async () => {
    const pairings = await getPairings('https://example.com/pairings-with-teams.html');

    expect(pairings).toHaveLength(76);

    expect(pairings[0]).toEqual({
      white: 'Nepomniachtchi Ian',
      black: 'Kontopodis Dimitrios',
    });
    expect(pairings[1]).toEqual({
      white: 'Koskinen Timo',
      black: 'Kadatsky Alexander',
    });
  });
});

test('format pairings', () => {
  const players: Player[] = [
    { name: 'A', lichess: 'aaa' },
    { name: 'B', lichess: 'bbb' },
    { name: 'C', lichess: 'ccc' },
    { name: 'D', lichess: 'ddd' },
  ];
  const pairings: Pairing[] = [
    { white: 'A', black: 'B' },
    { white: 'C', black: 'D' },
  ];

  const pairingResults = formatPairings(players, pairings);

  expect(pairingResults).toStrictEqual([
    { white: players[0], black: players[1] },
    { white: players[2], black: players[3] },
  ]);
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
