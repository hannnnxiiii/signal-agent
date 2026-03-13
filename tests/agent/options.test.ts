import { describe, expect, it } from "vitest";

import { buildAgentOptions } from "../../src/agent/options.js";

describe("buildAgentOptions", () => {
  it("loads project settings and MCP tool allowlist", () => {
    const options = buildAgentOptions({
      anthropicApiKey: "kimi-key",
      anthropicBaseUrl: "https://kimi.example.com/anthropic",
      githubToken: "github-token",
      model: "kimi-model"
    });

    expect(options.settingSources).toEqual(["project"]);
    expect(options.allowedTools).toContain("mcp__signal_daily__fetch_trending");
    expect(options.permissionMode).toBe("bypassPermissions");
    expect(options.allowDangerouslySkipPermissions).toBe(true);
    expect(options.maxTurns).toBe(12);
    expect(options.model).toBe("kimi-model");
  });
});
