import { range } from '$lib/util';
import { Model } from "$lib/model.svelte";

type Position = number[][];
type Move = {from: number, to: number};

export default class extends Model<Position, Move> {
  #diskCount = $state(4);
  
  constructor() {
    super([]);
    this.newGame();
  }

  get diskCount() {
    return this.#diskCount;
  }

  play({ from, to }: Move): Position | null {
    const position = this.position;
    const last = position[from].at(-1);
    if (from === to || last === undefined || last < (position[to].at(-1) ?? -1)) {
        return null;
    }
    const init = position[from].slice(0, -1);
    return position.with(from, init).with(to, position[to].concat([last]));
  }

  initialPosition = () => [range(0, this.#diskCount), [], []];
  isLevelFinished = () => this.position[0].length === 0 && this.position[1].length === 0;

  setDiskCount = (diskCount: number) => this.newGame(() => this.#diskCount = diskCount);
}