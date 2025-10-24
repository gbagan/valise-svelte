import type { ICoreModel } from "$lib/model/types";

export type Position = readonly number[];
export type Move = number;

export interface IModel extends ICoreModel<Position, Move> {
  readonly size: number;
  readonly colorCount: number;
  readonly range: number;
  readonly shuffle: boolean;
  inRange: (i: number, j: number) => boolean;
  setColorCount: (i: number) => void;
  setRange: (i: number) => void;
  toggleShuffle: () => void;
  setSize: (i: number) => void;
  isLevelFinished: () => boolean;
}