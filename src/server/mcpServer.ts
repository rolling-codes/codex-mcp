import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parseInput } from "../validation/validator.js";
import { startPipeline, finalizePipeline } from "../orchestrator/pipeline.js";

const TOOLS = [
  {
    name: "run_codex_task",
    description:
      "Start a Codex task. Returns pipeline instructions for Claude Code to execute (plan → code → test → heal). No API calls — uses your existing Claude session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        task: { type: "string", description: "What to build or implement" },
        context: { type: "string", description: "Optional extra context" },
      },
      required: ["task"],
    },
  },
  {
    name: "submit_codex_result",
    description:
      "Submit the completed pipeline result for validation and storage. Call this after executing all pipeline phases.",
    inputSchema: {
      type: "object" as const,
      properties: {
        task: { type: "string" },
        result: { type: "string", description: "Final implementation code" },
        tests: { type: "string", description: "Test summary (starts with PASS or FAIL)" },
        summary: { type: "string", description: "≤200 token outcome summary" },
      },
      required: ["task", "result", "tests", "summary"],
    },
  },
];

export function createServer(): Server {
  const server = new Server(
    { name: "codex-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;

    if (name === "run_codex_task") {
      try {
        const input = parseInput(req.params.arguments);
        const prompt = startPipeline(input);
        return { content: [{ type: "text" as const, text: prompt }] };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Invalid input: ${e}` }) }],
          isError: true,
        };
      }
    }

    if (name === "submit_codex_result") {
      try {
        const output = finalizePipeline(req.params.arguments);
        return { content: [{ type: "text" as const, text: JSON.stringify(output) }] };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Validation failed: ${e}` }) }],
          isError: true,
        };
      }
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Unknown tool" }) }],
      isError: true,
    };
  });

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
