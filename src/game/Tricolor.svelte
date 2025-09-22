<script lang="ts">
  import { generate, random, repeat } from '../lib/util';
  import {type Model, type Methods, initModel, playA, newGame } from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';

  type Position = number[];
  type Move = number;

  let model: Model<Position> = $state(initModel([]));
  let size = $state(5);
  let nbColors = $state(2);
  let range = $state(1);
  let hoverCell: number | null = $state(null);
  let shuffle = $state(false);

  let levelFinished = $derived(model.position.every(i => i === 0));

  function inRange(i: number, j: number) {
    const diff = Math.abs(i - j);
    return Math.min(diff, size - diff) <= range;
  }
  
  const play = (move: Move) => model.position.map((color, i) => 
    inRange(move, i) ? (color + 1) % nbColors : color
  );

  const initialPosition = () =>
    shuffle 
    ? generate(size, () => random(0, nbColors))
    : repeat(size, 1);

  const isLevelFinished = () => levelFinished;

  const methods: Methods<Position, Move> = { play, isLevelFinished, initialPosition };
  
  const colors = [ "green", "yellow", "red", "magenta", "blue" ];

  function translateCell(i: number) {
    const x = 50 + 35 * Math.cos(2 *  i * Math.PI / size);
    const y = 45 + 35 * Math.sin(2 *  i * Math.PI / size);
    return `translate(${x}px, ${y}px)`;
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet cell(i: number, color: number)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <circle
    r="7.5"
    class={["cell", {finished: levelFinished}]}
    stroke={hoverCell !== null && inRange(i, hoverCell) ? "lightgreen" : "black"}
    fill={levelFinished ? "" : colors[color]}
    style:transform={translateCell(i)}
    onclick={() => playA(model, methods, i)}
    onpointerenter={() => hoverCell = i}
    onpointerleave={() => hoverCell = null}
  />
{/snippet}

{#snippet colorCycle()}
  {#each colors.slice(0, nbColors) as color, i}
    <circle
      cx={95 + 15 * (i - nbColors)}
      cy="95"
      r="3"
      fill={color}
    />
    <path
      d="M0 2H4V0l3 3l-3 3v-2h-4Z"
      fill="black"
      style:transform="translate({99 + 15 * (i - nbColors)}px, 92px)"
    />
  {/each}
  <circle cx="95" cy="95" r="3" fill="green" />
{/snippet}

{#snippet board()}
  <div class="ui-board board">
    <svg viewBox="0 0 100 100">
      {#each model.position as color, i}
        {@render cell(i, color)}
      {/each}
      {@render colorCycle()}
    </svg>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Jeux tricolores">
    <I.SelectGroup
      title="Nombre de feux"
      values={[4, 5, 6, 7, 8, 9, 10, 11, 12, 13]}
      selected={size}
      setter={i => newGame(model, methods, () => size = i)}
    />
    <I.SelectGroup
      title="Nombre de couleurs"
      values={[2, 3, 4, 5]}
      selected={nbColors}
      setter={i => newGame(model, methods, () => nbColors = i)}
    />
    <I.SelectGroup
      title="Portée"
      values={[1, 2, 3]}
      selected={range}
      setter={i => newGame(model, methods, () => range = i)}
    />
    <I.Group title="Options">
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Icon
        text="#shuffle"
        tooltip="Mélanger"
        selected={shuffle}
        onclick={() => newGame(model, methods, () => shuffle = !shuffle)}
      />
      <I.Rules bind:model={model} />  
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Ce jeu est une variante de "Tout noir ou tout blanc" mais avec plusieurs couleurs.<br/>
  Lorsque tu cliques un jeton, celui-ci change de couleur ainsi que tous les jetons proches
  jusqu'à la distance choisie dans "Portée".<br/>
  Le but est que tous les jetons soient de couleur verte.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} />

<style>
  .board {
    height: 80vmin;
    width: 80vmin;
  }

  .cell {
    transition: fill 0.3s linear;
    &.finished {
      animation: 2s infinite tricolorHola;
    }
  }

  @keyframes tricolorHola {
    0%  { fill: green; }
    20% { fill: yellow; }
    40% { fill: red; }
    60% { fill: magenta; }
    80% { fill: blue; }
    100%  { fill: green; }
  }
</style>