<script lang="ts">
  import { range } from '../lib/util';
  import {type Model, type Methods, initModel, newGame } from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';
  import DndBoard from '../components/DndBoard.svelte';
  import DndItem from '../components/DndItem.svelte';

  type Pos = number[][];
  type Move = {from: number, to: number};

  let model: Model<Pos> = $state(initModel([]));
  let nbDisks = $state(4);
  let dragged: number | null = $state(null);

  function play({ from, to }: Move) {
    console.log(from, to);
    const position = model.position;
    const last = position[from].at(-1);
    if (from === to || last === undefined || last < (position[to].at(-1) ?? -1)) {
        return null;
    }
    const init = position[from].slice(0, -1);
    return position.with(from, init).with(to, position[to].concat([last]));
  }

  const initialPosition = () => [range(0, nbDisks), [], []];
  const isLevelFinished = () => model.position[0].length === 0 && model.position[1].length === 0;

  const methods: Methods<Pos, Move> = {play, initialPosition, isLevelFinished};

  const colors = [ "blue", "red", "green", "magenta", "orange", "gray", "cyan" ];

  let nbMoves = $derived(model.history.length);

  let winTitle = $derived(`Tu as gagné en ${nbMoves} coups`);

  // svelte-ignore state_referenced_locally
  newGame(model, methods)
</script>

{#snippet tower(i: number)}
  <path
    d="M{i * 60 + 14} 99a3 3 0 0 1 0 -6h20a3 3 0 0 0 3 -3v-80a3 3 0 0 1 6 0v80 a3 3 0 0 0 3 3h20a3 3 0 0 1 0 6z"
    stroke="blue"
    stroke-width="0.5"
    fill="#d43"
  />
{/snippet}

{#snippet disk([x, y, disk, isTop]: [number, number, number, boolean],
    dragged: boolean, _droppable: boolean,
    onpointerdown?: (e: PointerEvent) => void,
    onpointerup?: (e: PointerEvent) => void,
)}
  <rect
    x={x - 25 + 2.5 * disk}
    y={y - 7}
    width={50 - 5 * disk}
    height="10"
    class={["disk", {dragged: dragged && isTop}]}
    fill={colors[disk]}
    {onpointerdown} {onpointerup}
  />
{/snippet}

{#snippet dropZone(column: number,
    _dragged: boolean, _droppable: boolean,
    onpointerdown?: (e: PointerEvent) => void,
    onpointerup?: (e: PointerEvent) => void,
)}
  <rect
    x={13+60*column} y="10" width="54" height="90" fill="transparent"
    {onpointerdown} {onpointerup}
  />
{/snippet}

{#snippet draggedElement(style: string)}
  <g {style} pointer-events="none">
    {@render disk([0, 0, model.position[dragged!].at(-1)!, false], false, false)}
  </g>
{/snippet}

{#snippet board()}
  <div class="ui-board board">
    <DndBoard viewBox="0 0 200 100" bind:dragged={dragged} {draggedElement}>
      {#each model.position as disks, column}
        {@render tower(column)}
        <DndItem bind:model={model} bind:dragged={dragged} {methods}
          id={column}
          argument={column}
          render={dropZone}
          droppable={true}
        />
        {#each disks as d, i}
          {@const isTop = i === disks.length - 1}
          <DndItem bind:model={model} bind:dragged={dragged} {methods}
            id={column}
            argument={[40+60*column, 90-10*i, d, isTop]}
            render={disk}
            draggable={isTop}
          />
        {/each}
      {/each}
    </DndBoard>
    <div class="moves">{nbMoves} coup{nbMoves > 1 ? "s" : ""}</div>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Tours de Hanoi">
    <I.SelectGroup
      title="Nombre de disques"
      values={[4, 5, 6, 7, 8]}
      selected={nbDisks}
      setter={n => newGame(model, methods, () => nbDisks = n)}
    />
    <I.Group title="Options">
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Le but du jeu est de déplacer tous les disques sur la tour de droite avec les contraintes suivantes:<br/>
  - tu peux déplacer seulement un disque à la fois;<br/>
  - tu ne peux pas déplacer un disque sur un disque plus petit que lui.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {winTitle} />


<style>
  .board {
    position: relative;
    width: 100vmin;
    height: 50vmin;
  }

  .disk {
    stroke: black;
    rx: 5px;
    ry: 5px;
    &.dragged {
        opacity: 0;
    }
  }

  .moves {
    position: absolute;
    top: 0;
    left: 0.5em;
    color: blue;
    font-size: 1.5em;
  }
</style>