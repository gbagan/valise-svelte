<script lang="ts" generics="Pos,Move">
  import { type ICoreModel } from '$lib/model/types';
  import Icon from "./Icon.svelte";

  interface Props {
    model: ICoreModel<Pos, Move>;
  }

  const { model=$bindable() }: Props = $props();
</script>

<Icon
  text="#reset"
  tooltip="Recommence la partie"
  disabled={model.locked || model.isHistoryEmpty()}
  onclick={model.reset}
/>