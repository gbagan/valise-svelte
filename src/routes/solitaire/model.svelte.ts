import { Model, WithSize, WithScore, Objective } from '$lib/model.svelte';
import { diffCoords, generate, generate2, random, repeat } from '$lib/util';

export enum Board { French, English, Circle, Grid3, Random };
export type Position = boolean[];
type Move = {from: number, to: number};

export default class extends WithScore(WithSize(Model<Position, Move>)) {
  holes: boolean[] = $state([]);
  help2 = $state(0);
  boardType = $state(Board.Circle);
  
  constructor() {
    super([]);
    this.rows = 5;
    this.columns = 1;
  }

  // retourne la position du trou situé entre les deux positions d'un coup si celui est valide
  private betweenMove({ from, to }: Move): number | null {
    const [row, col] = diffCoords(this.columns, from, to);
    return row * row + col * col == 4 ? (from + to) / 2 | 0 : null;
  }
  
  // même chose que betweenMove mais dans un plateau circulaire    
  // ne traite pas le cas du plateau de taille 4
  private betweenInCircle = (from: number, to: number, size: number) =>
    from - to === 2 || to - from === 2
    ? (from + to) / 2 | 0
    : (size + to - from) % size === 2
    ? (from + 1) % size
    : (size + from - to) % size == 2
    ? (to + 1) % size
    : null;

  // même chose que betweenMove dans un plateau normal ou circuaire.
  // Traite le cas particulier du plateau circulaire de taille 4
  betweenMove2(move: Move): number | null {
    const {from, to} = move;
    if (this.boardType === Board.Circle) {
      const x = this.betweenInCircle(from, to, this.rows);
      if (x === null) {
        return null;
      } else {
        return this.rows === 4 && !this.position[x] ? (x + 2) % 4 : x; 
      }
    } else {
      return this.betweenMove(move);
    }
  }

  play(move: Move): Position | null {
    const {from, to} = move;
    const between = this.betweenMove2(move);
    if (between === null) {
      return null;
    }
    const pbetween = this.position[between];
    const pfrom = this.position[from];
    const pto = this.position[to];
    const hto = this.holes[to];
    if (!pfrom || !pbetween || !hto || pto) {
      return null;
    }
    const position = this.position.slice();
    position[from] = false;
    position[between] = false;
    position[to] = true;
    return position;
  }

  initialPosition = () => this.position;

  isLevelFinished = () => this.position.every((p, i) =>
    !p || [2, -2, 2 * this.columns, -2 * this.columns, this.rows - 2].every(d =>
      this.play({from: i, to: i+d}) === null
    )
  );

  onNewGame() {
    const columns = this.columns;
    const rows = this.rows;
    if (this.boardType === Board.English) {
      this.holes = generate2(7, 7, (row, col) =>
        Math.min(row, 6 - row) >= 2 || Math.min(col, 6 - col) >= 2 
      );
      this.position = this.holes.with(24, false);
      this.customSize = false;
    } else if (this.boardType === Board.French) {
      this.holes = generate2(7, 7, (row, col) =>
        Math.min(row, 6 - row) + Math.min(col, 6 - col) >= 2 
      );
      this.position = this.holes.with(24, false);
      this.customSize = false;
    } else if (this.boardType === Board.Circle) {
      this.holes = repeat(rows, true);
      const empty = random(0, rows);
      this.position = generate(rows, x => x !== empty);
      this.customSize = true;
    } else if (this.boardType === Board.Grid3) {
      this.holes = repeat(3 * columns, true);
      this.position = generate(3 * columns, i => i < 2 * columns);
      this.customSize = true;
    } else { // boardType === "random"
      this.holes = repeat(3 * columns, true);
      const bools = generate(columns, () => Math.random() < 0.5);
      this.position = bools.concat(repeat(columns, true), bools.map(x => !x));
      this.customSize = true;
    }
  }

  objective = () => Objective.Minimize;
  score = () => this.position.filter(x => x).length;
  // todo à vérifier
  scoreHash = () => this.boardType === Board.Random ? null : `${this.boardType},${this.rows},${this.columns}`;
  updateScore = () => this.updateScore2(true, "always");

  setBoard(b: Board) {
    this.boardType = b;
    switch (b) {
      case Board.Circle:
        this.rows = 6;
        this.columns = 1;
        break;
      case Board.Grid3:
      case Board.Random:
        this.rows = 3;
        this.columns = 5;
        break;
      default:
        this.rows = 7;
        this.columns = 7;
    }
  }
}