import { Me } from './auth';

export const formData = (data: any): FormData => {
  const formData = new FormData();
  for (const k of Object.keys(data)) formData.append(k, data[k]);
  return formData;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const variants = [
  ['standard', 'Standard'],
  ['chess960', 'Chess960'],
  ['crazyhouse', 'Crazyhouse'],
  ['kingOfTheHill', 'KingOfTheHill'],
  ['threeCheck', 'ThreeCheck'],
  ['antichess', 'Antichess'],
  ['atomic', 'Atomic'],
  ['horde', 'Horde'],
  ['racingKings', 'RacingKing'],
];

async function request<TResponse>(url: string, config: RequestInit, me: Me): Promise<TResponse> {
  const response = await fetch(url, config);
  return await response.json();
}
