<script lang="ts" generics="A">
  import Icon from "./Icon.svelte";
  import IconGroup from "./IconGroup.svelte";

  interface Props {
    title: string;
    values: readonly A[];
    selected: readonly A[];
    setter: (val: A) => void;
    disabled?: boolean;
  }
  
  const {title, values, disabled, selected, setter}: Props = $props();
</script>

<IconGroup {title}>
  {#each values as val}
    <Icon
      text={""+val}
      selected={selected.includes(val)}
      onclick={() => setter(val)}
      disabled={disabled}
    />
  {/each}
</IconGroup>