 import { maxBy } from "../lib/util";

// une arène est un objet générique pour résoudre un jeu de reachability
// attributs
// - size: nombre de sommets de l'arène,
// - AConfs: tableau des configutations de type A (avant que l'attaquant ne joue)
// - BConfs: tableau des configutations de type B (après que l'attaquant ait joué)
// - isAConf: teste si ne configuration est de type A
// - neighbors: renvoie la liste des configurations accessibles
// - encode: encode une configuration vers un entier entre 0 et size-1

export interface Arena<Conf> {
  size: number;
  AConfs: Conf[];
  BConfs: Conf[];
  isAConf: (conf: Conf) => boolean;
  neighbors: (conf: Conf) => Conf[];
  encode: (conf: Conf) => number;
}

export interface ArenaGraph<Conf> extends Arena<Conf> {
  adj: Conf[][];
  reverseAdj: Conf[][];
  attractor: number[];
}

export function makeArenaGraph<Conf>(arena: Arena<Conf>): ArenaGraph<Conf> {
  const adj: Conf[][] = new Array(arena.size);
  const reverseAdj: Conf[][] = new Array(arena.size);
    
  const confs = [...arena.AConfs, ...arena.BConfs];

  for (const conf of confs) {
    const econf = arena.encode(conf);
    adj[econf] = [];
    reverseAdj[econf] = [];
  }

  for (const conf of confs) {
    for (const conf2 of arena.neighbors(conf)) {
      adj[arena.encode(conf)].push(conf2);
      //console.log("meuh", conf, conf2, arena.encode(conf2));
      reverseAdj[arena.encode(conf2)].push(conf);
    }
  }
  const attractor = computeAttractor(arena, adj, reverseAdj);
  return {adj, reverseAdj, attractor, ...arena};
}

function computeAttractor<Conf>(arena: Arena<Conf>, adj: Conf[][], reverseAdj: Conf[][]): number[] {
  const attractor: number[] = new Array(arena.size);
  const deg: number[] = new Array(arena.size);
  const stack: Conf[] = [];

  for (const conf of arena.BConfs) {
    const econf = arena.encode(conf);
    const nbor = adj[econf];
    deg[econf] = nbor.length;
    if (nbor.length === 0) { // configurations gagnantes pour l'attaquant
      stack.push(conf);
      attractor[econf] = 1;
    }
  }

  while (stack.length > 0) {
    const elem = stack.shift();
    const eelem = arena.encode(elem!);
    const elemval = attractor[eelem]
    for (const pred of reverseAdj[eelem]) {
      const epred = arena.encode(pred)
      if (!attractor[epred] && (arena.isAConf(pred) || --deg[epred] === 0)) {
        attractor[epred] = elemval+1
        stack.push(pred)
      }
    }
  }
  return attractor
}

 export function answer<Conf>(arena: ArenaGraph<Conf>, conf: Conf) {
  const defs = arena.adj[arena.encode(conf)];
  // on prilivégie les sommets qui ne sont pas dans l'attracteur
  return maxBy(defs, conf2 => arena.attractor.at(arena.encode(conf2)) ?? 1000)
}