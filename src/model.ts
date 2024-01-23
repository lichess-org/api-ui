export interface Bulk {
  id: BulkId;
  games: BulkGame[];
  variant: string;
  rated: boolean;
  pairAt: Date;
  startClocksAt?: Date;
  scheduledAt: Date;
  pairedAt?: Date;
}
export interface BulkGame {
  id: string;
  white: Username;
  black: Username;
}
export type BulkId = string;
export type Username = string;

export interface Game {
  id: string;
  moves: string;
  status: string;
  players: { white: Player; black: Player };
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
