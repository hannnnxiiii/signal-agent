export interface RepoDetails {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  language?: string;
  stars?: number;
  topics: string[];
}

export async function getRepoDetails(
  owner: string,
  name: string,
  githubToken = process.env.GITHUB_TOKEN
): Promise<RepoDetails> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: githubToken
      ? {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        }
      : {
          Accept: "application/vnd.github+json"
        }
  });

  if (!response.ok) {
    throw new Error(`GitHub repo lookup failed with ${response.status}`);
  }

  const repo = (await response.json()) as {
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    topics?: string[];
  };

  return {
    owner,
    name,
    fullName: repo.full_name,
    description: repo.description ?? "",
    url: repo.html_url,
    language: repo.language ?? undefined,
    stars: repo.stargazers_count,
    topics: repo.topics ?? []
  };
}
