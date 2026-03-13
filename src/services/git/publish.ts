import { dirname, basename } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const defaultExecFile = promisify(execFileCallback);

interface PublishInput {
  reportPath: string;
  markdown: string;
}

interface PublishDeps {
  execFile: (file: string, args: string[]) => Promise<{ stdout: string }>;
}

const defaultDeps: PublishDeps = {
  execFile: defaultExecFile
};

export async function publishReport(input: PublishInput, deps: PublishDeps = defaultDeps) {
  await mkdir(dirname(input.reportPath), { recursive: true });
  await writeFile(input.reportPath, input.markdown, "utf8");
  await deps.execFile("git", ["add", input.reportPath]);
  await deps.execFile("git", [
    "commit",
    "-m",
    `feat: add daily report ${basename(input.reportPath, ".md")}`
  ]);
  const { stdout } = await deps.execFile("git", ["rev-parse", "HEAD"]);

  return { commitHash: stdout.trim() };
}
