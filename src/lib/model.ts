import {delay} from "./util";

type Turn = 1 | 2;
type Mode = "solo" | "random" | "expert" | "duel"

export interface Model<Pos> {
  position: Pos;
  history: Pos[];
  redoHistory: Pos[];
  turn: Turn;
  nbRows: number;
  nbColumns: number;
  customSize: boolean;
  mode: Mode;
  help: boolean;
  showWin: boolean;
  dialog: "rules" | null;
}

export function initModel<Pos>(position: Pos): Model<Pos> {
  return {
    position,
    history: [],
    redoHistory: [],
    turn: 1,
    nbRows: 0,
    nbColumns: 0,
    customSize: false,
    mode: "solo",
    help: false,
    showWin: false,
    dialog: "rules",
  }
}

export interface Dict<Pos, Move> {
  play: (m: Move) => (Pos | null),
  isLevelFinished: () => boolean,
  initialPosition: () => Pos,
  onNewGame?: () => void,
  updateScore?: () => { isNewRecord: boolean, showWin: boolean };
  possibleMoves?: () => Move[];
  isLosingPosition?: () => boolean;
}

function playHelper<Pos, Move>(model: Model<Pos>, dict: Dict<Pos, Move>, move: Move): boolean {
  const position = dict.play(move);
  if (position === null)
    return false;
  model.history.push(model.position);
  model.redoHistory = [];
  model.position = position;
  model.turn = model.turn == 1 ? 2 : 1;
  return true;
}

export async function playA<Pos, Move>(model: Model<Pos>, dict: Dict<Pos, Move>, move: Move) {
  //playA move = lockAction $ do
  if (!playHelper(model, dict, move)) {
    return
  }

  const {isNewRecord, showWin} = dict.updateScore ? dict.updateScore() : defaultUpdateScore(dict);
  if (isNewRecord) {
    // save to storage
  }
  if (showWin) {
    model.showWin = true;
    await delay(1000);
    model.showWin = false;
  } else if (model.mode === "expert" || model.mode === "random") {
    await delay(1000);
    const move = computerMove(model, dict)!;
    playHelper(model, dict, move);
    if (dict.isLevelFinished()) {
      model.showWin = true;
      await delay(1000);
      model.showWin = false;
    }
  }
}

export function defaultUpdateScore<Pos, Move>(dict: Dict<Pos, Move>): { isNewRecord: boolean, showWin: boolean } {
  return {
    isNewRecord: false,
    showWin: dict.isLevelFinished()
  }
}


export function newGame<Pos, Move>(model: Model<Pos>, dict: Dict<Pos, Move>) {
  if (dict.onNewGame) {
    dict.onNewGame();
  }
  do {
    model.position = dict.initialPosition();
  } while (dict.isLevelFinished())
  model.history = [];
  model.redoHistory = [];
  model.help = false;
  model.turn = 1;
  //  # set (_scores ∘ at "custom") Nothing
}


function changeTurn<Pos>(model: Model<Pos>) {
  if (model.mode === "duel") {
    model.turn = model.turn === 1 ? 2 : 1;
  }
}

export function undo<Pos, Move>(model: Model<Pos>, dict: Dict<Pos, Move>) {
  if (model.history.length === 0) {
    return;
  }
  const position = model.history.pop()!;
  model.redoHistory.push(model.position);
  model.position = position;
  changeTurn(model);
  
  // onPositionChange
}

export function redo<Pos, Move>(model: Model<Pos>, dict: Dict<Pos, Move>) {
  if (model.redoHistory.length === 0) {
    return;
  }
  const position = model.redoHistory.pop()!;
  model.history.push(model.position);
  model.position = position;
  changeTurn(model);
  
  // onPositionChange
}

function computerMove<Pos, Move>(model: Model<Pos>, dict: Dict<Pos, Move>): Move | null {
  if (dict.isLevelFinished()) {
    return null;
  }
  const moves = dict.possibleMoves!();
  let bestMove = null;
  if (model.mode === "expert") {
    for (const move of moves) {
      let found = false;
      playHelper(model, dict, move);
      if (dict.isLosingPosition!()) {
        found = true;
      }
      model.position = model.history.pop()!;
      model.turn = model.turn == 1 ? 2 : 1;
      if (found) {
        bestMove = move;
        break;
      }
    }
  }
  return bestMove;
}