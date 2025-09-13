<script lang="ts">
  interface Props {
    title: string;
    children: any;
  }
  
  const {title, children}: Props = $props();
</script>

<div>
  <div class="text-2xl font-bold mt-4 mb-4">{title}</div>
  <div class="ui-icon-grid">
    {@render children()}
  </div>
</div>

<style>
.ui-icon-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 1em;
}
</style>