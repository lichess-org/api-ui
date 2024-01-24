import * as cheerio from 'cheerio';

export interface Player {
  name: string;
  fideId?: string;
  rating?: number;
  lichess?: string;
}

export interface Pairing {
  white: Player;
  black: Player;
}

export interface SavedPlayerUrls {
  pairingsUrl: string;
  playersUrl?: string;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
  return await response.text();
}

export function setResultsPerPage(url: string, resultsPerPage: number = 99999): string {
  // show all players on one page
  const urlObject = new URL(url);
  urlObject.searchParams.set('zeilen', resultsPerPage.toString());
  return urlObject.toString();
}

export async function getPlayers(url: string): Promise<Player[]> {
  const html = await fetchHtml(setResultsPerPage(url));
  const $ = cheerio.load(html);
  const players: Player[] = [];

  const headers: string[] = $('.CRs1 tr th')
    .first()
    .parent()
    .children()
    .map((_index, element) => $(element).text().trim())
    .get();

  $('.CRs1 tr').each((_index, element) => {
    // ignore heading rows
    if ($(element).find('th').length > 0) {
      return;
    }

    const fideId = headers.includes('FideID')
      ? $(element).find('td').eq(headers.indexOf('FideID')).text().trim()
      : undefined;
    const rating = headers.includes('Rtg')
      ? parseInt($(element).find('td').eq(headers.indexOf('Rtg')).text().trim())
      : undefined;
    const lichess = headers.includes('Club/City')
      ? $(element).find('td').eq(headers.indexOf('Club/City')).text().trim()
      : undefined;

    const player: Player = {
      name: $(element).find('td').eq(headers.indexOf('Name')).text().trim(),
      fideId,
      rating,
      lichess,
    };
    players.push(player);
  });

  return players;
}

export async function getPairings(url: string, players?: Player[]): Promise<Pairing[]> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // Team Swiss pairings table has nested tables
  if ($('.CRs1 td').find('table').length > 1) {
    return parsePairingsForTeamSwiss(html);
  }

  return parsePairingsForIndividualEvent(html, players);
}

function parsePairingsForTeamSwiss(html: string): Pairing[] {
  const $ = cheerio.load(html);
  const pairings: Pairing[] = [];

  const headers: string[] = $('.CRs1 tr th')
    .first()
    .parent()
    .children()
    .map((_index, element) => $(element).text().trim())
    .get();

  $('.CRs1 tr').each((_index, element) => {
    // ignore rows that do not have pairings
    if ($(element).find('table').length === 0) {
      return;
    }

    const white = $(element).find('table').find('div.FarbewT').parentsUntil('table').last().text().trim();
    const black = $(element).find('table').find('div.FarbesT').parentsUntil('table').last().text().trim();

    const rating1 = headers.includes('Rtg')
      ? parseInt($(element).children().eq(headers.indexOf('Rtg')).text().trim())
      : undefined;
    const rating2 = headers.includes('Rtg')
      ? parseInt($(element).children().eq(headers.lastIndexOf('Rtg')).text().trim())
      : undefined;

    const username1 = headers.includes('Club/City')
      ? $(element).children().eq(headers.indexOf('Club/City')).text().trim()
      : undefined;
    const username2 = headers.includes('Club/City')
      ? $(element).children().eq(headers.lastIndexOf('Club/City')).text().trim()
      : undefined;

    // which color indicator comes first: div.FarbewT or div.FarbesT?
    const firstDiv = $(element).find('table').find('div.FarbewT, div.FarbesT').first();

    if ($(firstDiv).hasClass('FarbewT')) {
      pairings.push({
        white: {
          name: white,
          rating: rating1,
          lichess: username1,
        },
        black: {
          name: black,
          rating: rating2,
          lichess: username2,
        },
      });
    } else if ($(firstDiv).hasClass('FarbesT')) {
      pairings.push({
        white: {
          name: white,
          rating: rating2,
          lichess: username2,
        },
        black: {
          name: black,
          rating: rating1,
          lichess: username1,
        },
      });
    } else {
      throw new Error('Could not parse Pairings table');
    }
  });

  return pairings;
}

function parsePairingsForIndividualEvent(html: string, players?: Player[]): Pairing[] {
  const $ = cheerio.load(html);
  const pairings: Pairing[] = [];

  const headers: string[] = $('.CRs1 tr th')
    .first()
    .parent()
    .children()
    .map((_index, element) => $(element).text().trim())
    .get();

  $('.CRs1 tr').each((_index, element) => {
    // ignore certain table headings: rows with less than 2 <td>'s
    if ($(element).find('td').length < 2) {
      return;
    }

    const whiteName = $(element).children().eq(headers.indexOf('Name')).text().trim();
    const blackName = $(element).children().eq(headers.lastIndexOf('Name')).text().trim();

    pairings.push({
      white: players?.find(player => player.name === whiteName) ?? { name: whiteName },
      black: players?.find(player => player.name === blackName) ?? { name: blackName },
    });
  });

  return pairings;
}

export function saveUrlsForBulkPairing(bulkPairingId: string, pairingsUrl: string, playersUrl?: string) {
  const savedUrls = new Map<string, SavedPlayerUrls>();

  const currentEntries = localStorage.getItem('cr-urls');
  if (currentEntries) {
    const parsedEntries: { [key: string]: SavedPlayerUrls } = JSON.parse(currentEntries);
    Object.keys(parsedEntries).forEach(key => savedUrls.set(key, parsedEntries[key]));
  }

  savedUrls.set(bulkPairingId, { pairingsUrl, playersUrl });
  localStorage.setItem('cr-urls', JSON.stringify(Object.fromEntries(savedUrls)));
}

export function getUrlsForBulkPairing(bulkPairingId: string): SavedPlayerUrls | undefined {
  const currentEntries = localStorage.getItem('cr-urls');

  if (!currentEntries) {
    return undefined;
  }

  const parsedEntries: { [key: string]: SavedPlayerUrls } = JSON.parse(currentEntries);
  return parsedEntries[bulkPairingId];
}
