# Signal Agent to HX Blog Auto Publish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish each Signal Agent daily Markdown report into HX Blog as a normal post stored in MySQL, while keeping the existing local Markdown artifact and per-day idempotent state.

**Architecture:** Keep `signal-agent` as the orchestration owner. The publish step first persists the report into the Signal Agent repo, then uses a focused MySQL-backed blog publisher to insert or reuse a matching `HX Blog` post, and finally records `blogPostId` in the run-state file.

**Tech Stack:** TypeScript, Node.js, Claude Agent SDK, mysql2, Zod, Vitest, file-backed state, git CLI, MySQL

---

## File Map

### Signal Agent runtime and publish flow

- Modify: `signal-agent/package.json`
- Modify: `signal-agent/src/config/runtime.ts`
- Modify: `signal-agent/src/mcp/tools/publish-report.ts`
- Modify: `signal-agent/src/services/reports/history.ts`
- Modify: `signal-agent/src/services/git/publish.ts`

### New HX Blog publishing service inside Signal Agent

- Create: `signal-agent/src/services/blog/connection.ts`
- Create: `signal-agent/src/services/blog/publish.ts`

### Tests

- Modify: `signal-agent/tests/smoke.test.ts`
- Create: `signal-agent/tests/services/blog/publish.test.ts`
- Create: `signal-agent/tests/mcp/publish-report.test.ts`
- Create: `signal-agent/tests/config/runtime.test.ts`

## Chunk 1: Runtime Configuration and Blog Publisher

### Task 1: Add the blog database runtime config

**Files:**
- Modify: `signal-agent/src/config/runtime.ts`
- Test: `signal-agent/tests/config/runtime.test.ts`

- [ ] **Step 1: Write the failing runtime config test**

```ts
import { describe, expect, it } from "vitest";
import { getRuntimeConfig } from "../../src/config/runtime.js";

describe("getRuntimeConfig", () => {
  it("returns the HX Blog database URL when provided", () => {
    const config = getRuntimeConfig({
      ANTHROPIC_API_KEY: "test-key",
      HX_BLOG_DATABASE_URL: "mysql://blog-user:pw@127.0.0.1:3306/hx_blog"
    });

    expect(config.hxBlogDatabaseUrl).toBe(
      "mysql://blog-user:pw@127.0.0.1:3306/hx_blog"
    );
  });
});
```

- [ ] **Step 2: Run the targeted test**

Run: `npm test -- tests/config/runtime.test.ts`

Expected: FAIL because `hxBlogDatabaseUrl` is not in `RuntimeConfig`

- [ ] **Step 3: Extend the runtime config implementation**

Add `HX_BLOG_DATABASE_URL` to the env type and return shape in `signal-agent/src/config/runtime.ts`.

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- tests/config/runtime.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/runtime.ts tests/config/runtime.test.ts
git commit -m "feat: add hx blog database runtime config"
```

### Task 2: Create the MySQL connection helper

**Files:**
- Modify: `signal-agent/package.json`
- Create: `signal-agent/src/services/blog/connection.ts`

- [ ] **Step 1: Add the dependency**

Install: `npm install mysql2`

Expected: `package.json` and lockfile are updated

- [ ] **Step 2: Create the connection factory**

Implement a small helper around `mysql2/promise`:

```ts
import mysql from "mysql2/promise";

export function createBlogConnection(databaseUrl: string) {
  return mysql.createConnection(databaseUrl);
}
```

- [ ] **Step 3: Run the build**

Run: `npm run build`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/services/blog/connection.ts
git commit -m "feat: add hx blog mysql connection helper"
```

### Task 3: Implement blog post publication with duplicate detection

**Files:**
- Create: `signal-agent/src/services/blog/publish.ts`
- Test: `signal-agent/tests/services/blog/publish.test.ts`

- [ ] **Step 1: Write the failing blog publish tests**

Cover at least these cases:

- returns an existing `postId` when a matching title already exists
- inserts a new post when no matching title exists
- maps `title`, `summary`, and `content` correctly from the report inputs

Suggested test shape:

```ts
it("reuses an existing HX Blog post when the title already exists", async () => {
  const query = vi.fn()
    .mockResolvedValueOnce([[{ id: 42 }], []]);

  const result = await publishToHxBlog(
    {
      date: "2026-03-14",
      overview: "Today focuses on agent tooling.",
      markdown: "# report"
    },
    { query }
  );

  expect(result).toEqual({ postId: 42, skipped: true });
});
```

- [ ] **Step 2: Run the targeted test**

Run: `npm test -- tests/services/blog/publish.test.ts`

Expected: FAIL because the module does not exist yet

- [ ] **Step 3: Implement the publisher**

Implement a focused service that:

