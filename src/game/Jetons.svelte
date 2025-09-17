<script lang="ts">
  import { dCoords, gridStyle, repeat } from '../lib/util';
  import {type Model, type ScoreModel, type Dict, type ScoreDict, initModel, newGame, updateScore } from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';
  import DndBoard from '../components/DndBoard.svelte';
  import DndItem from '../components/DndItem.svelte';

  type Pos = number[];
  type Move = {from: number, to: number};

  let model: Model<Pos> & ScoreModel<Pos> = $state({
    ...initModel([]),
    nbRows: 4,
    nbColumns: 4,
    scores: {},
    customSize: true,
  });

  let dragged: number | null = $state(null);

  function play({ from, to }: Move) {
    const position = model.position;
    const [row, col] = dCoords(model.columns, from, to);
    const pfrom = position[from];
    const pto = position[to];
    if (pfrom > 0 && pfrom <= pto && row * row + col * col === 1) {
      return position.with(from, 0).with(to, pfrom+pto);
    } else {
      return null;
    }
  }

  const initialPosition = () => repeat(model.rows * model.columns, 1);

  const isLevelFinished = () => {
    const position = model.position;
    const columns = model.columns;
    return position.every((x, i) => {
      let y = (i + 1) % columns == 0 ? 0 : position[i + 1];
      let z = position[i + columns] ?? 0;
      return x * (y + z) === 0
    })
  }

  const score = () => model.position.filter(v => v > 0).length;
  const scoreHash = () => `${model.rows},${model.columns}`;
  const objective = "minimize";

  const dict: Dict<Pos, Move> & ScoreDict = {
    play, isLevelFinished, initialPosition,
    score, scoreHash, objective
  };
  dict.updateScore = () => updateScore(model, dict, true, "always");

  const sizeLimit = {minRows: 2, minCols: 2, maxCols: 6, maxRows: 6};

  let winTitle = $derived.by(() => {
    const score = dict.score();
    const s = score > 1 ? "s" : "";
    return `${score} case${s} restante${s}`;
  });

  // svelte-ignore state_referenced_locally
    newGame(model, dict);
</script>

{#snippet peg(i: number, val: number, dragged: boolean, droppable: boolean,
  onpointerdown?: (e: PointerEvent) => void, onpointerup?: (e: PointerEvent) => void)
}
  {@const row = i / model.columns | 0}
  {@const col = i % model.columns}
  <g style:transform="translate({25+50*col}px,{25+50*row}px)">
    <rect
      class={["peg", {dragged, droppable}]}
      fill="rgb(255 {255 * (1 - Math.sqrt(val / (model.rows * model.columns)))} 0)"
      filter="drop-shadow({val/2}px {val/2}px 0.5px #656565)"
      {onpointerdown} {onpointerup}
    />
    <text y="3" class="peg-text">{val}</text>
  </g>
{/snippet}

{#snippet draggedElement(style: string)}
  <rect x="-15" y="-15" width="30" height="30" class="cursor" {style}/> 
{/snippet}

{#snippet board()}
  <div class="board-container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 3)}>
      <DndBoard
        viewBox="0 0 {50 * model.columns} {50 * model.rows}"
        bind:dragged={dragged}
        {draggedElement}
      >
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
    
  </div>
{/snippet}

{#snippet config()}
  <Config title="Jeu d'acquisition">
    <I.Group title="Options">
      <I.Undo bind:model={model} {dict} />
      <I.Redo bind:model={model} {dict} />
      <I.Reset bind:model={model} {dict} />
      <I.Rules bind:model={model} />
    </I.Group>
    <I.BestScore bind:model={model} {dict} />
  </Config>
{/snippet}

{#snippet bestScore(position: Pos)}
  <div class="bestscore-container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 3)}>
      <svg viewBox="0 0 {50 * model.columns} {50 * model.rows}">
        {#each position as val, i}
          {#if val !== 0}
            {@render peg(i, val, false, false)}
          {/if}
        {/each}
      </svg>
    </div>
  </div>
{/snippet}



{#snippet rules()}
  À chaque tour de ce jeu, tu peux déplacer une pile de jetons vers une case adjacente
  qui contient au moins autant de jetons.<br/>
  Le but est de finir la partie avec le moins de cases contenant des piles de jetons.
{/snippet}

<Template bind:model={model} {dict} {board} {config} {rules} {bestScore} {winTitle} {sizeLimit} />

<style>
  .board-container {
    width: 75vmin;
    height: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
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
    fill: rgba(0, 0, 0, 0.65);
    pointer-events: none;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .cursor {
    pointer-events: none;
    fill: orange;
    opacity: 0.7;
  }

  .bestscore-container {
    width: 60vmin;
    height: 60vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>