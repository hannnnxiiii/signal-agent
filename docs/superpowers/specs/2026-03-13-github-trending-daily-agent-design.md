# GitHub Trending Daily Agent Design

Date: 2026-03-13
Status: Approved for planning

## Summary

Build a daily GitHub Trending report agent using Claude Agent SDK as the agent loop runtime. The agent runs automatically every day at 09:00 Asia/Shanghai, curates roughly five repositories related to frontend, full-stack, or agents, generates a Markdown report, and commits the report back into this repository.

The runtime is designed around:

- Claude Agent SDK for the main agent loop
- A Kimi endpoint used as the primary model backend through an Anthropic-compatible API configuration
- MCP tools as the agent's execution surface
- `CLAUDE.md` plus structured rules for durable behavior constraints
- Markdown reports in-repo as the final published artifact

## Goals

- Generate one readable daily Markdown report from GitHub Trending
- Focus on frontend, full-stack, and agent-related repositories
- Use an agent-oriented architecture rather than a one-off script
- Make the system extendable through tools, MCP capabilities, rules, and reusable prompts
- Keep daily runs stable, idempotent, and debuggable

## Non-Goals

- Building a multi-agent newsroom in the first version
- Supporting many content sources beyond GitHub Trending in v1
- Creating a fully autonomous editorial voice with unconstrained free-form output
- Optimizing for maximum repository coverage over report quality

## Assumptions

- The chosen Kimi endpoint can act as the main model backend for Claude Agent SDK via Anthropic-compatible API settings already proven to work in Claude Code
- GitHub Trending is the primary discovery source in v1
- The report should be committed back to this repository automatically
- Daily runs should skip duplicate publication for the same calendar date unless the previous run is incomplete or failed

## User-Facing Outcome

Each day the system produces one file at:

`reports/daily/YYYY-MM-DD.md`

The report should include:

- A title with the report date
- A short daily overview
- Around five curated repositories
- For each repository: name, link, category, short summary, and why it is worth attention
- A short closing observation about the day's trend

## Architecture

The design uses four layers.

### 1. Agent Loop

Claude Agent SDK owns the execution loop for the daily task. The agent receives the goal, decides which MCP tool to call next, reasons over retrieved context, and stops when the report is published or a terminal failure is recorded.

Important runtime characteristics:

- `query(...)` is the main execution entrypoint
- `settingSources: ["project"]` is used so project-level `CLAUDE.md` instructions are loaded
- `allowedTools` is managed explicitly to constrain the agent's execution surface
- `maxTurns` and other runtime limits are configured to avoid unbounded loops

### 2. Model Backend

The primary model backend is Kimi through an Anthropic-compatible API path, configured the same way the team already uses it successfully in Claude Code.

This means:

- The project treats Kimi as the main loop model, not as a sidecar summarization tool
- Runtime configuration should isolate endpoint and credential setup from task logic
- If backend configuration changes later, the agent task and MCP tools should remain mostly unchanged

### 3. MCP Capability Layer

MCP is the agent's action surface. The server exposes both low-level and higher-level report capabilities.

Low-level examples:

- fetch GitHub Trending data
- read repository details
- read report history and state
- write report files
- publish git changes

Higher-level examples:

- prepare today's candidate set
- compose the final daily report from structured inputs
- publish today's report and update state

### 4. Behavior Constraints

Behavior is governed by two durable mechanisms:

- `CLAUDE.md` for project-wide operating instructions
- `rules/daily-report.yaml` for structured editorial constraints such as count limits, category rules, deduplication windows, and output requirements

## Daily Execution Flow

The daily report run should proceed as follows:

1. Scheduler triggers the task at 09:00 Asia/Shanghai.
2. Agent starts a daily-report query with project settings and allowed MCP tools.
3. Agent collects the current GitHub Trending candidate list.
4. Agent loads recent report history and prior run state.
5. Agent filters obvious non-matches and removes recent duplicates.
6. Agent reviews candidate repositories, gathers extra metadata when needed, and selects about five entries spanning frontend, full-stack, and agent topics when quality allows.
7. Agent composes the Markdown report from a stable template.
8. Agent writes `reports/daily/YYYY-MM-DD.md`.
9. Agent commits and pushes the report.
10. Agent records final run status, selected repositories, and publication metadata.

## Selection Strategy

Selection uses a hybrid strategy:

- Rule-based pre-filtering first
- Agent judgment second

Pre-filtering should use fields like:

- repository name
- description
- topics
- language
- README snippets or metadata when available

Agent judgment then decides:

- whether the repository is truly relevant
- which category it belongs to
- whether it deserves inclusion today
- how to summarize it clearly

Selection rules:

- Aim for about five repositories
- Prioritize quality over count
- Avoid recommending repositories that appeared in recent reports
- Avoid filling the report with one narrow subcategory when better topical spread is available
- Allow fewer than five selections if the candidate pool is weak

## Repository Structure

