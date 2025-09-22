<script lang="ts">
  import { initModel, playA, type Methods, type Model, type SizeModel } from "../lib/model";
  import { allDistinct, countBy, generate, minBy, range, sublists } from "../lib/util";
  import { answer, makeArenaGraph, type Arena, type ArenaGraph } from "../lib/arena";
  import { getCoordsOfEdge, type Edge, type Graph } from "../lib/graph";
  import Template from "../components/Template.svelte";

  type Conf = number[];
  type AdjGraph = number[][];
  type Rules = "one" | "many";

  const hasEdge = (graph: AdjGraph, v: number, w: number) => graph[v].includes(w)

  // étant donné un graphe et une configuration, renvoit l'ensemble des configurations
  // accessibles depuis le déplacement de plusieurs gardes
  // doit être appelé avec i = 0
  function * multiMoves(graph: AdjGraph, conf: Conf, i=0): Generator<Conf> {
    if (i === conf.length) {
      yield conf
    } else {
      for (const conf2 of multiMoves(graph, conf, i + 1)) {
        yield conf2;
        for (const nbor of graph[conf2[i]]) {
          const conf3 = conf2.slice()
          conf3[i] = nbor
          yield conf3
        }
      }
    } 
  }

  function attackerPossibilities(graph: AdjGraph, guards: Conf): Conf[] {
    return range(0, graph.length)
      .filter(attack => !guards.includes(attack))
      .map(attack => ([...guards, attack]));
  }

  function * oneGuardPossibilities (graph: AdjGraph, conf: Conf): Generator<Conf> {
    const attack = conf[conf.length - 1];
    const guards = conf.slice(0, conf.length - 1);
    
    for (let i = 0; i < guards.length; i++) {
      if (hasEdge(graph, guards[i], attack)) {
        const guards2 = guards.slice()
        guards2[i] = attack
        guards2.sort((a, b) => a - b)
        yield guards2;
      }
    }
  }

  function * allGuardsPossibilities (graph: AdjGraph, conf: Conf): Generator<Conf> {
    const gconf = conf.slice()
    const attack = gconf.pop()!;
    for (const conf2 of multiMoves(graph, gconf, 0)) {
      const conf3 = conf2.slice()
      conf3.sort((a, b) => a - b)
      if (allDistinct(conf3) && conf3.includes(attack)) {
        yield conf3
      }
    }
  }

  const oneRules = {
    attackerPossibilities,
    guardsPossibilities: oneGuardPossibilities
  }
    
  const allRules = {
    attackerPossibilities,
    guardsPossibilities: allGuardsPossibilities
  };

  const makeRules = (name: Rules) => name === 'one' ? oneRules : allRules;

  type EdsGraph = ArenaGraph<Conf>;

  const guardsAnswer = (edsgraph: EdsGraph, guards: Conf, attack: number) =>
    answer(edsgraph, guards.concat(attack));
  
  function attackerAnswer(arenaGraph: EdsGraph, conf: Conf): number | null {
    const econf = arenaGraph.encode(conf);
    if(!arenaGraph.attractor[econf]) {
      return null;
    }
    const attacks = arenaGraph.adj[econf];
    const minattack = minBy(attacks, attack => arenaGraph.attractor[arenaGraph.encode(attack)] || 1000)!;
    return minattack.at(-1)!;
  }

  function makeEDS(graph: AdjGraph, rulesName: Rules, k: number) {
    const n = graph.length;
    const rules = makeRules(rulesName);
    const bconfs = []
    for (const conf of sublists(graph.length, k)) {
      for (let i = 0; i < n; i++) {
        if (!conf.includes(i)) {
          bconfs.push(conf.concat(i))
        }
      }
    }

    const arena: Arena<Conf> = {
      size: (n+1) << k,
      AConfs: sublists(graph.length, k),
      BConfs: bconfs,
      isAConf: (conf => conf.length === k),
      neighbors: (conf => conf.length === k
            ? rules.attackerPossibilities(graph, conf)
            : Array.from(rules.guardsPossibilities(graph, conf))
        ),
        // encode a configuration into an integer between 0 and size - 1
      encode: array => {
        let acc = 0
        const last = array[k] 
        for (let i = 0; i < k; i++) {
          acc += (1 << array[i])
        }
        if (last != null) {
          acc += (last + 1) << n;
        }
        return acc
      }
    }
    return makeArenaGraph(arena)
  }


  type GraphKind = "path" | "cycle" |"grid" | "biclique" | "custom";
  type Position = { guards: number[], attacked: number | null };
  type Move = number | number[]   // attack | defense;

  type Phase = "preparation" | "game";


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
      u == guards[i] || hasEdge(graph, u, guards[i])
    ));
    return minBy(perms, guards2 => countBy(guards2, (v, i) => v !== guards[i]));
  }

  // states

  let model: Model<Position> & SizeModel = $state({
    ...initModel({ guards: [], attacked: null}),
    rows: 6,
    columns: 0,
    customSize: true,
  });

  let nextMove: number[] = $state([]);
  let phase: Phase = $state("preparation");
  let graphKind: GraphKind = $state("path");
  let rulesName: Rules = $state("one");

  // derived

  let graph: Graph = $derived.by(() => {
    switch (graphKind) {
      case "path": return path(model.rows);
      case "cycle": return cycle(model.rows);
      default: return path(model.rows);
    }
  })

  let nbGuards = $derived(model.position.guards.length);
  let adjGraph: AdjGraph = $derived(edgesToGraph(graph.vertices.length, graph.edges));

  let arena: EdsGraph | null = $derived(
    model.mode === "duel"  ? null : makeEDS(adjGraph, rulesName, nbGuards)
  );

  function startGame() {
    phase = "game";
  }

  //addToNextMove ∷ Array Edge → Int → Int → Array Int → Array Int → Array Int
  function addToNextMove(from: number, to: number, srcs: number[], dests: number[]) {
    if (from === to || hasEdge(adjGraph, from, to)) {
      const idx = srcs.indexOf(from);
      if (idx !== -1) {
        dests[idx] = to;
      }
    }
  }

  function isValidNextMove(dests: number[]) {
    if (model.position.attacked === null) {
      return false;
    }
    const srcs = model.position.guards;
    return dests.includes(model.position.attacked)
      && srcs.every((src, i) => src === dests[i] || hasEdge(adjGraph, src, dests[i]))
      && allDistinct(dests)
  }


  function play(move: Move): Position | null {
    if (typeof move === "number") { // attack
      if (model.position.guards.includes(move) || model.position.attacked !== null) {
        return null;
      } else {
        return {...model.position, attacked: move };
      }
    } else if (model.position.attacked === null || !isValidNextMove(move)) { // defense
      return null;
    } else {
      return { guards: move, attacked: null }
    }
  }

  // todo: à verifier
  const initialPosition = () => ({ guards: [], attacked: null });

  function onNewGame() {
    initialGuards = [];
    nextMove = [];
    phase = "preparation";
    // draggedGuard
  }

  function isLevelFinished() {
    const attacked = model.position.attacked 
    return attacked !== null && model.position.guards.every(guard => !hasEdge(adjGraph, guard, attacked));
  }

  type Coords = {x: number, y: number};
  const translateGuard = ({ x, y }: Coords) => `translate(${100*x}%,${100*y}%)`;

  function arrowPath(x1: number, y1: number, x2: number, y2: number) {
    const arrowSize = 6;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle2 = Math.acos(dx / len);
    const angle = dy >= 0 ? 2 * Math.PI - angle2 : angle2;
    const x3 = x2 + arrowSize * Math.sin(angle - Math.PI / 3);
    const y3 = y2 + arrowSize * Math.cos(angle - Math.PI / 3);
    const x4 = x2 + arrowSize * Math.sin(angle - 2 * Math.PI / 3);
    const y4 = y2 + arrowSize * Math.cos(angle - 2 * Math.PI / 3);
    return `M${x2} ${y2}L${x3} ${y3}L${x4} ${y4}z`;
  }

  function selectVertex(x: number) {
    const {guards, attacked} = model.position;
    if (phase === "preparation") {
      const idx = guards.indexOf(x);
      if (idx === -1) {
        model.position = { attacked, guards: [...guards, x] };
      } else {
        guards.splice(idx, 1);
      }
    } else if (attacked !== null) {
      const move = guards.slice();
      addToNextMove(x, attacked, move, move);
      playA(model, methods, move) // todo
    } else {
      playA(model, methods, x);
    }
  }

  const methods: Methods<Position, Move> = {play, initialPosition, onNewGame, isLevelFinished};


