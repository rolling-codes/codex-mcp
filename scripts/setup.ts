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
      .map((l) => l.split("=").map((s) => s.trim()) as [string, string])
  );
}

function writeClaudeConfig(): void {
  const env = loadEnv();
  const ghostMode = env.GHOST_MODE ?? "false";

  const config = {
    mcpServers: {
      "codex-mcp": {
        command: "node",
        args: [DIST],
        env: { GHOST_MODE: ghostMode },
      },
    },
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
      try { existing = JSON.parse(readFileSync(target, "utf8")); } catch {}
    }

    const merged = {
      ...existing,
      mcpServers: { ...(existing.mcpServers as object | undefined), ...config.mcpServers },
    };

    writeFileSync(target, JSON.stringify(merged, null, 2));
    console.log(`wrote: ${target}`);
  }
}

writeClaudeConfig();
console.log("done — restart Claude Code to activate codex-mcp");
