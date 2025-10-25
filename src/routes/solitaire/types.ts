import type { ICoreModel, IScoreModel, ISizeModel } from "$lib/model/types";

export enum Board { French, English, Circle, Grid3, Random };
export type Position = readonly boolean[];
export type Move = {readonly from: number, readonly to: number};

export interface IModel extends ICoreModel<Position, Move>, ISizeModel, IScoreModel<Position> {
  readonly holes: readonly boolean[];
  readonly boardType: Board;
  readonly help2: number;
  readonly score: () => number;
  readonly setBoard: (type: Board) => void;
  readonly incrementHelp: () => void;
}