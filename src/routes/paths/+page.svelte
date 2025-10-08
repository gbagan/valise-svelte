<script lang="ts">
  import { allDistinct, diffCoords, gridStyle, random, range, repeat } from '$lib/util';
  import {type Model, type Methods, type SizeLimit, type SizeModel, 
    initModel, newGame, playA} from '$lib/model';
  import Template from '$lib/components/Template.svelte';
  import PointerTracker from '$lib/components/PointerTracker.svelte';
  import * as I from '$lib/components/Icons';
  import Config from '$lib/components/Config.svelte';

  type Position = number[];
  type Move = number;
  type Mode = 1 | 2;

  let model: Model<Position> & SizeModel = $state({
    ...initModel([]),
    rows: 4,
    columns: 6,
    customSize: false,
  });

  let exit: number | null = $state(null);
  let mode: Mode = $state(1);

  let levelFinished = $derived(
    exit !== null 
    && model.position.length > 0
    && model.position.length == model.columns * model.rows
        + (exit === model.position[0] ? 1 : 0)
  );

  // renvoie un chemin horizontal ou vertical entre u et v si celui ci existe (u exclus du chemin)
  function pathBetween(columns: number, u: number, v: number): number[] | null {
    const [row, col] = diffCoords(columns, u, v);
    if (row == 0) {
      return u < v ? range(u+1, v+1) : range(u-1, v-1, -1);
    } else if (col == 0) {
      return u < v ? range(u + columns, v+1, columns) : range(u - columns, v-1, -columns);
    } else {
      return null;
    }
  }

  // teste si un chemin est valide (sans répétition de sommets)
  // les extrémités peuvent être identiques si le chemin forme un cycle hamiltonien)
  // on ne peut pas passer par le sommet de sortie sauf si c'est le sommet final
  function isValidPath(path: number[]) {
    if (exit == null || path.length <= 2) {
        return true;
    }
    const path2 = path.slice(1);
    const path3 = path2.slice(0, -1);
    const begin = path[0];
    const end = path.at(-1)!;
    return allDistinct(path2)
        && !path3.includes(exit)
        && !path3.includes(end)
        && (begin !== end
            || path.length === model.rows * model.columns 
                + (begin === exit ? 1 : 0) 
                && end === exit
            )
  }

  function play(v: Move): Position | null {
    if (model.position.length === 0) {
      return mode === 2 ? [v] : null;
    } else {
      const last = model.position.at(-1)!;
      const p = pathBetween (model.columns, last, v);
      if (p === null || p.length === 0) {
        return null;
      }
      const p2 = model.position.concat(p);
      return isValidPath(p2) ? p2 : null;
    }
  }

  const isLevelFinished = () => levelFinished;

  const initialPosition = () => exit === null ? [] : [exit];
  
  function onNewGame() {
    exit = mode === 1 ? random(0, model.rows * model.columns) : null; 
  }

  const sizeLimit: SizeLimit = { minRows: 2, minCols: 2, maxRows: 9, maxCols: 9 };
  
  const methods: Methods<Position, Move> = {play, isLevelFinished, initialPosition, onNewGame};

  let grid = $derived.by(() => {
    const g = repeat(model.rows * model.columns, false);
    for (const i of model.position) {
      g[i] = true;
    }
    return g;
  })

  let pathDescription = $derived(
    model.position
      .map((p, i) => {
        const x = 50 + 100 * (p % model.columns);
        const y =  50 + 100 * (p / model.columns | 0);
        return `${i === 0 ? 'M' : 'L'}${x} ${y}`
      }).join("")
  );

  function selectSquare(square: number) {
    if (model.position.length === 0) {
        model.position = [square];
    } else if (exit === null) {
        exit = square;
    } else {
        playA(model, methods, square)
    }
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet square(x: number, y: number, darken: boolean, trap: boolean, door: boolean, onclick: () => void)}
  <g class={{darken}} style:transform="translate({x}px, {y}px)">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <use href="#paths-background" width="100" height="100"
      onclick={onclick}
    />
    {#if door}
      <use href="#paths-door" width="100" height="100" />
    {/if}
    <use href="#paths-trap" width="100" height="100" class={["trap", {visible: trap && !door}]} />
  </g>
{/snippet}

{#snippet hero(position: number)}
  {@const row = position / model.columns | 0}
  {@const col = position % model.columns}
  <use href="#meeplehat" width="80" height="80" x="10" y="10" class="hero"
    style:transform="translate({col * 100}px, {row * 100}px)"
  />
{/snippet}

{#snippet pointer(x: number, y: number)}
  {#if model.position.length === 0}
    <use
      href="#meeplehat"
      class="pointer"
      x="-40"
      y="-40"
      width="80"
      height="80"
      style:transform="translate({100*x}%, {100*y}%)"
    />
  {:else if exit === null}
    <use
      href="#paths-door"
      class="pointer"
      x="-50"
      y="-50.0"
      width="100"
      height="100"
      style:transform="translate({100*x}%, {100*y}%)"
    />
  {/if}
{/snippet}

{#snippet board()}
  <div class="board-container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 5)}>
      <PointerTracker {pointer} viewBox="0 0 {100*model.columns} {100*model.rows}">
        {#each grid as trapped, index}
          {@const row = index / model.columns | 0}
          {@const col = index % model.columns}
          {@render square(
            col * 100,
            row * 100,
            model.help && (row + col) % 2 === 0,
            trapped && index !== model.position.at(-1) && !levelFinished,
            index === exit,
            () => selectSquare(index)
          )}
        {/each}
        <path
          d={pathDescription}
          class={["path", {animate: levelFinished}]}
          stroke-dasharray={!levelFinished ? "0" : 100 * model.position.length}
          stroke-dashoffset={!levelFinished ? "0" : 100 * model.position.length}
        />
        {#if model.position.length > 0}
          {@render hero(model.position.at(-1)!)}
        {/if}
      </PointerTracker>
   </div>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Chemins">
    <I.SelectGroup
      title="Mode de jeu"
      values={[1, 2]}
      text={["#paths-mode0", "#paths-mode1"]}
      tooltip={["Mode 1", "Mode 2"]}
      selected={mode}
      setter={((m: Mode) => newGame(model, methods, () => mode = m))}
    />

    <I.SizesGroup bind:model={model} {methods}
      values={[[4, 6], [5, 5], [3, 8]]}
      customSize={true}
    />

    <I.Group title="Options">
      <I.Help bind:model={model} />
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  <p>
    Après moultes péripéties dans le temple maudit de Berge, le professeur <strong>Hamilton Jones</strong>
    se retrouve dans la dernière salle.<br/>
    Pour sortir de celle-ci, il doit s'enfuir par une porte au-dessous de lui.<br/>
    Celle-ci ne peut être ouverte qu'en marchant sur chacune des dalles dans la salle.
  </p>
  <p>
    Malheureusement, ces dalles sont piégées, le piège se déclenchant peu de temps après avoir marché dessus.<br/>
    Donc, Hamilton ne <strong>ne peut pas remarcher</strong> sur une dalle sur laquelle il a déjà été.<br/>
    N'ayant plus l'aisance de sa jeunesse, Hamilton ne peut se déplacer que d'une <strong>dalle à la fois</strong>
    et ne peut le faire en <strong>diagonale</strong>.
  </p>
  <p>
    Trouve un parcours pour résoudre l'énigme. Ca semble facile ?
    Mais, cela est-il possible pour toutes les tailles de grille ?
  </p>
  <p>
      Tu remarqueras qu'il n'y a <strong>pas</strong> toujours de solution.<br/>
      Dans le deuxième mode de jeu, tu peux choisir la <strong>position de départ</strong> d'Hamilton ainsi que celle de la
      <strong>porte</strong>.<br/>
    Trouve des critères sur les positions d'Hamilton et de la porte pour qu'une solution soit possible
  </p>
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {sizeLimit} />

<style>
  .board-container {
    height: 75vmin;
    width: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .darken {
    filter: url(#darken);
  }

  .path {
    stroke-width: 8;
    stroke: blue;
    fill: none;

    &.animate {
      animation: drawline 4s linear forwards infinite;
    }
  }

  .trap{
    opacity: 0;
    pointer-events: none;

    &.visible {
      opacity: 1;
      transition: all 100ms linear 500ms;
    }
  }

  .pointer {
    opacity: 0.6;
    pointer-events: none;
  }

  .hero {
    transition: all 500ms linear;
    pointer-events: none;
  }



  @keyframes drawline {
    70%, 80% {
      stroke-dashoffset: 0;
    }
  }
</style>