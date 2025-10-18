import { diffCoords, repeat } from '$lib/util';
import { Model, Objective, WithScore, WithSize } from '$lib/model.svelte';

export type Position = number[];
type Move = {from: number, to: number};

export default class extends WithScore(WithSize(Model<Position, Move>)) {
  baseCount = $state(5);
  missingPeg = $state(1);
  
  constructor() {
    super([]);
    this.rows = 4;
    this.columns = 4;
    this.customSize = false;
    this.newGame();
  }

  play({ from, to }: Move) {
    const position = this.position;
    const [row, col] = diffCoords(this.columns, from, to);
    const pfrom = position[from];
    const pto = position[to];
    if (pfrom > 0 && pfrom <= pto && row * row + col * col === 1) {
      return position.with(from, 0).with(to, pfrom+pto);
    } else {
      return null;
    }
  }

  initialPosition = () => repeat(this.rows * this.columns, 1);

  isLevelFinished () {
    const position = this.position;
    const columns = this.columns;
    return position.every((x, i) => {
      const y = (i + 1) % columns == 0 ? 0 : position[i + 1];
      const z = position[i + columns] ?? 0;
      return x * (y + z) === 0
    })
  }

  score = () => this.position.filter(v => v > 0).length;
  scoreHash = () => `${this.rows},${this.columns}`;
  objective = () => Objective.Minimize;
  protected updateScore = () => this.updateScore2(true, "always");
}