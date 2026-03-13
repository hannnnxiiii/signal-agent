import { runDailyReportQuery } from "../agent/query.js";

interface QueryMessage {
  type: string;
  result?: string;
}

interface RunDailyReportDeps {
  runQuery?: () => AsyncIterable<QueryMessage>;
}

export async function runDailyReportOnce(deps: RunDailyReportDeps = {}) {
  const runQuery = deps.runQuery ?? runDailyReportQuery;

  for await (const message of runQuery()) {
    if ("result" in message) {
      return message.result;
    }
  }

  return null;
}

void runDailyReportOnce().then((result) => {
  if (result) {
    console.log(result);
  }
});
