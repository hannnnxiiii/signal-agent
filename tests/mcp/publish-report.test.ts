import { describe, expect, it, vi } from "vitest";

import {
  extractSelectedReposFromMarkdown,
  publishDailyReport
} from "../../src/mcp/tools/publish-report.js";

describe("extractSelectedReposFromMarkdown", () => {
  it("extracts repository slugs from rendered markdown headings", () => {
    const selectedRepos = extractSelectedReposFromMarkdown(`
# GitHub Trending Daily Report - 2026-03-14

## Picks
### 1. [alibaba/page-agent](https://github.com/alibaba/page-agent)
### 2. [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)
    `);

    expect(selectedRepos).toEqual(["alibaba/page-agent", "promptfoo/promptfoo"]);
  });
});

describe("publishDailyReport", () => {
  it("skips publication when the report was already published for the date", async () => {
    const canPublish = vi.fn().mockResolvedValue(false);
    const save = vi.fn();

    const result = await publishDailyReport(
      {
        reportPath: "reports/2026-03-14.md",
        markdown: "# report"
      },
      {
        historyStore: {
          canPublish,
          save
        },
        publishReportToGit: vi.fn(),
        publishToHxBlog: vi.fn()
      }
    );

    expect(result).toEqual({ skipped: true, reason: "already_published" });
    expect(canPublish).toHaveBeenCalledWith("2026-03-14");
    expect(save).not.toHaveBeenCalled();
  });

  it("publishes to git and HX Blog, then saves blogPostId in state", async () => {
    const save = vi.fn();
    const publishReportToGit = vi.fn().mockResolvedValue({ commitHash: "abc123" });
    const publishToHxBlog = vi.fn().mockResolvedValue({ postId: 99, skipped: false });

    const result = await publishDailyReport(
      {
        reportPath: "reports/2026-03-14.md",
        markdown: `
### 1. [alibaba/page-agent](https://github.com/alibaba/page-agent)
        `.trim()
      },
      {
        historyStore: {
          canPublish: vi.fn().mockResolvedValue(true),
          save
        },
        publishReportToGit,
        publishToHxBlog
      }
    );

    expect(publishReportToGit).toHaveBeenCalledWith({
      reportPath: "reports/2026-03-14.md",
      markdown: "### 1. [alibaba/page-agent](https://github.com/alibaba/page-agent)"
    });
    expect(publishToHxBlog).toHaveBeenCalledWith({
      date: "2026-03-14",
      overview: "",
      markdown: "### 1. [alibaba/page-agent](https://github.com/alibaba/page-agent)"
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-03-14",
        status: "published",
        blogPostId: 99,
        commitHash: "abc123",
        selectedRepos: ["alibaba/page-agent"]
      })
    );
    expect(result).toEqual({ commitHash: "abc123", blogPostId: 99, skipped: false });
  });

  it("records a failed state when HX Blog publication throws", async () => {
    const save = vi.fn();

    await expect(
      publishDailyReport(
        {
          reportPath: "reports/2026-03-14.md",
          markdown: "# report"
        },
        {
          historyStore: {
            canPublish: vi.fn().mockResolvedValue(true),
            save
          },
          publishReportToGit: vi.fn().mockResolvedValue({ commitHash: "abc123" }),
          publishToHxBlog: vi.fn().mockRejectedValue(new Error("insert failed"))
        }
      )
    ).rejects.toThrow("insert failed");

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-03-14",
        status: "failed",
        commitHash: "abc123",
        failureReason: "insert failed",
        failureStage: "blog"
      })
    );
  });
});