</script>

{#snippet arrow(x1: number, y1: number, x2: number, y2: number)}
  <line {x1} {y1} {x2} {y2} class="line" />
  <path d={arrowPath(x1, y1, x2, y2)} fill="red" />
{/snippet}

{#snippet board()}
  <div class="ui-board board">
    <svg viewBox="0 0 100 100">
      {#each graph.edges as [u, v]}
        {@const {x1, x2, y1, y2} = getCoordsOfEdge(graph, u, v)}
        <line x1={100*x1} x2={100*x2} y1={100*y1} y2={100*y2} class="line1" />
      {/each}
      {#each graph.vertices as {x, y}}
        <circle cx={100*x} cy={100*y} r="3" fill="blue" />
      {/each}
      {#each model.position.guards as guard}
        <use
          href="#roman"
          width="6"
          height="12"
          x="-3"
          y="-6"
          class={["guard", {nomove: phase === "preparation"}]}
          style:transform={translateGuard(graph.vertices[guard])}
        />
      {/each}
      {#if model.position.attacked !== null}
        <use
          href="#eternal-attack"
          width="8"
          height="8"
          x="-4"
          y="-4"
          style:transform={translateGuard(graph.vertices[model.position.attacked])}
          pointer-events="none"
        />
      {/if}
      {#each graph.vertices as pos, i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <rect
          width="10"
          height="10"
          x="-5"
          y="-5"
          fill="transparent"
          style:transform={translateGuard(pos)}
          onclick={() => selectVertex(i)}
          class={{sel: phase === "preparation" 
                  || model.position.attacked !== null && model.position.guards.includes(i)
                  || model.position.attacked === null && !model.position.guards.includes(i)
                }}
        />
      {/each}
    </svg>
    <button
      class="ui-button ui-button-primary validate"
      disabled={nbGuards === 0 || phase === "game" 
                && (rulesName === "one")}
      onclick={() => startGame()}
    >Valider</button>
  </div>
{/snippet}

{#snippet config()}
  <div></div>
{/snippet}

{#snippet rules()}
  Domination Eternelle est un jeu à deux joueurs: un attaquant et un défenseur.<br/>
  Au début de la partie, le défenseur choisit des sommets sur lesquels poser des gardes.<br/>
  Ensuite, à chaque tour, l'attaquant choisit d'attaquer un sommet puis le défenseur doit déplacer un de ses gardes
  vers le sommet attaqué à la condition que celui soit adjacent au garde.<br/>
  Si le défenseur ne peut pas déplacer de garde, il perd la partie.<br/>
  La partie peut ne pas avoir de fin. Le but est de déterminer le nombre minimum
  de gardes pour défendre infiniment toute attaque.<br/>
  Dans une variante, le défenseur peut déplacer plusieurs gardes à chaque tour.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} />

<style>
  .board {
    width: 75vmin;
    height: 75vmin;
  }
  
  .line1 {
    stroke: grey;
    stroke-dasharray: 3,1;
  }

  .guard {
    transition: transform 0.5s linear;
    pointer-events: none;
    &.nomove {
        transition: none;
    }
  }

  .sel {
    cursor: pointer;
  }

  .validate {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    font-size: 1.7rem;
    padding: 0;
  }

  .info {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    font-size: 1.5rem;
    color: blue;
    padding: 0;
  }
</style>