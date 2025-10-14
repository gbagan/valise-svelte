<script lang="ts">
  import { getCoordsOfEdge, type Edge, type Graph } from "$lib/graph";
  import { initModel, loadRecords, newGame, playA, updateScore,
          type Methods, type Model, type ScoreMethods, type ScoreModel } from "$lib/model";
  import GraphEditor from "$lib/components/GraphEditor.svelte";
  import * as I from '$lib/components/Icons';
  import Config from '$lib/components/Config.svelte';
  import Template from "$lib/components/Template.svelte";
  import PointerTracker from "$lib/components/PointerTracker.svelte";
  import { onMount } from "svelte";

  const house: Graph = {
    title: "Maison",
    vertices: [ { x: 1, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 3 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 1 } ],
    edges: [ [0,1], [1,4], [3,4], [0,3], [0,2], [1,2], [2,3], [2,4], [3,5], [4,5] ]
  };

  const hourglass: Graph = {
    title: "Sablier",
    vertices: [
      { x: 1, y: 0.7 },
      { x: 4, y: 0.7 },
      { x: 2.5, y: 1.2 },
      { x: 2.5, y: 1.9 },
      { x: 1.5, y: 1.9 },
      { x: 3.5, y: 1.9 },
      { x: 1.5, y: 2.5 },
      { x: 3.5, y: 2.5 },
      { x: 2.5, y: 2.5 },
      { x: 2.5, y: 3.2 },
      { x: 1, y: 3.7 },
      { x: 4, y: 3.7 }
    ],
    edges: [ [0,1], [0,2], [1,2], [2,3], [3,4], [3,5], [4,6], [5,7], [6,8], [7,8], [8,9], [9,10], [9,11], [10,11] ]
  };

  const house2: Graph = {
    title: "Maison avec cave",
    vertices: [
      { x: 2, y: 2.5 },
      { x: 1, y: 3.2 },
      { x: 3, y: 3.2 },
      { x: 1, y: 1.8 },
      { x: 3, y: 1.8 },
      { x: 2, y: 1.0 },
      { x: 2, y: 4.0 },
    ],
    edges: [ [0, 1], [0,2], [0,3], [0,4], [1,2], [2,4], [3,4], [1,3], [3,5], [4,5], [1,6], [2,6] ]
  };

  const interlace: Graph = {
    title: "Entrelacements",
    vertices: [
      { x: 2.5, y: 1 },
      { x: 4, y: 1 },
      { x: 1, y: 2 },
      { x: 2.5, y: 2 },
      { x: 3.25, y: 2 },
      { x: 2.5, y: 2.5 },
      { x: 3.25, y: 2.5 },
      { x: 4, y: 2.5 },
      { x: 1, y: 4 },
      { x: 3.25, y: 4 },
    ],
    edges: [ [0,1], [0,3], [2,3], [3,4], [1,7], [5,6], [6,7], [3,5], [4,6], [2,8], [6,9], [8,9] ]
  };

  const grid: Graph = {
    title: "Grille",
    vertices: [
      { x: 0, y: 0.5 },
      { x: 2, y: 0.5 },
      { x: 4, y: 0.5 },
      { x: 1, y: 1.5 },
      { x: 3, y: 1.5 },
      { x: 0, y: 2.5 },
      { x: 2, y: 2.5 },
      { x: 4, y: 2.5 },
      { x: 1, y: 3.5 },
      { x: 3, y: 3.5 },
      { x: 0, y: 4.5 },
      { x: 2, y: 4.5 },
      { x: 4, y: 4.5 },
    ].map(({ x, y }) => ({ x: x * 0.85 + 1.0, y: y * 0.85 + 0.21 })),
    edges: [ [0,1], [1,2], [0,3], [1,3], [1,4], [2,4], [3,5], [3,6], [4,6], [4,7], [5,8], [6,8], [6,9],
            [7,9], [8,10], [8,11], [9,11], [9,12], [10,11], [11,12], [0,5], [2,7], [5,10], [7,12]
          ]
  }

  const konisberg: Graph = {
    title: "Ponts de Königsberg",
    vertices: [
      { x: 1, y: 0 },
      { x: 3.0, y: 0.0 },
      { x: 0.0, y: 1.0 },
      { x: 2.0, y: 1.0 },
      { x: 4.0, y: 1.0 },
      { x: 1.0, y: 2.0 },
      { x: 3.0, y: 2.0 },
      { x: 0.0, y: 3.0 },
      { x: 2.0, y: 4.0 },
      { x: 4.0, y: 3.0 }
    ].map(({ x, y }) => ({ x: x * 0.85 + 1.0, y: y * 0.85 + 1.0 })),
    edges: [ [0,2], [0,3], [1,3], [1,4], [4,6], [3,6], [3,5], [2,5], [2,7], [3,8], [4,9], [7,8], [8,9] ]
  }

  const ex1: Graph = {
    title: "Tour",
    vertices: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 4 },
      { x: 0, y: 5 },
      { x: 2, y: 5 },
    ].map(({ x, y }) => ({ x: x * 0.9 + 1.0, y: y * 0.9 + 0.2 })),
    edges: [ [0,1], [0,2], [1,2], [1,3], [2,3], [3,4], [3,5], [4,5], [1,4], [2,5],
            [4,6], [5,6], [6,7], [6,8], [4,7], [5,8] ]
  }

  const ex3: Graph = {
    title: "Soleil",
    vertices: [ 
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 3.5 },
      { x: 3.5, y: 3.5 },
      { x: 3.5, y: 0.5 },
      { x: 2, y: 2 },
    ].map(({ x, y }) => ({ x: x * 1.15, y: y * 1.15 })),
    edges: [ [0,1], [1,2], [2,3], [0,3], [0,8], [1,8], [2,8], [3,8], [0,4], [1,4], [0,5],
            [3,5], [2,6], [3,6], [1,7], [2,7] ]
  }

  const city: Graph = {
    title: "Ville folle",
    vertices: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 4, y: 3 },
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ].map(({ x, y }) => ({ x: x * 0.75 + 1, y: y * 0.72 + 0.6 })),
    edges: [ [1,2], [0,3], [0,4], [1,4], [2,5], [4,5], [3,7], [4,8], [7,8], [5,8], [5,9],
            [6,9], [6,10], [8,11], [9,12], [11,12], [10,13], [14,15], [15,16], [16,17],
            [9,16], [12,16], [13,16], [14,18], [15,19], [16,20], [17,21], [18,19], [20,21]]
  }

  const owl: Graph = {
    title: "Hibou",
    vertices: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 4, y: 3 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 1, y: 5 },
      { x: 3, y: 5 },
    ].map(({ x, y }) => ({ x: x * 0.8 + 0.5, y: y * 0.8 + 0.6 })),
    edges: [ [0,2], [0,3], [1,3], [1,4], [2,3], [3,4], [4,5], [2,6], [2,7], [3,7], [3,8],
          [4,8], [4,9], [5,9], [6,7], [7,8], [7,10], [7,11], [8,11], [9,11], [9,12], [10,14],
          [11,15], [12,15], [9,15], [13,14], [14,15], [15,16], [13,17], [14,17], [15,18],
          [16,18] ]
  }

  const rabbit: Graph = {
    title: "Lièvre bondissant",
    vertices: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 1, y: 5 },
    ].map(({ x, y }) => ({ x: x * 0.8 + 1, y: y * 0.8 + 0.8 })),
    edges: [ [0,1], [0,3], [1,4], [2,4], [2,5], [3,4], [4,5], [3, 6], [3,7], [4,7], [4,8],
          [5,8], [5,9], [7,8], [8,9], [6,10], [6,11], [7,11], [9,12], [12,13], [6,15],
          [10,15], [11,15], [14,15], [15,16], [12,16], [12,17], [13,17], [14,18], [15, 18]]
  }

  const cross: Graph = {
    title: "Croix",
    vertices: [
      { x: 0, y: 1 },
      { x: 0, y: 2.0 },
      { x: 0.5, y: 1.5 },
      // 0 -- 2
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      // 3 -- 6
      { x: 1.5, y: 0.5 },
      { x: 1.5, y: 1.5 },
      { x: 1.5, y: 2.5 },
      // 7 -- 9
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      // 10 -- 13
      { x: 2.5, y: 1.5 },
      { x: 3.0, y: 1.0 },
      { x: 3.0, y: 2.0 }, // 14 -- 16
    ].map(({ x, y }) => ({ x: x * 1.3 + 0.5, y: y * 1.3 + 0.5 })),
    edges: [
        [0,1], [0,2], [1,2], [0,4], [1,5], [2,4], [2,5], [3,4], [4,5], [5,6], [3,7], [4,7],
        [4,8], [5,8], [5,9], [6,9], [3,10], [4,11], [5,12], [6,13], [7,10], [7,11], [8,11],
        [8,12], [9,12], [9,13], [10,11], [11,12], [12,13], [11,14], [12,14], [11,15], [12,16],
        [14,15], [14,16], [15,16]
    ]
  }

  const graphs = [ house, house2, hourglass, interlace, grid, konisberg, ex1, ex3, city, owl, rabbit, cross];
  
  type Move = number | "raise";
  type Position = Move[];

  let model: Model<Position> & ScoreModel<Position> = $state({
    ...initModel([]),
    scores: {}
  });
  let graphIndex: number | "custom" = $state(0);
  let customGraph: Graph = $state({ title: "Graphe personnalisé", vertices: [], edges: []});
  // pour l'animation quand le niveau est fini
  let counter = $state(0);

  let graph: Graph = $derived.by(() => {
    if (graphIndex === "custom") {
      return customGraph;
    } else {
      const g = graphs[graphIndex];
      return {
        ...g,
        vertices: g.vertices.map(({x, y}) => ({x: x/5, y: y/5}))
      }
    }
  });

  function edgesOf(position: Position): Edge[] {
    const res: Edge[] = [];
    let n = position.length - 1;
    for (let i = 0; i < n; i++) {
      let u = position[i];
      let v = position[i+1];
      if (u !== "raise" && v !== "raise") {
        if (u > v) {
          [v, u] = [u, v];
        }
        res.push([u, v]);
      }
    }
    return res;
  }

  let positionEdges: Edge[] = $derived(edgesOf(model.position))

  let raiseCount = $derived(model.position.filter(x => x === "raise").length);

  function containsEdge(edges: Edge[], u: number, v: number) {
    if (u > v) {
      [v, u] = [u, v];
    }
    return edges.findIndex(e => e[0] === u && e[1] === v) !== -1;
  }

  function play(x: Move): Position | null {
    const last = model.position.at(-1);
    if (x === "raise") {
      return typeof last === "number" ? [...model.position, x] : null;
    } if (typeof last === "number" && (containsEdge(positionEdges, x, last) || !containsEdge(graph.edges, x, last))) {
      return null;
    } else {
      return [...model.position, x];
    }
  }

  const initialPosition = () => [] as Position;
  const isLevelFinished = () => positionEdges.length === graph.edges.length;

  const objective = "minimize";
  const score = () => raiseCount;
  const scoreHash = () => graphIndex === "custom" ? null : "" + graphIndex;

  const methods: Methods<Position, Move> & ScoreMethods = {
    play, isLevelFinished, initialPosition,
    objective, score, scoreHash
  };
  methods.updateScore = () => updateScore(model, methods, true, "onNewRecord");

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
  onMount(() => {
    loadRecords(model);
  });


  let levelFinished = $derived.by(isLevelFinished);
  let winTitle = $derived(`Tu as réussi en ${raiseCount} levé${raiseCount > 1 ? "s" : ""}`);

  const colors = [ "red", "green", "magenta", "orange", "gray", "cyan", "black", "blue" ];

  type PathDescription = {path: string, length: number, start: number};

  let pathDescriptions: PathDescription[] = $derived.by(() => {
    let paths = [];
    let path = "";
    let length = 0;
    let start = 0;
    let pred: [x: number, y: number] | null = null;
    for (const move of model.position) {
      if (move === "raise") {
        length += 0.5;
        paths.push({path, length, start});
        path = "";
        start += length;
        length = 0;
        pred = null;
      } else {
        const {x, y} = graph.vertices[move];
        path += `${path === "" ? 'M' : 'L'} ${100*x} ${100*y}`;
        if (pred) {
          let [x2, y2] = pred;
          length += Math.sqrt((x2 - x) ** 2 + (y2 - y) ** 2);
        }
        pred = [x, y];
      }
    }
    if (path !== "") {
      length += 2;
      paths.push({path, length, start});
    }
    return paths;
  })

  const selectCustomGraph = () => model.dialog = "customize";
  
  function acceptCustomGraph(graph: Graph) {
    if (graph.vertices.length > 0) {
      customGraph = graph;
      graphIndex = "custom";
    }
    model.dialog = null;
  }
