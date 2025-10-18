import { delay, mod, repeat, swap } from '$lib/util';
import { Model } from '$lib/model.svelte';

type Position = (number | null)[];
export type Location = { kind: "panel", id: number } | { kind: "wheel", id: number } | {kind: "board"};
type Move = {from: Location, to: Location};

export default class extends Model<Position, Move> {
  size = $state(5);
  rotation = $state(0);
  
  // tableau indiquant quelles sont les balles alignées avec leur couleur
  aligned = $derived(this.position.map((v, i) =>
    v !== null && mod(i + this.rotation, this.size) === v
  ));
  // comme isValidRotation mais avec seconde conditition en moins 
  isValidRotation2 = $derived(this.aligned.filter(x => x).length === 1);
  // une rotation est valide si exactement une couleur est alignée et il y a une balle pour chaque couleur 
  isValidRotation = $derived(this.isValidRotation2 && this.position.every(v => v !== null)); 
  
  constructor() {
    super([]);
    this.newGame();
  }

  play({from, to}: Move): Position | null {
    if (from.kind === "panel" && to.kind === "wheel") {
      return this.position.with(to.id, from.id);
    } else if (from.kind === "wheel" && to.kind === "wheel") {
      return swap(this.position, from.id, to.id);
    } else if (from.kind === "wheel" && to.kind === "board") {
      return this.position.with(from.id, null);
    } else {
      return null;
    }
  }

  initialPosition = () => repeat(this.size, null);
  isLevelFinished = () => false;
  onNewGame = () => this.rotation = 0;

  async check() { 
    this.lock(async () => {
      for (let i = 0; i < this.size; i++) {
        if (!this.isValidRotation) {
          return;
        }
        this.rotation += 1;
        await delay(600);
      }
      await this.showVictory();
    });
  }
}