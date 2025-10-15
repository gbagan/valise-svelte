<script lang="ts">
  import { diffCoords, generate, generate2, gridStyle, random, repeat } from '$lib/util';
  import { Model, WithSize, WithScore, type SizeLimit } from '$lib/model.svelte';
  import Template from '$lib/components/Template.svelte';
  import Icon from '$lib/components/icons/Icon.svelte';
  import * as I from '$lib/components/Icons';
  import Config from '$lib/components/Config.svelte';
  import DndBoard from '$lib/components/DndBoard.svelte';
  import DndItem from '$lib/components/DndItem.svelte';
  import { onMount } from 'svelte';

  type Board = "french" | "english" | "circle" | "grid3" | "random";

  type Position = boolean[];
  type Move = {from: number, to: number};

  class SolitaireModel extends WithScore(WithSize(Model<Position, Move>)) {
    constructor() {
      super([]);
      this.rows = 5;
      this.columns = 1;
    }

    play(move: Move): Position | null {
      const {from, to} = move;
      const between = betweenMove2(move);
      if (between === null) {
       return null;
      }
      const pbetween = this.position[between];
      const pfrom = this.position[from];
      const pto = this.position[to];
      const hto = holes[to];
      if (!pfrom || !pbetween || !hto || pto) {
        return null;
      }
      const position = this.position.slice();
      position[from] = false;
      position[between] = false;
      position[to] = true;
      return position;
    }

    initialPosition = () => this.position;

    isLevelFinished = () => this.position.every((p, i) =>
      !p || [2, -2, 2 * this.columns, -2 * this.columns, this.rows - 2].every(d =>
        this.play({from: i, to: i+d}) === null
      )
    );

    onNewGame() {
      let columns = this.columns;
      let rows = this.rows;
      if (boardType === "english") {
        holes = generate2(7, 7, (row, col) =>
          Math.min(row, 6 - row) >= 2 || Math.min(col, 6 - col) >= 2 
        );
        this.position = holes.with(24, false);
        this.customSize = false;
      } else if (boardType === "french") {
        holes = generate2(7, 7, (row, col) =>
          Math.min(row, 6 - row) + Math.min(col, 6 - col) >= 2 
        );
        this.position = holes.with(24, false);
        this.customSize = false;
      } else if (boardType === "circle") {
        holes = repeat(rows, true);
        const empty = random(0, rows);
        this.position = generate(rows, x => x !== empty);
        this.customSize = true;
      } else if (boardType === "grid3") {
        holes = repeat(3 * columns, true);
        this.position = generate(3 * columns, i => i < 2 * columns);
        this.customSize = true;
      } else { // boardType === "random"
        holes = repeat(3 * columns, true);
        const bools = generate(columns, () => Math.random() < 0.5);
        this.position = bools.concat(repeat(columns, true), bools.map(x => !x));
        this.customSize = true;
      }
    }

    objective = () => "minimize" as "minimize";
    score = () => model.position.filter(x => x).length;
    // todo à vérifier
    scoreHash = () => boardType === "random" ? null : `${boardType},${model.rows},${model.columns}`;
    updateScore = () => this.updateScore2(true, "always");
  }

  let model = $state(new SolitaireModel());
  let holes: boolean[] = $state([]);
  let help: 0 | 1 | 2 = $state(0);
  let boardType: Board = $state("circle");

  let dragged: number | null = $state(null);

  // retourne la position du trou situé entre les deux positions d'un coup si celui est valide
  function betweenMove({ from, to }: Move): number | null {
    const [row, col] = diffCoords(model.columns, from, to);
    return row * row + col * col == 4 ? (from + to) / 2 | 0 : null;
  }
  
  // même chose que betweenMove mais dans un plateau circulaire    
  // ne traite pas le cas du plateau de taille 4
  const betweenInCircle = (from: number, to: number, size: number) =>
    from - to === 2 || to - from === 2
    ? (from + to) / 2 | 0
    : (size + to - from) % size === 2
    ? (from + 1) % size
    : (size + from - to) % size == 2
    ? (to + 1) % size
    : null;

  // même chose que betweenMove dans un plateau normal ou circuaire.
  // Traite le cas particulier du plateau circulaire de taille 4
  function betweenMove2(move: Move): number | null {
    const {from, to} = move;
    if (boardType === "circle") {
      const x = betweenInCircle(from, to, model.rows);
      if (x === null) {
        return null;
      } else {
        return model.rows === 4 && !model.position[x] ? (x + 2) % 4 : x; 
      }
    } else {
      return betweenMove(move);
    }
  }

  let sizeLimit: SizeLimit = $derived(
    boardType === "circle"
    ? { minRows: 3, maxRows: 12, minCols: 1, maxCols: 1 }
    : boardType === "grid3" || boardType === "random"
    ? { minRows: 3, maxRows: 3, minCols: 1, maxCols: 12 }
    : { minRows: 7, maxRows: 7, minCols: 7, maxCols: 7 }
  );

  let winTitle = $derived.by(() => {
    const score = model.score();
    const s = score > 1 ? "s" : "";
    return `${score} pièce${s} restante${s}`;
  });

  function itemTransform(i: number): string {
    const row = i / model.columns | 0;
    const col = i % model.columns;
    if (boardType === "circle") {
      const x = 125 + Math.sin(2 * Math.PI * i / model.rows) * 90;
      const y = 125 + Math.cos(2 * Math.PI * i / model.rows) * 90;
      return `translate(${x}px,${y}px)`;
    } else {
      return `translate(${50*col+25}px,${50*row+25}px)`;
    }
  }

  function tricolor(i: number): string {
    switch ((i % model.columns + help + (i / model.columns | 0)) % 3) {
      case 0: return "red";
      case 1: return "blue";
      default: return "green";
    }
  }

  function setBoard(b: Board) {
    boardType = b;
    switch (b) {
      case "circle":
        model.rows = 6;
        model.columns = 1;
        break;
      case "grid3":
      case "random":
        model.rows = 3;
        model.columns = 5;
        break;
      default:
        model.rows = 7;
        model.columns = 7;
    }
  }

  // svelte-ignore state_referenced_locally
  model.newGame();
  onMount(() => {
    model.loadRecords();
  });
