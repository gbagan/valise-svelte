export function repeat<A>(n: number, val: A): A[] {
  const res = new Array(n);
  res.fill(val);
  return res;
}

export function generate<A>(n: number, f: (i: number) => A): A[] {
  const res = new Array(n);
  for (let i = 0; i < n; i++) {
    res[i] = f(i);
  }
  return res;
}

export function range(start: number, end: number, step?: number): number[] {
  const res = [];
  step = step ?? 1;
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      res.push(i);
    }
  } else {
    for (let i = start; i > end; i += step) {
      res.push(i);
    }
  }
  return res
}

export function countBy<A>(arr: readonly A[], pred: (x: A, i: number) => boolean): number {
  let count = 0;
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    if (pred(arr[i], i)) {
      count += 1;
    }
  }
  return count;
}

export function take<A>(arr: A[], n: number): A[] {
  return arr.slice(0, n);
}

export function swap<A>(arr: readonly A[], i: number, j: number): A[] {
  const res = arr.slice();
  const tmp = res[i];
  res[i] = res[j];
  res[j] = tmp;
  return res; 
}

export function minBy<A>(arr: readonly A[], fn: (x: A) => number) {
  let min = null;
  let bestScore = Infinity;
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    const x = arr[i];
    const score = fn(x);
    if (score < bestScore) {
      bestScore = score;
      min = x;
    } 
  }
  return min;
}

export const maxBy = <A>(arr: readonly A[], fn: (x: A) => number) => minBy(arr, x => -fn(x))

// renvoie les sous listes de taille k de [0, ... n-1]
export function sublists(n: number, k: number): number[][] {
  const res: number[][] = [];
  const current: number[] = [];

  function backtrack(start: number) {
    if (current.length === k) {
      res.push(current.slice());
      return;
    }
    for (let i = start; i < n; i++) {
      current.push(i);
      backtrack(i + 1);
      current.pop();
    }
  }

  backtrack(0);
  return res;
}

export const random = (start: number, end: number) =>
  start + (end - start) * Math.random() | 0;

export function randomPick<A>(arr: A[]): A | null {
  if (arr.length === 0) {
    return null;
  } else {
    return arr[Math.random() * arr.length | 0];
  }
}

export function shuffle<A>(arr: readonly A[]): A[] {
  const res = arr.slice();
  for (let i = res.length-1; i >= 0; i--) {
    const j = Math.random() * (i+1) | 0;
    const tmp = res[i];
    res[i] = res[j];
    res[j] = tmp;
  }
  return res;
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function allDistinct<A>(arr: readonly A[]): boolean {
  return new Set(arr).size === arr.length;
}

export function mod(x: number, y: number) {
  const z = x % y;
  return z < 0 ? z + y : z;  
}


export const generate2 = <A>(n: number,  m: number, f: (i: number, j: number) => A) => 
  generate(n * m, i => f(i / m | 0, i % m));


export function coords(cols: number, x: number): [number, number] {
  const row = x / cols | 0;
  const col = x % cols;
  return [row, col];
}

export function diffCoords(cols: number, x: number, y: number): [number, number] {
  const row1 = x / cols | 0;
  const col1 = x % cols;
  const row2 = y / cols | 0;
  const col2 = y % cols;
  return [row1 - row2, col1 - col2];
}

export function gridStyle(rows: number, columns: number, limit: number): string {
  const m = Math.max(limit, rows, columns);
  return `height:${100*rows/m}%;width:${100*columns/m}%;`
}

export function getPointerPosition(e: MouseEvent): {x: number, y: number} {
  const rect = (e.currentTarget as Element).getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return {x, y};
}