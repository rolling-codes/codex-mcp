# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build      # tsc → dist/
npm run dev        # tsx src/index.ts (no build, runs MCP server on stdio)
npm run start      # node dist/index.js (requires prior build)
npm run setup      # build + write mcp.json to .claude/ + ~/.claude/
npm run enable     # build + claude mcp add -s user (registers globally)
npm run disable    # claude mcp remove codex-mcp -s user
```

Typecheck only the scripts/ folder: `npx tsc --noEmit -p tsconfig.scripts.json`

No test runner is configured. Smoke tests are written ad-hoc against `dist/` modules with `node --input-type=module -e '...'`.

## Architecture

This is a Claude Code MCP plugin that does **not** call the Anthropic API itself. The server returns a pipeline prompt to the calling Claude Code session, which executes all reasoning. This is the central design constraint — never reintroduce the Anthropic SDK.

### Two-tool flow

```
run_codex_task(task, context?)  ──►  pipeline prompt (text)
                                       │
                                       ▼  (Claude Code runs PLAN→CODE→TEST→HEAL internally)
                                       │
submit_codex_result(task, result, tests, summary)  ──►  validated + sanitized + stored
```

`run_codex_task` is stateless prompt generation. `submit_codex_result` is the validation/storage boundary. The two are linked only by the `task` string the model echoes back.

### Module layout (src/)

- `server/mcpServer.ts` — `@modelcontextprotocol/sdk` server, `StdioServerTransport`. Declares both tools, dispatches to orchestrator.
- `orchestrator/pipeline.ts` — `startPipeline` builds context + prompt; `finalizePipeline` parses → sanitizes → validates → remembers.
- `agents/prompts.ts` — phase strings (PLANNER/CODER/TESTER/HEALER) + `buildPipelinePrompt`. Editing phase rules happens here.
- `core/context.ts` + `core/optimizer.ts` — `buildCtx` joins context with prior summary, `compress` strips `// comments` (URL-safe — uses `(?:^|(?<=\s))` lookbehind) and collapses whitespace, capped at 3000 chars.
- `core/ghost.ts` — env-gated output sanitizer. **Reads `process.env.GHOST_MODE` at call time, not module load** — required because the env var may be set by the MCP host after import.
- `memory/store.ts` — LRU-20 in-process recall. `recall(task)` does substring match on lowercased prefix (80 chars).
- `validation/inputSchema.ts` — Zod schemas. `SubmitSchema.tests` uses `.refine()` to enforce first line starts with `PASS` or `FAIL`.

### Critical invariants

- **Sanitize only on output, never on prompt.** `startPipeline` must NOT call `sanitize()` on the pipeline prompt — that destroys phase keywords (PLANNER, CODER, etc.) and breaks Claude Code's instructions. Sanitize lives in `finalizePipeline` only.
- **No double-prior injection.** `buildCtx` already prepends `Prior: <summary>`. Don't also pass `prior` to `buildPipelinePrompt`.
- **Env reads at call time.** Module-load reads of `process.env.GHOST_MODE` will be stale.

### scripts/ folder

Two install entry points:
- `enable.ts` — `execFileSync("claude", [...], { shell: process.platform === "win32" })`. Shell flag is required on Windows because `claude` is a `.cmd` shim.
- `setup.ts` — direct mcp.json merge (no `claude` CLI dependency). Uses `indexOf("=")` for env parsing so values with `=` survive.

`scripts/` has its own `tsconfig.scripts.json` (standalone, with `types: ["node"]`) because the main tsconfig restricts `rootDir` to `src/`.

## TypeScript config

- `target: ES2023`, `module: NodeNext` — uses top-level `await`, `Array.prototype.findLast`-era APIs.
- `import.meta.dirname` is used in scripts/ — requires Node ≥ 20.11. The `engines` field in package.json enforces this.
- `.js` extensions in imports are mandatory under NodeNext (e.g. `from "./server/mcpServer.js"`).
