import { tick } from "svelte";
import {clone, delay, randomPick} from "./util";
import { page } from "$app/state";

const VERSION = 1;

export type Turn = 1 | 2;
export type Mode = "solo" | "random" | "expert" | "duel"

export interface Model<Pos> {
  position: Pos;
  history: Pos[];
  redoHistory: Pos[];
  turn: Turn;
  computerStarts: boolean;
  mode: Mode;
  help: boolean;
  showWin: boolean;
  dialog: "rules" | "score" | "customize" | null;
  newGameAction: (() => void) | null;
  locked: boolean;
}

export function initModel<Pos>(position: Pos): Model<Pos> {
  return {
    position,
    history: [],
    redoHistory: [],
    turn: 1,
    computerStarts: false,
    mode: "solo",
    help: false,
    showWin: false,
    dialog: "rules",
    newGameAction: null,
    locked: false,
  }
}

export interface SizeLimit {
  minRows: number;
  maxRows: number;
  minCols: number;
  maxCols: number;
}

export interface Methods<Pos, Move> {
  play: (m: Move) => (Pos | null),
  isLevelFinished: () => boolean,
  initialPosition: () => Pos,
  onNewGame?: () => void,
  updateScore?: () => { isNewRecord: boolean, showWin: boolean };
  possibleMoves?: () => Move[];
  isLosingPosition?: () => boolean;
  computerMove?: () => Move | null;
}

function playHelper<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>, move: Move, push?: boolean): boolean {
  const position = methods.play(move);
  if (position === null)
    return false;
  if (push) {
    model.history.push(model.position);
    model.redoHistory = [];
  }
  model.position = position;
  model.turn = model.turn == 1 ? 2 : 1;
  return true;
}

export async function playA<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>, move: Move) {
  if (!playHelper(model, methods, move, true)) {
    return
  }

  const {isNewRecord, showWin} = methods.updateScore ? methods.updateScore() : defaultUpdateScore(methods);
  if (isNewRecord) {
    if (isScoreModel(model)) {
      const scores = {...model.scores};
      delete scores["$custom"];
      // save to storage
      localStorage.setItem(page.url.pathname, JSON.stringify([VERSION, scores]));
    }
    
    // save to storage
  }
  if (showWin) {
    model.showWin = false;
    await tick();
    model.showWin = true;
  } else if (model.mode === "expert" || model.mode === "random") {
    model.locked = true;
    await delay(1000);
    computerPlays(model, methods);
    model.locked = false;
  }
}

export async function computerPlays<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>) {
  const move = methods.computerMove ? methods.computerMove() : defaultComputerMove(model, methods);
  if (move === null) {
    return;
  }
  playHelper(model, methods, move);
  if (methods.isLevelFinished()) {
    model.showWin = false;
    await tick();
    model.showWin = true;
  }
}


export function defaultUpdateScore<Pos, Move>(methods: Methods<Pos, Move>): { isNewRecord: boolean, showWin: boolean } {
  return {
    isNewRecord: false,
    showWin: methods.isLevelFinished()
  }
}

export function newGame<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>, action?: () => void) {
  if (!model.newGameAction && action && model.history.length > 0 && !methods.isLevelFinished()) {
    model.newGameAction = action;
    return;
  }

  model.history = [];
  model.redoHistory = [];
  model.help = false;
  model.turn = 1;
  model.computerStarts = false;
  if(isScoreModel(model)) {
    delete model.scores["$custom"];
  }

  (action || model.newGameAction || (() => {}))();

  if (methods.onNewGame) {
    methods.onNewGame();
  }
  do {
    model.position = methods.initialPosition();
  } while (methods.isLevelFinished());

  model.newGameAction = null;
}

export function loadRecords<Pos>(model: Model<Pos> & ScoreModel<Pos>) {
  const scores = localStorage.getItem(page.url.pathname);
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
    model.scores = data[1];
  }
}

function changeTurn<Pos>(model: Model<Pos>) {
  if (model.mode === "duel") {
    model.turn = model.turn === 1 ? 2 : 1;
  } else {
    model.turn = model.computerStarts ? 2 : 1;
  }
}

export function undo<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>) {
  if (model.history.length === 0) {
    return;
  }
  const position = model.history.pop()!;
  model.redoHistory.push(model.position);
  model.position = position;
  changeTurn(model);
}

