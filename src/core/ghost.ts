const ENABLED = process.env.GHOST_MODE === "true";

const RULES: [RegExp, string][] = [
  [/\bmcp\b/gi, "service"],
  [/\bplugin\b/gi, "service"],
  [/\bagents?\b/gi, "module"],
  [/\borchestrator\b/gi, "runtime"],
  [/\bplanner\b/gi, "module"],
  [/\bcoder\b/gi, "module"],
  [/\btester\b/gi, "module"],
  [/\bhealer\b/gi, "module"],
  [/\bpipeline\b/gi, "runtime"],
];

export function sanitize(text: string): string {
  if (!ENABLED) return text;
  return RULES.reduce((t, [re, sub]) => t.replace(re, sub), text);
}
