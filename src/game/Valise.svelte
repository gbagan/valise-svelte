<script lang="ts">
  import { onMount } from 'svelte';
  import ValiseObject from '../components/ValiseObject.svelte';

  let isOpen = $state(false);
  let help: string | null = $state(null);
  let helpVisible = $state(false);
  //let drag: {name: string, x: number, y: number} | null = $state(null);
  // let positions: Record<string, {x: number, y: number}> = $state({});

  function setHelp(s: string | null) {
    if (s === null) {
      helpVisible = false;
    } else {
      help = s;
      helpVisible = true;
    }
  }

  let svg: SVGElement = $state()!;

  onMount(() => setTimeout(() => isOpen = true, 1500));
</script>

{#snippet valise()}
  <svg bind:this={svg} viewBox="0 0 825 690">
    <use href="#valise" class="valise-close" /> 
    <g class="valise-open">
      <use href="#openvalise"/>
        <ValiseObject
          symbol="knight"
          link="queens"
          help="Jeu: les 8 reines"
          x={461} y={380} width={24} height={48}
          style="transform:rotate(40deg);"
          {svg} {setHelp}
        />
      <ValiseObject
        symbol="stack"
        link="jetons"
        help="Jeu: acquisition"
        x={350} y={500} width={50} height={50}
        {svg} {setHelp}
      />
      <ValiseObject
        symbol="block2"
        link="nim"
        help="Jeu: bloque moi si tu peux"
        x={380} y={120} width={40} height={40}
        {svg} {setHelp}
      />
      <ValiseObject
        symbol="tricolor2"
        link="baseball"
        help="Jeu: baseball multicolore"
        x={350} y={330} width={90} height={60}
        {svg} {setHelp}
      />
      <ValiseObject
        symbol="frog2"
        link="frog"
        help="Jeu: la grenouille"
        x={549} y={320} width={40} height={40}
        style="fill:#bcd35f;"
        {svg} {setHelp}
      />
      <ValiseObject
        symbol="flowerpot"
        help="Quelque chose se cache derrière ce pot"
        drag={true}
        x={533} y={300} width={64} height={64}
        {svg} {setHelp}
      />
    </g>
  </svg>
{/snippet}

<div class={["main-container", {open: isOpen}]}>
    <div class="logo">
      <svg style:width="100%" style:height="100%">
        <use href="#logo" />
      </svg>
    </div>
    <div class="container">
      {@render valise()}
      <div class={["help", {visible: helpVisible}]}>
        {help}
      </div>
    </div>
</div>

<style>
.main-container {
    height: 100vh;
    width: 100vw;
}

.container {
    height: calc(69vmin * 1.1);
    width: calc(82.5vmin * 1.1);
    position: relative;
}

.valise-open {
    opacity: 0;
}

.valise-close {
    width: 100%;
    height: 100%;
    opacity: 1;
}

.logo {
    height: calc(18vmin * 1.1);
    width: calc(82.5vmin * 1.1);
    opacity: 0;
}

.object {
    pointer-events: inherit;
}

.object-link {
    cursor: pointer;
    fill: transparent;
}

.main-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.main-container.open  {
    & .valise-open, & .logo {
        opacity: 1;
        transition: opacity 0.5s ease-in 0.5s;
    }

    .valise-close {
        opacity: 0;
        transition: opacity 0.5s ease-out;
    }
}

.help {
    position: absolute;
    left: 67%;
    top: 18%;
    font-size: 1.5em;
    display: inline;
    border: thick solid blue;
    padding: 0.5em;
    border-radius: 0.5em;
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;

    &.visible {
        opacity: 1;
    }
}
</style>