export function redo<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>) {
  if (model.redoHistory.length === 0) {
    return;
  }
  const position = model.redoHistory.pop()!;
  model.history.push(model.position);
  model.position = position;
  changeTurn(model);
}

export function reset<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>) {
  if (model.history.length === 0) {
    return;
  }
  const position = model.history[0];
  model.history = [];
  model.redoHistory = [];
  model.turn === 1;
  model.position = position;
}

function defaultComputerMove<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>): Move | null {
  if (methods.isLevelFinished()) {
    return null;
  }
  const moves = methods.possibleMoves!();
  let bestMove = null;
  if (model.mode === "expert") {
    const position = model.position;
    for (const move of moves) {
      let found = false;
      playHelper(model, methods, move);
      if (methods.isLosingPosition!()) {
        found = true;
      }
      model.position = position;
      model.turn = model.turn == 1 ? 2 : 1;
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

export interface SizeModel {
  rows: number;
  columns: number;
  customSize: boolean;
}

export function isSizeModel<Pos>(model: Model<Pos>): model is Model<Pos> & SizeModel {
  return (model as any).rows !== undefined 
    && (model as any).columns !== undefined
    && (model as any).customSize !== undefined
}

export function setGridSize<Pos, Move>(
  model: Model<Pos>&SizeModel,
  methods: Methods<Pos, Move>,
  rows: number,
  columns: number,
  sizeLimit?: SizeLimit)
{
  if (!sizeLimit) {
    return
  }
  const {minRows, maxRows, minCols, maxCols} = sizeLimit;
  
  if (rows < minRows || rows > maxRows || columns < minCols || columns > maxCols) {
    return;
  }
  
  newGame(model, methods, () => {
    model.rows = rows;
    model.columns = columns;
  });
}

export interface ScoreModel<Pos> {
  scores: Record<string, [number, Pos]>
}

export function isScoreModel<Pos>(model: Model<Pos>): model is Model<Pos> & ScoreModel<Pos> {
  return !!(model as any).scores
}

export interface ScoreMethods {
  score: () => number;
  scoreHash: () => string | null;
  objective: "minimize" | "maximize";
}

export function isScoreMethods<Pos, Move>(methods: Methods<Pos, Move>): methods is Methods<Pos, Move> & ScoreMethods {
  return !!(methods as any).score && !!(methods as any).scoreHash && !!(methods as any).objective;
}

type ShowWinPolicy = "onNewRecord" | "always" | "never";

export function updateScore<Pos, Move>(
  model: Model<Pos> & ScoreModel<Pos>,
  methods: Methods<Pos, Move> & ScoreMethods,
  onlyWhenFinished: boolean,
  showWin: ShowWinPolicy)
{
  if (onlyWhenFinished && !methods.isLevelFinished()) {
    return { isNewRecord: false, showWin: false }
  } else {
    const score = methods.score();
    const hash = methods.scoreHash() ?? "$custom";
    const cmp = (a: number, b: number) => methods.objective === "minimize" ? a < b : a > b;
    const oldScore = model.scores[hash];
    const isNewRecord = !oldScore || cmp(score, oldScore[0]);
    if (isNewRecord) {
      model.scores[hash] = [score, clone(model.position)];
    }
    return {
      isNewRecord,
      showWin: isNewRecord && showWin === "onNewRecord" || showWin === "always"
    }
  }
}

// un message qui indique à qui est le tour ou si la partie est finie
export function turnMessage<Pos, Move>(model: Model<Pos>, methods: Methods<Pos, Move>) {
  if (methods.isLevelFinished()) {
    return "Partie finie"
  } else if ((model.turn === 1) !== model.computerStarts) {
    return "Tour du premier joueur"
  } else if (model.mode === "duel") {
    return "Tour du second joueur"
  } else {
    return "Tour de l'IA"
  }
}

export const winTitleFor2Player = <Pos>(model: Model<Pos>) =>
  model.mode === "duel"
  ? `Le ${model.turn === 2 ? "premier" : "second"} joueur gagne`
  : (model.turn === 2) !== model.computerStarts
  ? "Tu as gagné"
  : "L'IA gagne";