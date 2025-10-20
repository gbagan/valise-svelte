import { generate, random, repeat } from '$lib/util';
import { Model } from '$lib/model.svelte';

type Position = readonly number[];
type Move = number;

export default class extends Model<Position, Move> {
  #size = $state(5);
  #colorCount = $state(2);
  #range = $state(1);
  #shuffle = $state(false);

  constructor() {
    super([]);
    this.newGame();
  }

  get size() {
    return this.#size;
  }

  get colorCount() {
    return this.#colorCount;
  }

  get range() {
    return this.#range;
  }

  get shuffle() {
    return this.#shuffle;
  }

  protected play = (move: Move) => this.position.map((color, i) => 
    this.inRange(move, i) ? (color + 1) % this.#colorCount : color
  );

  protected initialPosition = () =>
    this.shuffle
    ? generate(this.#size, () => random(0, this.#colorCount))
    : repeat(this.#size, 1);

  isLevelFinished = () => this.position.every(i => i === 0);

  inRange(i: number, j: number) {
    const diff = Math.abs(i - j);
    return Math.min(diff, this.#size - diff) <= this.#range;
  }

  setSize = (size: number) => this.newGame(() => this.#size = size);
  setColorCount = (colorCount: number) => this.newGame(() => this.#colorCount = colorCount);
  setRange = (range: number) => this.newGame(() => this.#range = range);
  toggleShuffle = () => this.newGame(() => this.#shuffle = !this.#shuffle);
}