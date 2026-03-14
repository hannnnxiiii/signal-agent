import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { basename } from "node:path";

import { publishToHxBlog } from "../../services/blog/publish.js";
import { publishReport } from "../../services/git/publish.js";
import {
  createFileBackedHistoryStore,
  type HistoryStore
} from "../../services/reports/history.js";

const historyStore = createFileBackedHistoryStore("data/state");

interface PublishDailyReportInput {
  reportPath: string;
  markdown: string;
}

interface PublishDailyReportDeps {
  historyStore: Pick<HistoryStore, "canPublish" | "save">;
  publishReportToGit: typeof publishReport;
  publishToHxBlog: typeof publishToHxBlog;
}

export function extractSelectedReposFromMarkdown(markdown: string): string[] {
  return [...markdown.matchAll(/### \d+\. \[([^/\]]+\/[^\]]+)\]\(https:\/\/github\.com\/[^\)]+\)/g)].map(
    (match) => match[1]
  );
}

export function extractOverviewFromMarkdown(markdown: string): string {
  const match = markdown.match(/## 概览\s+([\s\S]*?)\n## /);
  return match?.[1]?.trim() ?? "";
}

export async function publishDailyReport(
  input: PublishDailyReportInput,
  deps: PublishDailyReportDeps
) {
  const date = basename(input.reportPath, ".md");

  if (!(await deps.historyStore.canPublish(date))) {
    return { skipped: true, reason: "already_published" as const };
  }

  const gitResult = await deps.publishReportToGit(input);

  try {
    const blogResult = await deps.publishToHxBlog({
      date,
      overview: extractOverviewFromMarkdown(input.markdown),
      markdown: input.markdown
    });

    await deps.historyStore.save({
      date,
      status: "published",
      selectedRepos: extractSelectedReposFromMarkdown(input.markdown),
      reportPath: input.reportPath,
      commitHash: gitResult.commitHash,
      blogPostId: blogResult.postId
    });

    return {
      skipped: false,
      commitHash: gitResult.commitHash,
      blogPostId: blogResult.postId
    };
  } catch (error) {
    await deps.historyStore.save({
      date,
      status: "failed",
      selectedRepos: extractSelectedReposFromMarkdown(input.markdown),
      reportPath: input.reportPath,
      commitHash: gitResult.commitHash,
      failureReason: error instanceof Error ? error.message : String(error),
      failureStage: "blog"
    });

    throw error;
  }
}

export const publishReportTool = tool(
  "publish_report",
  "Write a report file and commit it to git.",
  {
    reportPath: z.string(),
    markdown: z.string()
  },
  async ({ reportPath, markdown }) => {
    const result = await publishDailyReport(
      { reportPath, markdown },
      {
        historyStore,
        publishReportToGit: publishReport,
        publishToHxBlog
      }
    );

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
