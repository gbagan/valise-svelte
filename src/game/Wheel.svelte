<script lang="ts">
  import { delay, range, repeat, swap } from '../lib/util';
  import {type Model, type Methods, initModel, newGame} from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';
  import DndBoard from '../components/DndBoard.svelte';
  import DndItem from '../components/DndItem.svelte';

  type Pos = (number | null)[];
  type Location = { kind: "panel", id: number } | { kind: "wheel", id: number } | {kind: "board"};
  type Move = {from: Location, to: Location};

  let model: Model<Pos> = $state(initModel([]));
  let size = $state(5);
  let rotation = $state(0);
  let dragged: Location | null = $state.raw(null);

  // tableau indiquant quelles sont les balles alignées avec leur couleur
  let aligned = $derived(model.position.map((v, i) =>
    // todo vérifier le mod 
    v !== null && (i + rotation) % size === v 
  ));

  // comme isValidRotation mais avec seconde conditition en moins 
  let isValidRotation2 = $derived(aligned.filter(x => x).length === 1);
  // une rotation est valide si exactement une couleur est alignée et il y a une balle pour chaque couleur 
  let isValidRotation = $derived(isValidRotation2 && model.position.every(v => v !== null)); 

  let draggedColor: number | null = $derived.by(() => {
    if (dragged === null || dragged.kind === "board") {
      return null;
    } else if (dragged.kind === "panel") {
      return dragged.id;
    } else {
      return model.position[dragged.id];
    }
  });

  let usedColors: boolean[] = $derived.by(() => {
    const used = repeat(size, false);
    for (const c of model.position) {
        if (c !== null) {
            used[c] = true;
        }
    }
    return used;
  })

  function play({from, to}: Move): Pos | null {
    if (from.kind === "panel" && to.kind === "wheel") {
      return model.position.with(to.id, from.id);
    } else if (from.kind === "wheel" && to.kind === "wheel") {
      return swap(model.position, from.id, to.id);
    } else if (from.kind === "wheel" && to.kind === "board") {
      return model.position.with(from.id, null);
    } else {
      return null;
    }
  }

  const initialPosition  = () => repeat(size, null);
  const isLevelFinished = () => false;
  const onNewGame = () => rotation = 0;

  const methods: Methods<Pos, Move> = { play, initialPosition, isLevelFinished, onNewGame };

  const colors = [ "blue", "red", "magenta", "orange", "brown", "cyan", "gray", "black" ];

  async function check() { 
    model.locked = true;
    for (let i = 0; i < size; i++) {
      if (!isValidRotation) {
        model.locked = false;
        return;
      }
      rotation += 1;
      await delay(600);
    }
    model.showWin = true;
    await delay(1000);
    model.showWin = false;
    model.locked = false;
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number): [number, number] {
    return [ centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle) ];
  }

  function pizza(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const [sx, sy] = polarToCartesian(cx, cy, radius, startAngle);
    const [ex, ey] = polarToCartesian(cx, cy, radius, endAngle);
    return `M${cx} ${cy}L${ex} ${ey}A${radius} ${radius} 0 0 0 ${sx} ${sy}L${cx} ${cy}`;
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods)
</script>

{#snippet wheelPart([i, aligned]: [number, boolean], _dragged: boolean, droppable: boolean,
   onpointerdown?: (e: PointerEvent) => void, onpointerup?: (e: PointerEvent) => void)
}
  <path
    d={pizza(0, 0, 80, 2 * Math.PI * (i - 0.5) / size, 2 * Math.PI * (i + 0.5) / size)}
    class={["wheel-part", {droppable}]}
    fill={!aligned ? "#F0B27A" : isValidRotation2 ? "lightgreen" : "#F5B7B1"}
    {onpointerdown} {onpointerup}
  />
{/snippet}

{#snippet disk([color, x, y]: [number, number, number], dragged: boolean, droppable: boolean,
   onpointerdown?: (e: PointerEvent) => void, onpointerup?: (e: PointerEvent) => void)
}
  <circle cx={x} cy={y} r="8"
    {onpointerdown}
    {onpointerup}
    fill={colors[color]}
    stroke="black"
    opacity={dragged ? "20%" : "100%"}
  />
{/snippet}

