<script lang="ts">
  import { generate, range, repeat } from '../lib/util';
  import {type Model, type Methods, type SizeLimit, type SizeModel,
          initModel, playA, turnMessage, newGame, winTitleFor2Player } from '../lib/model';
  import Template from '../components/Template.svelte';
  import * as I from '../components/Icons';
  import Config from '../components/Config.svelte';

  type Pos = number;
  type Move = number;
  
  let model: Model<Pos> & SizeModel = $state({
    ...initModel(20),
    mode: 'expert',
    rows: 20,
    columns: 0,
    customSize: true,
  });

  let moves: number[] = $state([1, 2, 3]);
  let marked: boolean[] = $state([]);
  
  const canPlay = (v: number) => {
    const position = model.position;
    const maximum = Math.max(...moves);
    return moves.includes(position-v) || position > 0 && v == 0 && position <= maximum
  }

  let losingPositions: boolean[] = $derived.by(() => {
    const rows = model.rows;
    const losing = new Array(rows+1);
    losing[0] = true;
    for (let i = 1; i <= rows; i++) {
      losing[i] = moves.every(m => i - m >= 0 && !losing[i-m]);
    }
    return losing;
  });

  const play = (v: number) => canPlay(v) ? v : null;
  const initialPosition = () => model.rows;
  const isLevelFinished = () => model.position === 0;
  const possibleMoves = () => range(0, model.rows+1).filter(canPlay);
  const isLosingPosition = () => losingPositions[model.position];
  const onNewGame = () => marked = repeat(model.rows, false);

  const methods: Methods<Pos, Move> = { play, isLevelFinished, initialPosition, onNewGame, possibleMoves, isLosingPosition };   

  let reachable = $derived(generate(model.rows+1, canPlay));

  const sizeLimit: SizeLimit = {
    minRows: 5,
    maxRows: 30,
    minCols: 0,
    maxCols: 0,
  }

  function movesSetter(move: number) {
    const next = [1, 2, 3, 4, 5].filter(m => (m === move) != moves.includes(m));
    if (next.length > 0) {
      newGame(model, methods, () => moves = next);
    }
  }

  type Cartesian = { x: number, y: number };
  type Polar = { radius: number, theta: number };

  const rotate = (theta: number) => `rotate(${theta * 180 / Math.PI}deg)`;
  
  function lineIntersection(m1: number, b1: number, m2: number, b2: number): Cartesian {
    const x = (b2 - b1) / (m1 - m2);
    return { x, y: m1 * x + b1 }
  }

  function polarToCartesian(p: Polar): Cartesian {
    return { x: p.radius * Math.cos(p.theta), y: p.radius * Math.sin(p.theta) }
  }

  function spiral(center: Cartesian, startRadius: number, radiusStep: number,
                startTheta: number, endTheta: number, thetaStep: number): string
  {
    const ps = [];
    for(let theta = startTheta; theta <= endTheta; theta += thetaStep) {
      const b = radiusStep / (2 * Math.PI);
      const r = startRadius + b * theta;
      const point = { x: center.x + r * Math.cos(theta), y: center.y + r * Math.sin(theta) };
      const slope = (b * Math.sin(theta) + r * Math.cos(theta)) / (b * Math.cos(theta) - r * Math.sin(theta));
      const intercept = -(slope * r * Math.cos(theta) - r * Math.sin(theta));
      ps.push({ point, slope, intercept });
    }
    let path = `M${ps[0].point.x} ${ps[0].point.y}`;
    for (let i = 0; i < ps.length - 1; i++) {
      const a = ps[i];
      const b = ps[i+1];
      const { x, y } = lineIntersection(a.slope, a.intercept, b.slope, b.intercept);
      path += `Q${x + center.x} ${y + center.y} ${b.point.x} ${b.point.y}`;
    }
    return path;
  }

  const spiralDescription = spiral({ x: 0, y: 0 }, 0, 61, 0, 37 / 6 * Math.PI, Math.PI / 6.0);

  let polarPoints = $derived.by(() => {
    const n = model.rows;
    return range(0, n+1).map(i => {
      const theta = Math.sqrt(i == n ? 21 : i * 20 / n) * 1.36 * Math.PI;
      const radius = 61 * theta / (2 * Math.PI);
      return {theta, radius};
    }).toReversed();
  });

  let cartesianPoints = $derived(polarPoints.map(polarToCartesian));
  let frogPoint = $derived(polarPoints[model.position]);

  let message = $derived(turnMessage(model, methods));
  let winTitle = $derived(winTitleFor2Player(model));

  const onLilyClick = (e: MouseEvent, i: number) => {
    if (e.shiftKey) {
      marked[i] = !marked[i];
    } else {
      playA(model, methods, i)
    }
  }

  // svelte-ignore state_referenced_locally
    newGame(model, methods);
