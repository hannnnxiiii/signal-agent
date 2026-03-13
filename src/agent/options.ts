import type { Options, SettingSource } from "@anthropic-ai/claude-agent-sdk";

import { DAILY_REPORT_ALLOWED_TOOLS } from "./allowed-tools.js";
import type { RuntimeConfig } from "../config/runtime.js";
import { createDailyMcpServer } from "../mcp/server.js";

export function buildAgentOptions(config: RuntimeConfig): Options {
  return {
    settingSources: ["project"] satisfies SettingSource[],
    allowedTools: DAILY_REPORT_ALLOWED_TOOLS,
    permissionMode: "bypassPermissions" as const,
    allowDangerouslySkipPermissions: true,
    maxTurns: 12,
    model: config.model,
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: config.anthropicApiKey,
      ANTHROPIC_BASE_URL: config.anthropicBaseUrl,
      GITHUB_TOKEN: config.githubToken
    },
    mcpServers: {
      signal_daily: createDailyMcpServer()
    }
  };
}
