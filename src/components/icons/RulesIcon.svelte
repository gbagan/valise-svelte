<script lang="ts" generics="Pos,Move">
  import { type Model, type Dict } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
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