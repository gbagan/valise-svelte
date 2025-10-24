<script lang="ts" generics="Pos,Move">
  import { type ICoreModel } from '$lib/model/types';
  import Icon from "./Icon.svelte";

  interface Props {
    model: ICoreModel<Pos, Move>;
  }

  const {model=$bindable()}: Props = $props();
</script>

<Icon
  text="#undo"
  tooltip="Annule le dernier coup"
  disabled={model.locked || model.isHistoryEmpty()}
  onclick={model.undo}
/>