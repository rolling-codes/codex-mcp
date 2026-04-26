# codex-mcp

> A multi-agent code-execution pipeline that runs **inside your existing Claude Code session**. No second API key. No second bill. No external loop.

## Why this exists

I already pay for Claude Code. I did not want to also pay an Anthropic API bill every time I ran a multi-agent coding workflow on top of it.

Most "agentic coder" tooling out there does one of two things:

1. **Calls the Anthropic API directly** — meaning every planner/coder/tester/healer hop is a separate billable request that doesn't go through the Claude Code subscription you're already paying for.
2. **Locks you into a hosted runtime** — meaning your code, your context, and your task history live on someone else's server.

`codex-mcp` does neither. It is a local MCP plugin that registers with Claude Code via the standard `claude mcp add` plumbing. When you call `run_codex_task`, the plugin doesn't make any LLM calls of its own — it returns a structured pipeline prompt that **the Claude Code session you're already logged into** executes. All reasoning, all token spend, all model context goes through your existing subscription. The plugin is the scaffolding; Claude Code is the engine.

## Why I built it the way I did

### 1. Multi-agent quality without orchestration code

LLMs produce better code when forced to plan before coding, test what they wrote, and heal failures structurally rather than rewriting from scratch. That's well-established. What's annoying is that **stitching those phases together** — managing intermediate state, retry logic, validation gates, prompt templates — usually means writing a python orchestration layer with API calls and brittle JSON parsing.

`codex-mcp` collapses the entire pipeline into a single prompt. The model receives **all four phase instructions at once** and is told to execute them in strict order. There is no orchestration loop in code. The model runs the pipeline because the prompt structure compels it to. This is intentional — fewer moving parts means fewer places to break, and the pipeline survives whatever model upgrades happen on Anthropic's side.

### 2. A hard validation boundary

Every tool I tried before this one had the same failure mode: the model would say "tests passed" while quietly skipping the test phase, or hallucinate a test summary, or output garbage that downstream tooling couldn't consume. I wanted a contract that was machine-checkable.

The `submit_codex_result` tool enforces that:
- `tests` must start with `PASS` or `FAIL` — refused at the Zod boundary if not.
- `result` must be non-empty.
- `summary` must fit in 1000 chars.

If the model lies about test outcomes, the submission gets rejected and the loop fails loudly. If it forgets to call `submit_codex_result` at all, you get nothing — which is the correct answer to "did the pipeline succeed?"

### 3. Memory across runs without a database

Real coding tasks have continuity. If I asked the agent to "fix the auth bug" yesterday and "add MFA to login" today, the second task should know about the first. But I didn't want a sqlite file, a vector DB, or any persistent storage that would create migration headaches.

The memory layer is an **LRU-20 in-process store** keyed by lowercased substring match on the task description. It's deliberately small, deliberately ephemeral (resets when the MCP server restarts), and deliberately unsophisticated. It catches the obvious win — "you just worked on this; here's what you did" — without pretending to be long-term knowledge. That keeps the plugin stateless enough to ship as a single npm install, and the recall behavior is predictable instead of magical.

### 4. Ghost Mode

When the pipeline output gets quoted into other contexts — PR descriptions, code review comments, internal docs — references to "planner," "coder," "MCP," "agent," etc. leak implementation details that aren't useful to the reader. `GHOST_MODE=true` rewrites those terms to neutral labels in **output only** (never in the prompt — sanitizing the prompt would destroy the phase instructions and was a real bug I hit in v1).

This is the kind of thing that's a one-line config change but requires getting the plumbing right: env vars must be read at call time (not module load), the substitution rules must be regex-bounded to avoid mangling unrelated tokens, and the sanitizer must live downstream of validation so the validator sees the truth.

### 5. Plugin shape, not service shape

The first version of this thing was a standalone server you ran on a port. Rejected — that meant another process to manage, another port to remember, another thing to start before it would work.

The current version registers as a Claude Code MCP plugin via stdio transport. `npm run enable` runs `claude mcp add -s user`, and the plugin appears in your global plugin list. `npm run disable` removes it. There's no daemon, no port, no foreground process — Claude Code spawns the plugin as a subprocess on demand and tears it down when done. This is the right shape for a tool that's "always available but mostly idle."

## How it works

```
┌──────────────────────────────────────────────────────────────────┐
│ Claude Code (your session, your tokens)                          │
│                                                                  │
│   you: "build feature X"                                         │
│         │                                                        │
│         ▼                                                        │
│   Claude calls run_codex_task(task="build feature X")            │
│         │                                                        │
│         │  (stdio MCP roundtrip)                                 │
│         ▼                                                        │
│   ┌───────────────────────────────────┐                          │
│   │ codex-mcp (local subprocess)      │                          │
│   │   • recall prior summary          │                          │
│   │   • compress context              │                          │
│   │   • build pipeline prompt         │                          │
│   └───────────────────────────────────┘                          │
│         │                                                        │
│         ▼                                                        │
│   Claude receives PLAN→CODE→TEST→HEAL prompt                     │
│   Claude executes all 4 phases internally                        │
│         │                                                        │
│         ▼                                                        │
│   Claude calls submit_codex_result(task, result, tests, summary) │
│         │                                                        │
│         │  (stdio MCP roundtrip)                                 │
│         ▼                                                        │
│   ┌───────────────────────────────────┐                          │
│   │ codex-mcp                         │                          │
│   │   • parse + validate (PASS/FAIL)  │                          │
│   │   • sanitize if GHOST_MODE        │                          │
│   │   • remember(task, summary)       │                          │
│   └───────────────────────────────────┘                          │
│         │                                                        │
│         ▼                                                        │
│   you: gets validated result                                     │
└──────────────────────────────────────────────────────────────────┘
```

The plugin is the orchestrator. Claude Code is the model. **No LLM calls leave your session.**

## Quick install

```bash
git clone https://github.com/rolling-codes/codex-mcp.git
cd codex-mcp
npm install
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
| `npm test` | Run 60-test suite (`node --test` + tsx) |
| `npm run typecheck` | TypeScript check across `src/`, `scripts/`, `tests/` |

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

## License

MIT.
