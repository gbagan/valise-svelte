<script lang="ts">
  import { initModel, newGame, playA, updateScore,
        type Methods, type Model, type ScoreMethods, type ScoreModel, type SizeLimit, type SizeModel
      } from "$lib/model";
  import { coords, diffCoords, generate, gridStyle, range, repeat } from "$lib/util";
  import PointerTracker from "$lib/components/PointerTracker.svelte";
  import Template from "$lib/components/Template.svelte";
  import * as I from "$lib/components/Icons";
  import Config from "$lib/components/Config.svelte";
  import Dialog from "$lib/components/Dialog.svelte";

  type Piece = "R" | "B" | "K" | "N" | "Q" | "custom" | null;
  type Position = Piece[];
  type Move = number;

  const piecesList: Piece[] = ["R", "B", "K", "N", "Q"];
  const angles = [ 45, 90, 135, 0, 0, 180, -45, -90, -135 ]
  
  let model: Model<Position> & ScoreModel<Position> & SizeModel = $state({
    ...initModel([]),
    rows: 8,
    columns: 8,
    customSize: false,
    scores: {}
  });

  let selectedPiece: Piece = $state("Q");
  let selectedSquare: number | null = $state(null);
  let allowedPieces: Piece[] = $state(["R"]);
  let multiPieces = $state(false);
  let customLocalMoves = $state(repeat(25, false));
  let customDirections = $state(repeat(9, false));

  function legalMoves(piece: Piece, x: number, y: number) {
    switch(piece) {
      case "Q": return (x * x - y * y) * x * y == 0;
      case "K": return x * x + y * y <= 2;
      case "R": return x * y == 0;
      case "B": return x * x - y * y == 0;
      case "N": return x * x + y * y == 5;
      default: return false;
    }
  }

  // teste si la pièce de type "piece" à la position index1 peut attaquer la pièce à la position index2
  // suppose que la pièce est différent de Empty
  function canCapture(piece: Piece, index1: number, index2: number): boolean {
    const [row, col] = diffCoords(model.columns, index1, index2);
    if (piece !== "custom") {
      return index1 !== index2 && legalMoves(piece, row, col);
    } else {
      return (row * row - col * col) * row * col === 0 
        && customDirections[3 * Math.sign(row)  + Math.sign(col) + 4]
        || row * row + col * col <= 8
        && customLocalMoves[5 * row + col + 12]
    }
  }

  // renvoie l'ensemble des positions pouvant être attaquées par une pièce
  // à la position index sous forme de tableau de booléens
  const attackedBy = (piece: Piece, index: number) =>
    generate(model.rows * model.columns, i => canCapture(piece, i, index));

  // ensemble des cases pouvant être attaquées par une pièce sur le plateau
  let capturable = $derived.by(() => {
    const n = model.rows * model.columns;
    const res = repeat(n, false);
    model.position.forEach((piece, i) => {
      if (piece !== null) {
        const attacked = attackedBy(piece, i);
        for (let i = 0; i < n; i++) {
          res[i] ||= attacked[i];
        }
      }
    });

    return res;
  });

  let isValidPosition = $derived(model.position.every((piece, i) =>
    piece === null || !capturable[i]
  ));

  // ensemble des cases attaquées par la case survolée par le pointeur de la souris
  let attackedBySelected = $derived(
    selectedSquare === null
    ? repeat(model.rows * model.columns, false)
    : attackedBy(selectedPiece, selectedSquare)
  );

  function play(i: Move): Position | null {
    const p = model.position[i] === null ? selectedPiece : null;
    return model.position.with(i, p);
  }

  const initialPosition = () => repeat(model.rows * model.columns, null);
  const isLevelFinished = () => false;
  const onNewGame = () => selectedPiece = allowedPieces[0];

  const objective = "maximize";
  const score = () => isValidPosition ? model.position.filter(p => p !== null).length : 0;
  const scoreHash = () => multiPieces || allowedPieces.includes("custom")
    ? null
    : `${model.rows},${model.columns},${allowedPieces[0]}`;

  const methods: Methods<Position, Move> & ScoreMethods = {
    play, isLevelFinished, initialPosition, onNewGame,
    objective, score, scoreHash
  };
  methods.updateScore = () => updateScore(model, methods, false, "never")

  function tooltip(piece: Piece): string {
    switch (piece) {
      case "Q": return "Reine";
      case "K": return "Roi";
      case "R": return "Tour";
      case "B": return "Fou";
      case "N": return "Cavalier";
      default: return "Pièce personnalisée";
    }
  }

  function toggleMultiPieces() {
    multiPieces = !multiPieces;
    if (!multiPieces) {
      allowedPieces = allowedPieces.slice(0, 1);
    }
  }

  function changeAllowedPieces(piece: Piece) {
    newGame(model, methods, () => {
      if (multiPieces) {
        const pieces = piecesList.filter(p2 => (p2 === piece) !== allowedPieces.includes(p2));
        if (pieces.length > 0) {
          allowedPieces = pieces;
        }
      } else {
        allowedPieces = [piece];
      }
    })
  }

  const customize = () => newGame(model, methods, () => {
    allowedPieces = ["custom"];
    model.dialog = "customize";
    multiPieces = false;
  });

  const sizeLimit: SizeLimit = { minRows:3, minCols: 3, maxRows: 9, maxCols: 9 };

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet pieceSelector()}
  <div class="pieceselector">
    {#each allowedPieces as piece}
      <I.Icon
        text="#piece-{piece}"
        selected={piece === selectedPiece}
        onclick={() => selectedPiece = piece}
      />
    {/each}
  </div>
{/snippet}

{#snippet lines(rows: number, columns: number)}
  {#each range(1, columns) as i}
    <line y1="0" y2={50*rows} x1={i*50} x2={i*50} class="line" />
  {/each}
  {#each range(1, rows) as i}
    <line x1="0" x2={50*columns} y1={i*50} y2={i*50} class="line" />
  {/each}
{/snippet}

{#snippet pointer(x: number, y: number)}
  <use
    class="piece"
    href="#piece-{selectedPiece}"
    x={-20}
    y={-20}
    width="40"
    height="40"
    style:transform="translate({100*x}%, {100*y}%)"
  />
{/snippet}

{#snippet board2()}
  <div class="board">
    <div class="ui-board board" style={gridStyle(model.rows, model.columns, 5)}>
      <PointerTracker {pointer} viewBox="0 0 {50*model.columns} {50*model.rows}">
        {#each model.position as piece, i}
          {@const x = 50 * (i % model.columns)}  
          {@const y = 50 * (i / model.columns | 0)}  
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect {x} {y}
            class={["square", {
              attacked: i === selectedSquare || attackedBySelected[i],
              capturable: model.help && (piece !== null || capturable[i])
            }]}
            onclick={() => playA(model, methods, i)}
            onpointerenter={() => selectedSquare = i}
            onpointerleave={() => selectedSquare = null}
          />
          {#if piece !== null}
            <use
              class={["piece", {capturable: capturable[i]}]}
              href="#piece-{piece}"
              x={x + 5}
              y={y + 5}
              width="40"
              height="40"
            />
          {/if}
        {/each}
        {@render lines(model.rows, model.columns)}
      </PointerTracker>
    </div>
  </div>
{/snippet}

{#snippet board()}
  <div class="board-container">
    {@render pieceSelector()}
    {@render board2()}
  </div>
{/snippet}

{#snippet config()}
  <Config title="Les reines">
    <I.SizesGroup bind:model={model} {methods}
      values={[[4, 4], [5, 5], [7, 7], [8, 8]]}
      customSize={true}
    />
    <I.Group title="Pièces disponibles">
      {#each piecesList as piece}
        <I.Icon
          text="#piece-{piece}"
          selected={allowedPieces.includes(piece)}
          tooltip={tooltip(piece)}
          onclick={() => changeAllowedPieces(piece)}
        />
    {/each}
    </I.Group>
    <I.Group title="Options">
      <I.Icon
        text="#customize"
        selected={allowedPieces[0] == "custom"}
        tooltip="Crée ta propre pièce"
        onclick={customize}
      />
      <I.Icon
        text="#piece-mix"
        tooltip="Mode mixte"
        selected={multiPieces}
        onclick={toggleMultiPieces}
      />
      <I.Help bind:model={model} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
    <I.BestScore bind:model={model} {methods} />
  </Config>
{/snippet}

{#snippet rules()}
  Place le <strong>plus de pièces</strong> possible sur ta grille sans qu'aucune ne soit
  <strong>menacée</strong> par une autre pièce.<br/>
  Tu peux choisir de jouer avec différentes pièces comme celles du <strong>jeu d'échecs.</strong><br/>
  Le mode <strong>mixte</strong> permet de jouer avec plusieurs pièces différentes.<br/>
  Tu peux jouer avec une pièce <strong>personnalisée</strong> si tu le souhaites.
{/snippet}

{#snippet bestScore(position: Position)}
  <div class="bestscore-container">
    <div class="ui-board" style={gridStyle(model.rows, model.columns, 5)}>
      <svg viewBox="0 0 {50*model.columns} {50*model.rows}">
        {#each position as piece, i}
          {@const x = 50 * (i % model.columns)}  
          {@const y = 50 * (i / model.columns | 0)}
          <rect {x} {y} class="square" />
          {#if piece !== null}
            <use
              class="piece"
              href="#piece-{piece}"
              x={x + 5}
              y={y + 5}
              width="40"
              height="40"
            />
          {/if}
        {/each}
        {@render lines(model.rows, model.columns)}
      </svg>
    </div>
  </div>
{/snippet}

{#snippet custom()}
  <Dialog title="Personnalise ta pièce" onOk={() => model.dialog = null}>
    <div class="custompiece-container">
      <div class="ui-board custompiece-grid">
        <svg viewBox="0 0 250 250">
          {#each customLocalMoves as attacked, i}
            {@const [row, col] = coords(5, i)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <rect
              x={50*col} y={50*row}
              class={["square", {attacked}]}
              onclick={() => { if (i !== 12) customLocalMoves[i] = !customLocalMoves[i] }}
            />
          {/each}
          <use
            class="piece"
            href="#piece-custom"
            x="105"
            y="105"
            width="40"
            height="40"
          />
          {@render lines(5, 5)}
        </svg>
      </div>
      <div class="custompiece-directions">
        {#each customDirections as selected, i}
          <I.Icon
            text={i === 4 ? "" : "#arrow"}
            {selected}
            style="transform:rotate({angles[i]}deg)"
            onclick={() => { if (i !== 4) customDirections[i] = !customDirections[i] }}
          />
        {/each}
      </div>
    </div>
  </Dialog>
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {bestScore} {custom} {sizeLimit} />

<style>
  .board-container {
    display: flex;
    align-items: stretch;
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
  }
  
  .board {
    width: 75vmin;
    height: 75vmin;
    display: flex;
    align-items: center;
    justify-content: center;
  }
 
  .line {
    stroke: #bdc3c7;
    stroke-width: 0.5;
    pointer-events: none;
  }

  .piece {
    pointer-events: none;
    &.capturable {
      fill: red;
      color: red;
    }
  }

  .square {
    fill: white;
    width: 50px;
    height: 50px;
    &.attacked {
      fill: #e6e6e6
    }
    &.capturable {
      fill: rgb(224, 123, 162);
    }
    &.capturable.attacked {
      fill: rgb(200, 90, 140);
    }
  }

  .pieceselector {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    gap: 1rem;
  }

  .bestscore-container {
    width: 60vmin;
    height: 60vmin;
  }

  .custompiece-grid {
    width: 50vmin;
    height: 50vmin;
  }

  .custompiece-container {
    display: flex;
    align-items: start;
    justify-content: center;
    gap: 1rem;
  }

  .custompiece-directions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
</style>