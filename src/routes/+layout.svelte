<script lang="ts">
  type Props = { children: () => any }

  const { children }: Props = $props();

  import "../app.css";
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  let isHome = false; // $derived(page.url.pathname === resolve('/'));
</script>

<div class={["layout", isHome ? "valise" : "game"]}>
  {#if !isHome}
    <a class="valise-link" href="/" aria-label="valise">
      <svg style="width: 100%; height: 100%">
        <use href="#valise"/>
      </svg>
    </a>
  {/if}
  {@render children()}
</div>
<style>
  .layout {
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