{#snippet draggedDisk(style: string)}
  <circle r="8"
    cx="-100"
    cy="-120"
    fill={colors[draggedColor!]}
    stroke="black"
    pointer-events="none"
    style={style}
  />
{/snippet}


{#snippet board()}
  <div class="board-ui board">
    <DndBoard
      viewBox="-100 -120 200 260"
      bind:dragged={dragged}
      draggedElement={draggedDisk} 
    >
      {#each range(0, size) as color}
        {#if !usedColors[color]}  
          <DndItem bind:model={model} {methods}
            id={{kind: "panel", id: color}}
            argument={[color, -65 + 130 * color / (size - 1), -100]}
            bind:dragged={dragged}
            draggable={true}
            render={disk}
          />
        {/if}
      {/each}
      <g class="outer-wheel" style:transform="rotate({360 * rotation / size}deg)">
       {#each aligned as align, i (i)}
          <DndItem bind:model={model} {methods}
            id={{kind: "wheel", id: i}}
            argument={[i, align]}
            bind:dragged={dragged}
            droppable={true}
            render={wheelPart}
          />  
        {/each}
        {#each model.position as color, i}
          {#if color !== null}
            {@const x = 64 * Math.cos(2 * i * Math.PI / size)}
            {@const y = 64 * Math.sin(2 * i * Math.PI / size)}
            <DndItem bind:model={model} {methods}
              id={{kind: "wheel", id: i}}
              argument={[color, x, y]}
              bind:dragged={dragged}
              draggable={true}
              droppable={true}
              render={disk}
            />
          {/if}
        {/each}
      </g>
      {#each colors.slice(0, size) as color, i}
        <path
          d={pizza(0, 0, 50, 2 * Math.PI * (i - 0.5) / size, 2 * Math.PI * (i + 0.5) / size)}
          fill={color}
          stroke="black"
        />
      {/each}
    </DndBoard>
    <button class="ui-button ui-button-primary btn-left" onclick={() => rotation -= 1}>↶</button>
    <button class="ui-button ui-button-primary btn-right" onclick={() => rotation += 1}>↷</button>
    <button
      class="ui-button ui-button-primary btn-validate"
      disabled={model.locked || !isValidRotation}
      onclick={check}
    >
      Valider
    </button>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Roue des couleurs">
    <I.SelectGroup
      title="Nombre de couleurs"
      values={[4, 5, 6, 7, 8]}
      selected={size}
      setter={s => newGame(model, methods, () => size = s)}
    />
    <I.Group title="Options">
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Le but du jeu est de poser une bille sur chaque emplacement de la roue
  et effectuer un tour complet de la roue en respectant la condition suivante:<br/>
  à chaque moment durant la rotation de la roue, exactement une bille a sa couleur
  qui correspond avec la couleur de la roue.<br/>
  Tu peux tester en faisant varier le nombre de couleurs de la roue mais également
  en faisant varier le nombre de couleurs que tu utilises.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} />

<style>
  .board {
    height: 82.5vmin;
    width: 75vmin;
    border: thin solid gray;
    position: relative;
  }

  .btn-left {
    width: 3rem;
    height: 3rem;
    font-size: 2rem;
    padding: 0;
    position: absolute;
    left: 1rem;
    top: 0;
  }

  .btn-right {
    width: 3rem;
    height: 3rem;
    font-size: 2rem;
    padding: 0;
    position: absolute;
    right: 1rem;
    top: 0;
  }

  .btn-validate {
    font-size: 2rem;
    padding: 0;
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
  }

  .outer-wheel {
    transition: all linear 0.5s;
  }

.roue-inner {
    position: absolute;
    width: 50%;
    height: 50%;
    left: 25%;
    top: 25%; 
    pointer-events: none;
}

.roue-outer-piece {
    position: absolute;
    width: 12%;
    height: 12%;
    border: thin solid gray;
    border-radius: 50%;
    pointer-events: none;
}

.roue-select-color {
    width: 6vmin;
    height: 6vmin;
    border: thin solid gray;
    border-radius: 50%;
    color: green;
    font-weight: bold;
    font-size: 1.5em;
}

.roue-button {
    width: 6vmin;
    height: 6vmin;
    font-size: 4vmin;
    padding: 0;
}

.roue-validate {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    font-size: 4vmin;
    padding: 0;
}

.roue-buttons {
    height: 7.5vmin;
    width: 75vmin;
    display: flex;
    justify-content: space-around;
}

  .wheel-part {
    stroke: black;
    &.droppable:hover {
      stroke: green;
      stroke-width: 3;
      stroke-dasharray: 6;
    }
  }

.roue-valid-rotation {
    position: absolute;
    font-size: 4em;
    right: 0.5em;
    bottom: 1.2em;

    .valid {
        color: green;
    }
    .invalid {
        color: red;
    }
}

.roue-cursor {
    opacity: 0.7;
}
</style>