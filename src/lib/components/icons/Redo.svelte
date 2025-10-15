<script lang="ts" generics="Pos, Move">
  import { type Model } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos, Move>;
  }

  const {model=$bindable()}: Props = $props();
</script>

<Icon
  text="#undo"
  tooltip="Rejoue le coup annulé"
  style="transform:scaleX(-1);"
  disabled={model.locked || model.redoHistory.length === 0}
  onclick={() => model.redo()}
/>