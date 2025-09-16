<script lang="ts" generics="Pos,Move">
  import { type Model, type Dict, reset } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
    dict: Dict<Pos, Move>;
  }

  const {model=$bindable(), dict}: Props = $props();
</script>

<Icon
  text="#reset"
  tooltip="Recommence la partie"
  disabled={model.locked || model.history.length === 0}
  onclick={() => reset(model, dict)}
/>