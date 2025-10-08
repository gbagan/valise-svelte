<script lang="ts">
  interface Props {
    title: string,
    children: any,
  }
  
  let { title, children }: Props = $props();
</script>

<div class="card">
  <div class="head">
      <div class="title">{title}</div>
  </div>
  <div class="body">{@render children()}</div>
</div>

<style>
  .card {
    padding: 0;
    list-style: none;
    transition: all .3s;
    border-radius: 2px;
    border: 1px solid #e8e8e8;
    background-color: white;
  }

  .head{
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #e8e8e8;
    padding: 0.5rem;
  }

  .title {
    font-size: 2em;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    flex: 1;
  }

  .body {
    padding: 0.5rem;
  }

  @media (orientation: portrait) {
    .body {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 0em 4em;
    }
  }
</style>