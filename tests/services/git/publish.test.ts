import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { publishReport } from "../../../src/services/git/publish.js";

describe("publishReport", () => {
  it("writes the report, commits it, and returns the commit hash", async () => {
    const root = await mkdtemp(join(tmpdir(), "signal-agent-publish-"));
    const execFile = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "" })
      .mockResolvedValueOnce({ stdout: "" })
      .mockResolvedValueOnce({ stdout: "abc123\n" });
    const reportPath = join(root, "reports/daily/2026-03-14.md");

    const result = await publishReport({ reportPath, markdown: "# report" }, { execFile });

    expect(execFile).toHaveBeenNthCalledWith(1, "git", ["add", reportPath]);
    expect(execFile).toHaveBeenNthCalledWith(2, "git", [
      "commit",
      "-m",
      "feat: add daily report 2026-03-14"
    ]);
    expect(execFile).toHaveBeenNthCalledWith(3, "git", ["rev-parse", "HEAD"]);
    expect(result.commitHash).toBe("abc123");

    await rm(root, { recursive: true, force: true });
  });
});
