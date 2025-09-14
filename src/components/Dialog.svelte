<script lang="ts">
  interface Props {
    title: string;
    onOk?: () => void;
    onCancel?: () => void;
    children: any;
  }
  
  let { title, onOk, onCancel, children }: Props = $props();
</script>

<div class="absolute left-0 top-0 w-full h-full items-center flex justify-center ui-dialog-container">
  <div class="ui-dialog">
    <div class="ui-dialog-head">
      <div class="ui-dialog-title">{title}</div>
    </div>
    <div class="ui-dialog-body">
      {@render children()}
    </div>
    <div class="ui-dialog-buttons">
      {#if onCancel}
        <button class="ui-button ui-button-primary" onclick={onCancel}>Annuler</button>
      {/if}
      {#if onOk}
        <button class="ui-button ui-button-primary" onclick={onOk}>Ok</button>
      {/if}
    </div>
  </div>
</div>

<style>
.ui-dialog-container {
    background-color: rgba(127, 140, 141, 0.7);
    z-index: 1000;
}    

.ui-dialog {
    padding: 0;
    background: white;
    border-radius: 2px;
    border: 1px solid #e8e8e8;
    display: block;
}

.ui-dialog-head {
    border-bottom: 1px solid #e8e8e8;
    padding: 1rem;
    border-radius: 2px 2px 0 0;
    margin-bottom: -1px;
    min-height: 2rem;
}

.ui-dialog-title {
    font-size: 2rem;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    display: inline-block;
    flex: 1;
}

.ui-dialog-body {
    padding: 1.5em;
    margin-bottom: -1px;
    border-bottom: 1px solid #e8e8e8;
}

.ui-dialog-buttons {
    padding: 1em;
    text-align: right;

    & > button + button {
        margin-left: 0.5em;
    }
}
</style>