import { describe, expect, it, vi } from "vitest";

import {
  buildHxBlogPostPayload,
  publishToHxBlog
} from "../../../src/services/blog/publish.js";

describe("buildHxBlogPostPayload", () => {
  it("maps the report date, overview, and markdown into a blog post payload", () => {
    expect(
      buildHxBlogPostPayload({
        date: "2026-03-14",
        overview: "今天的趋势更偏向 Agent 工具链。",
        markdown: "# report"
      })
    ).toEqual({
      title: "GitHub Trending 日报 - 2026-03-14",
      summary: "今天的趋势更偏向 Agent 工具链。",
      content: "# report"
    });
  });
});

describe("publishToHxBlog", () => {
  it("reuses an existing HX Blog post when the title already exists", async () => {
    const query = vi.fn().mockResolvedValueOnce([[{ id: 42 }]]);

    const result = await publishToHxBlog(
      {
        date: "2026-03-14",
        overview: "今天的趋势更偏向 Agent 工具链。",
        markdown: "# report"
      },
      { query }
    );

    expect(query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ postId: 42, skipped: true });
  });

  it("inserts a new HX Blog post when no matching title exists", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 99 }]);

    const result = await publishToHxBlog(
      {
        date: "2026-03-14",
        overview: "今天的趋势更偏向 Agent 工具链。",
        markdown: "# report"
      },
      { query }
    );

    expect(query).toHaveBeenNthCalledWith(
      1,
      "SELECT id FROM Post WHERE title = ? LIMIT 1",
      ["GitHub Trending 日报 - 2026-03-14"]
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO Post (title, summary, content, createdAt) VALUES (?, ?, ?, NOW())",
      ["GitHub Trending 日报 - 2026-03-14", "今天的趋势更偏向 Agent 工具链。", "# report"]
    );
    expect(result).toEqual({ postId: 99, skipped: false });
  });
});
