# Signal Agent to HX Blog Auto Publish Design

Date: 2026-03-14
Status: Approved for planning

## Summary

Extend `signal-agent` so each generated daily Markdown report is automatically published as a normal article in `HX Blog`.

The deployment assumption is that both projects run on the same server. Because `HX Blog` already stores articles in MySQL through the `Post` table, the first version should publish by writing directly to the blog database instead of synchronizing Markdown files into the blog repository or calling the current cookie-based admin API.

## Goals

- Keep the existing daily report generation flow in `signal-agent`
- Preserve the local Markdown report artifact in `signal-agent/reports/`
- Automatically create one `HX Blog` `Post` record per daily report
- Make publication idempotent for the same date
- Keep the first version small enough to validate end-to-end quickly

## Non-Goals

- Changing the `HX Blog` frontend layout or adding a dedicated daily-report section
- Introducing categories, tags, cover images, or SEO metadata
- Replacing the current admin workflow in `HX Blog`
- Building a cross-service authentication layer in v1
- Supporting updates to already-published reports

## Current State

### Signal Agent

`signal-agent` already:

- runs a Claude Agent SDK query to generate the report
- composes a Chinese Markdown report from structured picks
- writes the report to `reports/YYYY-MM-DD.md`
- commits the report in its own git repository
- stores per-day run state in `data/state/YYYY-MM-DD.json`

Relevant files:

- `src/app/generate-daily-report.ts`
- `src/mcp/tools/publish-report.ts`
- `src/services/git/publish.ts`
- `src/services/reports/history.ts`

### HX Blog

`hx-blog` currently:

- stores posts in MySQL via Prisma
- exposes `GET` and authenticated `POST` routes for `/api/posts`
- renders posts from the `Post` table on the homepage and detail pages
- accepts Markdown content and renders it on the article page

Relevant files:

- `prisma/schema.prisma`
- `app/api/posts/route.js`
- `app/page.js`
- `app/blog/[id]/page.js`

## Recommended Approach

Use direct database publication from `signal-agent` into `HX Blog`'s MySQL database.

This is the best fit because:

- `HX Blog` already treats MySQL as the source of truth for articles
- same-server deployment removes the need for a public integration API
- the current `/api/posts` route is designed for browser sessions and cookie auth, not machine-to-machine publishing
- direct publication minimizes moving parts for the first working version

## Alternatives Considered

### 1. Direct database write from `signal-agent` to `HX Blog` MySQL

Recommended.

Pros:

- shortest and most reliable path
- no dependency on browser auth or a running web session
- no blog-side feature work required for v1

Cons:

- `signal-agent` takes on a small amount of blog persistence logic
- database schema changes in `HX Blog` must be reflected in the publisher later if the post model evolves

### 2. Call a new internal publish API on `HX Blog`

Not recommended for the first version.

Pros:

- business rules stay closer to the blog application
- easier to evolve into richer content workflows later

Cons:

- requires a new machine-authenticated API
- adds more moving pieces before the basic pipeline is validated

### 3. Sync Markdown files into the blog repo and let the blog import them

Not recommended.

Pros:

- weak coupling between the two apps

Cons:

- adds a second import pipeline and state machine
- harder to reason about failures and deduplication
- mismatched with `HX Blog`'s current DB-backed content model

## Architecture

The publishing flow remains owned by `signal-agent`.

1. Agent generates the structured daily report
2. Agent composes the final Markdown
3. Agent writes the Markdown file into `reports/`
4. Agent publishes a normal blog post into `HX Blog`'s `Post` table
5. Agent records publication state including the blog post id

The first version should keep `HX Blog` unchanged and introduce a focused blog publisher inside `signal-agent`.

## Data Flow

Input:

- generated report date
- report overview
- selected repositories
- closing note
- final Markdown

Derived blog fields:

- `title`: `GitHub Trending 日报 - YYYY-MM-DD`
- `summary`: the report overview text
- `content`: the full generated Markdown

Database target:

- `Post(title, summary, content, createdAt)`

Output:

- local Markdown file path
- git commit hash for the report repository
- `HX Blog` `postId`
- saved run state with final status

## Idempotency and Duplicate Prevention

Publication should use two layers of protection.

### Layer 1: Existing run-state file

`signal-agent` already stores daily state by date. Extend that state to include:

- `blogPostId`
- optional richer failure metadata for blog publication

If a date is already marked as published, the publish step should skip.

### Layer 2: Blog-side title lookup

Before inserting a post, the publisher should query `HX Blog` for an existing post with the exact generated title for that date.

If found:

- treat the publication as already complete
- return the existing `postId`
- persist that id back into the run state if missing

This protects against partial failures where the database write succeeds but the local state save fails afterward.

## Error Handling

### Markdown write fails

- stop publication
- mark the run as failed
- record the failure reason

### Git commit fails

- stop publication before the blog insert
- mark the run as failed
- leave the generated file for debugging

### Blog insert fails

- keep the Markdown file and any successful git state
- mark the run as failed with a blog-specific reason
- allow a retry on the next run

### State save fails after blog insert

- rely on the title-based duplicate check on retry
- do not attempt to delete the inserted blog post automatically

## Implementation Units

### `src/config/runtime.ts`

Add a blog database connection setting, preferably `HX_BLOG_DATABASE_URL`.

### `src/services/blog/connection.ts`

Create a small MySQL connection factory using `mysql2/promise`.

### `src/services/blog/publish.ts`

Encapsulate blog publication logic:

- generate title from date
- check for existing post by title
- insert a post when none exists
- return `postId`

### `src/services/reports/history.ts`

Extend `RunState` with `blogPostId` and optional structured publication metadata.

### `src/mcp/tools/publish-report.ts`

Turn the current publish step into a two-stage publisher:

- persist the report file and git commit
- publish the blog article
- save unified final state

## Testing Strategy

Focus tests on deterministic business logic rather than the agent loop.

- unit test title and summary mapping for blog posts
- unit test duplicate detection behavior when a post already exists
- unit test that `publish-report` writes state including `blogPostId`
- unit test failure behavior when the database insert throws

Use dependency injection for:

- MySQL query execution
- git command execution
- history store persistence

## Rollout Plan

### Phase 1

Ship direct DB publication with no `HX Blog` application changes.

Success criteria:

- `signal-agent` produces the Markdown report locally
- a matching row is created in `HX Blog`.`Post`
- the post appears on the blog homepage
- rerunning the same date does not create duplicates

### Phase 2

After the pipeline is stable, decide whether to:

- add a dedicated daily-report presentation in `HX Blog`
- split daily reports into a dedicated content type
- move from direct DB writes to a service-authenticated publish API

## Open Decisions Resolved During Brainstorming

- Daily reports should be published as normal blog posts for now
- The immediate priority is to get the auto-publish chain working end to end
- Blog layout changes can wait until after the publication pipeline is stable
