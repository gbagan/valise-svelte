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


export function range(start: number, end: number): number[] {
  if (end <= start) {
      return [];
  }
  const res = new Array(end-start);
  for (let i = 0; i < end - start; i++) {
    res[i] = start + i;
  }
  return res
}

export function shuffle<A>(arr: A[]): A[] {
  const res = arr.slice();
  for (let i = res.length-1; i >= 0; i--) {
    const j = Math.random() * (i+1) | 0;
    const tmp = res[i];
    res[i] = res[j];
    res[j] = tmp;
  }
  return res;
}

export function take<A>(arr: A[], n: number): A[] {
  return arr.slice(0, n);
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomPick<A>(arr: A[]): A | null {
  if (arr.length === 0) {
    return null;
  } else {
    return arr[Math.random() * arr.length | 0];
  }
}