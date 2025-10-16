import { generate, random } from '$lib/util';
import { Model, WithCombinatorial } from '$lib/model.svelte';

type Position = [number, number][];
type Move = {pile: number, pos: number};

export default class extends WithCombinatorial(Model<Position, Move>) {
  length = $state(10);
  pileCount = $state(4);
  
  constructor() {
    super([]);
    this.newGame();
  }

  canPlay(move: Move) {
    const [p1, p2] = this.position[move.pile];
    return move.pos != p1 && move.pos != p2
        && (this.turn === 1 ? move.pos < p2 : move.pos > p1)
  }

  play(move: Move): Position | null {
    if (!this.canPlay(move)) {
      return null;
    }
    const [p1, p2] = this.position[move.pile];
    return this.position.with(move.pile, this.turn === 1 ? [move.pos, p2] : [p1, move.pos]);
  }

  initialPosition = () =>
    generate(this.pileCount, () => this.length === 5 ? [0, 4] : [random(0, 5), random(5, 10)]) as Position;

  isLevelFinished = () =>
    this.position.every(([p1, p2]) =>
      p2 - p1 === 1 && p1 == (this.turn === 2 ? this.length - 2 : 0)
    );

  possibleMoves(): Move[] {
    const moves = [];
    for (let i = 0; i < this.pileCount; i++) {
      for (let j = 0; j < this.length; j++) {
        moves.push({pile: i, pos: j});
      }
    }

    const cmpKey = (move: Move) => {
      const [x, y] = this.position[move.pile];
      return this.turn === 1 ? x - move.pos : move.pos - y;
    }

    return moves
      .filter(m => this.canPlay(m))
      .toSorted((m1, m2) => cmpKey(m1) - cmpKey(m2))
  }

  isLosingPosition = () => this.position.reduce((acc, [x, y]) => acc ^ (y - x - 1), 0) === 0;
}