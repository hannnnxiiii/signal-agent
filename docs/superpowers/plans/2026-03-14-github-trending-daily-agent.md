# GitHub Trending Daily Agent Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily GitHub Trending report agent that runs on Claude Agent SDK, uses a Kimi Anthropic-compatible backend, curates about five frontend/full-stack/agent repositories, writes a Markdown report, and publishes it to this repository.

**Architecture:** The implementation keeps Claude Agent SDK as the main loop runtime and exposes all external actions through a local MCP server. Core business logic stays in focused TypeScript service modules, while `CLAUDE.md`, YAML rules, and a Markdown template constrain the agent's behavior and output shape.

**Tech Stack:** TypeScript, Node.js, Claude Agent SDK, Zod, Vitest, YAML, simple file-based state, git CLI

---

## File Map

### Runtime and configuration

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `CLAUDE.md`
- Create: `src/app/generate-daily-report.ts`
- Create: `src/app/scheduler.ts`
- Create: `src/agent/query.ts`
- Create: `src/agent/options.ts`
- Create: `src/agent/allowed-tools.ts`

### MCP server and tools

- Create: `src/mcp/server.ts`
- Create: `src/mcp/tools/fetch-trending.ts`
- Create: `src/mcp/tools/get-repo-details.ts`
- Create: `src/mcp/tools/load-report-history.ts`
- Create: `src/mcp/tools/select-candidates.ts`
- Create: `src/mcp/tools/compose-report.ts`
- Create: `src/mcp/tools/publish-report.ts`

### Services and shared types

- Create: `src/services/github/trending.ts`
- Create: `src/services/github/repo.ts`
- Create: `src/services/reports/composer.ts`
- Create: `src/services/reports/history.ts`
- Create: `src/services/git/publish.ts`
- Create: `src/rules/daily-report.yaml`
- Create: `src/templates/daily-report.md`
- Create: `src/types/daily-report.ts`

### Tests

- Create: `tests/services/github/trending.test.ts`
- Create: `tests/services/reports/history.test.ts`
- Create: `tests/services/reports/composer.test.ts`
- Create: `tests/services/git/publish.test.ts`
- Create: `tests/mcp/select-candidates.test.ts`
- Create: `tests/agent/options.test.ts`
- Create: `tests/test-helpers/history-store.ts`

## Chunk 1: Project Skeleton and Test Harness

### Task 1: Bootstrap the TypeScript workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Write the package manifest**

```json
{
  "name": "signal-agent",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "daily": "node --loader tsx src/app/generate-daily-report.ts",
    "schedule": "node --loader tsx src/app/scheduler.ts"
  }
}
```

