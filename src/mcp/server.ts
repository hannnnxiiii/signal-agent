import { z } from "zod";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";

import { composeReportTool } from "./tools/compose-report.js";
import { fetchTrendingTool } from "./tools/fetch-trending.js";
import { getRepoDetailsTool } from "./tools/get-repo-details.js";
import { loadReportHistoryTool } from "./tools/load-report-history.js";
import { publishReportTool } from "./tools/publish-report.js";
import { selectCandidates } from "./tools/select-candidates.js";

const selectCandidatesTool = tool(
  "select_candidates",
  "Filter recent duplicates and limit candidate repos to five.",
  {
    candidates: z.array(
      z.object({
        owner: z.string(),
        name: z.string(),
        description: z.string(),
        language: z.string().optional()
      })
    ),
    recentRepoNames: z.array(z.string())
  },
  async (args) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(await selectCandidates(args), null, 2)
      }
    ]
  })
);

export function createDailyMcpServer() {
  return createSdkMcpServer({
    name: "signal_daily",
    version: "0.1.0",
    tools: [
      fetchTrendingTool,
      getRepoDetailsTool,
      loadReportHistoryTool,
      selectCandidatesTool,
      composeReportTool,
      publishReportTool
    ]
  });
}