</script>

{#snippet currentLine(x2: number, y2: number)}
  {#if !levelFinished && typeof model.position.at(-1) === "number"}
    {@const {x, y} =  graph.vertices[model.position.at(-1) as number] }
    <line
      x1={x*100}
      y1={y*100}
      x2={x2*100}
      y2={y2*100}
      class="line-to-pointer"
      stroke={colors[raiseCount] ?? "red"}
    />
  {/if}
{/snippet}

{#snippet board()}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="ui-board board" oncontextmenu={e => { e.preventDefault(); playA(model, methods, "raise")}}>
    <PointerTracker viewBox="0 0 100 100" pointer={currentLine}>
      {#each graph.edges as [u, v]}
        {@const {x1, x2, y1, y2} = getCoordsOfEdge(graph, u, v)}
        <line
          x1={x1*100}
          x2={x2*100}
          y1={y1*100}
          y2={y2*100}
          class="line1"
        />
      {/each}
      {#each pathDescriptions as {path, length, start}, i (`${i},${counter}`)}
        <path
          d={path}
          class={["line2", {animate: levelFinished}]}
          stroke-dasharray={!levelFinished ? "0" : 100 * length}
          stroke-dashoffset={!levelFinished ? "0" : 100 * length}
          style:animation-duration="{length}s"
          style:animation-delay="{start}s"
          stroke={colors[i] ?? "red"}
          onanimationend={i < pathDescriptions.length - 1 ? null : () => counter += 1}
        />
      {/each}
      {#if !levelFinished}
        {#each graph.vertices as {x, y}, i}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <circle
            cx={x*100} cy={y*100}
            r="3"
            stroke={i === model.position.at(-1) ? "red" : "blue"}
            fill="blue"
            onclick={() => playA(model, methods, i)}
          />
        {/each}
      {/if}
    </PointerTracker>
    <span class="title">{graph.title}</span>
    <span class="raise-info">{raiseCount} levé{raiseCount > 0 ? "s" : ""} de crayon</span>
    <button
      class="ui-button ui-button-primary raise"
      disabled={levelFinished || typeof model.position.at(-1) !== "number"}
      onclick={() => playA(model, methods, "raise")}
    > Lever le crayon
    </button>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Dessin">
    <I.SelectGroup
      title="Niveau"
      values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
      selected={graphIndex}
      text={i => "" + (i as number + 1)}
      tooltip={i => graphs[i as number].title}
      setter={i => newGame(model, methods, () => graphIndex = i)}
    >
      <I.Icon
        text="#customize"
        tooltip="Créé ton propre graphe"
        selected={graphIndex === "custom"}
        onclick={selectCustomGraph}
      />
    </I.SelectGroup>
    <I.Group title="Options">
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
    <I.BestScore bind:model={model} {methods} />
  </Config>
{/snippet}

{#snippet bestScore(position: Position)}
  <div class="bestscore">
    <svg viewBox="0 0 100 100">
      {#each edgesOf(position) as [u, v], i}
        {@const {x1, x2, y1, y2} = getCoordsOfEdge(graph, u, v)}
        <line
          x1={x1*100}
          x2={x2*100}
          y1={y1*100}
          y2={y2*100}
          class="line2"
          stroke="red"
        />
        <text x={50*(x1+x2)} y={50*(y1+y2)} class="edge-no">{i+1}</text>
      {/each}
    </svg>
  </div>
{/snippet}

{#snippet custom()}
  <GraphEditor onOk={acceptCustomGraph} />
{/snippet}

{#snippet rules()}
  Le but du jeu est de dessiner le motif indiqué en pointillé en levant le moins souvent possible le crayon.<br/>
  Pour lever le crayon, tu peux cliquer sur le bouton prévu pour ou utiliser le clic droit.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {bestScore} {custom} {winTitle} />

<style>
  .board {
    width: 75vmin;
    height: 75vmin;
  }

  .bestscore {
    width: 66vmin;
    height: 66vmin;
  }

  .line1 {
    stroke: grey;
    stroke-dasharray: 3,1;
  }

  .line2 {
    stroke-width: 1.5;
    fill: transparent;
    stroke-linejoin: round;
    &.animate {
      animation: drawline 6s linear forwards;
    }
  }

  .line-to-pointer {
    stroke-width: 1.5;
    pointer-events: none;
    opacity: 0.6;
  }

  .raise {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    font-size: 1.7rem;
    padding: 0;
  }

  .title {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1.5rem;
    color: green;
    font-weight: bold;
  }

  .raise-info {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    color: blue;
    font-weight: bold;
  }

  .edge-no {
    fill: blue;
    font-weight: bold;
    font-size: 6px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  @keyframes drawline {
    to {
      stroke-dashoffset: 0;
    }
  }
</style>