const MAX = 3000;

export function compress(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\/\/[^\n]*/g, "").trim().slice(0, MAX);
}

export function truncate(s: string, n = 500): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
