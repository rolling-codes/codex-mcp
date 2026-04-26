const MAX = 3000;

export function compress(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\/\/[^\n]*/g, "").trim().slice(0, MAX);
}
