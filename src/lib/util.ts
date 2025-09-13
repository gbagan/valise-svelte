export function take<A>(arr: A[], n: number): A[] {
  return arr.slice(0, n);
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}