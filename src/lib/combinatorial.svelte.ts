import { type Constructor, type Model } from "./model.svelte";
import { Mode, type TwoPlayersModel, WithTwoPlayers } from "./twoplayers.svelte";
import { randomPick } from "./util";

type Constr<Pos, Move> = Constructor<Model<Pos, Move>>;

export function WithCombinatorial<Pos, Move, TBase extends Constr<Pos, Move>>(Base: TBase) {
  abstract class C extends WithTwoPlayers(Base) {
    protected abstract isLosingPosition(): boolean;
    protected abstract possibleMoves(): Move[];

    protected machineMove(): Move | null {
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
          this.changeTurn();
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
