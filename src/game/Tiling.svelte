<script lang="ts">
  import { coords, gridStyle, mod, repeat } from '../lib/util';
  import {type Model, type Methods, type SizeModel, type SizeLimit,
    initModel, newGame, playA} from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';
  import PointerTracker from '../components/PointerTracker.svelte';
    import Dialog from '../components/Dialog.svelte';

  type Coord = [row: number, col: number];
  type Tile = Coord[];
  type TileType = "type1" | "type2" | "type3" | "custom";

  const rotate90 = (tile: Tile) => tile.map(([row, col]) => [col, -row]) as Tile;

  function rotate(tile: Tile, n: number) {
    for (let i = 0; i < n; i++) {
      tile = rotate90(tile);
    }
    return tile;
  }

  const translate = (tile: Tile, [row, col]: Coord) => tile.map(([r,c]) => [row + r, col + c]) as Tile;

  // une position représente pour chaque position dans la grille ce que contient la case
  //   0: ne contient rien,
  //   -1: contient un évier,
  //    n > 0 contient un morceau de tuile
  // les morceaux de tuiles ayant le même numéro appartiennent à la même tuile
  // une partie est terminé si toute case contient un évier ou un morceau de tuile
  // un coup peut consister à poser une tuile ou à en retirer une

  type Position = number[];
  type Move = number; // todo

  let model: Model<Position> & SizeModel = $state({
    ...initModel([]),
    rows: 5,
    columns: 5,
    customSize: false,
  });

  let rotation = $state(0);
  let tileType: TileType = $state("type1");
  let nbSinks = $state(0);
  let hoverSquare: number | null = $state(null);
  let customTile: [number, number][] = $state([]);

  let tile: Tile = $derived.by(() => {
    switch (tileType) {
      case "type1": return [ [0, 0], [0, 1] ];
      case "type2": return [ [0, 0], [0, 1], [0, -1] ];
      case "type3": return [ [0, 0], [0, 1], [1, 0] ];
      default: return customTile;
    }
  });

  let customTileGrid = $derived.by(() => {
    const res = repeat(25, false);
    for (const [row, col] of customTile) {
      res[row * 5 + col + 12] = true;
    }
    return res;
  });  

  // renvoie la liste des positions où devra être posée une tuile,  -1 est une position invalide
  function tilePositions(index: number): number[] {
    const columns = model.columns;
    let tile2 = rotate(tile, mod(rotation, 4));
    tile2 = translate(tile2, coords(columns, index));
    return tile2.map(([row, col]) => 0 <= col && col < columns ? row * columns + col : - 1);
  }

  // teste si une tuile peut être posée à partir de la liste des positions otenues par tilePositions
  const canPutTile = (tile: number[]) => tile.every(i => model.position[i] === 0);

  // renvoie la liste des positions des éviers
  let sinks = $derived(model.position.map((v, i) => v == -1 ? i : null).filter(x => x !== null));

  let inConflict = $derived(
    hoverSquare !== null 
    && (model.position[hoverSquare] !== 0 || play(hoverSquare) === null)
  );

  function play(index: Move): Position | null {
    const tilePos = tilePositions(index);
    if (canPutTile(tilePos)) {
      const m = Math.max(...model.position) + 1;
      const position = model.position.slice();
      for (const i of tilePos) {
        position[i] = m;
      }
      return position;
    } else if (model.position[index] > 0) {
      const c = model.position[index];
      return model.position.map(x => x === c ? 0 : x);
    } else {
      return null;
    }
  }

  const isLevelFinished = () => model.position.every(x => x !== 0);
  const initialPosition = () => repeat(model.columns * model.rows, 0);
  const onNewGame = () => rotation = 0;

  const methods: Methods<Position, Move> = { play, isLevelFinished, initialPosition, onNewGame };

  // view

  const sizeLimit: SizeLimit = {minRows: 3, minCols: 3, maxRows: 10, maxCols: 10};

  const border = (i: number, d: number) => model.position[i] !== model.position[i+d];

  function selectSquare(index: number) {
    if (sinks.length < nbSinks) {
      model.position[index] = -1;
    } else {
      playA(model, methods, index);
    }
  }

  function flipCustomTile(i: number) {
    let [row, col] = coords(5, i);
    row -= 2;
    col -= 2;
    let idx = customTile.findIndex(([r, c]) => r === row && c === col);
    if (idx === -1) {
        customTile.push([row, col])
    } else {
        customTile.slice(idx, 1);
    }
  }

  const setTileType = (type: TileType) => newGame(model, methods, () => {
    tileType = type;
    if (type === "custom") {
      model.dialog = "customize";
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === " ") {
      rotation += 1;
    }
  }

  interface SquareProps {
    isDark?: boolean;
    hasBlock?: boolean;
    hasSink?: boolean;
    row: number;
    col: number;
    onclick?: (e: MouseEvent) => void;
    onpointerenter?: (e: PointerEvent) => void;
    onpointerleave?: (e: PointerEvent) => void;
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet square({isDark, hasBlock, hasSink, row, col,
        onclick, onpointerenter, onpointerleave}: SquareProps)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <g
    class={{darken: isDark}}
    style:transform="translate({50*col}px, {50*row}px)"
    {onclick} {onpointerenter} {onpointerleave}
  >
    <rect width="50" height="50" fill="url(#concrete)" />
    {#if hasBlock}
      <use href="#tile2" width="50" height="50" />
    {/if}
    {#if hasSink}
      <use href="#sink" width="50" height="50" />
    {/if}
  </g>
{/snippet}

{#snippet pointer(x: number, y: number)}
  {#if sinks.length < nbSinks}
    <use
      href="#sink"
      x="-25"
      y="-25"
      width="50"
      height="50"
      pointer-events="none"
      style:transform="translate({100*x}%, {100*y}%)"
    />  
  {:else}
    <g style:transform="translate({100*x}%, {100*y}%)">
      <g class="pointer" style:transform="rotate({90 * rotation}deg)">
        {#each tile as [row, col]}
          <use
            href="#tile2"
            x={50 * col - 25}
            y={50 * row - 25}
            width={50}
            height={50}
            opacity={inConflict ? "0.3" : "0.8"}
          />
        {/each}
      </g>
    </g>
  {/if}
{/snippet}

{#snippet board()}
  <div class="container">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="ui-board"
      style={gridStyle(model.rows, model.columns, 5)}
      oncontextmenu={e => {e.preventDefault(); rotation += 1}}
    >
      <PointerTracker {pointer} viewBox="0 0 {50 * model.columns} {50 * model.rows}">
        {#each model.position as pos, index}
          {@const [row, col] = coords(model.columns, index)}
          {@render square({
            isDark: model.help && (row + col) % 2 === 0,
            hasBlock: pos > 0,
            hasSink: pos === -1,
            row,
            col,
            onclick: () => selectSquare(index),
            onpointerenter: () => hoverSquare = index,
            onpointerleave: () => hoverSquare = null,
          })}
        {/each}
        {#each model.position as pos, index}
          {@const [row, col] = coords(model.columns, index)}
          <g style:transform="translate({50*col}px, {50*row}px)">
            {#if pos > 0 && border(index, -1)}
              <line x1="0" y1="0" x2="0" y2="50" stroke="#000" stroke-width="2" />
            {/if}
            {#if pos > 0 && border(index, 1)}
              <line x1="50" y1="0" x2="50" y2="50" stroke="#000" stroke-width="2" />
            {/if}
            {#if pos > 0 && border(index, -model.columns)}
              <line x1="0" y1="0" x2="50" y2="0" stroke="#000" stroke-width="2" />
            {/if}
            {#if pos > 0 && border(index, model.columns)}
              <line x1="0" y1="50" x2="50" y2="50" stroke="#000" stroke-width="2" />
            {/if}
          </g>
        {/each}
        </PointerTracker>
    </div>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Carrelage">
    <I.SizesGroup bind:model={model} {methods}
      values={[ [4, 5], [5, 5], [5, 6], [8, 8] ]}
      customSize={true}
    />
    <I.SelectGroup
      title="Motif de la tuile"
      values={["type1", "type2", "type3", "custom"] as TileType[]}
      text={["#beast1", "#beast2", "#beast3", "#customize"]}
      selected={tileType}
      setter={setTileType}
    />
    <I.SelectGroup
      title="Nombre d'éviers"
      values={[0, 1, 2]}
      selected={nbSinks}
      setter={i => newGame(model, methods, () => nbSinks = i)}
    />
    <I.Group title="Options">
      <I.Help bind:model={model} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet custom()}
  <Dialog
    title="Personnalise ta tuile"
    onOk={() => model.dialog = null}
  >
    <div class="customtile-container">
      <svg viewBox="0 0 250 250">
        {#each customTileGrid as block, i}
          {@const [row, col] = coords(5, i)}
          {@render square({
            hasBlock: block,
            row,
            col,
            onclick: () => flipCustomTile(i),
          })}
        {/each}
      </svg>
    </div>
  </Dialog>
{/snippet}

{#snippet rules()}
  Est-il possible de faire le <strong>carrelage</strong> de toute ta cuisine,
  sachant qu'elle peut avoir un ou plusieurs <strong>éviers</strong> ?<br/>
  Tu peux tester avec différentes formes de <strong>tuile</strong> et différents emplacements d'éviers.<br/>
  Pour tourner la pièce, tu peux utiliser le <strong>clic droit</strong> ou appuyer sur la touche
  <strong>Espace</strong>.<br/>
  Deux questions sont particulièrement intéressantes: <br/>
  <ul>
    <li>Pour quelles dimensions de la grille et pour quels positions d'éviers
        peut-on paver une grille avec tuiles de <strong>type 1</strong>?</li>
    <li> Peut-on toujours carreler une grille <strong>8x8</strong> avec les tuiles de <strong>type 3</strong> et
    en posant <strong>1 évier</strong>, et ceci, quelque soit la position de l'évier?</li>
  </ul>
{/snippet}

<svelte:window on:keydown={handleKeydown} />
<Template bind:model={model} {methods} {board} {config} {rules} {custom} {sizeLimit} />

<style>
  .container {
    width: 75vmin;
    height: 75vmin
  }

  .darken {
    filter: url(#darken);
  }

  .pointer {
    pointer-events: none;
    transition: transform 0.4s;
  }

  .customtile-container {
    width: 50vmin;
    height: 50vmin;
  }
</style>