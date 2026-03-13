import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { basename } from "node:path";

import { publishReport } from "../../services/git/publish.js";
import { createFileBackedHistoryStore } from "../../services/reports/history.js";

const historyStore = createFileBackedHistoryStore("data/state");

export const publishReportTool = tool(
  "publish_report",
  "Write a report file and commit it to git.",
  {
    reportPath: z.string(),
    markdown: z.string()
  },
  async ({ reportPath, markdown }) => {
    const date = basename(reportPath, ".md");

    if (!(await historyStore.canPublish(date))) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ skipped: true, reason: "already_published" }, null, 2)
          }
        ]
      };
    }

    const result = await publishReport({ reportPath, markdown });

    await historyStore.save({
      date,
      status: "published",
      selectedRepos: [],
      reportPath,
      commitHash: result.commitHash
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);
