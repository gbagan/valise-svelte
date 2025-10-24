import type { ICoreModel } from "$lib/model/types";

type Position = readonly (readonly number[])[];
type Move = {readonly from: number, readonly to: number};

export interface IModel extends ICoreModel<Position, Move> {
  readonly diskCount: number;
  setDiskCount: (count: number) => void;
}