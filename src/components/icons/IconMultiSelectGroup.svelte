<script lang="ts" generics="A">
  import Icon from "./Icon.svelte";
  import IconGroup from "./IconGroup.svelte";

  interface Props {
    title: string;
    values: A[];
    selected: A[];
    setter: (val: A) => void;
  }
  
  const {title, values, selected, setter}: Props = $props();
</script>

<IconGroup {title}>
  {#each values as val}
    <Icon
      text={""+val}
      selected={selected.includes(val)}
      onclick={() => setter(val)}
    />
  {/each}
</IconGroup>