- [ ] **Step 2: Write the TypeScript compiler config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist"
  },
  "include": ["src", "tests", "vitest.config.ts"]
}
```

- [ ] **Step 3: Add the initial ignore rules**

```gitignore
node_modules
dist
.env
data/cache
data/state/*.tmp.json
```

- [ ] **Step 4: Install dependencies**

Run: `npm install @anthropic-ai/claude-agent-sdk zod yaml`

Expected: install completes without peer dependency errors

- [ ] **Step 5: Install dev dependencies**

Run: `npm install -D typescript tsx vitest @types/node`

Expected: install completes and `package-lock.json` is created

- [ ] **Step 6: Run the empty build**

Run: `npm run build`

Expected: FAIL because `src/` files do not exist yet

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore
git commit -m "chore: bootstrap typescript workspace"
```

### Task 2: Add the test runner and a passing smoke test

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Write the initial smoke test**

```ts
import { describe, expect, it } from "vitest";

describe("workspace", () => {
  it("runs tests", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Write the Vitest config**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
```

- [ ] **Step 3: Run the test suite**

Run: `npm test`

Expected: PASS with one passing smoke test

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/smoke.test.ts
git commit -m "test: add vitest harness"
```

## Chunk 2: Domain Types, Rules, and Report Rendering

### Task 3: Define the daily report types

**Files:**
- Create: `src/types/daily-report.ts`
- Test: `tests/services/reports/composer.test.ts`

- [ ] **Step 1: Write the failing composer test using desired types**

```ts
import { describe, expect, it } from "vitest";
import { composeDailyReport } from "../../../src/services/reports/composer";

describe("composeDailyReport", () => {
  it("renders a markdown report with selected repositories", () => {
    const markdown = composeDailyReport({
      date: "2026-03-14",
      overview: "Agent tooling is rising on Trending.",
      picks: [
        {
          owner: "acme",
          name: "agent-ui",
          url: "https://github.com/acme/agent-ui",
          category: "frontend",
          summary: "A UI toolkit for agent apps.",
          whyItMatters: "Useful for frontend agent interfaces."
        }
      ],
      closingNote: "Expect more agent-native UI repos this week."
    });

    expect(markdown).toContain("# GitHub Trending Daily Report - 2026-03-14");
    expect(markdown).toContain("[acme/agent-ui](https://github.com/acme/agent-ui)");
  });
});
```

- [ ] **Step 2: Create the shared types**

```ts
export type RepoCategory = "frontend" | "full-stack" | "agent" | "hybrid";

export interface SelectedRepo {
  owner: string;
  name: string;
  url: string;
  category: RepoCategory;
  summary: string;
  whyItMatters: string;
}

export interface DailyReport {
  date: string;
  overview: string;
  picks: SelectedRepo[];
  closingNote: string;
}
```

- [ ] **Step 3: Add a placeholder composer implementation so the test can compile**

```ts
import type { DailyReport } from "../../types/daily-report";

export function composeDailyReport(_report: DailyReport): string {
  return "";
}
```

- [ ] **Step 4: Run the test**

Run: `npm test -- tests/services/reports/composer.test.ts`

Expected: FAIL because the placeholder returns an empty string

- [ ] **Step 5: Commit**

```bash
git add src/types/daily-report.ts src/services/reports/composer.ts tests/services/reports/composer.test.ts
git commit -m "test: define report types and composer contract"
```

### Task 4: Add the Markdown template and report composer

**Files:**
- Create: `src/templates/daily-report.md`
- Modify: `src/services/reports/composer.ts`
- Test: `tests/services/reports/composer.test.ts`

- [ ] **Step 1: Create the report template**

```md
# GitHub Trending Daily Report - {{date}}

## Overview
{{overview}}

## Picks
{{picks}}

## Closing Note
{{closingNote}}
```

- [ ] **Step 2: Implement the minimal composer**

```ts
import { readFileSync } from "node:fs";
import type { DailyReport } from "../../types/daily-report";

const template = readFileSync(
  new URL("../../templates/daily-report.md", import.meta.url),
  "utf8"
);

export function composeDailyReport(report: DailyReport): string {
  const picks = report.picks
    .map((pick, index) =>
      [
        `### ${index + 1}. [${pick.owner}/${pick.name}](${pick.url})`,
        `- Category: ${pick.category}`,
        `- Summary: ${pick.summary}`,
        `- Why it matters: ${pick.whyItMatters}`
      ].join("\n")
    )
    .join("\n\n");

  return template
    .replace("{{date}}", report.date)
    .replace("{{overview}}", report.overview)
    .replace("{{picks}}", picks)
    .replace("{{closingNote}}", report.closingNote);
}
```

- [ ] **Step 3: Run the composer test**

Run: `npm test -- tests/services/reports/composer.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/templates/daily-report.md src/services/reports/composer.ts tests/services/reports/composer.test.ts
git commit -m "feat: add markdown report composer"
```

### Task 5: Add structured rules and project instructions

**Files:**
- Create: `src/rules/daily-report.yaml`
- Create: `CLAUDE.md`

- [ ] **Step 1: Write the rules file**

```yaml
maxPicks: 5
dedupeWindowDays: 7
allowedCategories:
  - frontend
  - full-stack
  - agent
  - hybrid
requireWhyItMatters: true
allowFewerWhenWeak: true
```

- [ ] **Step 2: Write the project instructions**

```md
# Signal Agent Instructions

You are the daily GitHub Trending report editor.

- Prioritize repositories that are strongly related to frontend, full-stack, or agents.
- Prefer clarity and specific reasons over generic hype.
- Never publish more than five repositories in one daily report.
- Avoid repeating repositories that appeared in the recent report history.
- If the candidate quality is weak, publish fewer than five picks instead of padding.
```

- [ ] **Step 3: Commit**

```bash
git add src/rules/daily-report.yaml CLAUDE.md
git commit -m "docs: add report rules and agent instructions"
```

## Chunk 3: State, Data Retrieval, and Publishing Services

### Task 6: Implement report history persistence with tests

**Files:**
- Create: `src/services/reports/history.ts`
- Test: `tests/services/reports/history.test.ts`

- [ ] **Step 1: Write the failing history test**

```ts
import { describe, expect, it } from "vitest";
import { createTempHistoryStore } from "../test-helpers/history-store";

describe("history store", () => {
  it("writes and reloads the latest run state", async () => {
    const store = await createTempHistoryStore();
    await store.save({
      date: "2026-03-14",
      status: "published",
      selectedRepos: ["acme/agent-ui"],
      reportPath: "reports/daily/2026-03-14.md"
    });

    const loaded = await store.load("2026-03-14");
    expect(loaded?.status).toBe("published");
  });
});
```

- [ ] **Step 2: Implement the minimal file-backed history store**

```ts
export interface RunState {
  date: string;
  status: "started" | "published" | "failed";
  selectedRepos: string[];
  reportPath?: string;
  commitHash?: string;
  failureReason?: string;
}
```

- [ ] **Step 3: Add any missing test helper needed to isolate file IO**

```ts
// createTempHistoryStore returns a store rooted in a temporary directory
```

- [ ] **Step 4: Run the history test**

Run: `npm test -- tests/services/reports/history.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/reports/history.ts tests/services/reports/history.test.ts tests/test-helpers/history-store.ts
git commit -m "feat: add file-backed run history"
```

### Task 7: Implement Trending normalization with tests

**Files:**
- Create: `src/services/github/trending.ts`
- Test: `tests/services/github/trending.test.ts`

- [ ] **Step 1: Write the failing normalization test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeTrendingRepo } from "../../../src/services/github/trending";

describe("normalizeTrendingRepo", () => {
  it("normalizes owner, name, description, and language", () => {
    const repo = normalizeTrendingRepo({
      repo: "acme/agent-ui",
      description: "Agent UI kit",
      language: "TypeScript"
    });

    expect(repo.owner).toBe("acme");
    expect(repo.name).toBe("agent-ui");
    expect(repo.language).toBe("TypeScript");
  });
});
```

- [ ] **Step 2: Implement the minimal normalization code**

```ts
export interface TrendingRepo {
  owner: string;
  name: string;
  description: string;
  language?: string;
}

export function normalizeTrendingRepo(input: {
  repo: string;
  description?: string;
  language?: string;
}): TrendingRepo {
  const [owner, name] = input.repo.split("/");
  return {
    owner,
    name,
    description: input.description ?? "",
    language: input.language
  };
}
```

- [ ] **Step 3: Run the Trending test**

Run: `npm test -- tests/services/github/trending.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/github/trending.ts tests/services/github/trending.test.ts
git commit -m "feat: add trending normalization"
```

### Task 8: Implement git publication with tests

**Files:**
- Create: `src/services/git/publish.ts`
- Test: `tests/services/git/publish.test.ts`

- [ ] **Step 1: Write the failing publish test**

```ts
import { describe, expect, it, vi } from "vitest";
import { publishReport } from "../../../src/services/git/publish";

describe("publishReport", () => {
  it("writes the report, commits it, and returns the commit hash", async () => {
    const execFile = vi.fn().mockResolvedValue({ stdout: "abc123\n" });
    const result = await publishReport(
      {
        reportPath: "reports/daily/2026-03-14.md",
        markdown: "# report"
      },
      { execFile }
    );

    expect(execFile).toHaveBeenCalled();
    expect(result.commitHash).toBe("abc123");
  });
});
```

- [ ] **Step 2: Implement the minimal publisher**

```ts
export async function publishReport(
  input: { reportPath: string; markdown: string },
  deps = defaultDeps
) {
  await fs.mkdir(dirname(input.reportPath), { recursive: true });
  await fs.writeFile(input.reportPath, input.markdown, "utf8");
  await deps.execFile("git", ["add", input.reportPath]);
  await deps.execFile("git", ["commit", "-m", `feat: add daily report ${basename(input.reportPath, ".md")}`]);
  const { stdout } = await deps.execFile("git", ["rev-parse", "HEAD"]);
  return { commitHash: stdout.trim() };
}
```

- [ ] **Step 3: Run the publish test**

Run: `npm test -- tests/services/git/publish.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/git/publish.ts tests/services/git/publish.test.ts
git commit -m "feat: add git publication service"
```

## Chunk 4: Agent Runtime and MCP Surface

### Task 9: Implement agent options and allowed tools with tests

**Files:**
- Create: `src/agent/allowed-tools.ts`
- Create: `src/agent/options.ts`
- Test: `tests/agent/options.test.ts`

- [ ] **Step 1: Write the failing options test**

```ts
import { describe, expect, it } from "vitest";
import { buildAgentOptions } from "../../src/agent/options";

describe("buildAgentOptions", () => {
  it("loads project settings and MCP tool allowlist", () => {
    const options = buildAgentOptions();
    expect(options.settingSources).toEqual(["project"]);
    expect(options.allowedTools).toContain("mcp__signal_daily__fetch_trending");
  });
});
```

- [ ] **Step 2: Implement the tool allowlist**

```ts
export const DAILY_REPORT_ALLOWED_TOOLS = [
  "mcp__signal_daily__fetch_trending",
  "mcp__signal_daily__get_repo_details",
  "mcp__signal_daily__load_report_history",
  "mcp__signal_daily__select_candidates",
  "mcp__signal_daily__compose_report",
  "mcp__signal_daily__publish_report"
];
```

- [ ] **Step 3: Implement the minimal options builder**

```ts
import { DAILY_REPORT_ALLOWED_TOOLS } from "./allowed-tools";

export function buildAgentOptions() {
  return {
    settingSources: ["project"] as const,
    allowedTools: DAILY_REPORT_ALLOWED_TOOLS,
    permissionMode: "bypassPermissions" as const,
    maxTurns: 12
  };
}
```

- [ ] **Step 4: Run the options test**

Run: `npm test -- tests/agent/options.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agent/allowed-tools.ts src/agent/options.ts tests/agent/options.test.ts
git commit -m "feat: add agent runtime options"
```

### Task 10: Implement MCP tools around the services

**Files:**
- Create: `src/mcp/server.ts`
- Create: `src/mcp/tools/fetch-trending.ts`
- Create: `src/mcp/tools/get-repo-details.ts`
- Create: `src/mcp/tools/load-report-history.ts`
- Create: `src/mcp/tools/select-candidates.ts`
- Create: `src/mcp/tools/compose-report.ts`
- Create: `src/mcp/tools/publish-report.ts`
- Test: `tests/mcp/select-candidates.test.ts`

- [ ] **Step 1: Write the failing candidate selection tool test**

```ts
import { describe, expect, it } from "vitest";
import { selectCandidates } from "../../src/mcp/tools/select-candidates";

describe("selectCandidates", () => {
  it("drops recent duplicates and limits picks to five", async () => {
    const result = await selectCandidates({
      candidates: [
        { owner: "acme", name: "agent-ui", description: "Agent UI", language: "TypeScript" }
      ],
      recentRepoNames: ["acme/agent-ui"]
    });

    expect(result.selected).toEqual([]);
  });
});
```

- [ ] **Step 2: Implement the candidate selection tool**

```ts
export async function selectCandidates(args: {
  candidates: Array<{ owner: string; name: string; description: string; language?: string }>;
  recentRepoNames: string[];
}) {
  const selected = args.candidates
    .filter((candidate) => !args.recentRepoNames.includes(`${candidate.owner}/${candidate.name}`))
    .slice(0, 5);

  return { selected };
}
```

- [ ] **Step 3: Implement the remaining MCP tools by wrapping the service modules**

```ts
// Example shape for one tool
export async function fetchTrendingTool() {
  const repos = await fetchTrending();
  return { content: [{ type: "text", text: JSON.stringify(repos) }] };
}
```

- [ ] **Step 4: Register all tools in `src/mcp/server.ts`**

```ts
import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
```

- [ ] **Step 5: Run the MCP tool test**

Run: `npm test -- tests/mcp/select-candidates.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/mcp/server.ts src/mcp/tools tests/mcp/select-candidates.test.ts
git commit -m "feat: add mcp tools for daily report workflow"
```

## Chunk 5: End-to-End Task Entry and Scheduler

### Task 11: Implement the report query entrypoint

**Files:**
- Create: `src/agent/query.ts`
- Create: `src/app/generate-daily-report.ts`

- [ ] **Step 1: Write the task prompt in code**

```ts
const DAILY_PROMPT = `
Generate today's GitHub Trending daily report.

- Focus on frontend, full-stack, and agent repositories
- Use MCP tools for all external actions
- Publish at most five repositories
- Skip duplicates from recent history
`;
```

- [ ] **Step 2: Implement the query wrapper**

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildAgentOptions } from "./options";

export function runDailyReportQuery() {
  return query({
    prompt: DAILY_PROMPT,
    options: buildAgentOptions()
  });
}
```

- [ ] **Step 3: Implement the CLI entrypoint**

```ts
for await (const message of runDailyReportQuery()) {
  if ("result" in message) {
    console.log(message.result);
  }
}
```

- [ ] **Step 4: Run the build**

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/agent/query.ts src/app/generate-daily-report.ts
git commit -m "feat: add daily report agent entrypoint"
```

### Task 12: Implement the scheduler and environment contract

**Files:**
- Create: `src/app/scheduler.ts`
- Create: `.env.example`

- [ ] **Step 1: Write the environment example**

```env
ANTHROPIC_API_KEY=replace-me
ANTHROPIC_BASE_URL=https://replace-me
GITHUB_TOKEN=replace-me
```

- [ ] **Step 2: Implement the scheduler with one daily trigger**

```ts
import { setInterval } from "node:timers";

// Replace this with the chosen scheduling library if needed during implementation.
```

- [ ] **Step 3: Make the scheduler call the daily report entrypoint**

```ts
await runDailyReportOnce();
```

- [ ] **Step 4: Run the typecheck and tests**

Run: `npm run build && npm test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/scheduler.ts .env.example
git commit -m "feat: add scheduler and environment contract"
```

## Chunk 6: Final Hardening

### Task 13: Add idempotency checks before publication

**Files:**
- Modify: `src/services/reports/history.ts`
- Modify: `src/services/git/publish.ts`
- Modify: `src/mcp/tools/publish-report.ts`
- Test: `tests/services/reports/history.test.ts`

- [ ] **Step 1: Write the failing idempotency test**

```ts
it("skips publication when the same date is already published", async () => {
  // save published state for 2026-03-14
  // attempt to publish again
  // expect skip result
});
```

- [ ] **Step 2: Implement a `canPublish(date)` check in history**

```ts
export async function canPublish(date: string): Promise<boolean> {
  const current = await load(date);
  return current?.status !== "published";
}
```

- [ ] **Step 3: Gate `publishReport` on the history check**

```ts
if (!(await history.canPublish(date))) {
  return { skipped: true, reason: "already_published" };
}
```

- [ ] **Step 4: Run the targeted tests**

Run: `npm test -- tests/services/reports/history.test.ts tests/services/git/publish.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/reports/history.ts src/services/git/publish.ts src/mcp/tools/publish-report.ts tests/services/reports/history.test.ts
git commit -m "feat: enforce idempotent publication"
```

### Task 14: Add a mocked integration test for one full report run

**Files:**
- Create: `tests/integration/generate-daily-report.test.ts`
- Modify: `src/app/generate-daily-report.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
import { describe, expect, it } from "vitest";

describe("generate daily report", () => {
  it("runs one complete mocked daily report flow", async () => {
    // mock Trending, history, and publish dependencies
    // expect one markdown report and a published result
  });
});
```

- [ ] **Step 2: Refactor the entrypoint so dependencies can be injected in tests**

```ts
export async function runDailyReportOnce(deps = defaultDeps) {
  // use deps.query or deps.executor for testability
}
```

- [ ] **Step 3: Run the full suite**

Run: `npm test`

Expected: PASS

- [ ] **Step 4: Run the final build**

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/integration/generate-daily-report.test.ts src/app/generate-daily-report.ts
git commit -m "test: add mocked daily report integration coverage"
```

## Notes for the Implementer

- Keep files small and focused. If any module starts mixing SDK setup, business rules, and file IO, split it before continuing.
- Do not add extra sources, ranking algorithms, or multi-agent coordination in v1.
- Prefer deterministic string rendering for the final Markdown over fully free-form model output.
- Keep MCP tools factual and executable; keep editorial judgment in the main agent loop.
- If Claude Agent SDK requires a slightly different MCP registration API than expected, adapt the server wrapper without changing the service boundaries in this plan.
- If scheduling needs a dedicated library after implementation starts, add the smallest library that cleanly supports one daily run in Asia/Shanghai.