The project should start with a structure aligned to Claude Agent SDK's real abstractions rather than an overbuilt custom runtime:

```text
signal-agent/
  src/
    app/
      generate-daily-report.ts
      scheduler.ts
    agent/
      query.ts
      options.ts
      allowed-tools.ts
    mcp/
      server.ts
      tools/
        fetch-trending.ts
        get-repo-details.ts
        load-report-history.ts
        select-candidates.ts
        compose-report.ts
        publish-report.ts
    services/
      github/
        trending.ts
        repo.ts
      reports/
        composer.ts
        history.ts
      git/
        publish.ts
    rules/
      daily-report.yaml
    templates/
      daily-report.md
    types/
      daily-report.ts
  reports/
    daily/
  data/
    state/
    cache/
  CLAUDE.md
  .env.example
  docs/
    superpowers/
      specs/
```

## Key File Responsibilities

### `CLAUDE.md`

Stores durable project instructions for the agent, especially editorial standards and operating discipline.

### `src/app/generate-daily-report.ts`

Main task entrypoint for one daily report run.

### `src/app/scheduler.ts`

Connects time-based execution to the daily report task.

### `src/agent/query.ts`

Wraps the Claude Agent SDK query entrypoint for this project.

### `src/agent/options.ts`

Builds shared SDK options, including settings loading, permission mode, MCP configuration, environment passthrough, and runtime guards.

### `src/agent/allowed-tools.ts`

Maintains the allowlist for MCP tools the agent may call during daily runs.

### `src/mcp/server.ts`

Registers all MCP tools and exposes them to the agent runtime.

### `src/mcp/tools/*`

Agent-facing tool definitions. Each tool should validate input, call lower-level services, and return stable structured results.

### `src/services/github/*`

GitHub and Trending data retrieval logic. These modules should not know anything about the agent runtime.

### `src/services/reports/composer.ts`

Builds the Markdown report from structured selected items and template rules.

### `src/services/reports/history.ts`

Loads and updates run history, deduplication memory, and publication state.

### `src/services/git/publish.ts`

Handles file writes, commit creation, and push logic for report publication.

### `src/rules/daily-report.yaml`

Stores structured rules such as:

- max selected repository count
- allowed topic families
- duplicate lookback window
- required fields in report entries
- minimum report completeness before publication

## Error Handling

The runtime should distinguish at least four failure classes:

### Data Source Failure

Examples:

- Trending fetch failure
- page structure change
- API timeout

Handling:

- retry with limits
- record failure details
- do not proceed to publish incomplete content silently

### Model Failure

Examples:

- backend timeout
- malformed output
- repeated non-converging reasoning

Handling:

- use runtime limits such as `maxTurns`
- prefer structured tool results to reduce fragile parsing
- record enough details for replay or manual rerun

### Publication Failure

Examples:

- file write failure
- commit failure
- push rejection

Handling:

- keep generated content locally when possible
- separate write, commit, and push steps
- persist partial success state so the run can be recovered

### Loop Control Failure

Examples:

- repeated calls without progress
- tool thrashing
- failure to reach completion

Handling:

- explicit stop conditions
- bounded turns
- run status updates with terminal reason

## Idempotency and State

The report date is the primary idempotency key.

Expected behavior:

- Output path is fixed per day
- Re-running the same day should detect whether publication already succeeded
- Successful publication should default to skip on repeat runs
- Failed or partial runs may be resumed or repaired

Recommended state fields:

- date
- status
- selected repositories
- report path
- commit hash
- updated at
- last failure reason

State should live in `data/state/` rather than being inferred only from report files.

## Testing Strategy

Testing should focus on stability and deterministic behavior.

### Unit Tests

Cover:

- data normalization
- filtering logic
- deduplication checks
- Markdown composition
- idempotency decisions

### MCP Tool Tests

Cover:

- schema validation
- expected structured outputs
- error reporting behavior

### Minimal Integration Tests

Cover one end-to-end daily run with mocked dependencies:

- mocked Trending payload
- mocked model responses where appropriate
- mocked git publication
- assertion on final Markdown output and recorded run state

The first version should avoid depending heavily on live end-to-end tests because Trending data, model behavior, and git remote state are all variable.

## Why This Approach

This design intentionally avoids two failure modes:

- reducing the project to a brittle cron script
- overbuilding a multi-agent system before the core workflow is proven

The selected shape keeps the system agent-oriented while preserving operational clarity:

- the agent decides and coordinates
- MCP tools execute reliable actions
- rules constrain quality and behavior
- repository state makes the job repeatable and recoverable

## Open Decisions For Planning

These details should be finalized in the implementation plan:

- exact scheduling mechanism
- exact GitHub Trending retrieval approach
- exact shape of run-state files in `data/state/`
- report Markdown template details
- whether candidate selection should be a single agent step or partly encoded in an MCP tool

## Approval

This design was approved by the user on 2026-03-13 and is ready to move into implementation planning after spec review.
