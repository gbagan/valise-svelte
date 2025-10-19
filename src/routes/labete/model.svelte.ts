import { coords, countBy, generate2, mod, repeat } from '$lib/util';
import { Model } from '$lib/model.svelte';
import { Objective, WithScore } from '$lib/score.svelte';
import { WithSize } from '$lib/size.svelte';

export enum Mode { Standard, Cylinder, Torus };
type Beast = [number, number][];
type Beast2 = Beast[];
export enum BeastType { Type1, Type2, Type3, Type4, Custom };

const type1: Beast = [ [0, 0], [0, 1] ];
const type2: Beast = [ [0, 0], [0, 1], [0, -1] ];
const type3: Beast = [ [0, 0], [0, 1], [1, 1] ];
const beastTypes: Beast2[] = [ [ type1 ], [ type2 ], [ type3 ], [ type2, type3 ] ];

export type Position = boolean[];
type Move = number;

const rotate90 = (beast: Beast) => beast.map(([row, col]) => [-col, row]) as Beast;
const translate = (beast: Beast, row: number, col: number) => beast.map(([r, c]) => [r+row, c+col]) as Beast;

function allRotations(beast: Beast): Beast[] {
  const beast2 = rotate90(beast);
  const beast3 = rotate90(beast2);
  const beast4 = rotate90(beast3);    
  return [ beast, beast2, beast3, beast4 ];
}

// Fonction auxiliaire pour nonTrappedBeast.
// Il n'est pas nécessaire d'avoir une vraie fonction aléatoire
const pseudoRandomPick = <A>(arr: A[]) => arr[28921 % arr.length]

export default class extends WithScore(WithSize(Model<Position, Move>)) {
  mode = $state(Mode.Standard);
  beastType = $state(BeastType.Type1);
  selectedColor = $state(0);
  currentPosition: {x: number, y: number} | null = $state(null);
  startingPosition: {x: number, y: number} | null = $state(null);
  startingSquare: number | null = $state(null);
  squareColors: number[] = $state([]);
  customBeast: Beast2 = $state([[]]);

  constructor() {
    super([]);
    this.rows = 5;
    this.columns = 5;
    this.customSize = false;
    this.newGame()
  }

  beast: Beast2 = $derived.by(() => {
    switch (this.beastType) {
      case BeastType.Type1: return beastTypes[0];
      case BeastType.Type2: return beastTypes[1];
      case BeastType.Type3: return beastTypes[2];
      case BeastType.Type4: return beastTypes[3];
      default: return this.customBeast;
    }
  });

  allTranslations = (beast: Beast) =>
    generate2(this.rows, this.columns, (row, col) => translate(beast, row, col));

  // renvoie toutes les positions possibles pour une bête à plusieurs formes en prenant
  // en compte toutes les rotations et translations
  // peut contenir des positions hors du plateau
  allBeastPositions(beast: Beast2): Beast[] {
    const res = [];
    for (const b of beast) {
      for (const b2 of allRotations(b)) {
        for (const b3 of this.allTranslations(b2)) {
          res.push(b3);
        }
      }
    }
    return res;
  }

  adaptBeast = (beast: Beast): Beast => beast.map(([row, col]) => {
    switch (this.mode) {
      case Mode.Standard: return [row, col];
      case Mode.Cylinder: return [row, mod(col, this.columns)];
      default: return  [mod(row, this.rows), mod(col, this.columns)];
    }
  })

  // Renvoie toutes les emplacement possibles évitants les pièges pour la bête
  nonTrappedBeasts = $derived.by(() => {
    const rows = this.rows
    const columns = this.columns;
    const isValidBeast = (beast: Beast) => beast.every(([row, col]) =>
      row >= 0 && row < rows && col >= 0 && col < columns
      && !this.position[row * columns + col]
    );
    return this.allBeastPositions(this.beast).map(this.adaptBeast).filter(isValidBeast);
  })

  // Renvoie un emplacement possible pour la bête sur le plateau sous forme d'un tableau de booléens
  // indicé par les positions du plateau.
  // Renvoie un tableau ne contenant que la valeur false si aucun emplacement pour la bête n'est possible
  nonTrappedBeast = $derived.by(() => {
    const res = repeat(this.rows * this.columns, false);
    if (this.nonTrappedBeasts.length > 0) {
      const beast = pseudoRandomPick(this.nonTrappedBeasts);
      for (const [row, col] of beast) {
        res[row * this.columns + col] = true;
      }
    }
    return res;
  });

  customBeastGrid = $derived.by(() => {
    const res = repeat(25, false);
    for (const [row, col] of this.customBeast[0]) {
      res[row * 5 + col + 12] = true;
    }
    return res;
  });

  play = (i: Move) => this.position.with(i, !this.position[i]);
  isLevelFinished = () => this.nonTrappedBeasts.length === 0;
  initialPosition = () => repeat(this.rows * this.columns, false);
  onNewGame() {
    this.squareColors = repeat(this.rows * this.columns, 0);
  }

  objective = () => Objective.Minimize;
  score = () => countBy(this.position, x => x);
  scoreHash = () => this.beastType === BeastType.Custom
    ? null
    : `${this.columns},${this.rows},${this.mode},${this.beastType}`;

  protected updateScore = () => this.updateScore2(true, "onNewRecord");

  setBeastType(type: BeastType) {
    this.beastType = type;
    if (type === BeastType.Custom) {
      this.openCustomizeDialog();
      this.rows = Math.max(this.rows, 5);
      this.columns = Math.max(this.columns, 5);
    }
  }

  flipCustomBeast(i: number) {
    let [row, col] = coords(5, i);
    row -= 2;
    col -= 2;
    const idx = this.customBeast[0].findIndex(([r, c]) => r === row && c === col);
    if (idx === -1) {
      this.customBeast[0].push([row, col])
    } else {
      // todo à vérifier
      this.customBeast[0].splice(idx, 1);
    }
  }

  finishZone(index: number) {
    if (this.startingSquare !== null) {
      let [row1, col1] = coords(this.columns, index);
      let [row2, col2] = coords(this.columns, this.startingSquare);
      if (row1 > row2) {
        [row1, row2] = [row2, row1];
      };
      if (col1 > col2) {
        [col1, col2] = [col2, col1];
      };
      for (let i = row1; i <= row2; i++) {
        for (let j = col1; j <= col2; j++) {
          this.squareColors[i * this.columns + j] = this.selectedColor;
        }
      }
    }
    this.startingSquare = null;
    this.startingPosition = null;
  }
}