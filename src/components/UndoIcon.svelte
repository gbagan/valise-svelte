<script lang="ts">
  import Icon from "./Icon.svelte";
  import {undo} from "../lib/model";

  const {model, dict} = $props();
</script>

<Icon
  text="#undo"
  tooltip="Annule le dernier coup"
  disabled={model.history.length === 0}
  onclick={() => undo(model, dict)}
/>