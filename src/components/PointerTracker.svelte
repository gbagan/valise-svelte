<script lang="ts" generics="Drag">
  import { getPointerPosition } from '../lib/util';

  interface Props {
    viewBox: string;
    class?: string;
    style?: string;
    children: () => any;
    pointer: (x: number, y: number) => any;
  }

  let { viewBox, class: className, style, children, pointer }: Props = $props();
  
  let position: {x: number, y: number} | null = $state(null);
</script>

<svg
  {viewBox} class={className} {style}
  onpointermove={e => position = getPointerPosition(e)}
  onpointerleave={() => position = null}
>
  {@render children()}
  {#if position}
    {@render pointer(position.x, position.y)}
  {/if}
</svg>