<script lang="ts">
  interface Props {
    title: string,
    children: any,
  }
  

  let { title, children }: Props = $props();
</script>

<div class="p-0 ui-card bg-white">
  <div class="flex items-center justify-center ui-card-head">
    <div class="ui-card-title">{title}</div>
  </div>
  <div class="ui-card-body">{@render children()}</div>
</div>

<style>
.ui-card {
    list-style: none;
    transition: all .3s;
    border-radius: 2px;
    border: 1px solid #e8e8e8;
}

.ui-card-head{
    border-bottom: 1px solid #e8e8e8;
    padding: 0.5rem;
}

.ui-card-title {
    font-size: 2em;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    flex: 1;
}

.ui-card-body {
    padding: 0.5rem;
}

@media (orientation: portrait) {
    .ui-card-body {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 0em 4em;
    }
}
</style>