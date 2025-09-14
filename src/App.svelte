<script lang="ts">
  import Baseball from './game/Baseball.svelte';
  import Nim from './game/Nim.svelte';

  let location = $state("nim");
</script>

<div class="main-main-container game">
  {#if location !== ""}
    <a class="main-minivalise-link" href="#main" aria-label="valise">
      <svg style="width: 100%; height: 100%">
        <use href="#valise"/>
      </svg>
    </a>
  {/if}
  {#if location === "baseball"}
    <Baseball />
  {:else if location === "nim"}
    <Nim />
  {/if}
</div>

<style>
  .main-main-container {
    min-height: 100%;
    width: 100%;
    position: fixed;
    transform: scale(1);
    &.game {
        animation: linear 1s gameenter;
    }
    &.valise {
        animation: linear 1s valiseenter;
    }
}

@keyframes gameenter {
    from {
        transform: scale(0.05); 
    }
    to {
        transform: scale(1);
    }
}

@keyframes valiseenter {
    from {
        transform: translate(-50%, -50%) scale(0.1);
    }
    to {
        transform: scale(1);
    }
}


.main-minivalise-link {
    position: absolute;
    left: 0;
    width: calc(192vmin / 25);
    height: calc(169vmin / 25);
    z-index: 10;
}
</style>