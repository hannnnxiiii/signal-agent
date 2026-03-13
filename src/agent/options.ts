import type { Options, SettingSource } from "@anthropic-ai/claude-agent-sdk";

import { DAILY_REPORT_ALLOWED_TOOLS } from "./allowed-tools.js";
import { createDailyMcpServer } from "../mcp/server.js";

export function buildAgentOptions(): Options {
  return {
    settingSources: ["project"] satisfies SettingSource[],
    allowedTools: DAILY_REPORT_ALLOWED_TOOLS,
    permissionMode: "bypassPermissions" as const,
    maxTurns: 12,
    mcpServers: {
      signal_daily: createDailyMcpServer()
    }
  };
}
