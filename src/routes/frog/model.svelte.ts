import { range, repeat } from '$lib/util';
import { Model } from '$lib/model.svelte';
import { WithCombinatorial } from '$lib/combinatorial.svelte';
import { WithSize, type SizeLimit } from '$lib/size.svelte';

type Position = number;
type Move = number;

const sizeLimit: SizeLimit = {
  minRows: 5,
  maxRows: 30,
  minCols: 0,
  maxCols: 0,
}

export default class extends WithCombinatorial(WithSize(Model<Position, Move>)) {
  #moves = $state([1, 2, 3]);
  #marked: boolean[] = $state([]);
  
  constructor() {
    super(20);
    this.resize(20, 0, true);
  }
  
  get moves(): readonly number[] {
    return this.#moves;
  }

  get marked(): readonly boolean[] {
    return this.#marked;
  }

  canPlay = (v: number) => {
    const position = this.position;
    const maximum = Math.max(...this.moves);
    return this.moves.includes(position-v) || position > 0 && v === 0 && position <= maximum
  }

  protected losingPositions: boolean[] = $derived.by(() => {
    const rows = this.rows;
    const losing = new Array(rows+1);
    losing[0] = true;
    for (let i = 1; i <= rows; i++) {
      losing[i] = this.moves.every(m => i - m >= 0 && !losing[i-m]);
    }
    return losing;
  });

  protected play = (v: number) => this.canPlay(v) ? v : null;
  protected initialPosition = () => this.rows;
  isLevelFinished = () => this.position === 0;
  protected possibleMoves = () => range(0, this.rows+1).filter(this.canPlay);
  protected isLosingPosition = () => this.losingPositions[this.position];
  protected onNewGame() {
    this.#marked = repeat(this.rows, false);
  }

  get sizeLimit() {
    return sizeLimit;
  }

  movesSetter = (move: number) => {
    const next = [1, 2, 3, 4, 5].filter(m => (m === move) !== this.moves.includes(m));
    if (next.length > 0) {
      this.newGame(() => this.#moves = next);
    }
  }

  toggleMarked(index: number) {
    this.#marked[index] = !this.#marked[index];
  }
}