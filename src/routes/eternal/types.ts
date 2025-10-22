import type { Edge } from "$lib/graph.svelte";
import { generate } from "$lib/util";

export type AdjGraph = number[][];

export const hasEdge = (graph: AdjGraph, v: number, w: number) => graph[v].includes(w);

export function addEdge(graph: AdjGraph, u: number, v: number) {
  graph[u].push(v);
  graph[v].push(u);
}

export function edgesToGraph(n: number, edges: readonly Edge[]): AdjGraph {
  const g = generate(n, () => []);
  for (const [u, v] of edges) {
    addEdge(g, u, v);
  }
  return g;
}