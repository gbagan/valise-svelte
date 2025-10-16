import { generate, random, repeat } from '$lib/util';
import { Model } from '$lib/model.svelte';

type Position = number[];
type Move = number;

export default class extends Model<Position, Move> {
  size = $state(5);
  colorCount = $state(2);
  range = $state(1);
  shuffle = $state(false);

  constructor() {
    super([]);
    this.newGame();
  }

  play = (move: Move) => this.position.map((color, i) => 
    this.inRange(move, i) ? (color + 1) % this.colorCount : color
  );

  initialPosition = () =>
    this.shuffle
    ? generate(this.size, () => random(0, this.colorCount))
    : repeat(this.size, 1);

  isLevelFinished = () => this.position.every(i => i === 0);

  inRange(i: number, j: number) {
    const diff = Math.abs(i - j);
    return Math.min(diff, this.size - diff) <= this.range;
  }
}