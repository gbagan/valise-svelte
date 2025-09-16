<script lang="ts" generics="Pos,Move">
  import { type Model, type Dict, undo } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
    dict: Dict<Pos, Move>;
  }

  const {model=$bindable(), dict}: Props = $props();
</script>

<Icon
  text="#undo"
  tooltip="Annule le dernier coup"
  disabled={model.locked || model.history.length === 0}
  onclick={() => undo(model, dict)}
/>