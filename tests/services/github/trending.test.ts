import { describe, expect, it } from "vitest";

import { normalizeTrendingRepo, parseTrendingHtml } from "../../../src/services/github/trending.js";

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

  it("parses repository rows from GitHub Trending HTML", () => {
    const repos = parseTrendingHtml(`
      <article class="Box-row">
        <h2 class="h3 lh-condensed">
          <a href="/microsoft/BitNet">
            <span class="text-normal">microsoft /</span>
            BitNet
          </a>
        </h2>
        <p class="col-9 color-fg-muted my-1 tmp-pr-4">
          Official inference framework for 1-bit LLMs
        </p>
        <span itemprop="programmingLanguage">Python</span>
      </article>
      <article class="Box-row">
        <h2 class="h3 lh-condensed">
          <a href="/sponsors/obra">
            <span class="text-normal">sponsors /</span>
            obra
          </a>
        </h2>
      </article>
    `);

    expect(repos).toEqual([
      {
        owner: "microsoft",
        name: "BitNet",
        description: "Official inference framework for 1-bit LLMs",
        language: "Python"
      }
    ]);
  });
});
