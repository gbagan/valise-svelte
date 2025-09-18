<script lang="ts" generics="A">
  import Icon from "./Icon.svelte";
  import IconGroup from "./IconGroup.svelte";

  interface Props {
    title: string;
    values: A[];
    selected: A;
    text?: string[] | ((v: A) => string);
    tooltip?: string[] | ((v: A) => string);
    setter: (val: A) => void;
  }
  
  const {title, values, selected, text, tooltip, setter}: Props = $props();
</script>

<IconGroup {title}>
  {#each values as val, i}
    <Icon
      text={Array.isArray(text) ? text[i] : text ? text(val) : ""+val}
      tooltip={Array.isArray(tooltip) ? tooltip[i] : tooltip ? tooltip(val) : ""+val}
      selected={val === selected}
      onclick={() => setter(val)}
    />
  {/each}
</IconGroup>