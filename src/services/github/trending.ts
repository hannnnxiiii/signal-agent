export interface TrendingRepo {
  owner: string;
  name: string;
  description: string;
  language?: string;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

export function parseTrendingHtml(html: string): TrendingRepo[] {
  const rows = [...html.matchAll(/<article class="Box-row">([\s\S]*?)<\/article>/g)];

  return rows
    .map((match) => {
      const row = match[1];
      const hrefMatch = row.match(/href="\/([^/"<>]+)\/([^/"<>]+)"/);

      if (!hrefMatch) {
        return null;
      }

      if (hrefMatch[1] === "sponsors") {
        return null;
      }

      const descriptionMatch = row.match(
        /<p class="col-9 color-fg-muted my-1 tmp-pr-4">([\s\S]*?)<\/p>/
      );
      const languageMatch = row.match(/<span itemprop="programmingLanguage">([\s\S]*?)<\/span>/);

      return normalizeTrendingRepo({
        repo: `${hrefMatch[1]}/${hrefMatch[2]}`,
        description: descriptionMatch ? stripTags(descriptionMatch[1]) : "",
        language: languageMatch ? stripTags(languageMatch[1]) : undefined
      });
    })
    .filter((repo): repo is TrendingRepo => repo !== null);
}
