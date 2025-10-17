import type { Edge, Graph } from "$lib/graph";
import { Model, Objective, WithScore } from "$lib/model.svelte";
import graphs from "./graphs";

type Move = number | "raise";
export type Position = Move[];

export default class extends WithScore(Model<Position, Move>) {
  graphIndex: number | "custom" = $state(0);
  customGraph: Graph = $state({ title: "Graphe personnalisé", vertices: [], edges: []});
  // pour l'animation quand le niveau est fini
  counter = $state(0);
  
  constructor() {
    super([]);
    this.newGame();
  }

  graph: Graph = $derived.by(() => {
    if (this.graphIndex === "custom") {
      return this.customGraph;
    } else {
      const g = graphs[this.graphIndex];
      return {
        ...g,
        vertices: g.vertices.map(({x, y}) => ({x: x/5, y: y/5}))
      }
    }
  });

  play(x: Move): Position | null {
    const last = this.position.at(-1);
    if (x === "raise") {
      return typeof last === "number" ? [...this.position, x] : null;
    } if (typeof last === "number" && 
        (this.containsEdge(this.positionEdges, x, last) 
        || !this.containsEdge(this.graph.edges, x, last))) 
    {
      return null;
    } else {
      return [...this.position, x];
    }
  }

  initialPosition = () => [];
  isLevelFinished = () => this.positionEdges.length === this.graph.edges.length;

  objective = () => Objective.Minimize;
  score = () => this.raiseCount;
  scoreHash = () => this.graphIndex === "custom" ? null : "" + this.graphIndex;
  updateScore = () => this.updateScore2(true, "onNewRecord");

  edgesOf(position: Position): Edge[] {
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

  positionEdges: Edge[] = $derived(this.edgesOf(this.position))

  raiseCount: number = $derived(this.position.filter(x => x === "raise").length);

  containsEdge(edges: Edge[], u: number, v: number) {
    if (u > v) {
      [v, u] = [u, v];
    }
    return edges.findIndex(e => e[0] === u && e[1] === v) !== -1;
  }

  selectCustomGraph = () => this.dialog = "customize";
  
  acceptCustomGraph = (graph: Graph) => {
    if (graph.vertices.length > 0) {
      this.customGraph = graph;
      this.graphIndex = "custom";
    }
    this.dialog = null;
  }
}