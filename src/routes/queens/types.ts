import type { ICoreModel, IScoreModel, ISizeModel } from "$lib/model/types";

export type Piece = "R" | "B" | "K" | "N" | "Q" | "custom" | null;
export type Position = readonly Piece[];
export type Move = number;

export const piecesList: readonly Piece[] = ["R", "B", "K", "N", "Q"];

export interface IModel extends ICoreModel<Position, Move>, ISizeModel, IScoreModel<Position> {
  readonly selectedPiece: Piece;
  readonly allowedPieces: readonly Piece[];
  readonly multiPieces: boolean;
  readonly customLocalMoves: readonly boolean[];
  readonly customDirections: readonly boolean[];
  readonly capturable: readonly boolean[];
  attackedBy: (piece: Piece, index: number) => readonly boolean[];
  setSelectedPiece: (piece: Piece) => void;
  changeAllowedPieces: (piece: Piece) => void;
  customize: () => void;
  toggleMultiPieces: () => void;
  toggleCustomLocalMove: (index: number) => void;
  toggleCustomDirection: (index: number) => void;
}