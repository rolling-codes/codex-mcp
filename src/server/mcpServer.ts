import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parseInput } from "../validation/validator.js";
import { run } from "../orchestrator/pipeline.js";

const TOOL_DEF = {
  name: "run_codex_task",
  description: "Execute a task via planner→coder→tester→healer pipeline.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task: { type: "string" },
      context: { type: "string" },
    },
    required: ["task"],
  },
};

export function createServer(): Server {
  const server = new Server(
    { name: "codex-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [TOOL_DEF],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name !== "run_codex_task") {
      throw new Error("Unknown tool");
    }

    let input;
    try {
      input = parseInput(req.params.arguments);
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Invalid input: ${e}` }) }],
        isError: true,
      };
    }

    const log: string[] = [];
    try {
      const output = await run(input.task, input.context, (msg) => log.push(msg));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: String(e), log: log.slice(-10) }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
