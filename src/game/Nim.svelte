<script lang="ts">
  import { generate, random, range } from '../lib/util';
  import {type Model, type Methods, initModel, playA, newGame, winTitleFor2Player } from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';

  type Position = [number, number][];
  type Move = {pile: number, pos: number};

  let model: Model<Position> = $state({...initModel([]), mode: "random"});
  let length = $state(10);
  let nbPiles = $state(4);

  const canPlay = (move: Move) => {
    const [p1, p2] = model.position[move.pile];
    return move.pos != p1 && move.pos != p2
        && (model.turn === 1 ? move.pos < p2 : move.pos > p1)
  }

  function play(move: Move): Position | null {
    if (!canPlay(move)) {
      return null;
    }
    const [p1, p2] = model.position[move.pile];
    return model.position.with(move.pile, model.turn === 1 ? [move.pos, p2] : [p1, move.pos]);
  }

  const initialPosition = () =>
    generate(nbPiles, () => length === 5 ? [0, 4] : [random(0, 5), random(5, 10)]) as Position;

  const isLevelFinished = () => 
    model.position.every(([p1, p2]) =>
      p2 - p1 === 1 && p1 == (model.turn === 2 ? length - 2 : 0)
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

  const methods: Methods<Position, Move> = { play, isLevelFinished, initialPosition, possibleMoves, isLosingPosition };

  let turnMessage = $derived(
    isLevelFinished() 
    ? "Partie finie"
    : model.turn === 1
    ? "Tour du joueur bleu"
    : "Tour du joueur rouge"
  );

   let winTitle = $derived(winTitleFor2Player(model));

  // svelte-ignore state_referenced_locally
    newGame(model, methods);
</script>

{#snippet row(i: number)}
  <rect class="row {length === 5? "row-5" : "row-10"}" y={10+19*i}/>
{/snippet}

{#snippet square(i: number, j: number)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <rect
    class="square"
    style:transform="translate({(length === 5 ? 30 : 5) + 10 * j}px, {15 + 19 * i}px) rotate(45deg)"
    style:cursor={canPlay({pile:i, pos: j}) ? "pointer" : "not-allowed"}
    onclick={() => playA(model, methods, {pile: i, pos: j})}
  />
{/snippet}

{#snippet peg(i: number, player: number, j: number)}
  <use
    href="#meeple"
    width="8"
    height="8"
    class="player"
    fill={player === 0 ? "blue" : "red"}
    style:transform="translate({ (length === 5 ? 26 : 1) + 10 * j}px, {11 + 19 * i}px)"
  />
{/snippet}

{#snippet board()}
  <div class="ui-board board">
    <svg viewBox="0 0 100 100">
      {#each range(0, nbPiles) as i}
        {@render row(i)}
        {#each range(0, length) as j}
          {@render square(i, j)}
        {/each}
      {/each}
      
      {#each model.position as [p1, p2], i}
        {@render peg(i, 0, p1)}
        {@render peg(i, 1, p2)}
      {/each}
    </svg>
    <span class="turn-message">{turnMessage}</span>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Bloque moi si tu peux">
    <I.SelectGroup 
      title="Taille des rangées"
      values={[ 1, 2, 3, 4, 5 ]}
      selected={nbPiles}
      disabled={model.locked}
      setter={i => newGame(model, methods, () => nbPiles = i)}
    />
    <I.SelectGroup 
      title="Taille des rangées"
      values={[ 10, 5 ]}
      selected={length}
      disabled={model.locked}
      setter={i => newGame(model, methods, () => length = i)}
    />
    <I.TwoPlayers bind:model={model} {methods} />
    <I.Group title="Options">
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Le but de <strong>Bloque moi</strong> si tu peux est d'acculer chacun des jetons de l'adversaire au bord du plateau de telle
  façon qu'il ne puisse <strong>plus en déplacer</strong>.<br/>
  À chaque tour, tu peux déplacer un de tes jetons vers la <strong>gauche</strong>
  ou vers la <strong>droite</strong> d'autant de cases que tu veux mais tu
  ne peux pas <strong>sauter</strong> par-dessus un jeton adverse.<br/>
  Tu es obligé de déplacer un jeton d'au moins une case, tu ne peux pas <strong>passer ton tour</strong>.<br/>
  Tu gagnes la partie si ton adversaire n'a aucun mouvement possible.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {winTitle} />

<style>
  .board {
    height: 80vmin;
    width: 80vmin;
    position: relative;
    background-color: lightblue;
  }

  .square {
    x: -2.5px;
    y: -2.5px;
    width: 5px;
    height: 5px;
    fill: grey;
  }

  .row {
    height: 10px;
    fill: snow;
  }

  .row-5 {
    x: 25px;
    width: 50px;
  }

  .row-10 {
    width: 100px;
  }

  .player {
    cursor: not-allowed;
    transition: all 0.5s linear;
  }

  .turn-message {
    position: absolute;
    left: 0;
    top: 0;
    color: blue;
    font-size: 1.5em;
    font-weight: bold;
  }
</style>