import { answer, makeArenaGraph, type Arena, type ArenaGraph } from "$lib/arena";
import type { Edge, Graph } from "$lib/graph";
import { Model } from "$lib/model.svelte";
import { Mode, WithTwoPlayers } from "$lib/twoplayers.svelte";
import { WithSize } from "$lib/size.svelte";
import { allDistinct, countBy, generate, generate2, minBy, randomPick, range, sublists } from "$lib/util";

type Conf = number[];
type AdjGraph = number[][];
export enum Rules { One, Many }

const hasEdge = (graph: AdjGraph, v: number, w: number) => graph[v].includes(w)

function * multiMoves(graph: AdjGraph, conf: Conf, i=0): Generator<Conf> {
  if (i === conf.length) {
    yield conf
  } else {
    for (const conf2 of multiMoves(graph, conf, i + 1)) {
      yield conf2;
      for (const nbor of graph[conf2[i]]) {
        //const conf3 = conf2.slice();
        //conf3[i] = nbor;
        yield conf2.with(i, nbor);
      }
    }
  } 
}

const attackerMoves = (graph: AdjGraph, guards: Conf): Conf[] =>
  range(0, graph.length)
    .filter(attack => !guards.includes(attack))
    .map(attack => ([...guards, attack]));

function * oneGuardMoves (graph: AdjGraph, conf: Conf): Generator<Conf> {
  const attack = conf[conf.length - 1];
  const guards = conf.slice(0, -1);
    
  for (let i = 0; i < guards.length; i++) {
    if (hasEdge(graph, guards[i], attack)) {
      const guards2 = guards.with(i, attack);
      // todo nécessaire ?
      guards2.sort((a, b) => a - b)
      yield guards2;
    }
  }
}

function * allGuardsMoves (graph: AdjGraph, conf: Conf): Generator<Conf> {
  const gconf = conf.slice()
  const attack = gconf.pop()!;
  for (const conf2 of multiMoves(graph, gconf, 0)) {
    const conf3 = conf2.slice()
    conf3.sort((a, b) => a - b) // todo nécessaire ?
    if (allDistinct(conf3) && conf3.includes(attack)) {
      yield conf3
    }
  }
}

const oneRules = {
  attackerMoves,
  guardsMoves: oneGuardMoves
}
    
const allRules = {
  attackerMoves,
  guardsMoves: allGuardsMoves
};

const makeRules = (name: Rules) => name === Rules.One ? oneRules : allRules;

type EdsArena = ArenaGraph<Conf>;

const guardsAnswer = (arena: EdsArena, guards: Conf, attack: number) =>
  answer(arena, guards.concat(attack));
  
function attackerAnswer(arena: EdsArena, conf: Conf): number | null {
  const econf = arena.encode(conf);
  if(!arena.attractor[econf]) {
    return null;
  }
  const attacks = arena.adj[econf];
  const minattack = minBy(attacks, attack => arena.attractor[arena.encode(attack)] || 1000)!;
  return minattack.at(-1)!;
}

function makeEDS(graph: AdjGraph, rulesName: Rules, k: number) {
  const n = graph.length;
  const rules = makeRules(rulesName);
  const aconfs = sublists(graph.length, k);
  const bconfs = [];
  for (const conf of aconfs) {
    for (let i = 0; i < n; i++) {
      if (!conf.includes(i)) {
        bconfs.push(conf.concat(i))
      }
    }
  }

  const arena: Arena<Conf> = {
    size: (n+1) << k,
    AConfs: aconfs,
    BConfs: bconfs,
    isAConf: (conf => conf.length === k),
    neighbors: (conf => conf.length === k
      ? rules.attackerMoves(graph, conf)
      : Array.from(rules.guardsMoves(graph, conf))
    ),
    
    // encode a configuration into an integer between 0 and size - 1
    encode: array => {
      let acc = 0
      const last = array[k]
      for (let i = 0; i < k; i++) {
        acc += (1 << array[i])
      }
      if (last !== undefined) {
        acc += (last + 1) << n;
      }
      return acc
    }
  }
  return makeArenaGraph(arena)
}

export enum GraphKind { Path, Cycle, Grid, Biclique, Custom }
export enum Phase { Preparation, Game }
type Position = { guards: number[], attacked: number | null };
type Move = number | number[]   // attack | defense;

const path = (n: number) => ({
  title: "Chemin",
  vertices: generate(n, i => ({
      x: 0.5 + 0.35 * Math.cos(2 * i * Math.PI / n),
      y: 0.5 + 0.35 * Math.sin(2 * i * Math.PI / n)
    })),
    edges: generate(n - 1, i => [i, i+1])
  }) as Graph;


