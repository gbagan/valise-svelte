<script lang="ts" generics="Pos, Move">
  import { type Model } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos, Move>;
  }

  const {model=$bindable()}: Props = $props();
</script>

<Icon
  text="#rules"
  tooltip="Règles"
  disabled={model.locked}
  selected={model.dialog === "rules"}
  onclick={() => model.dialog = "rules"}
/>