<script lang="ts">
  import { addEdge, addVertex, getCoordsOfEdge, removeEdge, removeVertex,
  type Graph, type Position } from "$lib/graph";
    import { getPointerPosition } from "$lib/util";
  import Dialog from "./Dialog.svelte";
  import Icon from "./icons/Icon.svelte";

  type Mode = "vertex" | "addedge" | "delete";

  interface Props {
    onOk: (graph: Graph) => void;
  }

  let {onOk}: Props = $props();

  let graph: Graph = $state({title: "Graph personnalisé", vertices: [], edges: []});
  let mode: Mode = $state("vertex");
  let selectedVertex: number | null = $state(null);
  let currentPosition: Position | null = $state.raw(null);

  const onclick = (e: MouseEvent) => {
    if (mode === "vertex") {
      addVertex(graph, getPointerPosition(e));
    }
  }

  const onpointermove = (e: PointerEvent) => {
    if (selectedVertex === null) return;
    const {x, y} = getPointerPosition(e);
    if (mode === "vertex" && selectedVertex !== null) {
      graph.vertices[selectedVertex] = {x, y};
    } else if (mode === "addedge") {
      currentPosition = {x, y};
    }
  }

  function dropOrLeave() {
    if (mode === "addedge") {
      selectedVertex = null;
      currentPosition = null;
    }
  }

  function onVertexClick(e: MouseEvent, i: number) {
    if (mode === "vertex") {
      e.stopPropagation();
    } else if (mode === "delete") {
      removeVertex(graph, i);
    }
  }

  function onVertexPointerUp(i: number) {
    if (mode === "vertex") {
      selectedVertex = null;
      currentPosition = null;
    } else if (mode === "addedge" && selectedVertex !== null) {
      addEdge(graph, selectedVertex, i);
      selectedVertex = null;
    }
  }

  function selectVertex(e: MouseEvent, i: number) {
    e.stopPropagation();
    if (mode === "addedge" || mode === "vertex") {
      selectedVertex = i;
    }
  }

  function onEdgeClick(u: number, v: number) {
    if (mode === "delete") {
      removeEdge(graph, u, v);
    }
  }

</script>

<Dialog title="Créé ton graphe" onOk={() => onOk(graph)}>
  <div class="container">
    <div class="board">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <svg
        viewBox="0 0 100 100"
        class="svg {mode}"
        onpointerup={dropOrLeave}
        {onclick}
        {onpointermove}
        onpointerleave={dropOrLeave}
      >
        {#each graph.edges as [u, v]}
          {@const {x1, y1, x2, y2} = getCoordsOfEdge(graph, u, v)}
          <line
            x1={100*x1} y1={100*y1} x2={100*x2} y2={100*y2}
            class="edge"
            onclick={() => onEdgeClick(u, v)}
          />
        {/each}
        {#each graph.vertices as {x, y}, i}
          <circle
            cx={100*x} cy={100*y}
            r="3"
            class={["vertex", {selected: selectedVertex === i}]}
            onclick={e => onVertexClick(e, i)}
            onpointerdown={e => selectVertex(e, i)}
            onpointerup={() => onVertexPointerUp(i)}
          />
        {/each}
        {#if selectedVertex !== null && currentPosition !== null}
          {@const {x, y} = graph.vertices[selectedVertex]}
          <line x1={100*x} y1={100*y} x2={100*currentPosition.x} y2={100*currentPosition.y} class="line-to-pointer" />
        {/if}
        S.line
      </svg>
    </div>
    <div class="buttons">
      <Icon text="#vertex" selected={mode === "vertex"} tooltip="Ajoute ou déplace un sommet"
        onclick={() => mode = "vertex"}
      />
      <Icon text="#edge" selected={mode === "addedge"} tooltip="Connecte deux sommets"
        onclick={() => mode = "addedge"}
      />
      <Icon text="#trash" selected={mode === "delete"} tooltip="Retire un sommet ou une arête"
        onclick={() => mode = "delete"}
      />
      <Icon text="#clear" tooltip="Efface tout le graphe"
        onclick={() => {graph.vertices = []; graph.edges = []}}
      />
    </div>

  </div>
</Dialog>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .board {
    width: 75vmin;
    height: 75vmin;
    box-shadow: 0px 0px 5px 5px #bdc3c7;
  }

  .vertex {
    fill: blue;
    stroke: blue;
    &.selected {
      stroke: red;
    }
  }

  .delete > .vertex:hover {
    fill: gray;
    stroke: gray;
  }

  .edge {
    stroke: red;
    stroke-width: 1.5;
  }

  .delete .edge:hover {
    stroke: gray;
  }

  .buttons {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    grid-gap: 1rem;
  }

  .line-to-pointer {
    stroke: red;
    stroke-width: 1.5;
    pointer-events: none;
    opacity: 0.6;
  }
</style>