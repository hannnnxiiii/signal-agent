import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import { composeDailyReport } from "../../services/reports/composer.js";

export const composeReportTool = tool(
  "compose_report",
  "Compose the final Markdown daily report from structured data.",
  {
    date: z.string(),
    overview: z.string(),
    picks: z.array(
      z.object({
        owner: z.string(),
        name: z.string(),
        url: z.string(),
        category: z.enum(["frontend", "full-stack", "agent", "hybrid"]),
        summary: z.string(),
        whyItMatters: z.string()
      })
    ),
    closingNote: z.string()
  },
  async (args) => ({
    content: [
      {
        type: "text",
        text: composeDailyReport(args)
      }
    ]
  })
);
