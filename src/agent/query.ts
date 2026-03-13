import { query } from "@anthropic-ai/claude-agent-sdk";

import { getRuntimeConfig } from "../config/runtime.js";
import { buildAgentOptions } from "./options.js";

const DAILY_PROMPT = `Generate today's GitHub Trending daily report.

- Focus on frontend, full-stack, and agent repositories
- Use MCP tools for all external actions
- Publish at most five repositories
- Skip duplicates from recent history`;

export function runDailyReportQuery() {
  const config = getRuntimeConfig();

  return query({
    prompt: DAILY_PROMPT,
    options: buildAgentOptions(config)
  });
}
