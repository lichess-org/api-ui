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

export const gameRules: [string, string][] = [
  ['noAbort', 'Players cannot abort the game'],
  ['noRematch', 'Players cannot offer a rematch'],
  ['noGiveTime', 'Players cannot give extra time'],
  ['noClaimWin', 'Players cannot claim the win if the opponent leaves'],
  ['noEarlyDraw', 'Players cannot offer a draw before move 30 (ply 60)'],
];
export const gameRuleKeys = gameRules.map(([key]) => key);

export const gameRulesExceptNoAbort = gameRules.filter(([key]) => key !== 'noAbort');
export const gameRuleKeysExceptNoAbort = gameRulesExceptNoAbort.map(([key]) => key);
