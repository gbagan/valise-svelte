<script lang="ts">
  import { dCoords, gridStyle, repeat } from '../lib/util';
  import {type Model, type ScoreModel, type Methods, type SizeLimit, type SizeModel,
    initModel, newGame, 
    playA} from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';

  type Pos = {light: boolean[], played: boolean[]};
  type Move = number;
  type Mode = 0 | 1 | 2 | 3;
  
  let model: Model<Pos> & SizeModel & ScoreModel<Pos> = $state({
    ...initModel({light: [], played: []}),
    rows: 3,
    columns: 3,
    customSize: false,
    scores: {},
  });
  let mode: Mode = $state(0);
  let level: number = $state(0); // le niveau en cours
  let maxLevels: number[] = $state([ 0, 1, 1, 0 ]);

  // indique si index1 est voisine de index2 selon le mode de jeu en cours
  // c'est à dire que si l'on active index1, index2 va changer de couleur
  function neighbor(index1: number, index2: number): boolean {
    let [row, col] = dCoords(model.columns, index1, index2);
    return row * row + col * col === 1
      || mode % 3 == 0 && index1 === index2
      || mode >= 2 && index1 !== index2 && row * col == 0
  }

  // met à jour le tableau light en fonction du coup joué à la position index
  const toggleCell = (light: boolean[], index: number) =>
    light.map((b, i) => b !== neighbor(index, i)); 
 
  function play(move: Move): Pos | null {
    const {light, played} = model.position;
    return {
      light: toggleCell(light, move),
      played: played.with(move, !played[move])
    }
  };

  function initialPosition(): Pos {
    const size = model.rows * model.columns;
    // todo
    const light = repeat(size, true);
    return { light, played: repeat(size, false) }
  }

  const isLevelFinished = () => model.position.light.every(b => !b);
  
  const sizes: [number, number][] = [ [3, 3], [4, 4], [2, 10], [3, 10], [5, 5]]; 

  function onNewGame() {
    if (level < 5) {
      const [rows, columns] = sizes[level];
      model.customSize = false;
      model.rows = rows;
      model.columns = columns;
    } else if (!model.customSize) {
      model.customSize = true;
      model.rows = 8;
      model.columns = 8;  
    }
  }

  const methods: Methods<Pos, Move> = { play, isLevelFinished, initialPosition, onNewGame }; 

  // si le niveau est fini, on met à jour les nivaux débloqués
  // et on passe au niveau suivant
  async function play2(i: number) {
    await playA(model, methods, i);
    if (methods.isLevelFinished()) {
      maxLevels[mode] = level >= 4 ? 6 : level + (mode === 0 || mode === 3 ? 1 : 2)
      //saveToStorage
      newGame(model, methods, () => level = Math.min(level+1, 6));
    }
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet square(light: boolean, cross: boolean, style: string, onclick: () => void)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="square" {style} {onclick}>
    <div class={["square-inner", {light}]}>
      <div class="blanc">
        {#if cross}
          <svg class="cross"><use href="#cross"/></svg>
        {/if}
      </div>
      <div class="noir">
        {#if cross}
          <svg class="cross"><use href="#cross"/></svg>
        {/if}
      </div>
    </div>
  </div>
{/snippet}

{#snippet board()}
  {@const rows = model.rows}
  {@const cols = model.columns}  
  <div class="board-container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 4)}>
      {#each model.position.light as light, i}
        {@const row = i / model.columns | 0}
        {@const col = i % model.columns}
        {@const style = `width:${86/cols}%;height:${86/rows}%;left:${(100*col+7)/cols}%;top:${(100*row+7)/rows}%;`}
        {@render square(light, model.help && model.position.played[i], style, () => play2(i))}
      {/each}
    </div>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Tout noir, tout blanc">
    <I.Group title="Options">
      <I.Help bind:model={model} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Le but du jeu est de retourner des tuiles pour que toutes soient face noire.<br/>
  La difficulté est que lorsque tu retournes une tuile, les tuiles adjacentes sont également retournées.<br/>
  Ce jeu possède différents niveaux débloqués au fur et à mesure ainsi que d'autres modes de jeu.
  Selon le mode choisi, les règles pour retourner les tuiles changent.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} />


<style>
  .board-container {
    width: 75vmin;
    height: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .square {
    position: absolute;
    overflow: hidden;
    perspective: 1000px;
  }

  .square-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.8s;
    transform-style: preserve-3d;
    &.light {
      transform: rotateY(180deg);
    }
}
  
  .noir, .blanc {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border: 0.2rem solid #656565;
    border-radius: 12%;
  }
  
  .noir {
    background-color: #333;
  }
  
  .blanc {
    background-color: #dfdfdf;
    transform: rotateY(180deg);
  }

  .cross {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    fill: blue;
  }
</style>