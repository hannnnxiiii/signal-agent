import { describe, expect, it, vi } from "vitest";

import { publishReport } from "../../../src/services/git/publish";

describe("publishReport", () => {
  it("writes the report, commits it, and returns the commit hash", async () => {
    const execFile = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "" })
      .mockResolvedValueOnce({ stdout: "" })
      .mockResolvedValueOnce({ stdout: "abc123\n" });

    const result = await publishReport(
      {
        reportPath: "reports/daily/2026-03-14.md",
        markdown: "# report"
      },
      { execFile }
    );

    expect(execFile).toHaveBeenNthCalledWith(1, "git", ["add", "reports/daily/2026-03-14.md"]);
    expect(execFile).toHaveBeenNthCalledWith(2, "git", [
      "commit",
      "-m",
      "feat: add daily report 2026-03-14"
    ]);
    expect(execFile).toHaveBeenNthCalledWith(3, "git", ["rev-parse", "HEAD"]);
    expect(result.commitHash).toBe("abc123");
  });
});
