import { describe, expect, it } from "vitest";

import { composeDailyReport } from "../../../src/services/reports/composer.js";

describe("composeDailyReport", () => {
  it("renders a markdown report with selected repositories", () => {
    const markdown = composeDailyReport({
      date: "2026-03-14",
      overview: "Agent tooling is rising on Trending.",
      picks: [
        {
          owner: "acme",
          name: "agent-ui",
          url: "https://github.com/acme/agent-ui",
          category: "frontend",
          summary: "A UI toolkit for agent apps.",
          whyItMatters: "Useful for frontend agent interfaces."
        }
      ],
      closingNote: "Expect more agent-native UI repos this week."
    });

    expect(markdown).toContain("# GitHub Trending Daily Report - 2026-03-14");
    expect(markdown).toContain("[acme/agent-ui](https://github.com/acme/agent-ui)");
  });
});
