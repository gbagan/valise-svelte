<script lang="ts" generics="Pos">
  import { type Model } from '../lib/model';

  interface Props {
    model: Model<Pos>;
    board: any;
    config: any;
    winTitle?: string;
  }
  

  let { board, config, winTitle, model }: Props = $props();
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
</style>