import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import { getRepoDetails } from "../../services/github/repo.js";

export const getRepoDetailsTool = tool(
  "get_repo_details",
  "Fetch repository details from the GitHub API.",
  {
    owner: z.string(),
    name: z.string()
  },
  async ({ owner, name }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(await getRepoDetails(owner, name), null, 2)
      }
    ]
  })
);
