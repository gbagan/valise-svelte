<script lang="ts" generics="Pos,Move">
  import { type Model } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos, Move>;
  }

  const {model=$bindable()}: Props = $props();
</script>

<Icon
  text="#undo"
  tooltip="Annule le dernier coup"
  disabled={model.locked || model.isHistoryEmpty()}
  onclick={model.undo}
/>