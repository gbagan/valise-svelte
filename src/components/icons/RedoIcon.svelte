<script lang="ts" generics="Pos,Move">
  import { type Model, type Dict, redo } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
    dict: Dict<Pos, Move>;
  }

  const {model, dict}: Props = $props();
</script>

<Icon
  text="#undo"
  tooltip="Rejoue le coup annulé"
  style="transform:scaleX(-1);"
  disabled={model.locked || model.redoHistory.length === 0}
  onclick={() => redo(model, dict)}
/>