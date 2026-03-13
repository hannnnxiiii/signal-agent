export type RepoCategory = "frontend" | "full-stack" | "agent" | "hybrid";

export interface SelectedRepo {
  owner: string;
  name: string;
  url: string;
  category: RepoCategory;
  summary: string;
  whyItMatters: string;
}

export interface DailyReport {
  date: string;
  overview: string;
  picks: SelectedRepo[];
  closingNote: string;
}
