<script lang="ts">
  import { coords, countBy, generate2, gridStyle, mod, getPointerPosition, repeat } from '../lib/util';
  import {type Model, type ScoreModel, type Methods, type SizeLimit, type ScoreMethods, type SizeModel,
    initModel, newGame, playA, updateScore} from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';
    import Dialog from '../components/Dialog.svelte';

  type Mode = "standard" | "cylinder" | "torus";
  type Beast = [number, number][];
  type Beast2 = Beast[];
  type BeastType = "type1" | "type2" | "type3" | "type4" | "custom";

  const type1: Beast = [ [0, 0], [0, 1] ];
  const type2: Beast = [ [0, 0], [0, 1], [0, -1] ];
  const type3: Beast = [ [0, 0], [0, 1], [1, 1] ];

  const beastTypes: Beast2[] = [ [ type1 ], [ type2 ], [ type3 ], [ type2, type3 ] ];


  type Position = boolean[];
  type Move = number;

  let model: Model<Position> & SizeModel & ScoreModel<Position> = $state({
    ...initModel([]),
    rows: 5,
    columns: 5,
    customSize: false,
    scores: {},
  });

  let mode: Mode = $state("standard");
  let beastType: BeastType = $state("type1");
  let selectedColor = $state(0);
  let currentPosition: {x: number, y: number} | null = $state(null);
  let startingPosition: {x: number, y: number} | null = $state(null);
  let startingSquare: number | null = $state(null);
  let squareColors: number[] = $state([]);
  let customBeast: Beast2 = $state([[]]);

  let beast: Beast2 = $derived.by(() => {
    switch (beastType) {
      case "type1": return beastTypes[0];
      case "type2": return beastTypes[1];
      case "type3": return beastTypes[2];
      case "type4": return beastTypes[3];
      default: return customBeast;
    }
  });

  const rotate90 = (beast: Beast) => beast.map(([row, col]) => [-col, row]) as Beast;
  const translate = (beast: Beast, row: number, col: number) => beast.map(([r, c]) => [r+row, c+col]) as Beast;

  function allRotations(beast: Beast): Beast[] {
    const beast2 = rotate90(beast);
    const beast3 = rotate90(beast2);
    const beast4 = rotate90(beast3);    
    return [ beast, beast2, beast3, beast4 ];
  }

  const allTranslations = (beast: Beast) =>
    generate2(model.rows, model.columns, (row, col) => translate(beast, row, col));

  // renvoie toutes les positions possibles pour une bête à plusieurs formes en prenant
  // en compte toutes les rotations et translations
  // peut contenir des positions hors du plateau
  function allBeastPositions(beast: Beast2): Beast[] {
    const res = [];
    for (const b of beast) {
        for (const b2 of allRotations(b)) {
            for (const b3 of allTranslations(b2)) {
                res.push(b3);
            }
        }
    }
    return res;
  }

  const adaptBeast = (beast: Beast) => beast.map(([row, col]) => {
    switch (mode) {
      case "standard": return [row, col];
      case "cylinder": return [row, mod(col, model.columns)];
      default: return  [mod(row, model.rows), mod(col, model.columns)];
    }
  }) as Beast

  // Fonction auxiliaire pour nonTrappedBeast.
  // Il n'est pas nécessaire d'avoir une vraie fonction aléatoire
  const pseudoRandomPick = <A>(arr: A[]) => arr[28921 % arr.length]

  // Renvoie toutes les emplacement possibles évitants les pièges pour la bête
  let nonTrappedBeasts = $derived.by(() => {
    const rows = model.rows
    const columns = model.columns;
    const isValidBeast = (beast: Beast) => beast.every(([row, col]) =>
      row >= 0 && row < rows && col >= 0 && col < columns
      && !model.position[row * columns + col]
    );
    return allBeastPositions(beast).map(adaptBeast).filter(isValidBeast);
  })

  // Renvoie un emplacement possible pour la bête sur le plateau sous forme d'un tableau de booléens
  // indicé par les positions du plateau.
  // Renvoie un tableau ne contenant que la valeur false si aucun emplacement pour la bête n'est possible
  let nonTrappedBeast = $derived.by(() => {
    const res = repeat(model.rows * model.columns, false);
    if (nonTrappedBeasts.length > 0) {
      const beast = pseudoRandomPick(nonTrappedBeasts);
      for (const [row, col] of beast) {
        res[row * model.columns + col] = true;
      }
    }
    return res;
  });


  let customBeastGrid = $derived.by(() => {
    const res = repeat(25, false);
    for (const [row, col] of customBeast[0]) {
      res[row * 5 + col + 12] = true;
    }
    return res;
  });

  const play = (i: Move) => model.position.with(i, !model.position[i]);
  const isLevelFinished = () => nonTrappedBeasts.length === 0;
  const initialPosition = () => repeat(model.rows * model.columns, false);
  function onNewGame() {
    squareColors = repeat(model.rows * model.columns, 0);
  }

  const objective = "minimize";
  const score = () => countBy(model.position, x => x);
  // todo
  const scoreHash = () => beastType === "custom" ? null : `${model.columns},${model.rows},${mode},${beastType}`;

  const methods: Methods<Position, Move> & ScoreMethods = {
    play, isLevelFinished, initialPosition, onNewGame,
    objective, score, scoreHash
  };
  methods.updateScore = () => updateScore(model, methods, true, "onNewRecord");

  function setBeastType(type: BeastType) {
    beastType = type;
    if (type === "custom") {
      model.dialog = "customize";
      model.rows = Math.max(model.rows, 5);
      model.columns = Math.max(model.columns, 5);
    }
  }

  function flipCustomBeast(i: number) {
    let [row, col] = coords(5, i);
    row -= 2;
    col -= 2;
    let idx = customBeast[0].findIndex(([r, c]) => r === row && c === col);
    if (idx === -1) {
        customBeast[0].push([row, col])
    } else {
        customBeast[0].slice(idx, 1);
    }
  }

  function finishZone(index: number) {
    if (startingSquare !== null) {
      let [row1, col1] = coords(model.columns, index);
      let [row2, col2] = coords(model.columns, startingSquare);
      if (row1 > row2) {
        [row1, row2] = [row2, row1];
      };
      if (col1 > col2) {
        [col1, col2] = [col2, col1];
      };
      for (let i = row1; i <= row2; i++) {
        for (let j = col1; j <= col2; j++) {
          squareColors[i * model.columns + j] = selectedColor;
        }
      }
    }
    startingSquare = null;
    startingPosition = null;
  }

  const sizeLimit: SizeLimit = { minRows: 2, minCols: 2, maxRows: 9, maxCols: 9 };
  let winTitle = $derived(`Record: ${score()} pièges`);

  const colors = [ "#5aa02c", "blue", "red", "yellow", "magenta", "cyan", "orange", "darkgreen", "grey" ];

  function handleKeydown(e: KeyboardEvent) {
    if (e.code === "ArrowLeft") {
      selectedColor = (selectedColor + 8) % 9;
    } else if (e.code === "ArrowRight") {
      selectedColor = (selectedColor + 1) % 9;
    }
  }

  const handlePointerdown = (e: PointerEvent, i: number) => {
    if (e.shiftKey) {
      (e.currentTarget as Element)?.releasePointerCapture(e.pointerId);
      startingSquare = i;
    }
  }

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet zone()}
  {#if startingPosition && currentPosition}
    {@const { x: x1, y: y1 } = startingPosition}
    {@const { x: x2, y: y2 } = currentPosition}
    <rect
      x="{100*Math.min(x1, x2)}%"
      y="{100*Math.min(y1, y2)}%"
      width="{100*Math.abs(x2 - x1)}%"
      height="{100*Math.abs(y2 - y1)}%"
      class="zone"
      fill={colors[selectedColor]}
    />
  #{/if}
{/snippet}

{#snippet pointerTrap()}
  {#if !startingPosition && currentPosition}
    {@const {x, y} = currentPosition}
    <use
      href="#trap"
      x="-20"
      y="-20"
      width="40"
      height="40"
      class="pointer"
      style:transform="translate({100*x}%, {100*y}%)"
    />
  {/if}
{/snippet}

{#snippet board()}
  <div class="container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 5)}>
      <svg
        onpointerdown={e => { if(e.shiftKey) startingPosition = getPointerPosition(e) }} 
        viewBox="0 0 {50*model.columns} {50*model.rows}"
        onpointermove={e => currentPosition = getPointerPosition(e)}
        onpointerleave={() => startingPosition = currentPosition = null}       
      >
        {#each squareColors as color, i}
          {@const [row, col] = coords(model.columns, i)}
          <use href="#grass" x={50*col} y={50*row} width="50" height="50" fill={colors[color]} />  
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect x={50*col} y={50*row} width="50" height="50"
            class="square-borders"
            onpointerdown={e => handlePointerdown(e, i)}
            onpointerup={() => finishZone(i)}
            onclick={e => { if (!e.shiftKey) playA(model, methods, i) }}
          />
        {/each}
        {#each model.position as hasTrap, i}
          {@const [row, col] = coords(model.columns, i)}
          {#if hasTrap}
            <use href="#trap" x={50*col+5} y={50*row+5} width="40" height="40" pointer-events="none" />
          {/if}
        {/each}
        {#each nonTrappedBeast as hasBeast, i}
          {@const [row, col] = coords(model.columns, i)}
          <use
            href="#paw" x={50*col+5} y={50*row+5} width="40" height="40"
            class={["beast", {visible: model.help && hasBeast}]}
          />
        {/each}
        {@render zone()}
        {@render pointerTrap()}
      </svg>
    </div>
    <div class="color" style:background-color={colors[selectedColor]}></div>
  </div>
{/snippet}

{#snippet config()}
  <Config title="La bête">
    <I.SelectGroup
      title="Forme de la bête"
      values={["type1", "type2", "type3", "type4", "custom"] as BeastType[]}
      text={["#beast1", "#beast2", "#beast3", "#beast23", "#customize"]}
      selected={beastType}
      setter={i => newGame(model, methods, () => setBeastType(i))}
    />
    <I.SelectGroup
      title="Type de la grille"
      values={["standard", "cylinder", "torus"] as Mode[]}
      text={["#grid-normal", "#grid-cylinder", "#grid-torus"]}
      tooltip={["Normale", "Cylindrique", "Torique"]}
      selected={mode}
      setter={i => newGame(model, methods, () => mode = i)}
    />
    <I.SizesGroup bind:model={model} {methods}
      values={[[3,3], [5,5], [6,6]]}
      customSize={true}
    />
    <I.Group title="Options">
      <I.Help bind:model={model} interaction="press" />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
    <I.BestScore bind:model={model} {methods} />
  </Config>
{/snippet}

{#snippet bestScore(position: Position)}
  <div class="bestscore-container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 5)}>
      <svg viewBox="0 0 {50*model.columns} {50*model.rows}">
        {#each position as hasTrap, i}
          {@const [row, col] = coords(model.columns, i)}
          <use href="#grass" x={50*col} y={50*row} width="50" height="50" fill={colors[0]} />  
          <rect x={50*col} y={50*row} width="50" height="50" class="square-borders" />
          {#if hasTrap}
            <use href="#trap" x={50*col+5} y={50*row+5} width="40" height="40" />
          {/if}
        {/each}
      </svg>
    </div>
  </div>
{/snippet}

{#snippet custom()}
  <Dialog
    title="Personnalise ta bête"
    onOk={() => model.dialog = null}
  >
    <div class="custombeast-container">
      <svg viewBox="0 0 250 250">
        {#each customBeastGrid as beast, i}
          {@const [row, col] = coords(5, i)}
          <use href="#grass" x={50*col} y={50*row} width="50" height="50" fill={colors[0]} />  
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect
            x={50*col} y={50*row} width="50" height="50"
            class="square-borders"
            onclick={() => flipCustomBeast(i)}
          />
          <use
            href="#paw" x={50*col+5} y={50*row+5} width="40" height="40"
            class={["beast", {visible: beast}]}
          />
        {/each}
      </svg>
    </div>
  </Dialog>
{/snippet}


{#snippet rules()}
  Place le moins de <strong>pièges</strong> possible pour empêcher la <strong>bête</strong> d'abîmer ta belle pelouse !<br/>
  Tu peux choisir de jouer avec des bêtes de différentes formes comme celles prédéfinies dans
  <strong>Forme de la bête</strong>.<br/>
  Dans le dernier choix, la bête peut prendre l'une ou l'autre des formes indiquées.<br/>
  Le plateau de jeu peut prendre une <strong>grille</strong>, un <strong>cylindre</strong>
  ou un <strong>tore</strong>.<br/>
  <br/>
  Pour t'aider, tu peux <strong>colorier</strong> les zones en la sélectionnant à la souris
  et en maintenant <strong>shift</strong> enfoncé.<br/>
  Tu peux changer de couleur à l'aide des flèches gauche et droite du clavier.
{/snippet}

<svelte:window on:keydown={handleKeydown} />
<Template bind:model={model} {methods} {board} {config} {rules} {sizeLimit} {winTitle} {bestScore} {custom} />

<style>
  .container {
    position: relative;
    width: 75vmin;
    height: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .color {
    position: absolute;
    left: 10rem;
    top: -4em;
    display: inline-block;
    width: 3.5em;
    height: 2.5em;
  }

  .beast {
    opacity: 0;
    transition: opacity 0.3s ease-in;
    pointer-events: none;

    &.visible {
      opacity: 0.6;
      transition: none;
    }
  }

  .square-borders {
    stroke: black;
    stroke-width: 0.5;
    fill: transparent;
  }

  .pointer {
    opacity: 0.7;
    pointer-events: none;

    &.overtrap {
      opacity: 0.3;
    }
  }

  .zone {
    stroke: black;
    pointer-events: none;
    opacity: 0.4;
  }

  .custombeast-container {
    width: 50vmin;
    height: 50vmin;
  }

  .bestscore-container {
    width: 60vmin;
    height: 60vmin;
  }
</style>