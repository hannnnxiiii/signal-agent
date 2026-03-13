import { describe, expect, it } from "vitest";

import { buildAgentOptions } from "../../src/agent/options.js";

describe("buildAgentOptions", () => {
  it("loads project settings and MCP tool allowlist", () => {
    const options = buildAgentOptions();

    expect(options.settingSources).toEqual(["project"]);
    expect(options.allowedTools).toContain("mcp__signal_daily__fetch_trending");
    expect(options.permissionMode).toBe("bypassPermissions");
    expect(options.maxTurns).toBe(12);
  });
});
