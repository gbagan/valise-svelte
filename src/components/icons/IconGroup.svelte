<script lang="ts">
  interface Props {
      title: string;
      children: any;
  }
  
  const {title, children}: Props = $props();
</script>

<div>
  <div class="title">{title}</div>
  <div class="icons">
    {@render children()}
  </div>
</div>

<style>
.title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.icons {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 1rem;
}
</style>