- generates `title` as `GitHub Trending 日报 - ${date}`
- selects `id` from `Post` by exact title
- inserts into `Post(title, summary, content, createdAt)` when missing
- returns `{ postId, skipped }`

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- tests/services/blog/publish.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/blog/publish.ts tests/services/blog/publish.test.ts
git commit -m "feat: add hx blog post publisher"
```

## Chunk 2: Persist Blog Publication State in the Daily Publish Flow

### Task 4: Extend the run-state model with blog publication metadata

**Files:**
- Modify: `signal-agent/src/services/reports/history.ts`
- Test: `signal-agent/tests/mcp/publish-report.test.ts`

- [ ] **Step 1: Write the failing state assertion in the publish-report test**

Add an expectation that a successful publish saves:

```ts
expect(save).toHaveBeenCalledWith(
  expect.objectContaining({
    date: "2026-03-14",
    status: "published",
    blogPostId: 99
  })
);
```

- [ ] **Step 2: Run the targeted test**

Run: `npm test -- tests/mcp/publish-report.test.ts`

Expected: FAIL because `blogPostId` is not part of the current state

- [ ] **Step 3: Extend `RunState`**

Add:

- `blogPostId?: number`
- optional publication failure source if useful, for example `failureStage?: "git" | "blog" | "state"`

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- tests/mcp/publish-report.test.ts`

Expected: still FAIL until the publish tool is updated in the next task

- [ ] **Step 5: Commit**

```bash
git add src/services/reports/history.ts tests/mcp/publish-report.test.ts
git commit -m "feat: extend report history with blog publish metadata"
```

### Task 5: Update the publish tool to publish to HX Blog after writing the report

**Files:**
- Modify: `signal-agent/src/mcp/tools/publish-report.ts`
- Modify: `signal-agent/src/services/git/publish.ts`
- Test: `signal-agent/tests/mcp/publish-report.test.ts`

- [ ] **Step 1: Write the failing publish tool tests**

Cover at least:

- saves the Markdown report and git commit result first
- publishes the Markdown to HX Blog and stores `blogPostId`
- skips publication if the daily state is already published
- surfaces a failure when the HX Blog insert throws

- [ ] **Step 2: Run the targeted tests**

Run: `npm test -- tests/mcp/publish-report.test.ts`

Expected: FAIL because the current tool only writes git state

- [ ] **Step 3: Refactor `publish-report.ts` for dependency injection**

Make the tool implementation call injected dependencies for:

- `historyStore.canPublish`
- `publishReport` from the git service
- `publishToHxBlog` from the new blog service
- `historyStore.save`

This keeps the logic unit-testable without a live database or git repo.

- [ ] **Step 4: Update the success state payload**

Save:

- `status: "published"`
- `selectedRepos`
- `reportPath`
- `commitHash`
- `blogPostId`

- [ ] **Step 5: Handle blog publication failure**

When the blog publish step throws:

- save `status: "failed"`
- save `failureReason`
- optionally save `failureStage: "blog"`
- rethrow or return an error result that makes the run fail visibly

- [ ] **Step 6: Re-run the targeted tests**

Run: `npm test -- tests/mcp/publish-report.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/mcp/tools/publish-report.ts src/services/git/publish.ts tests/mcp/publish-report.test.ts
git commit -m "feat: publish daily reports into hx blog"
```

## Chunk 3: Verify End-to-End Behavior

### Task 6: Add or refresh a smoke test for the new flow

**Files:**
- Modify: `signal-agent/tests/smoke.test.ts`

- [ ] **Step 1: Add a basic assertion for the new publish path**

Keep this light. The smoke test should only verify the test harness still runs cleanly after the new service is added.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: PASS

- [ ] **Step 3: Run the TypeScript build**

Run: `npm run build`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/smoke.test.ts
git commit -m "test: verify hx blog auto publish flow"
```

### Task 7: Perform a manual integration check against local HX Blog services

**Files:**
- No code changes required

- [ ] **Step 1: Prepare environment variables**

Set:

- `ANTHROPIC_API_KEY`
- `HX_BLOG_DATABASE_URL`

Optional if needed for the existing report logic:

- `GITHUB_TOKEN`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_MODEL`

- [ ] **Step 2: Run a local daily report generation**

Run: `npm run daily`

Expected:

- a report file is created under `reports/`
- the run state file includes `blogPostId`

- [ ] **Step 3: Verify the blog database row**

Run a SQL check such as:

```sql
SELECT id, title, createdAt
FROM Post
WHERE title = 'GitHub Trending 日报 - 2026-03-14';
```

Expected: one row exists

- [ ] **Step 4: Verify the blog UI**

Start `hx-blog`, open the homepage, and confirm the new article appears and the detail page renders the Markdown.

- [ ] **Step 5: Re-run the daily job for the same date**

Run: `npm run daily`

Expected: no duplicate `Post` row is inserted

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: verify local hx blog auto publish integration"
```
