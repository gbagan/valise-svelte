import { type Constructor, Model } from "./model.svelte";

export interface SizeLimit {
  minRows: number;
  maxRows: number;
  minCols: number;
  maxCols: number;
}

export interface SizeModel {
  readonly rows: number;
  readonly columns: number;
  readonly customSize: boolean;
  readonly sizeLimit: SizeLimit | null;
  resize: (rows: number, columns: number, customSize?: boolean) => void;
}

export function isSizeModel<Pos, Move>(model: Model<Pos, Move>): model is Model<Pos, Move> & SizeModel {
  return (model as Partial<SizeModel>).rows !== undefined 
    && (model as Partial<SizeModel>).columns !== undefined
    && (model as Partial<SizeModel>).customSize !== undefined
}

export function WithSize<Pos, Move, TBase extends Constructor<Model<Pos, Move>>>(Base: TBase) {
  abstract class C extends Base implements SizeModel {
    #rows = $state(0);
    #columns = $state(0);
    #customSize = $state(false);

    constructor(...args: any[]) {
      super(...args);
    }

    get rows() {
      return this.#rows;
    }

    get columns() {
      return this.#columns;
    }

    get customSize() {
      return this.#customSize;
    }

    protected set rows(value: number) {
      this.#rows = value;
    }

    protected set columns(value: number) {
      this.#columns = value;
    }

    protected set customSize(value: boolean) {
      this.#customSize = value;
    } 

    get sizeLimit(): SizeLimit | null {
      return null;
    }

    resize = (rows: number, columns: number, customSize?: boolean) => {
      let valid: boolean;
      if (!this.sizeLimit) {
        valid = true;
      } else {
        const {minRows, maxRows, minCols, maxCols} = this.sizeLimit;
        valid = rows >= minRows && rows <= maxRows && columns >= minCols && columns <= maxCols;
      }

      if (!valid) {
        return;
      }

      this.newGame(() => {
        this.#rows = rows;
        this.#columns = columns;
        if (customSize !== undefined) {
          this.#customSize = customSize;
        }
      });
    }
  }

  return C;
}