import type { ICoreModel, ISizeModel, ITwoPlayersModel } from "$lib/model/types";

export type Position = number;
export type Move = number;

export interface IModel extends ICoreModel<Position, Move>, ISizeModel, ITwoPlayersModel {
  readonly moves: readonly Move[];
  readonly marked: readonly boolean[];
  movesSetter: (move: number) => void;
  toggleMarked: (index: number) => void;
}