</script>



{#snippet spiralPath()}
  <g>
    <path d={spiralDescription} fill="none" stroke="black" stroke-width="3"/>
    <line x1="153" y1="9" x2="207" y2="20" stroke="black" stroke-dasharray="5" stroke-width="6"/>
    <line x1="153" y1="7" x2="153" y2="39" stroke="black" stroke-width="3.0" />
    <line x1="207" y1="18" x2="207" y2="50" stroke="black" stroke-width="3.0" />
  </g>
{/snippet}


{#snippet lily(i: number, x: number, y: number, reachable: boolean, hidden: boolean)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <use
    href="#lily"
    class={["lily", {reachable, hidden}]}
    x={i === 0 ? x - 30 : x - 24}
    y={i === 0 ? y - 45 : y - 24}
    width={i === 0 ? 80 : 48}
    height={i === 0 ? 80 : 48}
    onclick={e => onLilyClick(e, i)}
    oncontextmenu={e => {
      e.preventDefault();
      marked[i] = !marked[i];
    }}
  />
{/snippet}

{#snippet frog()}
  {@const {theta, radius} = frogPoint}
  <g
    class="frog-container"
    style:transform="{rotate(theta)} translate({radius}px, 0px) {rotate(-theta)}"
  >
    <use
      href="#frog2"
      x="-20"
      y="-30"
      width="40"
      height="40"
      class={["frog", {goal: model.position === 0}]}
    />
  </g>
{/snippet}

{#snippet board()}
  <div class="ui-board board"
    style:width="80vmin" style:height="80vmin">
    <svg viewBox="-190 -200 400 400">
      {@render spiralPath()}
      {#each cartesianPoints as p, i}
        {@render lily(i, p.x, p.y, false, false)}
        {@render lily(i, p.x, p.y, true, !reachable[i] || model.locked)}
        {#if model.help}
          <text x={p.x} y={p.y} class="index">{model.rows - i}</text>
        {/if}
        {#if marked[i] && i !== model.position}
          <use href="#frog2" x={p.x-20} y={p.y-20} width="20" height="20" class="frog marked" />
        {/if}
      {/each}
      {@render frog()}
    </svg>
    <span class="turn-message">{message}</span>
  </div>
{/snippet}

{#snippet config()}
  <Config title="La grenouille">
    <I.MultiSelectGroup
      title="Déplacements autorisés"
      values={[1, 2, 3, 4, 5]}
      selected={moves}
      setter={movesSetter}
    />
    <I.Group title="Options">
      <I.Help bind:model={model} />
      <I.Undo bind:model={model} {methods} />
      <I.Redo bind:model={model} {methods} />
      <I.Reset bind:model={model} {methods} />
      <I.Rules bind:model={model} />
    </I.Group>
  </Config>
{/snippet}

{#snippet rules()}
  Le jeu de la grenouille est un jeu à deux joueurs.<br/>
  A chaque tour, un joueur peut avancer la grenouille d'un nombre de cases parmi ceux
  indiqués dans "Déplacements autorisés".<br/>
  Le premier joueur à atteindre le nénuphar final a gagné.<br/>
  Pour éviter une situation bloquante, un joueur peut se déplacer vers le nénuphar
  final en utilisant moins de déplacements que ce qui lui est autorisé.<br/>
  Tu peux placer des indices sur les nénuphars avec un clic droit ou shift + clic gauche.
{/snippet}

<Template bind:model={model} {methods} {board} {config} {rules} {winTitle} {sizeLimit} />

<style>
.board {
    width: 100%;
    height: 100%;
}

.lily {
    fill: url(#lilyg);

    &.reachable {
        transition: opacity 0.3s linear 0.5s;
        fill: url(#lilyh);
    }

    &.reachable.hidden {
        transition: opacity 0.3s linear;
        opacity: 0;
    }
}

.index {
    fill: blue;
    font-size: 20;
    text-anchor: middle;
    pointer-events: none;
}

.frog-container {
    transition: transform linear 0.6s;
}

.frog {
    fill: #bcd35f;
    pointer-events: none;
    &.marked {
        opacity: 0.6;
        fill: #bc835f;
    }
    &.goal {
        animation: frog-jump 4s infinite;
    }
}

@keyframes frog-jump {
    0% { transform: translate(0, 0); }
    70% { transform: translate(0, 0); }
    75% { transform: translate(0, -30px); }
    80% { transform: translate(0, 0); }
    85% { transform: translate(0, -30px); }
    90% { transform: translate(0, -0); }
    95% { transform: translate(0, -30px); }
    100% { transform: translate(0, 0); }
}

.turn-message {
    position: absolute;
    bottom: 0.5em;
    left: 0.5em;
    color: blue;
    font-size: 1.3em;
}
</style>