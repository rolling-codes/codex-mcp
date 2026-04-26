import { execFileSync } from "child_process";
import { resolve, join } from "path";
import { existsSync } from "fs";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist", "index.js");

if (!existsSync(DIST)) {
  console.error("dist/index.js not found — run: npm run build");
  process.exit(1);
}

const ghostMode = process.env["GHOST_MODE"] ?? "false";
const isWin = process.platform === "win32";

try {
  execFileSync(
    "claude",
    ["mcp", "add", "-s", "user", "-e", `GHOST_MODE=${ghostMode}`, "--", "codex-mcp", "node", DIST],
    { stdio: "inherit", shell: isWin }
  );
  console.log("codex-mcp enabled — restart Claude Code to activate");
} catch {
  console.error("Failed. Is Claude Code CLI installed and in PATH?");
  process.exit(1);
}
