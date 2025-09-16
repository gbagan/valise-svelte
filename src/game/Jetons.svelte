<script lang="ts">
  import { dCoords, range, repeat } from '../lib/util';
  import {type Model, type Dict, initModel, newGame } from '../lib/model';
  import Template from '../components/Template.svelte';
  //import * as I from '../components/Icons';
  //import Config from '../components/Config.svelte';
  import DndBoard from '../components/DndBoard.svelte';
  import DndItem from '../components/DndItem.svelte';

  type Pos = number[];
  type Move = {from: number, to: number};

  let model: Model<Pos> = $state({
    ...initModel(range(0, 10)),
    nbRows: 4,
    nbColumns: 4,
  });

  let dragged: number | null = $state(null);

  function play({ from, to }: Move) {
    const position = model.position;
    const [row, col] = dCoords(model.nbColumns, from, to);
    const pfrom = position[from];
    const pto = position[to];
    if (pfrom > 0 && pfrom <= pto && row * row + col * col === 1) {
      return position.with(from, 0).with(to, pfrom+pto);
    } else {
      return null;
    }
  }

  const initialPosition = () => repeat(model.nbRows * model.nbColumns, 1);

  const isLevelFinished = () => {
    const position = model.position;
    const columns = model.nbColumns;
    return position.every((x, i) => {
      let y = (i + 1) % columns == 0 ? 0 : position[i + 1];
      let z = position[i + columns] ?? 0;
      return x * (y + z) === 0
    })
  }

  const dict: Dict<Pos, Move> = { play, isLevelFinished, initialPosition };

  const sizeLimit = {minRows: 2, minCols: 2, maxCols: 6, maxRows: 6};

  // svelte-ignore state_referenced_locally
    newGame(model, dict);
</script>

{#snippet peg(i: number, val: number, dragged: boolean, droppable: boolean,
  onpointerdown?: (e: PointerEvent) => void, onpointerup?: (e: PointerEvent) => void)
}
  {@const row = i / model.nbRows | 0}
  {@const col = i % model.nbColumns}
  <g style:transform="translate({25+50*col}px,{25+50*row}px)">
    <rect
      class={["peg", {dragged, droppable}]}
      fill="rgb(255 {255 * (1 - Math.sqrt(val / (model.nbRows * model.nbColumns)))} 0)"
      {onpointerdown} {onpointerup}
    />
    <text y="3" class="peg-text">{val}</text>
  </g>
{/snippet}

{#snippet draggedElement(style: string)}
  <rect x="-15" y="-15" width="30" height="30" fill="orange" class="dragged" {style}/> 
{/snippet}

{#snippet board()}
  <div class="ui-board board">
    <DndBoard viewBox="0 0 200 200" bind:dragged={dragged} {draggedElement}>
      {#each model.position as val, i}
        {#if val !== 0}
          <DndItem bind:model={model} bind:dragged={dragged} {dict}
            id={i}
            params={val}
            draggable={true}
            droppable={true}
            render={peg}
          />
        {/if}
      {/each}
    </DndBoard>
  </div>
{/snippet}

{#snippet config()}
  <div></div>
{/snippet}

{#snippet rules()}
  À chaque tour de ce jeu, tu peux déplacer une pile de jetons vers une case adjacente
  qui contient au moins autant de jetons.<br/>
  Le but est de finir la partie avec le moins de cases contenant des piles de jetons.
{/snippet}

<Template bind:model={model} {dict} {board} {config} {rules} {sizeLimit} />

<style>
.board {
  width: 60vmin;
  height: 60vmin;
}

.peg {
    cursor: pointer;
    x: -18px;
    y: -18px;
    width: 36px;
    height: 36px;
    rx: 5px;
    ry: 5px;

    &.dragged {
        opacity: 0.3;
    }

    &.droppable {
        stroke: green;
        stroke-width: 2;
        &:hover {
            stroke: red;
        }
    }
}

.peg-text {
  font: bold 20px sans-serif;
  pointer-events: none;
  text-anchor: middle;
  dominant-baseline: middle;
}

.dragged {
    pointer-events: none;
}

.jetons-bestscore-grid-container {
    width: 60vmin;
    height: 60vmin;
}
</style>