import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { homedir } from "os";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist", "index.js");
const ENV_FILE = join(ROOT, ".env");

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    readFileSync(ENV_FILE, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()] as [string, string];
      })
  );
}

function writeClaudeConfig(): void {
  if (!existsSync(DIST)) {
    console.error("dist/index.js not found — run: npm run build");
    process.exit(1);
  }

  const env = loadEnv();
  const ghostMode = env["GHOST_MODE"] ?? "false";

  const mcpEntry = {
    command: "node",
    args: [DIST],
    env: { GHOST_MODE: ghostMode },
  };

  const targets = [
    join(ROOT, ".claude", "mcp.json"),
    join(homedir(), ".claude", "mcp.json"),
  ];

  for (const target of targets) {
    const dir = target.replace(/[/\\][^/\\]+$/, "");
    mkdirSync(dir, { recursive: true });

    let existing: Record<string, unknown> = {};
    if (existsSync(target)) {
      try {
        existing = JSON.parse(readFileSync(target, "utf8")) as Record<string, unknown>;
      } catch {
        // ignore malformed JSON
      }
    }

    const merged = {
      ...existing,
      mcpServers: {
        ...(existing["mcpServers"] as Record<string, unknown> | undefined),
        "codex-mcp": mcpEntry,
      },
    };

    writeFileSync(target, JSON.stringify(merged, null, 2) + "\n");
    console.log(`wrote: ${target}`);
  }
}

writeClaudeConfig();
console.log("done — restart Claude Code to activate codex-mcp");
