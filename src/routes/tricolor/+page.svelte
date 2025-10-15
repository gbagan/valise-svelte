<script lang="ts">
  import { generate, random, repeat } from '$lib/util';
  import { Model } from '$lib/model.svelte';
  import Template from '$lib/components/Template.svelte';
  import * as I from '$lib/components/Icons';
  import Config from '$lib/components/Config.svelte';

  type Position = number[];
  type Move = number;

  class TricolorModel extends Model<Position, Move> {
    constructor() {
      super([]);
    }

    play = (move: Move) => this.position.map((color, i) => 
      inRange(move, i) ? (color + 1) % colorCount : color
    );

    initialPosition = () =>
      shuffle 
      ? generate(size, () => random(0, colorCount))
      : repeat(size, 1);

    isLevelFinished = () => this.position.every(i => i === 0);
  }

  let model = $state(new TricolorModel());

  let size = $state(5);
  let colorCount = $state(2);
  let range = $state(1);
  let hoverCell: number | null = $state(null);
  let shuffle = $state(false);

  function inRange(i: number, j: number) {
    const diff = Math.abs(i - j);
    return Math.min(diff, size - diff) <= range;
  }
  
  // svelte-ignore state_referenced_locally
  model.newGame();

  let levelFinished = $derived(model.isLevelFinished());

  const colors = [ "green", "yellow", "red", "magenta", "blue" ];

  function translateCell(i: number) {
    const x = 50 + 35 * Math.cos(2 *  i * Math.PI / size);
    const y = 45 + 35 * Math.sin(2 *  i * Math.PI / size);
    return `translate(${x}px, ${y}px)`;
  }
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
    onclick={() => model.playA(i)}
    onpointerenter={() => hoverCell = i}
    onpointerleave={() => hoverCell = null}
  />
{/snippet}

{#snippet colorCycle()}
  {#each colors.slice(0, colorCount) as color, i}
    <circle
      cx={95 + 15 * (i - colorCount)}
      cy="95"
      r="3"
      fill={color}
    />
    <path
      d="M0 2H4V0l3 3l-3 3v-2h-4Z"
      fill="black"
      style:transform="translate({99 + 15 * (i - colorCount)}px, 92px)"
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
      setter={i => model.newGame(() => size = i)}
    />
    <I.SelectGroup
      title="Nombre de couleurs"
      values={[2, 3, 4, 5]}
      selected={colorCount}
      setter={i => model.newGame(() => colorCount = i)}
    />
    <I.SelectGroup
      title="Portée"
      values={[1, 2, 3]}
      selected={range}
      setter={i => model.newGame(() => range = i)}
    />
    <I.Group title="Options">
      <I.Undo bind:model={model} />
      <I.Redo bind:model={model} />
      <I.Reset bind:model={model} />
      <I.Icon
        text="#shuffle"
        tooltip="Mélanger"
        selected={shuffle}
        onclick={() => model.newGame(() => shuffle = !shuffle)}
      />
      <I.Rules bind:model={model} />  
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  <strong>Feux tricolores</strong> est une variante de <strong>Tout noir ou tout blanc</strong> mais
  avec plusieurs <strong>couleurs</strong>.<br/>
  Lorsque tu <strong>cliques</strong> un feu, celui-ci change de couleur ainsi que tous les jetons proches
  jusqu'à la distance choisie dans <strong>Portée</strong>.<br/>
  Le but est que tous les jetons soient de couleur <strong>verte</strong>.
{/snippet}

<Template bind:model={model} {board} {config} {rules} />

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