import * as cheerio from 'cheerio';

export interface Player {
  name: string;
  fideId?: string;
  rating?: number;
  lichess?: string;
}

export interface Pairing {
  white: string;
  black: string;
}

export interface PairingResult {
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

export async function getPairings(url: string): Promise<Pairing[]> {
  const response = await fetchHtml(url);
  const $ = cheerio.load(response);
  const pairings: Pairing[] = [];

  $('.CRs1 tr').each((_index, element) => {
    // ignore rows that do not have pairings
    if ($(element).find('table').length === 0) {
      return;
    }

    // white indicator == div.FarbewT
    // black indicator == div.FarbesT
    const white = $(element).find('table').find('div.FarbewT').parentsUntil('table').last().text().trim();
    const black = $(element).find('table').find('div.FarbesT').parentsUntil('table').last().text().trim();

    pairings.push({ white, black });
  });

  return pairings;
}

export function formatPairings(players: Player[], pairings: Pairing[]): PairingResult[] {
  return pairings.map(pairing => {
    const white = players.find(player => player.name === pairing.white);
    const black = players.find(player => player.name === pairing.black);

    if (!white) throw new Error(`Could not find in player list: ${pairing.white}`);
    if (!black) throw new Error(`Could not find in player list: ${pairing.black}`);

    return { white, black };
  });
}