function cycle(n: number): Graph {
  const g = path(n);
  g.title = "Cycle";
  g.edges.push([0, n-1]);
  return g;
}

// generate a grid graph
function grid(n: number, m: number): Graph {
  const p = Math.max(n, m);
  return {
    title: "Grille",
    vertices: generate2(n, m, (i, j) => ({
      x: 0.15 + 0.7 * i / (p - 1),
      y: 0.1 + 0.7 * j / (p - 1)
    })),
    edges: [
      ...generate2(n, m - 1, (i, j) => [i * m + j, i * m + j + 1] as Edge),
      ...generate2(n - 1, m, (i, j) => [i * m + j, i * m + j + m] as Edge)
    ]
  }
}

// generate a biclique graph
const biclique = (m: number, n: number) => ({
  title: "Biclique",
  vertices: generate(n + m, i => ({
    x: i < n ? 0.2 : 0.8,
    y: 0.75 - 0.7 * (i < n ? i : i - n) / (i < n ? n : m)
  })),
  edges: generate2(n, m, (i, j) => [i, j + n]),
}) as Graph;

function addEdge(graph: AdjGraph, u: number, v: number) {
  graph[u].push(v);
  graph[v].push(u);
}

function edgesToGraph(n: number, edges: Edge[]): AdjGraph {
  const g = generate(n, () => []);
  for (const [u, v] of edges) {
    addEdge(g, u, v);
  }
  return g;
}

function permutations<A>(arr: A[]): A[][] {
  if (arr.length === 0) return [[]];
  
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.toSpliced(i, 1);
    const remainingPerms = permutations(remaining);
    for (const perm of remainingPerms) {
      result.push([current].concat(perm));
    }
  }
  return result;
}

// une bonne permutation d'un tableau [v1, ..., vn] pour un ensemble de gardes [g1, ..., gn]
// est une permutation [u1, ..., vn]
// telle que pour tout i, ui = gi ou {ui, gi} est une arete du graphe
// et qui minimize le nombre de déplacements de gardes (i.e. le nombre de ui ≠ gi
function goodPermutation(graph: AdjGraph, guards: Conf, answer: Conf): number[] | null {
  const perms = permutations(answer).filter(guards2 => guards2.every((u, i) =>
    u === guards[i] || hasEdge(graph, u, guards[i])
  ));
  return minBy(perms, guards2 => countBy(guards2, (v, i) => v !== guards[i]));
}

// states

export default class extends WithTwoPlayers(WithSize(Model<Position, Move>)) {
  phase = $state(Phase.Preparation);
  graphKind = $state(GraphKind.Path);
  rulesName = $state(Rules.One);
  draggedGuard: number | null = $state(null);
  pointerPosition: {x: number, y: number} | null = $state(null);
  customGraph: Graph = $state({ title: "Graphe personnalisé", vertices: [], edges: []});

  constructor() {
    super({ guards: [], attacked: null });
    this.resize(6, 0, true);
  }

  get didMachineStart() {
    // hack pour empécher l'IA de commencer tant qu'on est en phase de préparation
    return super.didMachineStart || this.phase === Phase.Preparation;
  }

  nextMove = $derived(this.position.guards);

  graph = $derived.by(() => {
    switch (this.graphKind) {
      case GraphKind.Path: return path(this.rows);
      case GraphKind.Cycle: return cycle(this.rows);
      case GraphKind.Biclique: return biclique(this.rows, this.columns);
      case GraphKind.Grid: return grid(this.rows, this.columns);
      default: return this.customGraph;
    }
  })

  guardCount = $derived(this.position.guards.length);
  adjGraph = $derived(edgesToGraph(this.graph.vertices.length, this.graph.edges));

  arena = $derived(
    this.mode === Mode.Duel ? null : makeEDS(this.adjGraph, this.rulesName, this.guardCount)
  );

  validate = () => {
    if (this.phase === Phase.Preparation) {
      this.phase = Phase.Game;
      //this.computerStarts = false;
    } else {
      this.playA(this.nextMove);
    }
  }

  addToNextMove(from: number, to: number, srcs: number[], dests: number[]): number[] {
    if (from === to || hasEdge(this.adjGraph, from, to)) {
      const idx = srcs.indexOf(from);
      return idx !== -1 ? dests.with(idx, to) : dests;
    } else {
      return dests;
    }
  }

