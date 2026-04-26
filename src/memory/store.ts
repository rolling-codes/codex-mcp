interface Entry {
  task: string;
  summary: string;
  ts: number;
}

const store: Entry[] = [];
const LIMIT = 20;

export function remember(task: string, summary: string): void {
  if (store.length >= LIMIT) store.shift();
  store.push({ task: task.slice(0, 120), summary: summary.slice(0, 300), ts: Date.now() });
}

export function recall(task: string): string | null {
  const q = task.toLowerCase().slice(0, 80);
  const hit = [...store].reverse().find((r: Entry) => r.task.toLowerCase().includes(q));
  return hit?.summary ?? null;
}
