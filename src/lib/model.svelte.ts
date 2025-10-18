import { tick } from "svelte";
import {clone, delay, randomPick} from "./util";
import { page } from "$app/state";

const VERSION = 1;

export type Turn = 1 | 2;
export enum Mode { Solo, Random, Expert, Duel };
export enum Dialog { None, Rules, Score, Customize, NewGame };

export interface SizeLimit {
  minRows: number;
  maxRows: number;
  minCols: number;
  maxCols: number;
}

export abstract class Model<Position, Move> {
  #position: Position;
  #history: Position[] = $state([]);
  #redoHistory: Position[] = $state([]);
  turn: Turn = $state(1);
  computerStarts = $state(false);
  mode = $state(Mode.Solo);
  help = $state(false);
  showWin = $state(false);
  #dialog = $state(Dialog.None);
  #newGameAction: (() => void) | null = $state(null);
  locked: boolean = $state(false);

  abstract play(m: Move): (Position | null);
  abstract initialPosition(): Position;
  abstract isLevelFinished(): boolean;

  onNewGame() {};

  constructor(position: Position) {
    this.#position = $state.raw(position);
  }

  get position() {
    return this.#position;
  }

  protected set position(pos: Position) {
    this.#position = pos;
  }

  isHistoryEmpty = () => this.#history.length === 0;
  isRedoHistoryEmpty = () => this.#redoHistory.length === 0;
  historyLength = () => this.#history.length;

  get dialog() {
    return this.#dialog;
  }

  closeDialog = () => {
    this.#dialog = Dialog.None;
    this.#newGameAction = null;
  }

  openRulesDialog = () => {
    this.#dialog = Dialog.Rules;
  }

  openScoreDialog = () => {
    this.#dialog = Dialog.Score;
  }

  openCustomizeDialog = () => {
    this.#dialog = Dialog.Customize;
  }

  protected playHelper(move: Move, push?: boolean): boolean {
    const position = this.play(move);
    if (position === null)
      return false;
    if (push) {
      this.#history.push(this.position);
      this.#redoHistory = [];
    }
    this.#position = position;
    this.turn = this.turn == 1 ? 2 : 1;
    return true;
  }

  protected updateScore(): { isNewRecord: boolean, showWin: boolean } {
    return {
      isNewRecord: false,
      showWin: this.isLevelFinished()
    }
  }

  async playA(move: Move) {
    if (!this.playHelper(move, true)) {
      return
    }

    const {isNewRecord, showWin} = this.updateScore();
    if (isNewRecord) {
      this.saveRecord();
    }
    
    if (showWin) {
      this.showWin = false;
      await tick();
      this.showWin = true;
    } else if (this.mode === Mode.Expert || this.mode === Mode.Random) {
      this.locked = true;
      await delay(1000);
      this.computerPlays();
      this.locked = false;
    }
  }

  async computerPlays() {
    const move = this.computerMove();
    if (move === null) {
      return;
    }
    this.playHelper(move);
    if (this.isLevelFinished()) {
      this.showWin = false;
      await tick();
      this.showWin = true;
    }
  }

  computerMove(): Move | null {
    return null;
  }

