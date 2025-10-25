import type { ICoreModel, ISizeModel } from "$lib/model/types";

export type Position = readonly number[];
export type Move = number;
export enum Mode { Mode1, Mode2 };

export interface IModel extends ICoreModel<Position, Move>, ISizeModel {
  readonly exit: number | null;
  readonly mode: Mode;
  selectSquare: (square: number) => void;
  setMode: (mode: Mode) => void;
  isLevelFinished: () => boolean;
}