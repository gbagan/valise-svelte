<script lang="ts" generics="Pos, Move">
  import { type ICoreModel } from '$lib/model/types';
  import Icon from "./Icon.svelte";

  type Interaction = "click" | "press";

  interface Props {
    model: ICoreModel<Pos, Move>;
    interaction?: Interaction
  }

  const {model=$bindable(), interaction = "click"}: Props = $props();
</script>

<Icon
  text="#help"
  tooltip="Aide"
  disabled={model.locked}
  selected={model.help}
  onclick={interaction !== "click" ? null : () => model.toggleHelp()}
  onpointerdown={interaction !== "press" ? null : () => model.setHelp(true)}
  onpointerup={interaction !== "press" ? null : () => model.setHelp(false)}
  onpointerleave={interaction !== "press" ? null : () => model.setHelp(false)}
/>