<script lang="ts">
  import { random, range, shuffle, take } from '$lib/util';
  import {type Model, type Methods, initModel, playA, newGame } from '$lib/model';
  import Template from '$lib/components/Template.svelte';
  import * as I from '$lib/components/Icons';
  import Config from '$lib/components/Config.svelte';

  type Position = number[];
  type Move = number;

  let model: Model<Position> = $state(initModel([]));
  let baseCount = $state(5);
  let missingPeg = $state(1);

  function play(i: number): Position | null {
    const position = model.position;
    const j = missingPeg;
    const x = position[i];
    const y = position[j];
    if ([1, baseCount-1, -1, -baseCount+1].includes((x >> 1) - (y >> 1))) {
      return position.with(i, y).with(j, x);
    } else {
      return null;
    }
  }

  const isLevelFinished = () => model.position.every((i, j) => i >> 1 == j >> 1);
  const initialPosition = () => shuffle(range(0, 2*baseCount))
  const onNewGame = () => missingPeg = random(0, 2 * baseCount);

  const methods: Methods<Position, Move> = { play, isLevelFinished, initialPosition, onNewGame };

  let levelFinished = $derived(isLevelFinished());


  const colors = [ "blue", "red", "green", "magenta", "orange", "black", "cyan", "gray" ];

  const transformPeg = (position: number) => {
    const mid = position / 2 | 0;
    const angle = 2 * mid * Math.PI / baseCount;
    const x = 0.42 + 0.35 * Math.cos(angle) + 0.1 * (position % 2);
    const y = 0.46 + 0.35 * Math.sin(angle);
    return `translate(${100*x}%, ${100*y}%)`;
  }

  const transformBase = (i: number) => {
    const angle = 2 * i * Math.PI / baseCount;
    const x = 0.5 + 0.35 * Math.cos(angle);
    const y = 0.5 + 0.35 * Math.sin(angle);
    return `translate(${100*x}%, ${100*y}%) rotate(45deg)`;
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods);

</script>

{#snippet board()}
  <div class="ui-board board">
    <svg viewBox="0 0 100 100">
      {#each take(colors, baseCount) as color, i}
        <rect
          class="base"
          stroke={color}
          style:transform={transformBase(i)}          
        />
      {/each}

      {#each model.position as pos, peg}
        {#if peg !== missingPeg}
          <g
            class="player"
            style:transform={transformPeg(pos)}
          >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <use
              href="#meeple"
              width="7"
              height="7"
              fill={colors[peg / 2 | 0]}
              onclick={() => playA(model, methods, peg)}
              style:cursor={play(peg) !== null ? "pointer" : "not-allowed"}
              style:animation-delay="{1000 + 2000 * peg / baseCount}ms"
              class={{animate: levelFinished}} 
            />
          </g>
        {/if}
      {/each}
    </svg>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Baseball multicolore">
    <I.SelectGroup
      title="Nombre de bases"
      values={[4, 5, 6, 7, 8]}
      selected={baseCount}
      setter={i => newGame(model, methods, () => baseCount = i)}
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
  Le but de <strong>Baseball multicolore</strong> est d'amener chaque <strong>jeton</strong> dans sa
  <strong>base</strong> (celle qui a la même couleur que le jeton).<br/>
  Pour cela, tu peux déplacer un jeton vers une base <strong>adjacente</strong>
  si celle-ci possède un emplacement <strong>libre</strong>.<br/>
  Pour déplacer un jeton, il te suffit de <strong>cliquer</strong> dessus.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} />

<style>
  .board {
    height: 80vmin;
    width: 80vmin;
    background-color: lightgreen;
  }

  .base {
    stroke-width: 1.2;
    fill: white;
    x: -10px;
    y: -10px;
    width: 20px;
    height: 20px;
  }

  .player {
    transition: transform 0.5s linear;
  }

  .animate {
    animation: hola 4s linear infinite;
  }

  @keyframes hola {
    0%  { transform: translate(0, 0); }
    10% { transform: translate(0, -5%); }
    20%, 100% {transform: translate(0, 0); }
  }
</style>