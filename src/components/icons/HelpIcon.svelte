<script lang="ts" generics="Pos">
  import { type Model } from '../../lib/model';
  import Icon from "./Icon.svelte";

  interface Props {
    model: Model<Pos>;
  }

  const {model=$bindable()}: Props = $props();
</script>

<Icon
  text="#help"
  tooltip="Aide"
  disabled={model.locked}
  selected={model.help}
  onclick={() => model.help = !model.help}
/>