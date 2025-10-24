import type { ICoreModel } from "$lib/model/types";

export type Position = readonly number[];
export type Move = number;

export interface IModel extends ICoreModel<Position, Move> {
  readonly baseCount: number;
  readonly missingPeg: number;
  setBaseCount: (i: number) => void;
  isLevelFinished: () => boolean;
}