  newGame(action?: () => void) {
    if (!this.#newGameAction && action && this.#history.length > 0 && !this.isLevelFinished()) {
      this.#newGameAction = action;
      this.#dialog = Dialog.NewGame;
      return;
    }

    this.#history = [];
    this.#redoHistory = [];
    this.help = false;
    this.turn = 1;
    this.computerStarts = false;
    //if (this.isScoreModel(this)) {
    //  delete this.scores["$custom"];
    //}

    (action || this.#newGameAction || (() => {}))();
    this.onNewGame();
    do {
      this.#position = this.initialPosition();
    } while (this.isLevelFinished());

    if (this.#dialog === Dialog.NewGame) {
      this.#dialog = Dialog.None;
    }
    this.#newGameAction = null;
  }

  saveRecord() {}

  private changeTurn() {
    if (this.mode === Mode.Duel) {
      this.turn = this.turn === 1 ? 2 : 1;
    } else {
      this.turn = this.computerStarts ? 2 : 1;
    }
  }

  undo = () => {
    if (this.#history.length === 0) {
      return;
    }
    const position = this.#history.pop()!;
    this.#redoHistory.push(this.position);
    this.#position = position;
    this.changeTurn();
  }

  redo = () => {
    if (this.#redoHistory.length === 0) {
      return;
    }
    const position = this.#redoHistory.pop()!;
    this.#history.push(this.#position);
    this.#position = position;
    this.changeTurn();
  }

  reset = () => {
    if (this.#history.length === 0) {
      return;
    }
    const position = this.#history[0];
    this.#history = [];
    this.#redoHistory = [];
    this.turn = 1;
    this.#position = position;
  }

  // un message qui indique à qui est le tour ou si la partie est finie
  turnMessage() {
    if (this.isLevelFinished()) {
      return "Partie finie"
    } else if ((this.turn === 1) !== this.computerStarts) {
      return "Tour du premier joueur"
    } else if (this.mode === Mode.Duel) {
      return "Tour du second joueur"
    } else {
      return "Tour de l'IA"
    }
  }

  winTitleFor2Player() {
    return this.mode === Mode.Duel
      ? `Le ${this.turn === 2 ? "premier" : "second"} joueur gagne`
      : (this.turn === 2) !== this.computerStarts
      ? "Tu as gagné"
      : "L'IA gagne";
  }
}

type Constructor<T> = abstract new (...args: any[]) => T;

export interface CombinatorialModel<Move> {
  isLosingPosition: () => boolean;
  possibleMoves: () => Move[];
}

export function WithCombinatorial<Pos, Move, TBase extends Constructor<Model<Pos, Move>>>(Base: TBase) {
  abstract class C extends Base implements CombinatorialModel<Move> {
    abstract isLosingPosition(): boolean;
    abstract possibleMoves(): Move[];

    constructor(...args: any) {
      super(...args);
      this.mode = Mode.Random;
    }
  
    computerMove(): Move | null {
      if (this.isLevelFinished()) {
        return null;
      }
      const moves = this.possibleMoves();
      let bestMove = null;
      if (this.mode === Mode.Expert) {
        const position = this.position;
        for (const move of moves) {
          let found = false;
          this.playHelper(move);
          if (this.isLosingPosition()) {
            found = true;
          }
          this.position = position;
          this.turn = this.turn == 1 ? 2 : 1;
          if (found) {
            bestMove = move;
            break;
          }
        }
      }
      if (bestMove !== null) {
        return bestMove;
      } else {
        return randomPick(moves)
      }
    }
  } 

  return C;
}

export interface SizeModel {
  rows: number;
  columns: number;
  customSize: boolean;
  setGridSize: (rows: number, columns: number, sizeLimit?: SizeLimit) => void;
}

export function isSizeModel<Pos, Move>(model: Model<Pos, Move>): model is Model<Pos, Move> & SizeModel {
  return (model as any).rows !== undefined 
    && (model as any).columns !== undefined
    && (model as any).customSize !== undefined
}

export function WithSize<Pos, Move, TBase extends Constructor<Model<Pos, Move>>>(Base: TBase) {
  abstract class C extends Base implements SizeModel {
    rows = $state(0);
    columns = $state(0);
    customSize = $state(false);

    constructor(...args: any) {
      super(...args);
    }

    setGridSize(rows: number, columns: number, sizeLimit?: SizeLimit) {
      if (!sizeLimit) {
        return
      }
      const {minRows, maxRows, minCols, maxCols} = sizeLimit;
  
      if (rows < minRows || rows > maxRows || columns < minCols || columns > maxCols) {
        return;
      }

      this.newGame(() => {
        this.rows = rows;
        this.columns = columns;
      });
    }
  }

  return C;
}

type ShowWinPolicy = "onNewRecord" | "always" | "never";
export enum Objective { Minimize, Maximize }

export interface ScoreModel<Position> {
  bestScore: () => number | null;
  bestPosition: () => Position | null;
}

export function isScoreModel<Pos, Move>(model: Model<Pos, Move>): model is Model<Pos, Move> & ScoreModel<Pos> {
  return typeof (model as any).bestScore === "function";
}

export function WithScore<Position, Move, TBase extends Constructor<Model<Position, Move>>>(Base: TBase) {
  abstract class C extends Base implements ScoreModel<Position> {
    #scores: Record<string, [number, Position]> = $state({});

    protected abstract score: () => number;
    protected abstract scoreHash: () => string | null;
    protected abstract objective: () => Objective;

    protected updateScore2(onlyWhenFinished: boolean, showWin: ShowWinPolicy) {
      if (onlyWhenFinished && !this.isLevelFinished()) {
        return { isNewRecord: false, showWin: false }
      } else {
        const score = this.score();
        const hash = this.scoreHash() ?? "$custom";
        const cmp = (a: number, b: number) => this.objective() === Objective.Minimize ? a < b : a > b;
        const oldScore = this.#scores[hash];
        const isNewRecord = !oldScore || cmp(score, oldScore[0]);
        if (isNewRecord) {
          this.#scores[hash] = [score, clone(this.position)];
        }
        return {
          isNewRecord,
          showWin: isNewRecord && showWin === "onNewRecord" || showWin === "always"
        }
      }
    }

    bestScore(): number | null {
      const hash = this.scoreHash() ?? "$custom";
      const record = this.#scores[hash];
      return record ? record[0] : null;
    }

    bestPosition(): Position | null {
      const hash = this.scoreHash() ?? "$custom";
      const record = this.#scores[hash];
      return record ? record[1] : null;
    }

    loadRecords() {
      const routeId = page.route.id;
      if (!routeId) {
        return;
      }
      const scores = localStorage.getItem(routeId);
      let data;
      if (!scores) {
        return;
      }
      try {
        data = JSON.parse(scores);
      } catch {
        return
      }
      if (typeof Array.isArray(data) && data.length === 2 && data[0] === VERSION) {
        this.#scores = data[1];
      }
    }

    saveRecord() {
      const routeId = page.route.id;
      if (!routeId) {
        return;
      }
      const scores = {...this.#scores};
      delete scores["$custom"];
      //save to storage
      localStorage.setItem(routeId, JSON.stringify([VERSION, scores]));
    }
  }
  return C;
}