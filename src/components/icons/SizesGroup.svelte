<script lang="ts" generics="Pos,Move">
  import { type Model, type Dict, newGame } from '../../lib/model';
  import Icon from "./Icon.svelte";
  import IconGroup from "./IconGroup.svelte";

  interface Props {
    model: Model<Pos>;
    dict: Dict<Pos, Move>;
    values: [number, number][];
    customSize?: boolean;
  }
  
  const {model=$bindable(), dict, values, customSize }: Props = $props();

  const setSize = (rows: number, columns: number) =>
    newGame(model, dict, () => {
      model.rows = rows;
      model.columns = columns;
      model.customSize = false;
    });

</script>

<IconGroup title="Dimensions de la grille">
  {#each values as [rows, cols]}
    <Icon
      text="{rows}x{cols}"
      selected={!model.customSize && rows === model.rows && cols === model.columns}
      onclick={() => setSize(rows, cols)}
    />
  {/each}
  {#if customSize}
    <Icon
      text="NxM"
      tooltip="Taille personalisée"
      selected={model.customSize}
      onclick={() => newGame(model, dict, () => model.customSize = true)}
    />
  {/if}
</IconGroup>