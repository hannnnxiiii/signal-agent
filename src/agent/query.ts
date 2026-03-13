import { query } from "@anthropic-ai/claude-agent-sdk";

import { buildAgentOptions } from "./options.js";

const DAILY_PROMPT = `Generate today's GitHub Trending daily report.

- Focus on frontend, full-stack, and agent repositories
- Use MCP tools for all external actions
- Publish at most five repositories
- Skip duplicates from recent history`;

export function runDailyReportQuery() {
  return query({
    prompt: DAILY_PROMPT,
    options: buildAgentOptions()
  });
}
