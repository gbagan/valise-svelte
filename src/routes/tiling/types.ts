import type { ICoreModel, ISizeModel } from "$lib/model/types";

export type Coord = [row: number, col: number];
export type Tile = Coord[];
export type TileType = "type1" | "type2" | "type3" | "custom";
export type Position = readonly number[];
export type Move = number;

export interface IModel extends ICoreModel<Position, Move>, ISizeModel {
  readonly sinks: readonly number[];
  readonly sinkCount: number;
  readonly tileType: TileType;
  readonly rotation: number;
  readonly tile: Tile;
  readonly customTileGrid: readonly boolean[];
  rotate: () => void;
  selectSquare: (index: number) => void;
  setSinkCount: (count: number) => void;
  setTileType: (type: TileType) => void;
  flipCustomTile: (index: number) => void;
}