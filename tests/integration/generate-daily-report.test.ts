import { describe, expect, it } from "vitest";

import { runDailyReportOnce } from "../../src/app/generate-daily-report.js";

describe("generate daily report", () => {
  it("returns the completed result from a mocked query stream", async () => {
    async function* queryStream() {
      yield { type: "assistant", message: { content: [] } };
      yield { type: "result", result: "published", subtype: "success" };
    }

    const result = await runDailyReportOnce({
      runQuery: () => queryStream()
    });

    expect(result).toBe("published");
  });
});
