<script lang="ts">
  import { range } from '../lib/util';
  import {type Model, type Dict, initModel, playA, newGame } from '../lib/model';
  import Template from '../components/Template.svelte';
  import UndoIcon from '../components/UndoIcon.svelte';
  import RedoIcon from '../components/RedoIcon.svelte';
  import IconGroup from '../components/IconGroup.svelte';
  import IconSelectGroup from '../components/IconSelectGroup.svelte';
  import Config from '../components/Config.svelte';

  // model = genModel [] _ { mode = ExpertMode } (Ext { length: 10, nbPiles: 4 })
  
  type Pos = [number, number][];
  type Move = {pile: number, pos: number};

  let model: Model<Pos> = $state({...initModel([]), mode: 'expert'});
  let length = $state(10);
  let nbPiles = $state(4);

  const canPlay = (move: Move) => {
    const [p1, p2] = model.position[move.pile];
    return move.pos != p1 && move.pos != p2
        && (model.turn === 1 ? move.pos < p2 : move.pos > p1)
  }

  function play(move: Move): Pos | null {
    if (!canPlay(move)) {
      return null;
    }
    const [p1, p2] = model.position[move.pile];
    return model.position.with(move.pile, model.turn === 1 ? [move.pos, p2] : [p1, move.pos]);
  }

  function initialPosition(): Pos {
    return range(0, nbPiles).map(() =>
      [Math.random() * 5 | 0, 5 + Math.random() * 5 | 0]
    )
  }

  const isLevelFinished = () => 
    model.position.every(([p1, p2]) =>
      p2 - p1 == 1 && p1 == (model.turn === 2 ? length - 2 : 0)
    );

  function possibleMoves(): Move[] {
    const moves = [];
    for (let i = 0; i < nbPiles; i++) {
      for (let j = 0; j < length; j++) {
        moves.push({pile: i, pos: j});
      }
    }

    const cmpKey = (move: Move) => {
      const [x, y] = model.position[move.pile];
      return model.turn === 1 ? x - move.pos : move.pos - y; 
    }

    return moves
      .filter(canPlay)
      .toSorted((m1, m2) => cmpKey(m1) - cmpKey(m2))
  }

  const isLosingPosition = () =>
    model.position.reduce((acc, [x, y]) => acc ^ (y - x - 1), 0) === 0

  const dict: Dict<Pos, Move> = { play, isLevelFinished, initialPosition, possibleMoves, isLosingPosition };

  newGame(model, dict);
</script>

{#snippet row(i: number)}
  <rect class="nim-row nim-row-10" y={10+19*i}/>
{/snippet}

{#snippet square(i: number, j: number)}
  <rect
    class="nim-square"
    style:transform="translate({5 + 10 * j}px, {15 + 19 * i}px) rotate(45deg)"
    style:cursor={canPlay({pile:i, pos: j}) ? "pointer" : "not-allowed"}
  />
{/snippet}

{#snippet peg(i: number, player: number, j: number)}
  <use
    href="#meeple"
    width="8"
    height="8"
    class="nim-player"
    fill={player === 0 ? "blue" : "red"}
    style:transform="translate({5 + 10 * j}px, {11 + 19 * i}px)"
  />
{/snippet}

{#snippet board()}
  <div class="ui-board nim-board">
    <svg viewBox="0 0 100 100">
      {#each model.position as [p1, p2], i}
        {@render peg(i, 0, p1)}
        {@render peg(i, 1, p2)}
      {/each}
    </svg>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Bloque moi si tu peux">
    <IconGroup title="Options">
      <UndoIcon {model} {dict}/>
      <RedoIcon {model} {dict}/>
    </IconGroup>
  </Config>
{/snippet}

{#snippet rules()}
  Le but du jeu est d'acculer chacun des jetons de l'adversaire au bord du plateau de telle
  façon qu'il ne puisse plus en déplacer.<br/>
  À chaque tour, tu peux déplacer un de tes jetons vers la gauche ou vers la droite d'autant
  de cases que tu veux mais tu ne peux pas sauter par-dessus un jeton adverse.<br/>
  Tu es obligé de déplacer un jeton d'au moins une case, tu ne peux pas passer ton tour.<br/>
  Tu gagnes la partie si ton adversaire n'a aucun mouvement possible.
{/snippet}

<Template bind:model={model} {board} {config} {rules} />

<style>
.nim-board {
    height: 80vmin;
    width: 80vmin;
    position: relative;
    background-color: lightblue;
}

.nim-square {
    x: -2.5px;
    y: -2.5px;
    width: 5px;
    height: 5px;
    fill: grey;
}

.nim-row {
    height: 10px;
    fill: snow;
}

.nim-row-5 {
    x: 25px;
    width: 50px;
}

.nim-row-10 {
    width: 100px;
}

.nim-player {
    cursor: not-allowed;
    transition: all 0.5s linear;
}

.nim-turn-message {
    position: absolute;
    left: 0;
    color: blue;
    font-size: 1.5em;
}
</style>

