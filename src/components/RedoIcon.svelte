<script lang="ts">
  import Icon from "./Icon.svelte";
  import {redo} from "../lib/model";

  const {model, dict} = $props();
</script>

<Icon
  text="#undo"
  tooltip="Rejoue le coup annulé"
  style="transform:scaleX(-1);"
  disabled={model.redoHistory.length === 0}
  onclick={() => redo(model, dict)}
/>