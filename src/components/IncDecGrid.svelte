<script lang="ts">
  import Icon from "./icons/Icon.svelte";
  
  interface Props {
    locked: boolean;
    showRowButtons: boolean;
    showColButtons: boolean;
    customSize: boolean;
    nbRows: number;
    nbColumns: number;
    resize: (row: number, col: number) => void;
    children: () => any;
  }

  const {locked, nbRows, nbColumns, showRowButtons, showColButtons, customSize, resize, children }: Props = $props();
</script>

<div class="grid">
  <div class="container">
    {@render children()}
    {#if showRowButtons}
      <div class="rows">
        <Icon
          round={true}
          text="#plus"
          disabled={locked}
          hidden={!customSize}
          onclick={() => resize(nbRows+1, nbColumns)}
        />
        <div class="text">{nbRows}</div>
        <Icon 
          round={true}
          text="#minus"
          disabled={locked}
          hidden={!customSize}
          onclick={() => resize(nbRows-1, nbColumns)}
        />
      </div>
    {/if}
  </div>
  {#if showColButtons}
    <div class="columns">
      <Icon 
        round={true}
        text="#minus"
        disabled={locked}
        hidden={!customSize}
        onclick={() => resize(nbRows, nbColumns-1)}
      />
      <div class="text">{nbColumns}</div>
      <Icon
        round={true}
        text="#plus"
        disabled={locked}
        hidden={!customSize}
        onclick={() => resize(nbRows, nbColumns+1)}
      />
    </div>
    
  {/if}
</div>

<style>
.grid {
    display: flex;
    align-items: stretch;
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
}

.container {
    display: flex;
    align-items: stretch;
    gap: 1rem;
}

.rows {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
}

.columns {
    display: flex;
    justify-content: space-around;
}

.text {
    font-size: 2rem;
    font-weight: bold;
}
</style>