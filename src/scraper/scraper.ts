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
  const response = await fetchHtml(setResultsPerPage(url));
  const $ = cheerio.load(response);
  const players: Player[] = [];

  let headers: string[] = [];

  $('.CRs1 tr').each((index, element) => {
    if (index === 0) {
      headers = $(element)
        .children()
        .map((_index, element) => $(element).text().trim())
        .get();
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

export async function getPairings(url: string, players: Player[]): Promise<Pairing[]> {
  const response = await fetchHtml(url);
  const $ = cheerio.load(response);
  const pairings: Pairing[] = [];

  $('.CRs1 tr').each((_index, element) => {
    // ignore rows that do not have pairings
    if ($(element).find('table').length === 0) {
      return;
    }

    const whiteName = $(element).find('table').find('div.FarbewT').parentsUntil('table').last().text().trim();
    const blackName = $(element).find('table').find('div.FarbesT').parentsUntil('table').last().text().trim();

    pairings.push({
      white: players.find(player => player.name === whiteName) || { name: whiteName },
      black: players.find(player => player.name === blackName) || { name: blackName },
    });
  });

  return pairings;
}

export async function getPairingsForTeamSwiss(url: string): Promise<Pairing[]> {
  const response = await fetchHtml(url);
  const $ = cheerio.load(response);
  const pairings: Pairing[] = [];

  const headerRow = $('.CRs1 tr th')
    .first()
    .parent()
    .children()
    .map((_index, element) => $(element).text().trim())
    .get();

  if (!headerRow.includes('Club/City')) {
    throw new Error('Pairings table does not contain Lichess usernames');
  }

  $('.CRs1 tr').each((_index, element) => {
    // ignore rows that do not have pairings
    if ($(element).find('table').length === 0) {
      return;
    }

    const white = $(element).find('table').find('div.FarbewT').parentsUntil('table').last().text().trim();
    const black = $(element).find('table').find('div.FarbesT').parentsUntil('table').last().text().trim();

    const rating1 = $(element).children().eq(headerRow.indexOf('Rtg')).text().trim();
    const rating2 = $(element).children().eq(headerRow.lastIndexOf('Rtg')).text().trim();

    const username1 = $(element).children().eq(headerRow.indexOf('Club/City')).text().trim();
    const username2 = $(element).children().eq(headerRow.lastIndexOf('Club/City')).text().trim();

    // which color indicator comes first: div.FarbewT or div.FarbesT?
    const firstDiv = $(element).find('table').find('div.FarbewT, div.FarbesT').first();

    if ($(firstDiv).hasClass('FarbewT')) {
      pairings.push({
        white: {
          name: white,
          rating: parseInt(rating1),
          lichess: username1,
        },
        black: {
          name: black,
          rating: parseInt(rating2),
          lichess: username2,
        },
      });
    } else if ($(firstDiv).hasClass('FarbesT')) {
      pairings.push({
        white: {
          name: white,
          rating: parseInt(rating2),
          lichess: username2,
        },
        black: {
          name: black,
          rating: parseInt(rating1),
          lichess: username1,
        },
      });
    } else {
      throw new Error('Could not parse Pairings table');
    }
  });

  return pairings;
}
