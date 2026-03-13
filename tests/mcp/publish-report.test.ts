import { describe, expect, it } from "vitest";

import { extractSelectedReposFromMarkdown } from "../../src/mcp/tools/publish-report.js";

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
