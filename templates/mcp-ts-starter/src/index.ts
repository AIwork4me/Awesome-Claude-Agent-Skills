/**
 * MCP TypeScript Starter Template
 * Gold-standard MCP server implementation
 *
 * @aiwork4me
 * @version 1.0.0
 */

import {
  Server,
  createServer,
  type Request,
  type Response,
} from "@modelcontextprotocol/sdk";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SkillInput {
  /** Primary input parameter */
  input: string;
  /** Optional configuration */
  options?: SkillOptions;
}

export interface SkillOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface SkillOutput {
  /** Skill execution result */
  result: unknown;
  /** Execution metadata */
  metadata: {
    skillName: string;
    timestamp: string;
    duration: number;
    version: string;
  };
}

export interface SkillLinkOutput extends SkillOutput {
  /** Hint for next skill in chain */
  nextSkillHint?: string;
  /** Chain execution history */
  chainHistory?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SKILL_NAME = "{{SKILL_NAME}}";
const SKILL_VERSION = "1.0.0";
const SKILL_DESCRIPTION = "{{SKILL_DESCRIPTION}}";

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate skill input parameters
 */
export function validateInput(input: SkillInput): void {
  if (!input.input || typeof input.input !== "string") {
    throw new Error("Invalid input: 'input' must be a non-empty string");
  }

  if (input.options?.timeout && input.options.timeout < 0) {
    throw new Error("Invalid option: 'timeout' must be a positive number");
  }
}

/**
 * Create standardized skill metadata
 */
export function createMetadata(duration: number): SkillOutput["metadata"] {
  return {
    skillName: SKILL_NAME,
    timestamp: new Date().toISOString(),
    duration,
    version: SKILL_VERSION,
  };
}

/**
 * Log debug information if enabled
 */
export function debugLog(message: string, data?: unknown): void {
  if (process.env.DEBUG === "true") {
    console.log(`[${SKILL_NAME}] ${message}`, data ?? "");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SKILL EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main skill execution function
 *
 * @param input - Skill input parameters
 * @returns Skill execution result with metadata
 */
export async function execute(input: SkillInput): Promise<SkillLinkOutput> {
  const startTime = Date.now();

  debugLog("Starting execution", input);

  // Validate input
  validateInput(input);

  // ========================================
  // TODO: Implement your skill logic here
  // ========================================

  const result = {
    message: `Processed: ${input.input}`,
    timestamp: new Date().toISOString(),
  };

  // ========================================
  // End of skill logic
  // ========================================

  const duration = Date.now() - startTime;
  debugLog("Execution completed", { duration });

  return {
    result,
    metadata: createMetadata(duration),
    nextSkillHint: undefined, // Set if this skill can chain to another
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MCP SERVER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MCP_TOOLS = [
  {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    inputSchema: {
      type: "object" as const,
      properties: {
        input: {
          type: "string" as const,
          description: "Primary input parameter",
        },
        options: {
          type: "object" as const,
          properties: {
            timeout: { type: "number" as const },
            retries: { type: "number" as const },
            debug: { type: "boolean" as const },
          },
        },
      },
      required: ["input"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MCP SERVER INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create and configure MCP server
 */
export function createMcpServer(): Server {
  const server = createServer({
    name: SKILL_NAME,
    version: SKILL_VERSION,
  });

  // Register tools
  server.setRequestHandler("tools/list", async () => {
    return { tools: MCP_TOOLS };
  });

  // Handle tool execution
  server.setRequestHandler("tools/call", async (request: Request) => {
    const { name, arguments: args } = request.params;

    if (name === SKILL_NAME) {
      try {
        const result = await execute(args as SkillInput);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: error instanceof Error ? error.message : "Unknown error",
                  skillName: SKILL_NAME,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  const server = createMcpServer();

  // Start server
  server.connect(process.stdin, process.stdout).catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });

  console.error(`${SKILL_NAME} MCP server started`);
}

export default {
  name: SKILL_NAME,
  description: SKILL_DESCRIPTION,
  version: SKILL_VERSION,
  execute,
  createMcpServer,
};
