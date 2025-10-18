import { type Constructor, Model } from "./model.svelte";

export interface SizeLimit {
  minRows: number;
  maxRows: number;
  minCols: number;
  maxCols: number;
}

export interface SizeModel {
  rows: number;
  columns: number;
  customSize: boolean;
  setGridSize: (rows: number, columns: number, sizeLimit?: SizeLimit) => void;
}

export function isSizeModel<Pos, Move>(model: Model<Pos, Move>): model is Model<Pos, Move> & SizeModel {
  return (model as Partial<SizeModel>).rows !== undefined 
    && (model as Partial<SizeModel>).columns !== undefined
    && (model as Partial<SizeModel>).customSize !== undefined
}

export function WithSize<Pos, Move, TBase extends Constructor<Model<Pos, Move>>>(Base: TBase) {
  abstract class C extends Base implements SizeModel {
    rows = $state(0);
    columns = $state(0);
    customSize = $state(false);

    constructor(...args: any[]) {
      super(...args);
    }

    setGridSize(rows: number, columns: number, sizeLimit?: SizeLimit) {
      if (!sizeLimit) {
        return
      }
      const {minRows, maxRows, minCols, maxCols} = sizeLimit;
  
      if (rows < minRows || rows > maxRows || columns < minCols || columns > maxCols) {
        return;
      }

      this.newGame(() => {
        this.rows = rows;
        this.columns = columns;
      });
    }
  }

  return C;
}