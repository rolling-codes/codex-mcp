const MAX = 3000;

export function compress(s: string): string {
  return s
    .replace(/(?:^|(?<=\s))\/\/[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX);
}
