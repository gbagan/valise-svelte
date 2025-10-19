import { random, range } from '$lib/util';
import { Model } from '$lib/model.svelte';
import { WithCombinatorial } from '$lib/combinatorial.svelte';
import { WithSize, type SizeLimit } from '$lib/size.svelte';

type Position = {left: number, right: number, top: number, bottom: number};
export type Move = ["left" | "right" | "top" | "bottom", number];
export enum SoapMode { Corner, Border, Standard, Custom };

const sizeLimit: SizeLimit = { minRows: 4, minCols: 4, maxRows: 10, maxCols: 10 };

export default class extends WithCombinatorial(WithSize(Model<Position, Move>)) {
  soap: [number, number] | null = $state(null);
  soapMode = $state(SoapMode.Corner);

  constructor() {
    super({left: 0, right: 0, top: 0, bottom: 0});
    this.resize(6, 7);
  }

  play([dir, x]: Move): Position | null {
    switch (dir) {
      case "left": return {...this.position, left: x};
      case "right": return {...this.position, right: x};
      case "top": return {...this.position, top: x};
      default: return {...this.position, bottom: x};
    }
  }

  isLevelFinished() {
    const {left, right, top, bottom} = this.position;
    return left === right - 1 && top === bottom - 1;
  }

  initialPosition = () => ({left: 0, right: this.columns, top: 0, bottom: this.rows});

  onNewGame() {
    if (this.soapMode === SoapMode.Custom) {
      this.soap = null;
    } else {
      const row = this.soapMode === SoapMode.Standard ? random(0, this.rows) : 0;
      const col = this.soapMode !== SoapMode.Corner ? random(0, this.columns) : 0;
      this.soap = [row, col];
    }
  }

  isLosingPosition(): boolean {
    if (this.soap === null) {
      return false;
    }
    const [row, col] = this.soap;
    const {left, right, top, bottom} = this.position;
    return ((col - left) ^ (right - col - 1) ^ (row - top) ^ (bottom - row - 1)) === 0;
  }

  possibleMoves(): Move[] {
    if (this.soap === null) {
       return [];
    }
    const [row, col] = this.soap;
    const {left, right, top, bottom} = this.position;
    const l = range(left+1, col+1).map(i => ["left", i] as Move);
    const r = range(col+1, right).map(i => ["right", i] as Move);
    const t = range(top+1, row+1).map(i => ["top", i] as Move);
    const b = range(row+1, bottom).map(i => ["bottom", i] as Move);
    return l.concat(r, t, b);
  }

  get sizeLimit() {
    return sizeLimit;
  }

  putSoap(s: [number, number]) {
    if (this.soap === null) {
      this.soap = s;
    }
  }
}