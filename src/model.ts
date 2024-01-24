export interface Bulk {
  id: BulkId;
  games: BulkGame[];
  variant: string;
  rated: boolean;
  rules: Rule[];
  pairAt: Date;
  startClocksAt?: number;
  scheduledAt: number;
  pairedAt?: number;
  clock: { limit: number; increment: number };
}
interface BulkGame {
  id: string;
  white: Username;
  black: Username;
}
export type BulkId = string;
export type Username = string;

export type Rule = 'noAbort' | 'noRematch' | 'noGiveTime' | 'noClaimWin' | 'noEarlyDraw';

export interface Game {
  id: string;
  moves: string;
  status: 'created' | 'started';
  players: { white: Player; black: Player };
  winner?: 'white' | 'black';
}
export interface Player {
  user: LightUser;
  rating: number;
}
export interface LightUser {
  id: string;
  name: string;
  title?: string;
}
