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
