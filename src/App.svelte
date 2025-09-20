<script lang="ts">
  import Valise from './game/Valise.svelte';
  import Baseball from './game/Baseball.svelte';
  import Chocolate from './game/Chocolate.svelte';
  import Frog from './game/Frog.svelte';
  import Hanoi from './game/Hanoi.svelte';
  import Jetons from './game/Jetons.svelte';
  import NoirBlanc from './game/NoirBlanc.svelte';
  import Nim from './game/Nim.svelte';
  import Paths from './game/Paths.svelte';
  import Queens from './game/Queens.svelte';
  import SansMot from './game/SansMot.svelte';
  import Solitaire from './game/Solitaire.svelte';
  import { onMount } from 'svelte';

  let location = $state(window.location.hash.slice(1) || "main");

  onMount(() =>
    addEventListener("hashchange", () => { 
      location = window.location.hash.slice(1) || "main";
    })
  )

$inspect(location);
</script>

<div class="container {location === "main" ? "valise" : "game"}">
  {#if location !== "main"}
    <a class="valise-link" href="#main" aria-label="valise">
      <svg style="width: 100%; height: 100%">
        <use href="#valise"/>
      </svg>
    </a>
  {/if}
  {#if location === "main"}
    <Valise />
  {:else if location === "baseball"}
    <Baseball />
  {:else if location === "chocolate"}
    <Chocolate />
  {:else if location === "frog"}
    <Frog />
  {:else if location === "hanoi"}
    <Hanoi />
  {:else if location === "jetons"}
    <Jetons />
  {:else if location === "noirblanc"}
    <NoirBlanc />
  {:else if location === "nim"}
    <Nim />
  {:else if location === "paths"}
    <Paths />
  {:else if location === "queens"}
    <Queens />
  {:else if location === "sansmot"}
    <SansMot />
  {:else if location === "solitaire"}
    <Solitaire />
  {/if}
</div>

<style>
  .container {
    min-height: 100%;
    width: 100%;
    position: fixed;
    transform: scale(1);
    top: 0;
    left: 0;
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


.valise-link {
    position: absolute;
    left: 0;
    width: calc(192vmin / 25);
    height: calc(169vmin / 25);
    z-index: 10;
}
</style>