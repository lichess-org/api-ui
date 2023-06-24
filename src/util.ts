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
