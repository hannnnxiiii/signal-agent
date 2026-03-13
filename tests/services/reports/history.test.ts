import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createFileBackedHistoryStore } from "../../../src/services/reports/history";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("history store", () => {
  it("writes and reloads the latest run state", async () => {
    const root = await mkdtemp(join(tmpdir(), "signal-agent-history-"));
    tempDirs.push(root);

    const store = createFileBackedHistoryStore(root);

    await store.save({
      date: "2026-03-14",
      status: "published",
      selectedRepos: ["acme/agent-ui"],
      reportPath: "reports/daily/2026-03-14.md"
    });

    const loaded = await store.load("2026-03-14");

    expect(loaded?.status).toBe("published");
    expect(loaded?.selectedRepos).toEqual(["acme/agent-ui"]);
  });
});
