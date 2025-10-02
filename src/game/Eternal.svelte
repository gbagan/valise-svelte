<script lang="ts">
  import { initModel, newGame, playA, type Methods, type Model, type SizeModel } from "../lib/model";
  import { allDistinct, countBy, generate, generate2, getPointerPosition, minBy, randomPick, range, sublists } from "../lib/util";
  import { answer, makeArenaGraph, type Arena, type ArenaGraph } from "../lib/arena";
  import { getCoordsOfEdge, type Edge, type Graph } from "../lib/graph";
  import Template from "../components/Template.svelte";
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';
    import GraphEditor from "../components/GraphEditor.svelte";

  type Conf = number[];
  type AdjGraph = number[][];
  type Rules = "one" | "many";

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

  function attackerMoves(graph: AdjGraph, guards: Conf): Conf[] {
    return range(0, graph.length)
      .filter(attack => !guards.includes(attack))
      .map(attack => ([...guards, attack]));
  }

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

  const makeRules = (name: Rules) => name === 'one' ? oneRules : allRules;

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
  const biclique = (m: number, n: number) => (console.log(n, m), {
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

  let model: Model<Position> & SizeModel = $state({
    ...initModel({ guards: [], attacked: null}),
    rows: 6,
    columns: 0,
    customSize: true,
    mode: "duel",
  });

  let nextMove: number[] = $state([]);
  let phase: Phase = $state("preparation");
  let graphKind: GraphKind = $state("path");
  let rulesName: Rules = $state("one");
  let draggedGuard: number | null = $state(null);
  let pointerPosition: {x: number, y: number} | null = $state(null);
  let customGraph: Graph = $state({ title: "Graphe personnalisé", vertices: [], edges: []});

  // derived

  let graph: Graph = $derived.by(() => {
    switch (graphKind) {
      case "path": return path(model.rows);
      case "cycle": return cycle(model.rows);
      case "biclique": return biclique(model.rows, model.columns);
      case "grid": return grid(model.rows, model.columns);
      default: return customGraph;
    }
  })

  let nbGuards = $derived(model.position.guards.length);
  let adjGraph: AdjGraph = $derived(edgesToGraph(graph.vertices.length, graph.edges));

  let arena: EdsArena | null = $derived(
    model.mode === "duel"  ? null : makeEDS(adjGraph, rulesName, nbGuards)
  );

  let sizeLimit = $derived.by(() => {
    switch (graphKind) {
      case "grid": return {minRows: 2, minCols: 2, maxRows: 5, maxCols: 5};
      //case "sun": return {minRows: 3, minC  ols: 0, maxRows: 6, maxCols: 0};
      case "biclique": return {minRows: 1, minCols: 1, maxRows: 6, maxCols: 0};
      case "custom": return {minRows: 0, minCols: 0, maxRows: 0, maxCols: 0};
      default: return {minRows: 3, minCols: 0, maxRows: 11, maxCols: 0};
    }
  });

  let levelFinished = $derived.by(() => {
    const attacked = model.position.attacked 
    return attacked !== null && model.position.guards.every(guard => !hasEdge(adjGraph, guard, attacked));
  });

  function validate() {
    if (phase === "preparation") {
      phase = "game";
      model.computerStarts = false;
    } else {
      playA(model, methods, nextMove);
    }
  }

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
    nextMove = [];
    phase = "preparation";
    // draggedGuard;
    // hack pour empécher l'IA de commencer tant qu'on ait en phase de préparation
    model.computerStarts = true;
  }

  const isLevelFinished = () => levelFinished;


  function onPositionChange() {
    nextMove = model.position.guards.slice();
  }

  function randomMove() : Move | null {
    if (levelFinished) {
      return null;
    }
    const {guards, attacked} = model.position;
    if (attacked !== null) {
      // cannot be empty
      const candidates = guards.filter(g => hasEdge(adjGraph, g, attacked));
      const move = guards.slice();
      addToNextMove(randomPick(candidates)!, attacked, move, move);
      return move;
    } else {
      const candidates = range(0, graph.vertices.length).filter(x => !guards.includes(x));
      return randomPick(candidates);
    }
  }

  function computerMove(): Move | null {
    if (levelFinished) {
      return null;
    } else if (!arena || model.mode === "random") {
      return randomMove();
    }
    const {guards, attacked} = model.position;
    if (attacked !== null) {
      const ans = guardsAnswer(arena, guards, attacked);
      return !ans || rulesName === "one" ? ans : goodPermutation(adjGraph, guards, ans);
    } else {
      const ans = attackerAnswer(arena, guards);
      if (ans !== null) {
        return ans;
      } else {
        return randomMove();
      }
    }
  }

  const methods: Methods<Position, Move> = {
    play, initialPosition, onNewGame, isLevelFinished, computerMove, onPositionChange
  };

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

  // callbacks

  function selectVertex(x: number) {
    const {guards, attacked} = model.position;
    if (phase === "preparation") {
      const idx = guards.indexOf(x);
      if (idx === -1) {
        model.position = { attacked, guards: [...guards, x] };
      } else {
        guards.splice(idx, 1);
      }
    } else if (attacked === null) {
      playA(model, methods, x);
    } else if (rulesName === "one") {
      const move = guards.slice();
      addToNextMove(x, attacked, move, move);
      playA(model, methods, move) // todo
    }
  }

  function setPointer(e: PointerEvent) {
    if (draggedGuard === null) return;
    pointerPosition = getPointerPosition(e);
  }

  function startDrag(e: PointerEvent, i: number) {
    if (rulesName === "many" && model.position.guards.includes(i) && model.position.attacked !== null) {
      (e.currentTarget as Element)?.releasePointerCapture(e.pointerId);
      draggedGuard = i;
    }
  }

  function dropGuard(to: number | null) {
    if (draggedGuard !== null) {
      addToNextMove(draggedGuard, to ?? draggedGuard, model.position.guards, nextMove);
      draggedGuard = null;
    }
  }

  const setGraphKind = (kind: GraphKind) => newGame(model, methods, () => {
    graphKind = kind;
    switch (kind) {
      case "path":
      case "cycle":
        model.columns = 0;
        model.rows = 6;
        break;
      case "grid":
        model.columns = 3;
        model.rows = 3;
        break;
      case "biclique":
        model.columns = 2;
        model.rows = 5;
    }
  })

  const selectCustomGraph = () => model.dialog = "customize";

  function acceptCustomGraph(graph: Graph) {
    if (graph.vertices.length > 0) {
      customGraph = graph;
      graphKind = "custom";
    }
    model.dialog = null;
  }

  const winTitle = "L'attaquant gagne"

  // svelte-ignore state_referenced_locally
  newGame(model, methods);
</script>

{#snippet arrow(x1: number, y1: number, x2: number, y2: number)}
  <line {x1} {y1} {x2} {y2} class="line2" />
  <path d={arrowPath(x1, y1, x2, y2)} fill="red" />
{/snippet}

{#snippet cursor(x: number, y: number)}
  <use
    href="#roman"
    width="6"
    height="12"
    x="-3"
    y="-6"
    pointer-events="none"
    style:transform="translate({100*x}px, {100*y}px)"
  />
{/snippet}

{#snippet board()}
  <div class="ui-board board">
    <svg
      viewBox="0 0 100 100"
      onpointerdown={setPointer}
      onpointermove={setPointer}
      onpointerup={() => dropGuard(null)}
      onpointerleave={() => draggedGuard = null}
    >
      {#each graph.edges as [u, v]}
        {@const {x1, x2, y1, y2} = getCoordsOfEdge(graph, u, v)}
        <line x1={100*x1} x2={100*x2} y1={100*y1} y2={100*y2} class="line1" />
      {/each}
      {#if rulesName == "many"}
        {#each nextMove as to, i}
          {@const from = model.position.guards[i]}
          {#if from !== to}
            {@const {x1, y1, x2, y2} = getCoordsOfEdge(graph, from, to)}
            {@render arrow(100*x1, 100*y1, 100*x2, 100*y2)}
          {/if}
        {/each}
      {/if}
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
          onpointerdown={e => startDrag(e, i)}
          onpointerup={() => dropGuard(i)}
          class={{sel: phase === "preparation" 
                  || model.position.attacked !== null && model.position.guards.includes(i)
                  || model.position.attacked === null && !model.position.guards.includes(i)
                  // todo
                }}
        />
      {/each}
      {#if draggedGuard !== null && pointerPosition !== null}
        {@render cursor(pointerPosition.x, pointerPosition.y)}
      {/if}
    </svg>
    <span class="info">
      {#if levelFinished}
        Le sommet attaqué ne peut être défendu
      {:else if phase === "preparation"}
        Choisis la position initiale des gardes
      {:else if model.position.attacked !== null}
        Déplace un garde vers le sommet attaqué
      {:else}
        Choisis un sommet à attaquer
      {/if}
    </span>
    <button
      class="ui-button ui-button-primary validate"
      disabled={nbGuards === 0 || phase === "game" 
                && (rulesName === "one")}
      onclick={() => validate()}
    >Valider</button>
  </div>
{/snippet}

{#snippet config()}
  <Config title="Domination éternelle">
    <I.SelectGroup
      title="Type de graphe"
      values={["path", "cycle", "biclique", "grid"] as GraphKind[]}
      selected={graphKind}
      text={["#graph-path", "#graph-cycle", "#graph-biclique", "#graph-grid"]}
      disabled={model.locked}
      tooltip={["Chemin", "Cycle", "Biclique", "Grille"]}
      setter={i => newGame(model, methods, () => setGraphKind(i))}
    >
      <I.Icon
        text="#customize"
        tooltip="Créé ton propre graphe"
        selected={graphKind === "custom"}
        disabled={model.locked}
        onclick={selectCustomGraph}
      />
    </I.SelectGroup>
    <I.SelectGroup
      title="Règles"
      values={["one", "many"] as Rules[]}
      selected={rulesName}
      text={["1", "∞", "#graph-biclique"]}
      disabled={model.locked}
      tooltip={["Un seul garde peut se déplacer", "Plusieurs gardes peuvent se déplacer"]}
      setter={i => newGame(model, methods, () => rulesName = i)}
    />
    <I.TwoPlayers bind:model={model} {methods} />
    <I.Group title="Options">
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet custom()}
  <GraphEditor onOk={acceptCustomGraph} />
{/snippet}

{#snippet rules()}
  <strong>Domination Eternelle</strong> est un jeu à deux joueurs: un <strong>attaquant</strong>
   et un <strong>défenseur</strong>.<br/>
  Au début de la partie, le défenseur choisit des sommets sur lesquels poser des <strong>gardes</strong>.<br/>
  Ensuite, à chaque tour, l'attaquant choisit d'attaquer un sommet puis le défenseur doit <strong>déplacer</strong>
  un de ses gardes vers le sommet attaqué à la condition que celui soit <strong>adjacent</strong> au garde.<br/>
  Si le défenseur ne peut pas déplacer de garde, il perd la partie.<br/>
  La partie peut ne pas avoir de fin. Le but est de déterminer le nombre minimum
  de gardes pour défendre infiniment toute attaque.<br/>
  Dans une variante, le défenseur peut déplacer <strong>plusieurs gardes</strong> à chaque tour.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {custom} {rules} {sizeLimit} {winTitle} />

<style>
  .board {
    width: 75vmin;
    height: 75vmin;
  }
  
  .line1 {
    stroke: grey;
    stroke-dasharray: 3,1;
  }

  .line2 {
    stroke: red;
    stroke-width: 2;
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