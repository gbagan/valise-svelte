<script lang="ts">
  import Icon from "./icons/Icon.svelte";
  
  interface Props {
    locked: boolean;
    showRowButtons: boolean;
    showColButtons: boolean;
    rows: number;
    columns: number;
    resize: (row: number, col: number) => void;
    children: () => any;
  }

  const {locked, rows, columns, showRowButtons, showColButtons, resize, children }: Props = $props();
</script>

<div class="grid">
  <div class="container">
    {@render children()}
    <div class="rows">
      <Icon
        round={true}
        text="#plus"
        disabled={locked}
        hidden={!showRowButtons}
        onclick={() => resize(rows+1, columns)}
      />
      <div class="text">{rows}</div>
      <Icon 
        round={true}
        text="#minus"
        disabled={locked}
        hidden={!showRowButtons}
        onclick={() => resize(rows-1, columns)}
      />
    </div>
  </div>
  <div class="columns">
    <Icon 
      round={true}
      text="#minus"
      disabled={locked}
      hidden={!showColButtons}
      onclick={() => resize(rows, columns-1)}
    />
    <div class="text">{columns}</div>
    <Icon
      round={true}
      text="#plus"
      disabled={locked}
      hidden={!showColButtons}
      onclick={() => resize(rows, columns+1)}
    />
  </div>
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