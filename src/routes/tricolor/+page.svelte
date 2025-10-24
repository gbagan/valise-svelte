<script lang="ts">
  import View from './view.svelte';
  import Model from './model.svelte';

  let model = new Model();
</script>

<View {model} />