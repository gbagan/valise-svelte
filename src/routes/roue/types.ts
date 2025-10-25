import type { ICoreModel } from "$lib/model/types";

export type Position = (number | null)[];
export type Location = { kind: "panel", id: number } | { kind: "wheel", id: number } | {kind: "board"};
export type Move = {from: Location, to: Location};

export interface IModel extends ICoreModel<Position, Move> {
  readonly size: number;
  readonly rotation: number;
  readonly isValidRotation: boolean;
  readonly isValidRotation2: boolean;
  readonly aligned: readonly boolean[];
  check: () => Promise<void>;
  setSize: (size: number) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
}