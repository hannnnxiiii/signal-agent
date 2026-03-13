import { tool } from "@anthropic-ai/claude-agent-sdk";

import { normalizeTrendingRepo } from "../../services/github/trending.js";

export async function fetchTrendingRepos() {
  const response = await fetch("https://github.com/trending");

  if (!response.ok) {
    throw new Error(`GitHub Trending fetch failed with ${response.status}`);
  }

  const html = await response.text();
  const matches = [...html.matchAll(/href="\/([^/"<>]+)\/([^/"<>]+)"/g)];
  const seen = new Set<string>();
  const repos = [];

  for (const match of matches) {
    const repo = `${match[1]}/${match[2]}`;
    if (seen.has(repo) || repo.includes("sponsors")) {
      continue;
    }

    seen.add(repo);
    repos.push(normalizeTrendingRepo({ repo }));

    if (repos.length >= 25) {
      break;
    }
  }

  return repos;
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
