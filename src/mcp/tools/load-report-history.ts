import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import { createFileBackedHistoryStore } from "../../services/reports/history.js";

const historyStore = createFileBackedHistoryStore("data/state");

export const loadReportHistoryTool = tool(
  "load_report_history",
  "Load the saved run state for a report date.",
  {
    date: z.string()
  },
  async ({ date }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(await historyStore.load(date), null, 2)
      }
    ]
  })
);
