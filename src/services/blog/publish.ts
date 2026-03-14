import type { Connection } from "mysql2/promise";

import { createBlogConnection } from "./connection.js";

interface PublishToHxBlogInput {
  date: string;
  overview: string;
  markdown: string;
}

interface HxBlogPostPayload {
  title: string;
  summary: string;
  content: string;
}

interface QueryResultRow {
  id: number;
}

interface InsertResult {
  insertId: number;
}

interface PublishToHxBlogDeps {
  query?: (sql: string, params: unknown[]) => Promise<unknown[]>;
  databaseUrl?: string;
  createConnection?: (databaseUrl: string) => Promise<Connection>;
}

export function buildHxBlogPostPayload(input: PublishToHxBlogInput): HxBlogPostPayload {
  return {
    title: `GitHub Trending 日报 - ${input.date}`,
    summary: input.overview,
    content: input.markdown
  };
}

export async function publishToHxBlog(
  input: PublishToHxBlogInput,
  deps: PublishToHxBlogDeps = {}
) {
  const payload = buildHxBlogPostPayload(input);

  if (deps.query) {
    return publishWithQuery(payload, deps.query);
  }

  const databaseUrl = deps.databaseUrl ?? process.env.HX_BLOG_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing HX_BLOG_DATABASE_URL for HX Blog publication");
  }

  const createConnection = deps.createConnection ?? createBlogConnection;
  const connection = await createConnection(databaseUrl);

  try {
    return await publishWithQuery(payload, (sql, params) => connection.query(sql, params));
  } finally {
    await connection.end();
  }
}

async function publishWithQuery(
  payload: HxBlogPostPayload,
  query: (sql: string, params: unknown[]) => Promise<unknown[]>
) {
  const existingRows = (await query("SELECT id FROM Post WHERE title = ? LIMIT 1", [payload.title])) as [
    QueryResultRow[]
  ];
  const existingPost = existingRows[0]?.[0];

  if (existingPost) {
    return { postId: existingPost.id, skipped: true };
  }

  const insertRows = (await query(
    "INSERT INTO Post (title, summary, content, createdAt) VALUES (?, ?, ?, NOW())",
    [payload.title, payload.summary, payload.content]
  )) as [InsertResult];

  return { postId: insertRows[0].insertId, skipped: false };
}
