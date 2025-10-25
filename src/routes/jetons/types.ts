import type { ICoreModel, IScoreModel, ISizeModel } from "$lib/model/types";

export type Position = readonly number[];
export type Move = {readonly from: number, readonly to: number};

export interface IModel extends ICoreModel<Position, Move>, ISizeModel, IScoreModel<Position> {
  score: () => number;
}