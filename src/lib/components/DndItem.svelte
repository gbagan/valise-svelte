<script lang="ts" generics="Pos, D, P">
  import { Model } from '$lib/model.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    model: Model<Pos, {from: D, to: D }>;
    dragged: D | null;
    id: D;
    draggable?: boolean;
    droppable?: boolean;
    equals?: (x: D, y: D) => boolean;
    argument: P;
    render: Snippet<[
      argument: P,
      draggable: boolean,
      candrop: boolean,
      onpointerdown?: (e: PointerEvent) => void,
      onpointerup?: (e: PointerEvent) => void,
    ]>;
  }

  let { model=$bindable(), dragged=$bindable(), draggable, droppable, equals,
        id, argument, render }: Props = $props();
  
  let candrop = $derived(
    !!droppable && dragged !== null
    && model.play({from: dragged, to: id}) !== null
  );

  function onpointerdown(e: PointerEvent) {
    (e.currentTarget as Element)?.releasePointerCapture(e.pointerId);
    dragged = id;
  }

  function onpointerup(e: PointerEvent) {
    e.stopPropagation();
    if (dragged !== null) {
      model.playA({from: dragged, to: id});
    }
    dragged = null;
  }

</script>

<g>
  {@render render(argument, dragged !== null && (equals ? equals(dragged, id) : dragged === id), candrop,
    draggable ? onpointerdown : undefined,
    droppable ? onpointerup : undefined
  )}
</g>