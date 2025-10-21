export type Edge = readonly [number, number];

export type Coords = {
  readonly x: number,
  readonly y: number
};

type EdgeCoords = {
  readonly x1: number,
  readonly y1: number,
  readonly x2: number,
  readonly y2: number
};

export interface IGraph {
  readonly title: string;
  readonly vertices: readonly Coords[];
  readonly edges: readonly Edge[];
  getCoords(u: number): Coords;
  getCoordsOfEdge(u: number, v: number): EdgeCoords;
}

export class Graph implements IGraph {
  #title: string = $state("Graphe personnalisé");
  protected _vertices: Coords[] = $state([]);
  protected _edges: Edge[] = $state([]);

  constructor(title?: string, vertices?: Coords[], edges?: Edge[]) {
    if (title !== undefined) {
      this.#title = title;
    }
    if (vertices !== undefined) {
      this._vertices = vertices;
    }
    if (edges !== undefined) {
      this._edges = edges;
    }
  }

  get title() {
    return this.#title;
  }

  get vertices(): readonly Coords[] {
    return this._vertices;
  }

  get edges(): readonly Edge[] {
    return this._edges;
  }

  getCoords(u: number) {
    return this._vertices[u];
  }

  getCoordsOfEdge(u: number, v: number): EdgeCoords {
    const { x: x1, y: y1 } = this._vertices[u];
    const { x: x2, y: y2 } = this._vertices[v];
    return { x1, x2, y1, y2 };
  }
}

export class MutableGraph extends Graph {
  addVertex(p: Coords) {
    this._vertices.push(p);
  }

  removeVertex(i: number) {
    this._vertices.splice(i, 1);
    this._edges = this._edges
      .filter(([u, v]) => u !== i && v !== i)
      .map(([u, v]) => [u > i ? u - 1 : u, v > i ? v - 1 : v]);
  }

  addEdge(u: number, v: number) {
    if (u > v) {
      [u, v] = [v, u];
    }
    if (this._edges.findIndex(e => e[0] === u && e[1] === v) === -1) {
      this._edges.push([u, v]);
    }
  }

  removeEdge(u: number, v: number) {
    if (u > v) {
      [u, v] = [v, u];
    }
    this._edges = this._edges.filter(e => e[0] !== u || e[1] !== v);
  }

  moveVertex(i: number, p: Coords) {
    this._vertices[i] = p;
  }

  clear() {
    this._vertices = [];
    this._edges = [];
  }
}

export class GraphView implements IGraph {
  #graph: IGraph;

  constructor(graph: IGraph) {
    this.#graph = graph;
  }

  get title() {
    return this.#graph.title;
  }

  get vertices(): readonly Coords[] {
    return this.#graph.vertices;
  }

  get edges(): readonly Edge[] {
    return this.#graph.edges;
  }

  getCoords(u: number) {
    return this.#graph.getCoords(u);
  }

  getCoordsOfEdge(u: number, v: number): EdgeCoords {
    return this.#graph.getCoordsOfEdge(u, v);
  }
}