  isValidNextMove(dests: number[]) {
    if (this.position.attacked === null) {
      return false;
    }
    const srcs = this.position.guards;
    return dests.includes(this.position.attacked)
      && srcs.every((src, i) => src === dests[i] || hasEdge(this.adjGraph, src, dests[i]))
      && allDistinct(dests)
  }


  play(move: Move): Position | null {
    if (typeof move === "number") { // attack
      if (this.position.guards.includes(move) || this.position.attacked !== null) {
        return null;
      } else {
        return {...this.position, attacked: move };
      }
    } else if (this.position.attacked === null || !this.isValidNextMove(move)) { // defense
      return null;
    } else {
      return { guards: move, attacked: null }
    }
  }

  // todo: à verifier
  initialPosition = () => ({ guards: [], attacked: null });

  onNewGame() {
    this.nextMove = [];
    this.phase = Phase.Preparation;
    // draggedGuard;
  }

  isLevelFinished = () => {
    const attacked = this.position.attacked
    return attacked !== null && this.position.guards.every(guard => !hasEdge(this.adjGraph, guard, attacked));
  }

  #sizeLimit = $derived.by(() => {
    switch (this.graphKind) {
      case GraphKind.Grid: return {minRows: 2, minCols: 2, maxRows: 5, maxCols: 5};
      //case "sun": return {minRows: 3, minC  ols: 0, maxRows: 6, maxCols: 0};
      case GraphKind.Biclique: return {minRows: 1, minCols: 1, maxRows: 6, maxCols: 0};
      case GraphKind.Custom: return {minRows: 0, minCols: 0, maxRows: 0, maxCols: 0};
      default: return {minRows: 3, minCols: 0, maxRows: 11, maxCols: 0};
    }
  });

  get sizeLimit() {
    return this.#sizeLimit;
  }

  levelFinished = $derived(this.isLevelFinished());

  #randomMove() : Move | null {
    if (this.levelFinished) {
      return null;
    }
    const {guards, attacked} = this.position;
    if (attacked !== null) {
      // cannot be empty
      const candidates = guards.filter(g => hasEdge(this.adjGraph, g, attacked));
      return this.addToNextMove(randomPick(candidates)!, attacked, guards, guards)
    } else {
      const candidates = range(0, this.graph.vertices.length).filter(x => !guards.includes(x));
      return randomPick(candidates);
    }
  }
  
  machineMove(): Move | null {
    if (this.levelFinished) {
      return null;
    } else if (!this.arena || this.mode === Mode.Random) {
      return this.#randomMove();
    }
    const {guards, attacked} = this.position;
    if (attacked !== null) {
      const ans = guardsAnswer(this.arena, guards, attacked);
      return !ans || this.rulesName === Rules.One ? ans : goodPermutation(this.adjGraph, guards, ans);
    } else {
      const ans = attackerAnswer(this.arena, guards);
      if (ans !== null) {
        return ans;
      } else {
        return this.#randomMove();
      }
    }
  }

  selectVertex(x: number) {
    const {guards, attacked} = this.position;
    if (this.phase === Phase.Preparation) {
      const idx = guards.indexOf(x);
      if (idx === -1) {
        this.position = { attacked, guards: [...guards, x] };
      } else {
        guards.splice(idx, 1);
      }
    } else if (attacked === null) {
      this.playA(x);
    } else if (this.rulesName === Rules.One) {
      this.playA(this.addToNextMove(x, attacked, guards, guards)); // todo
    }
  }

  startDrag(e: PointerEvent, i: number) {
    if (this.rulesName === Rules.Many && this.position.guards.includes(i) && this.position.attacked !== null) {
      (e.currentTarget as Element)?.releasePointerCapture(e.pointerId);
      this.draggedGuard = i;
    }
  }

  dropGuard(to: number | null) {
    if (this.draggedGuard !== null) {
      this.nextMove = this.addToNextMove(
        this.draggedGuard,
        to ?? this.draggedGuard,
        this.position.guards,
        this.nextMove
      );
      this.draggedGuard = null;
    }
  }

  setGraphKind = (kind: GraphKind) => this.newGame(() => {
    this.graphKind = kind;
    switch (kind) {
      case GraphKind.Path:
      case GraphKind.Cycle:
        this.columns = 0;
        this.rows = 6;
        break;
      case GraphKind.Grid:
        this.columns = 3;
        this.rows = 3;
        break;
      case GraphKind.Biclique:
        this.columns = 2;
        this.rows = 5;
    }
  })

  acceptCustomGraph = (graph: Graph) => {
    if (graph.vertices.length > 0) {
      this.customGraph = graph;
      this.graphKind = GraphKind.Custom;
    }
    this.closeDialog();
  }
}