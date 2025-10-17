<script lang="ts" generics="Pos, Move">
  import { type Model } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";

  type Interaction = "click" | "press";

  interface Props {
    model: Model<Pos, Move>;
    interaction?: Interaction
  }

  const {model=$bindable(), interaction = "click"}: Props = $props();
</script>

<Icon
  text="#help"
  tooltip="Aide"
  disabled={model.locked}
  selected={model.help}
  onclick={interaction !== "click" ? null : () => model.help = !model.help}
  onpointerdown={interaction !== "press" ? null : () => model.help = true}
  onpointerup={interaction !== "press" ? null : () => model.help = false}
  onpointerleave={interaction !== "press" ? null : () => model.help = false}
/>