<script lang="ts" generics="Pos">
  import { type Model } from '../lib/model';
    import Dialog from './Dialog.svelte';

  interface Props {
    model: Model<Pos>;
    board: any;
    config: any;
    rules: any;
    winTitle?: string;
  }
  
  const { board, config, rules, winTitle, model=$bindable() }: Props = $props();
</script>

{#snippet winPanel(title: string, visible: boolean)}
  <div class="flex items-center justify-center absolute ui-win-container">
    <div class={["ui-win", {visible}]}>
      {title}
    </div>
  </div>
{/snippet}

<div class="main-container">
  {@render board()}
  {@render config()}
  {@render winPanel(winTitle || "GAGNÉ", model.showWin)}
  {#if model.dialog === "rules"}
    <Dialog title="Règles du jeu" onOk={() => model.dialog = null}>
      <div class="ui-rules">
        {@render rules()}
      </div>
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

.ui-win-container {
    pointer-events: none;
    z-index: 500;
}

.ui-win {
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

.ui-rules {
    width: 46rem;
    font-size: 1.1rem;
}

</style>