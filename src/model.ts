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
