import { diffCoords, repeat } from '$lib/util';
import { Model } from '$lib/model.svelte';
import { Objective, WithScore } from '$lib/score.svelte';
import { WithSize } from '$lib/size.svelte';

export type Position = readonly number[];
type Move = {readonly from: number, readonly to: number};

const sizeLimit = { minRows: 1, minCols: 2, maxRows: 6, maxCols: 12 };

export default class extends WithScore(WithSize(Model<Position, Move>)) {
  constructor() {
    super([]);
    this.resize(4, 4);
  }

  protected play({ from, to }: Move) {
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

  protected initialPosition = () => repeat(this.rows * this.columns, 1);

  protected isLevelFinished () {
    const position = this.position;
    const columns = this.columns;
    return position.every((x, i) => {
      const y = (i + 1) % columns === 0 ? 0 : position[i + 1];
      const z = position[i + columns] ?? 0;
      return x * (y + z) === 0
    })
  }

  score = () => this.position.filter(v => v > 0).length;
  protected scoreHash = () => `${this.rows},${this.columns}`;
  protected objective = () => Objective.Minimize;
  protected updateScore = () => this.updateScore2(true, "always");

  get sizeLimit() {
    return sizeLimit;
  }
}