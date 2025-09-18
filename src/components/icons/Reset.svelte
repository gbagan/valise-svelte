<script lang="ts" generics="Pos,Move">
  import { type Model, type Methods, reset } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
    methods: Methods<Pos, Move>;
  }

  const {model=$bindable(), methods}: Props = $props();
</script>

<Icon
  text="#reset"
  tooltip="Recommence la partie"
  disabled={model.locked || model.history.length === 0}
  onclick={() => reset(model, methods)}
/>