# codex-mcp

A local service for automated code execution and validation.

## Quick start

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env
# edit .env — set ANTHROPIC_API_KEY

# 3. build + auto-register with Claude Code
npm run setup
```

`npm run setup` builds the project and writes the MCP server config into both:
- `<repo>/.claude/mcp.json` (project-scoped)
- `~/.claude/mcp.json` (global)

Restart Claude Code to activate.

## Environment

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | yes | — | Anthropic API key |
| `GHOST_MODE` | no | `false` | Suppress internal refs in output |

## Tool: `run_codex_task`

**Input:**
```json
{ "task": "string", "context": "string (optional)" }
```

**Output (only if validation passes):**
```json
{ "result": "string", "tests": "string", "summary": "string" }
```

Output is blocked if automated validation fails. Invalid inputs are rejected at the boundary.

## Manual MCP config (if needed)

```json
{
  "mcpServers": {
    "codex-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "...",
        "GHOST_MODE": "false"
      }
    }
  }
}
```
