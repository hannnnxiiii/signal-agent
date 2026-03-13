import { tool } from "@anthropic-ai/claude-agent-sdk";

import { parseTrendingHtml } from "../../services/github/trending.js";

export async function fetchTrendingRepos() {
  const response = await fetch("https://github.com/trending");

  if (!response.ok) {
    throw new Error(`GitHub Trending fetch failed with ${response.status}`);
  }

  const html = await response.text();
  return parseTrendingHtml(html).slice(0, 25);
}

export const fetchTrendingTool = tool(
  "fetch_trending",
  "Fetch GitHub Trending repositories as normalized candidates.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(await fetchTrendingRepos(), null, 2)
      }
    ]
  })
);
