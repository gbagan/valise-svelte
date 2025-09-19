<script lang="ts" generics="Drag">
  interface Props {
    viewBox: string;
    class?: string;
    style?: string;
    children: () => any;
    pointer: (style: string) => any;
  }

  let { viewBox, class: className, style, children, pointer }: Props = $props();
  
  let position: {x: number, y: number} | null = $state(null);

  const onpointermove = (e: PointerEvent) => {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    position = {x, y};
  }

</script>

<svg
  {viewBox} class={className} {style}
  onpointerdown={onpointermove}
  onpointermove={onpointermove}
  onpointerleave={() => position = null}
>
  {@render children()}
  {#if position}
    {@render pointer(`transform:translate(${100*position.x}%,${100*position.y}%);`)}
  {/if}
</svg>