<script lang="ts">
  import {default as Model, type TileType} from './model.svelte';
  import { coords, gridStyle } from '$lib/util';
  import { type SizeLimit } from '$lib/model.svelte';
  import Template from '$lib/components/Template.svelte';
  import * as I from '$lib/components/Icons';
  import Config from '$lib/components/Config.svelte';
  import PointerTracker from '$lib/components/PointerTracker.svelte';
  import Dialog from '$lib/components/Dialog.svelte';

  let model = $state(new Model());
  let hoverSquare: number | null = $state(null);

  let inConflict = $derived(
    hoverSquare !== null 
    && (model.position[hoverSquare] !== 0 || model.play(hoverSquare) === null)
  );

  const sizeLimit: SizeLimit = {minRows: 3, minCols: 3, maxRows: 10, maxCols: 10};

  const border = (i: number, d: number) => model.position[i] !== model.position[i+d];

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === " ") {
      model.rotation += 1;
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
  {#if model.sinks.length < model.sinkCount}
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
      <g class="pointer" style:transform="rotate({90 * model.rotation}deg)">
        {#each model.tile as [row, col]}
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
      oncontextmenu={e => {e.preventDefault(); model.rotation += 1}}
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
            onclick: () => model.selectSquare(index),
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
    <I.SizesGroup bind:model={model}
      values={[ [4, 5], [5, 5], [5, 6], [8, 8] ]}
      customSize={true}
    />
    <I.SelectGroup
      title="Motif de la tuile"
      values={["type1", "type2", "type3", "custom"] as TileType[]}
      text={["#beast1", "#beast2", "#beast3", "#customize"]}
      selected={model.tileType}
      setter={t => model.setTileType(t)}
    />
    <I.SelectGroup
      title="Nombre d'éviers"
      values={[0, 1, 2]}
      selected={model.sinkCount}
      setter={i => model.newGame(() => model.sinkCount = i)}
    />
    <I.Group title="Options">
      <I.Help bind:model={model} />
      <I.Reset bind:model={model} />
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
        {#each model.customTileGrid as block, i}
          {@const [row, col] = coords(5, i)}
          {@render square({
            hasBlock: block,
            row,
            col,
            onclick: () => model.flipCustomTile(i),
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
<Template bind:model={model} {board} {config} {rules} {custom} {sizeLimit} />

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