</script>


{#snippet hole(i: number, _dragged: boolean, droppable: boolean,
  onpointerdown?: (e: PointerEvent) => void, onpointerup?: (e: PointerEvent) => void)
}
  {#if help > 0 && boardType !== "circle"}
    <rect
      x="-25.0"
      y="-25.0"
      width="50"
      height="50"
      fill={tricolor(i)}
      style:transform={itemTransform(i)}
    />
  {/if}
  <circle
    r="17"
    class={["hole", {droppable}]}
    style:transform={itemTransform(i)}
    onpointerdown={onpointerdown}
    onpointerup={onpointerup}
  />
{/snippet}

{#snippet peg(i: number, dragged: boolean, _droppable: boolean,
  onpointerdown?: (e: PointerEvent) => void, onpointerup?: (e: PointerEvent) => void)
}
  <circle
    r="20"
    class={["peg", {dragged}]}
    style:transform={itemTransform(i)}
    onpointerdown={onpointerdown}
    onpointerup={onpointerup}
  />
{/snippet}

{#snippet draggedElement(style: string)}
  <circle r="20" width="30" height="30" class="cursor" {style}/> 
{/snippet}
    
{#snippet genericBoard(position: boolean[], interactive: boolean)}
  <div
    class="ui-board"
    style={boardType === "circle" ? "width:100%;height:100%;" : gridStyle(model.rows, model.columns, 5)}
  >
    <DndBoard
      viewBox={boardType === "circle" ? "0 0 250 250" : `0 0 ${50 * model.columns} ${50 * model.rows}`}
      bind:dragged={dragged} {draggedElement}
    >
      {#if boardType === "circle"}
        <circle cx="125" cy="125" r="90" class="circle" />
      {/if}
      {#each holes as hasHole, i}
        {#if hasHole}
          <DndItem bind:model={model} bind:dragged={dragged}
            id={i}
            argument={i}
            droppable={interactive}
            render={hole}
          />
        {/if}
      {/each}
      {#each position as hasPeg, i}
        {#if hasPeg}
          <DndItem bind:model={model} bind:dragged={dragged}
            id={i}
            argument={i}
            draggable={interactive}
            render={peg}
          />
        {/if}
      {/each}
    </DndBoard>
  </div>
{/snippet}

{#snippet board()}
  <div class="board-container">
    {@render genericBoard(model.position, true)}
  </div>
{/snippet}

{#snippet bestScore(position: Position)}
  <div class="scoredialog">
    {@render genericBoard(position, false)}
  </div>
{/snippet}

{#snippet config()}
  <Config title="Les reines">
    <I.SelectGroup
      title="Plateau"
      values={["circle", "grid3", "random", "english", "french"]}
      text={["#circle", "3xN", "#shuffle", "#tea", "#bread"]}
      tooltip={["3xN", "Cercle", "Aléatoire", "Anglais", "Français"]}
      selected={boardType}
      setter={i => model.newGame(() => setBoard(i as Board))}
    />
    <I.Group title="Options">
      <Icon text="#help" tooltip="Aide" selected={help > 0} onclick={() => help = (help + 1) % 3} />
      <I.Undo bind:model={model} />
      <I.Redo bind:model={model} />
      <I.Reset bind:model={model} />
      <I.Rules bind:model={model} />
    </I.Group>
    <I.BestScore bind:model={model} />
  </Config>
{/snippet}

{#snippet rules()}
  todo
{/snippet}

<Template bind:model={model} {board} {config} {rules} {winTitle} {bestScore} {sizeLimit} />

<style>
  .board-container {
    height: 75vmin;
    width: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hole {
    fill: url(#soli-hole);

    &.droppable {
      stroke: green;
      stroke-width: 4;
    }
  }

  .peg {
    fill: url(#soli-peg);
    cursor: pointer;
    &.dragged {
      opacity: 0.3;
    }
  }

  .circle {
    stroke: grey;
    fill: transparent;
    stroke-width: 5;
  }

  .cursor {
    pointer-events: none;
    fill: url(#soli-peg);
  }

  .scoredialog {
    height: 60vmin;
    width: 60vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>