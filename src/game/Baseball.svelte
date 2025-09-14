<script lang="ts">
  import { range, shuffle, take } from '../lib/util';
  import {type Model, type Dict, initModel, playA, newGame } from '../lib/model';
  import Template from '../components/Template.svelte';
  import UndoIcon from '../components/UndoIcon.svelte';
  import RedoIcon from '../components/RedoIcon.svelte';
  import IconGroup from '../components/IconGroup.svelte';
  import IconSelectGroup from '../components/IconSelectGroup.svelte';
  import Config from '../components/Config.svelte';

  type Pos = number[];
  type Move = number;

  let model: Model<Pos> = $state(initModel(range(0, 10)));
  let nbBases = $state(5);
  let missingPeg = $state(1);

  function play(i: number): Pos | null {
    const position = [...model.position];
    const j = missingPeg;
    const x = model.position[i];
    const y = model.position[j];
    if ([1, nbBases-1, -1, -nbBases+1].includes((x >> 1) - (y >> 1))) {
       position[i] = y;
       position[j] = x;
       return position;
    } else {
      return null;
    }
  }

  const isLevelFinished = () =>
    model.position.every((i, j) => i >> 1 == j >> 1)

  const initialPosition = () => shuffle(range(0, 2*nbBases))

  function onNewGame() {
    missingPeg = Math.random() * (2 * nbBases) | 0
  }

  const dict: Dict<Pos, Move> = { play, isLevelFinished, initialPosition, onNewGame };

  const colors = [ "blue", "red", "green", "magenta", "orange", "black", "cyan", "gray" ];

  const transformPeg = (position: number, nbBases: number) => {
    const mid = position / 2 | 0;
    const x = 0.42 + 0.35 * Math.cos(mid * 2 * Math.PI / nbBases) + 0.1 * (position % 2);
    const y = 0.46 + 0.35 * Math.sin(mid * 2 * Math.PI / nbBases);
    return `translate(${x * 100}%, ${y * 100}%)`;
  }

  const transformBase = (i: number, nbBases: number) => {
    const x = 0.50 + 0.35 * Math.cos(2 * i * Math.PI / nbBases);
    const y = 0.50 + 0.35 * Math.sin(2.0 * i * Math.PI / nbBases);
    return `translate(${x * 100}%, ${y * 100}%) rotate(45deg)`;
  }

  const levelFinished = $derived(isLevelFinished());

  newGame(model, dict);

</script>

{#snippet board()}
  <div class="ui-board baseball-board">
    <svg viewBox="0 0 100 100">
      {#each take(colors, nbBases) as color, i}
        <rect
          class="baseball-base"
          stroke={color}
          style:transform={transformBase(i, nbBases)}          
        />
      {/each}

      {#each model.position as pos, peg}
        {#if peg !== missingPeg}
          <g
            class="baseball-player"
            style:transform={transformPeg(pos, nbBases)}
          >
            <use
              href="#meeple"
              width="7"
              height="7"
              fill={colors[peg / 2 | 0]}
              onclick={() => playA(model, dict, peg)}
              style:cursor={play(peg) !== null ? "pointer" : "not-allowed"}
              style:animation={
                levelFinished 
                ? `baseballHola 4s linear ${1000 + 2000 * peg / nbBases}ms infinite`
                : "none"
              }
            />
          </g>
        {/if}
      {/each}
    </svg>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Baseball multicolore">
    <IconSelectGroup
      title="Nombre de bases"
      values={[4, 5, 6, 7, 8]}
      selected={nbBases}
      setter={() => {}}
    />

    <IconGroup title="Options">
      <UndoIcon {model} {dict}/>
      <RedoIcon {model} {dict}/>
    </IconGroup>
  </Config>
{/snippet}

{#snippet rules()}
  Le but du jeu est d'amener chaque jeton dans sa base (celle qui a la même couleur que le jeton).<br/>
  Pour cela, tu peux déplacer un jeton vers une base adjacente si celle-ci possède un emplacement libre.<br/>
  Pour déplacer un jeton, il te suffit de cliquer dessus.
{/snippet}


<Template bind:model={model} {board} {config} {rules} />

<style>
.baseball-board {
    height: 80vmin;
    width: 80vmin;
    background-color: lightgreen;
}

.baseball-base {
    stroke-width: 1.2;
    fill: white;
    x: -10px;
    y: -10px;
    width: 20px;
    height: 20px;
}

.baseball-player {
    transition: transform 0.5s linear;
}

:global {
  @keyframes baseballHola {
    0%  { transform: translate(0, 0); }
    10% { transform: translate(0, -5%); }
    20%, 100% {transform: translate(0, 0); }
  }
}
</style>