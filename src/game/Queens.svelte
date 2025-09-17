<script lang="ts">
  import { initModel, newGame, type Dict, type Model } from "../lib/model";
  import { dCoords, generate, range, repeat } from "../lib/util";
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';

  type Piece = "R" | "B" | "K" | "N" | "Q" | "custom" | "";
  type Pos = Piece[];
  type Move = number;

  const piecesList: Piece[] = ["R", "B", "K", "N", "Q"];
  
  let model: Model<Pos> = $state({
    ...initModel([]),
    nbRows: 8,
    nbColumns: 8,
  });

  let selectedPiece: Piece = $state("Q");
  let selectedSquare: number | null = $state(null);
  let allowedPieces: Piece[] = ["R"];
  let multiPieces = $state(false);

  function legalMoves(piece: Piece, x: number, y: number) {
    switch(piece) {
      case "Q": return (x * x - y * y) * x * y == 0;
      case "K": return x * x + y * y <= 2;
      case "R": return x * y == 0;
      case "B": return x * x - y * y == 0;
      case "K": return x * x + y * y == 5;
      default: return false;
    }
  }

   // teste si la pièce de type "piece" à la position index1 peut attaquer la pièce à la position index2
   // suppose que la pièce est différent de Empty
  function canCapture(piece: Piece, index1: number, index2: number): boolean {
    const [row, col] = dCoords(model.nbColumns, index1, index2);
    if (piece !== "custom") {
      return index1 !== index2 && legalMoves(piece, row, col);
    } else {
      return false;
    }
  }

  // renvoie l'ensemble des positions pouvant être attaquées par une pièce
  // à la position index sous forme de tableau de booléens
  const attackedBy = (piece: Piece, index: number) =>
    generate(model.nbRows * model.nbColumns, i => canCapture(piece, index, i));

  // ensemble des cases pouvant être attaquées par une pièce sur le plateau
  let capturable = $derived.by(() => {
    const n = model.nbRows * model.nbColumns;
    const res = repeat(n, false);
    model.position.forEach((piece, i) => {
      if (piece !== "") {
        const attacked = attackedBy(piece, i);
        for (let i = 0; i < n; i++) {
          res[i] ||= attacked[i];
        }
      }
    });

    return res;
  });

  // ensemble des cases attaquées par l'endroit du pointeur de la souris
  let attackedBySelected = $derived(
    selectedSquare === null
    ? repeat(model.nbRows * model.nbColumns, false)
    : attackedBy(selectedPiece, selectedSquare)
  );

  function play(i: Move): Pos | null {
    const p = model.position[i] === "" ? selectedPiece : "";
    return model.position.with(i, p);
  }

  const initialPosition = () => repeat(model.nbRows * model.nbColumns, "" as Piece);
  const isLevelFinished = () => false;
  const onNewGame = () => selectedPiece = allowedPieces[0];

  const dict: Dict<Pos, Move> = { play, isLevelFinished, initialPosition, onNewGame };

  // svelte-ignore state_referenced_locally
  newGame(model, dict);
  model.position[11] = "K";
  model.position[41] = "Q";
  model.position[15] = "R";
  model.position[21] = "B";
  model.position[61] = "N";
</script>



{#snippet board()}
  <div class="ui-board board">
    <svg viewBox="0 0 {50*model.nbColumns} {50*model.nbRows}">
      {#each range(1, model.nbColumns) as i}
        <line
          y1="0"
          y2={50*model.nbRows}
          x1={i*50}
          x2={i*50}
          stroke="#bdc3c7"
        />
      {/each}
      {#each range(1, model.nbRows) as i}
        <line
          x1="0"
          x2={50*model.nbColumns}
          y1={i*50}
          y2={i*50}
          stroke="#bdc3c7"
        />
      {/each}
      {#each model.position as piece, i}
        {#if piece !== ""}
          {@const x = 50 * (i % model.nbColumns) + 5}  
          {@const y = 50 * (i / model.nbColumns | 0) + 5}
          
          <use
            class={["piece", {capturable: capturable[i]}]}
            href="#piece-{piece}"
            style:transform="translate({x}px,{y}px)"
            width="40"
            height="40"
          />
        {/if}
      {/each}

    </svg>
  </div>  
{/snippet}

{#snippet config()}
  <div>

  </div>  
{/snippet}

{#snippet rules()}
  Place le plus de pièces possible sur ta grille sans qu\'aucune ne soit menacée par une autre pièce.<br/>
  Tu peux choisir de jouer avec différentes pièces comme celles du jeu d\'échecs.<br/>
  Le mode mixte permet de jouer avec plusieurs pièces différentes.<br/>
  Tu peux jouer avec une pièce personnalisée si tu le souhaites.
{/snippet}

<Template bind:model={model} {dict} {board} {config} {rules} />

<style>
  .board {
    width: 75vmin;
    height: 75vmin;
  }
 

  .piece {
    pointer-events: none;
    &.capturable {
      fill: red;
      color: red;
    }
  }

  .square {
    float: left;
    background: white;
    box-shadow: 0px 0px 0px 1px #bdc3c7;
  }

  .square-selected {
    filter: brightness(0.8);
  }

  .square-nonavailable {
    background: rgb(224, 123, 162);
  }

  .queens-square-capturable .piece {
    fill: red;
    color: red;
  }   

  .queens-pieceselector {
    margin-bottom: 0.5em;
  }

  .queens-bestscore-container {
    width: 60vmin;
    height: 60vmin;
  }

.queens-custompiece-grid {
    width: 50vmin;
    height: 50vmin;
}

.queens-custompiece-directions {
    width : 13em;
    margin-left: 0.5em;
}

.queens-custompiece-directions > div {
    margin: 0.3em;
}
</style>