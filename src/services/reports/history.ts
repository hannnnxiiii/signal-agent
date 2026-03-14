import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface RunState {
  date: string;
  status: "started" | "published" | "failed";
  selectedRepos: string[];
  reportPath?: string;
  commitHash?: string;
  blogPostId?: number;
  failureReason?: string;
  failureStage?: "git" | "blog" | "state";
}

export interface HistoryStore {
  load(date: string): Promise<RunState | null>;
  save(state: RunState): Promise<void>;
  canPublish(date: string): Promise<boolean>;
}

export function createFileBackedHistoryStore(rootDir: string): HistoryStore {
  return {
    async load(date) {
      const path = join(rootDir, `${date}.json`);

      try {
        const raw = await readFile(path, "utf8");
        return JSON.parse(raw) as RunState;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return null;
        }

        throw error;
      }
    },
    async save(state) {
      const path = join(rootDir, `${state.date}.json`);

      await mkdir(rootDir, { recursive: true });
      await writeFile(path, JSON.stringify(state, null, 2), "utf8");
    },
    async canPublish(date) {
      const current = await this.load(date);
      return current?.status !== "published";
    }
  };
}
