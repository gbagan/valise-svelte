import { range, repeat } from '$lib/util';
import { Model, WithCombinatorial } from '$lib/model.svelte';
import { WithSize } from '$lib/size.svelte';

type Position = number;
type Move = number;

export default class extends WithCombinatorial(WithSize(Model<Position, Move>)) {
  moves = $state([1, 2, 3]);
  marked: boolean[] = $state([]);
  
  constructor() {
    super(20);
    this.rows = 20;
    this.columns = 0;
    this.customSize = true;
    this.newGame();
  }
  
  canPlay = (v: number) => {
    const position = this.position;
    const maximum = Math.max(...this.moves);
    return this.moves.includes(position-v) || position > 0 && v == 0 && position <= maximum
  }

  losingPositions: boolean[] = $derived.by(() => {
    const rows = this.rows;
    const losing = new Array(rows+1);
    losing[0] = true;
    for (let i = 1; i <= rows; i++) {
      losing[i] = this.moves.every(m => i - m >= 0 && !losing[i-m]);
    }
    return losing;
  });

  play = (v: number) => this.canPlay(v) ? v : null;
  initialPosition = () => this.rows;
  isLevelFinished = () => this.position === 0;
  possibleMoves = () => range(0, this.rows+1).filter(this.canPlay);
  isLosingPosition = () => this.losingPositions[this.position];
  onNewGame = () => this.marked = repeat(this.rows, false);

  movesSetter(move: number) {
    const next = [1, 2, 3, 4, 5].filter(m => (m === move) != this.moves.includes(m));
    if (next.length > 0) {
      this.newGame(() => this.moves = next);
    }
  }
}