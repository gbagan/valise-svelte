<script lang="ts" generics="Pos, Move">
  import { setGridSize, type Model, type Methods, type SizeLimit, newGame, isScoreModel, isScoreMethods, isSizeModel } from '../lib/model';
  import Dialog from './Dialog.svelte';
  import IncDecGrid from './IncDecGrid.svelte';

  interface Props {
    model: Model<Pos>;
    methods: Methods<Pos, Move>;
    board: () => any;
    config: () => any;
    rules: () => any;
    bestScore?: (position: Pos) => any;
    custom?: () => any;
    winTitle?: string;
    sizeLimit?: SizeLimit;
  }

  const { board, config, rules, bestScore, custom, winTitle, sizeLimit,
          model=$bindable(), methods}: Props = $props();
</script>

{#snippet winPanel(title: string, visible: boolean)}
  <div class="win-container">
    <div class={["win", {visible}]}>
      {title}
    </div>
  </div>
{/snippet}

<div class="main-container">
  {#if sizeLimit && isSizeModel(model)}
    <IncDecGrid
      rows={model.rows}
      columns={model.columns}
      showRowButtons={model.customSize && sizeLimit.minRows < sizeLimit.maxRows}
      showColButtons={model.customSize && sizeLimit.minCols < sizeLimit.maxCols}
      locked={model.locked}
      resize={(row, col) => setGridSize(model, methods, row, col, sizeLimit)}
    >
      {@render board()}
    </IncDecGrid>
  {:else}
    {@render board()}
  {/if}
  {@render config()}
  {@render winPanel(winTitle || "GAGNÉ", model.showWin)}
  {#if model.dialog === "rules"}
    <Dialog title="Règles du jeu" onOk={() => model.dialog = null}>
      <div class="rules">
        {@render rules()}
      </div>
    </Dialog>
  {:else if model.dialog === "customize"}
    {@render custom?.()}
  {:else if model.dialog == "score" && isScoreModel(model) && isScoreMethods(methods)}
    <Dialog title="Meilleur score" onOk={() => model.dialog = null}>
      {@const position = model.scores[methods.scoreHash() ?? "$custom"][1] }
      {@render bestScore?.(position)}
    </Dialog>
  {:else if model.newGameAction}
    <Dialog
      title="Nouvelle Partie"
      onOk={() => newGame(model, methods)}
      onCancel={() => model.newGameAction = null}
    >
      Tu es sur le point de créer une nouvelle partie. Ta partie en cours sera perdue. Es-tu sûr(e)?
    </Dialog>
  {/if}
</div>

<style>
.main-container {
    position: fixed;
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: space-around;
    align-items: center;
    background: linear-gradient(to right, #cfd9df, #e2ebf0);
}

@media screen and (orientation: portrait) {
    .main-container {
        flex-direction: column;
    }
}

.win-container {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center; 
    pointer-events: none;
    z-index: 500;
}

.win {
    background: white;
    white-space: nowrap;
    border-radius: 1rem;
    border: thin solid red;
    font-size: 4rem;
    padding: 2rem;
    color: red;
    display: block;
    opacity: 0;
    z-index: 500;
    transition: opacity 0.5s ease-in;

    &.visible {
        opacity: 1;
        transition: none;
    }
}

  .rules {
    width: 46rem;
    font-size: 1.1rem;
  
    :global {
      & strong {
        color: blue;
        font-weight: bold;
      }
    }
  }

</style>