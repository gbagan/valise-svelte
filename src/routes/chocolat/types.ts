import type { ICoreModel, ISizeModel, ITwoPlayersModel } from "$lib/model/types";

export type Position = {
  readonly left: number,
  readonly right: number,
  readonly top: number,
  readonly bottom: number
};
export type Move = readonly ["left" | "right" | "top" | "bottom", number];
export enum SoapMode { Corner, Border, Standard, Custom };

export interface IModel extends ICoreModel<Position, Move>, ISizeModel, ITwoPlayersModel {
  readonly soap: readonly [number, number] | null;
  readonly soapMode: SoapMode;
  possibleMoves: () => Move[];
  putSoap: (soap: [number, number]) => void;
  setSoapMode: (mode: SoapMode) => void;
}