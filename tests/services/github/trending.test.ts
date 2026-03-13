import { describe, expect, it } from "vitest";

import { normalizeTrendingRepo } from "../../../src/services/github/trending.js";

describe("normalizeTrendingRepo", () => {
  it("normalizes owner, name, description, and language", () => {
    const repo = normalizeTrendingRepo({
      repo: "acme/agent-ui",
      description: "Agent UI kit",
      language: "TypeScript"
    });

    expect(repo.owner).toBe("acme");
    expect(repo.name).toBe("agent-ui");
    expect(repo.description).toBe("Agent UI kit");
    expect(repo.language).toBe("TypeScript");
  });
});
