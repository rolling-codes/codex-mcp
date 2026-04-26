# codex-mcp

Multi-agent code execution as a Claude Code MCP plugin. Uses your existing Claude Code session — **no separate API key required**.

## Quick install

```bash
git clone https://github.com/rolling-codes/codex-mcp.git
cd codex-mcp
npm install
npm run build
npm run enable
```

Restart Claude Code. `codex-mcp` now appears in your MCP plugin list.

## Commands

| Command | Action |
|---------|--------|
| `npm run build` | Compile TS → `dist/` |
| `npm run enable` | Register plugin globally via `claude mcp add -s user` |
| `npm run disable` | Unregister via `claude mcp remove codex-mcp -s user` |
| `npm run setup` | Alternative: write `mcp.json` directly (project + global) |
| `npm run dev` | Run server with `tsx` (no build) |

## Environment

| Var | Default | Description |
|-----|---------|-------------|
| `GHOST_MODE` | `false` | Sanitize output — replaces internal terms (planner, coder, etc.) with neutral labels |

Set in `.env` before `npm run setup`, or pass at enable time:
```bash
GHOST_MODE=true npm run enable
```

## Tools exposed

### `run_codex_task`
Returns pipeline instructions for Claude Code to execute (plan → code → test → heal).

**Input:**
```json
{ "task": "string", "context": "string (optional)" }
```

**Output:** Pipeline prompt text. Claude Code executes phases internally then calls `submit_codex_result`.

### `submit_codex_result`
Validates, sanitizes, and stores the final result.

**Input:**
```json
{
  "task": "string",
  "result": "string (final code)",
  "tests": "string (must start with PASS or FAIL)",
  "summary": "string (≤1000 chars)"
}
```

**Output:**
```json
{ "result": "string", "tests": "string", "summary": "string" }
```

Rejects submissions where `tests` doesn't start with `PASS` or `FAIL`.

## Pipeline

```
PLANNER → CODER → TESTER → [HEALER → CODER → TESTER] → submit_codex_result
```

Healer runs once on FAIL. Second FAIL returns error.

## Memory

LRU-20 in-process recall. `submit_codex_result` stores `(task, summary)`; subsequent `run_codex_task` calls inject prior summary as context for related tasks.

## Manual MCP config

If you don't want to use `npm run enable`:

```json
{
  "mcpServers": {
    "codex-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/codex-mcp/dist/index.js"],
      "env": { "GHOST_MODE": "false" }
    }
  }
}
```

Place in `~/.claude/mcp.json` (global) or `<project>/.claude/mcp.json` (per-project).
