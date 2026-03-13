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
