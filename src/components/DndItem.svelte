<script lang="ts" generics="Pos, D, P">
  import { type Model, type Methods, playA } from '../lib/model';
  interface Props {
    model: Model<Pos>;
    dragged: D | null;
    methods: Methods<Pos, {from: D, to: D }>;
    id: D;
    draggable?: boolean;
    droppable?: boolean;
    params: P;
    render: (
        id: D,
        param: P,
        draggable: boolean,
        candrop: boolean,
        onpointerdown?: (e: PointerEvent) => void,
        onpointerup?: (e: PointerEvent) => void,
    ) => any;
  }

  let { model=$bindable(), dragged=$bindable(), draggable, droppable, methods, id, params, render }: Props = $props();
  
  let candrop = $derived(
    !!droppable && dragged !== null
    && methods.play({from: dragged, to: id}) !== null
  );

  function onpointerdown(e: PointerEvent) {
    dragged = id;
  }

  function onpointerup(e: PointerEvent) {
    e.stopPropagation();
    if (dragged !== null) {
      playA(model, methods, {from: dragged, to: id});
    }
    dragged = null;
  }

</script>

<g>
  {@render render(id, params, dragged === id, candrop,
    draggable ? onpointerdown : undefined,
    droppable ? onpointerup : undefined
  )}
</g>