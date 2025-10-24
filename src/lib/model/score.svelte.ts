import { page } from "$app/state";
import { type Constructor, CoreModel, VERSION } from "./core.svelte";
import type { IScoreModel } from "./types";

type ShowWinPolicy = "onNewRecord" | "always" | "never";
export enum Objective { Minimize, Maximize }

export function WithScore<Position, Move>() {
  return function <TBase extends Constructor<CoreModel<Position, Move>>>(Base: TBase) {
    abstract class C extends Base implements IScoreModel<Position> {
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
            this.#scores[hash] = [score, this.position];
          }
          return {
            isNewRecord,
            showWin: isNewRecord && showWin === "onNewRecord" || showWin === "always"
          }
        }
      }

      protected resetAttributes() {
        super.resetAttributes();
        delete this.#scores["$custom"];
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

      protected onNewRecord() {
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
}