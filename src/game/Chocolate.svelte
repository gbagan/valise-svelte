<script lang="ts">
  import { generate2, gridStyle, random, range } from '../lib/util';
  import {type Model, type Methods, type SizeModel, initModel, playA, newGame, winTitleFor2Player, turnMessage } from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';

  type Pos = {left: number, right: number, top: number, bottom: number};
  type Move = ["left" | "right" | "top" | "bottom", number];
  type SoapMode = "corner" | "border" | "standard" | "custom";

  let model: Model<Pos> & SizeModel = $state({
    ...initModel({left: 0, right: 0, top: 0, bottom: 0}),
    rows: 6,
    columns: 7,
    customSize: false,
    mode: "random"
  });
  let soap: [number, number] | null = $state(null);
  let soapMode: SoapMode = $state("corner");
  let moveWhenHover: Move | null = $state(null);

  function play([dir, x]: Move): Pos | null {
    switch (dir) {
        case "left": return {...model.position, left: x};
        case "right": return {...model.position, right: x};
        case "top": return {...model.position, top: x};
        default: return {...model.position, bottom: x};
    }
  }

  function isLevelFinished() {
    const {left, right, top, bottom} = model.position;
    return left === right - 1 && top === bottom - 1;
  }

  const initialPosition = () => ({left: 0, right: model.columns, top: 0, bottom: model.rows});

  function onNewGame() {
    if (soapMode === "custom") {
      soap = null;
    } else {
      const row = soapMode === "standard" ? random(0, model.rows) : 0;
      const col = soapMode !== "corner" ? random(0, model.columns) : 0;
      soap = [row, col];
    }
  }

  function isLosingPosition(): boolean {
    if (soap === null) {
      return false;
    }
    const [row, col] = soap;
    const {left, right, top, bottom} = model.position;
    return ((col - left) ^ (right - col - 1) ^ (row - top) ^ (bottom - row - 1)) === 0;
  }

  function possibleMoves(): Move[] {
    if (soap === null) {
       return [];
    }
    const [row, col] = soap;
    const {left, right, top, bottom} = model.position;
    const l = range(left+1, col+1).map(i => ["left", i] as Move);
    const r = range(col+1, right).map(i => ["right", i] as Move);
    const t = range(top+1, row+1).map(i => ["top", i] as Move);
    const b = range(row+1, bottom).map(i => ["bottom", i] as Move);
    return l.concat(r, t, b);
  }

  const methods: Methods<Pos, Move> = {
    play, isLevelFinished, initialPosition, onNewGame,
    isLosingPosition, possibleMoves
  }

  function isInside(row: number, col: number): boolean {
    const {left, right, top, bottom} = model.position;
    return col >= left && col < right && row >= top && row < bottom;
  }

  let grid = $derived(generate2(model.rows, model.columns, (row, col) => [row, col]));
  let pmoves = $derived(possibleMoves());

  let cutLine = $derived.by(() => {
    if (moveWhenHover === null) {
      return null;
    }
    const {left, right, top, bottom} = model.position;
    const [dir, i] = moveWhenHover;
    if (dir === "left" || dir === "right") {
      return { x1: i, y1: top, x2: i, y2: bottom };
    } else {
      return { x1: left, y1: i, x2: right, y2: i }; 
    }
  });

  let message = $derived(soap === null ? "Place le savon" : turnMessage(model, methods));
  let winTitle = $derived(winTitleFor2Player(model));

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet cutter(row: number, col: number, move: Move)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <circle
    cx={50 * col}
    cy={50 * row}
    r="7"
    class="cutter"
    onclick={() => {moveWhenHover = null; playA(model, methods, move)}}
    onpointerenter={() => moveWhenHover = move}
    onpointerleave={() => moveWhenHover = null}
  />
{/snippet}

{#snippet board()}
  {@const {left, right, top, bottom} = model.position}
  <div class="board-container">
    <div class="turn-message">{message}</div>
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 3)}>
      <svg viewBox="-7 -7 {50 * model.columns + 14} {50 * model.rows + 14}">
        {#each grid as [row, col]}
          <rect
            class={["square", {
              soap: soap !== null && soap[0] === row && soap[1] === col,
              hidden: !isInside(row, col)
            }]}
            style:transform="translate({50*col}px, {50*row}px)"
          />
        {/each}
        {#each pmoves as [dir, i]}
          {#if dir === "left"}
            {@render cutter(top, i, ["left", i])}
            {@render cutter(bottom, i, ["left", i])}
          {:else if dir === "right"}
            {@render cutter(top, i, ["right", i])}
            {@render cutter(bottom, i, ["right", i])}
          {:else if dir === "top"}
            {@render cutter(i, left, ["top", i])}
            {@render cutter(i, right, ["top", i])}
          {:else}
            {@render cutter(i, left, ["bottom", i])}
            {@render cutter(i, right, ["bottom", i])}
          {/if}
        {/each}

        {#if soap !== null}
          {@const [row, col] = soap}
          <use
            href="#skull"
            x={50*col+12}
            y={50*row+12}
            width="26"
            height="26"
            class="skull"
          />
        {/if}
        {#if cutLine}
          {@const {x1, x2, y1, y2} = cutLine}
          <line x1={50*x1} x2={50*x2} y1={50*y1} y2={50*y2} class="cut-line" />
        {/if}
      </svg>
    </div>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Chocolat">
    <I.Group title="Options">
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Chocolat est un jeu à deux joueurs.<br/>
  A chaque tour, un joueur coupe la barre de chocolat en deux et conserve celle qui contient le carré empoisonné.<br/>
  Lorsqu'il ne reste que le carré empoisonné, le joueur qui doit jouer a perdu.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {winTitle} />

<style>
  .board-container {
    height: 75vmin;
    width: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .turn-message {
    position: absolute;
    color: blue;
    font-weight: bold;
    font-size: 1.5rem;
    top: -1rem;
    left: 0;
  }

  .square {
    fill: #b37b47;
    stroke: black;
    stroke-width: 3;
    x: 7px;
    y: 7px;
    width: 36px;
    height: 36px;

    &.soap {
      fill: cyan;
    }

    &.hidden {
      opacity: 0;
    }
  }

  .skull {
    fill: #20AF20;
  }

  .cutter {
    fill: blue;
  }

  .cut-line {
    stroke: red;
    stroke-width: 2;
    stroke-dasharray: 10;
    pointer-events: none;
    opacity: 0.6;
  }
</style>