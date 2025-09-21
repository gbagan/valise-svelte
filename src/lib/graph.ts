export type Edge = [number, number];
export type Position = { x: number, y: number };
export type Graph = { title: string, vertices: Position[], edges: Edge[] }
   
export const getCoords = (graph: Graph, u: number) => graph.vertices[u];

export function getCoordsOfEdge(graph: Graph, u: number, v: number) {
  const { x: x1, y: y1 } = graph.vertices[u];
  const { x: x2, y: y2 } = graph.vertices[v];
  return { x1, x2, y1, y2 };
}

export function addVertex(graph: Graph, position: Position) {
  graph.vertices.push(position);
}

export function removeVertex(graph: Graph, i: number) {
  graph.vertices.splice(i, 1);
  graph.edges = graph.edges
    .filter(([u, v]) => u !== i && v !== i)
    .map(([u, v]) => [u > i ? u - 1 : u, v > i ? v - 1 : v]);
}

export function removeEdge(graph: Graph, u: number, v: number) {
  if (u > v) {
    [u, v] = [v, u];
  }
  graph.edges = graph.edges.filter(e => e[0] !== u || e[1] !== v);
}

export function addEdge(graph: Graph, u: number, v: number) {
  if (u > v) {
    [u, v] = [v, u];
  }
  if (graph.edges.findIndex(e => e[0] === u && e[1] === v) === -1) {
    graph.edges.push([u, v]);
  }
}