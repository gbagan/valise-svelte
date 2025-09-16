<script lang="ts">
  interface Props {
    symbol: string;
    drag?: boolean;
    link?: string;
    help: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rectX?: string;
    rectY?: string;
    rectWidth?: string;
    rectHeight?: string;
    fill?: string;
    svg: SVGElement;
  }

  const {symbol, link, drag, x, y, width, height, rectX, rectY, rectWidth, rectHeight, fill, svg}: Props = $props();

  let x2: number | null = $state(null);
  let y2: number | null = $state(null);

  let isDragging = false;

  const onpointerdown = (e: PointerEvent) => {
    if (!drag) {
        return;
    }
    isDragging = true;
    svg.addEventListener("pointermove", onpointermove);
    svg.addEventListener("pointerup", onpointerup);
    svg.addEventListener("pointerleave", onpointerup);
  };

  const onpointermove = (e: PointerEvent) => {
    if (!isDragging) return;
    const rect = svg.getBoundingClientRect();
    x2 = 100 * (e.clientX - rect.left) / rect.width - width / 16.5;
    y2 = 100 * (e.clientY - rect.top) / rect.height - height / 13.8;
  };

  const onpointerup = () => {
    isDragging = false;
    svg.removeEventListener("pointermove", onpointermove);
    svg.removeEventListener("pointerup", onpointerup);
    svg.removeEventListener("pointerleave", onpointerup);
  };

</script>

<g style:transform="translate({x2 ?? x / 8.5}%, {y2 ?? y / 6.9}%)" fill={fill}>
  <svg class={["object", {draggable: drag}]} {width} {height} {onpointerdown}>
  <use href="#{symbol}" class="symbol" />
    {#if link}
      <a href="#{link}" aria-label={link}>
        <rect
          x={rectX ?? "0"}
          y={rectY ?? "0"}
          width={rectWidth ?? "100%"}
          height={rectHeight ?? "100%"}
          class="link"
        />
      </a>
    {/if}
  </svg>
</g>

<style>
.object {
    pointer-events: inherit;
    &.draggable {
        cursor: grab;
    }
}

.link {
    cursor: pointer;
    fill: transparent;
}
</style>