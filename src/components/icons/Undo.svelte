<script lang="ts" generics="Pos,Move">
  import { type Model, type Methods, undo } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
    methods: Methods<Pos, Move>;
  }

  const {model=$bindable(), methods}: Props = $props();
</script>

<Icon
  text="#undo"
  tooltip="Annule le dernier coup"
  disabled={model.locked || model.history.length === 0}
  onclick={() => undo(model, methods)}
/>