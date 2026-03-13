import { describe, expect, it } from "vitest";

import { selectCandidates } from "../../src/mcp/tools/select-candidates.js";

describe("selectCandidates", () => {
  it("drops recent duplicates and limits picks to five", async () => {
    const result = await selectCandidates({
      candidates: [
        { owner: "acme", name: "agent-ui", description: "Agent UI", language: "TypeScript" },
        { owner: "acme", name: "agent-db", description: "Agent DB", language: "TypeScript" },
        { owner: "acme", name: "agent-cli", description: "Agent CLI", language: "TypeScript" },
        { owner: "acme", name: "agent-web", description: "Agent Web", language: "TypeScript" },
        { owner: "acme", name: "agent-fullstack", description: "Agent Fullstack", language: "TypeScript" },
        { owner: "acme", name: "agent-extra", description: "Agent Extra", language: "TypeScript" }
      ],
      recentRepoNames: ["acme/agent-ui"]
    });

    expect(result.selected).toHaveLength(5);
    expect(
      result.selected.map((repo: { owner: string; name: string }) => `${repo.owner}/${repo.name}`)
    ).not.toContain("acme/agent-ui");
  });
});
