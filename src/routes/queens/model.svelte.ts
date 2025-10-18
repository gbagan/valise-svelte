import { Model, WithScore, WithSize, Objective } from "$lib/model.svelte";
import { diffCoords, generate, repeat } from "$lib/util";

export type Piece = "R" | "B" | "K" | "N" | "Q" | "custom" | null;
export type Position = Piece[];
type Move = number;

export const piecesList: Piece[] = ["R", "B", "K", "N", "Q"];

function legalMoves(piece: Piece, x: number, y: number) {
  switch(piece) {
    case "Q": return (x * x - y * y) * x * y == 0;
    case "K": return x * x + y * y <= 2;
    case "R": return x * y == 0;
    case "B": return x * x - y * y == 0;
    case "N": return x * x + y * y == 5;
    default: return false;
  }
}

export default class extends WithScore(WithSize(Model<Position, Move>)) {
  selectedPiece: Piece = $state("Q");
  selectedSquare: number | null = $state(null);
  allowedPieces: Piece[] = $state(["R"]);
  multiPieces = $state(false);
  customLocalMoves = $state(repeat(25, false));
  customDirections = $state(repeat(9, false));
  
  constructor() {
    super([]);
    this.rows = 8;
    this.columns = 8;
    this.customSize = false;
    this.newGame();
  }

  // teste si la pièce de type "piece" à la position index1 peut attaquer la pièce à la position index2
  // suppose que la pièce est différent de Empty
  canCapture(piece: Piece, index1: number, index2: number): boolean {
    const [row, col] = diffCoords(this.columns, index1, index2);
    if (piece !== "custom") {
      return index1 !== index2 && legalMoves(piece, row, col);
    } else {
      return (row * row - col * col) * row * col === 0
        && this.customDirections[3 * Math.sign(row) + Math.sign(col) + 4]
        || row * row + col * col <= 8
        && this.customLocalMoves[5 * row + col + 12]
    }
  }

  // renvoie l'ensemble des positions pouvant être attaquées par une pièce
  // à la position index sous forme de tableau de booléens
  attackedBy = (piece: Piece, index: number) =>
    generate(this.rows * this.columns, i => this.canCapture(piece, i, index));

  // ensemble des cases pouvant être attaquées par une pièce sur le plateau
  capturable = $derived.by(() => {
    const n = this.rows * this.columns;
    const res = repeat(n, false);
    this.position.forEach((piece, i) => {
      if (piece !== null) {
        const attacked = this.attackedBy(piece, i);
        for (let i = 0; i < n; i++) {
          res[i] ||= attacked[i];
        }
      }
    });

    return res;
  });

  isValidPosition = $derived(this.position.every((piece, i) =>
    piece === null || !this.capturable[i]
  ));

  // ensemble des cases attaquées par la case survolée par le pointeur de la souris
  attackedBySelected = $derived(
    this.selectedSquare === null
    ? repeat(this.rows * this.columns, false)
    : this.attackedBy(this.selectedPiece, this.selectedSquare)
  );

  play(i: Move): Position | null {
    const p = this.position[i] === null ? this.selectedPiece : null;
    return this.position.with(i, p);
  }

  initialPosition = () => repeat(this.rows * this.columns, null);
  isLevelFinished = () => false;
  onNewGame = () => this.selectedPiece = this.allowedPieces[0];

  objective = () => Objective.Maximize;
  score = () => this.isValidPosition ? this.position.filter(p => p !== null).length : 0;
  scoreHash = () => this.multiPieces || this.allowedPieces.includes("custom")
    ? null
    : `${this.rows},${this.columns},${this.allowedPieces[0]}`;


  protected updateScore = () => this.updateScore2(false, "never")

  toggleMultiPieces() {
    this.multiPieces = !this.multiPieces;
    if (!this.multiPieces) {
      this.allowedPieces = this.allowedPieces.slice(0, 1);
    }
  }

  changeAllowedPieces(piece: Piece) {
    this.newGame(() => {
      if (this.multiPieces) {
        const pieces = piecesList.filter(p2 => (p2 === piece) !== this.allowedPieces.includes(p2));
        if (pieces.length > 0) {
          this.allowedPieces = pieces;
        }
      } else {
        this.allowedPieces = [piece];
      }
    })
  }

  customize = () => this.newGame(() => {
    this.allowedPieces = ["custom"];
    this.multiPieces = false;
    this.openCustomizeDialog();
  });
}