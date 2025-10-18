<script lang="ts" generics="A">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";
  import IconGroup from "./IconGroup.svelte";

  interface Props {
    title: string;
    values: A[];
    selected: A;
    text?: string[] | ((v: A) => string);
    tooltip?: string[] | ((v: A) => (string | null));
    disabled?: boolean[] | ((v: A) => boolean) | boolean;
    setter: (val: A) => void;
    children?: Snippet;
  }
  
  const {title, values, selected, text, tooltip, disabled, setter, children}: Props = $props();
</script>

<IconGroup {title}>
  {#each values as val, i}
    <Icon
      text={Array.isArray(text) ? text[i] : text ? text(val) : ""+val}
      tooltip={Array.isArray(tooltip) ? tooltip[i] : tooltip ? tooltip(val) : null}
      selected={val === selected}
      onclick={() => setter(val)}
      disabled={
        Array.isArray(disabled) 
        ? disabled[i] 
        : typeof disabled === "function" 
        ? disabled(val) 
        : !!disabled
      }
    />
  {/each}
  {@render children?.()}
</IconGroup>