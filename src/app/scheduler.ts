import { runDailyReportOnce } from "./generate-daily-report.js";

const DAY_MS = 24 * 60 * 60 * 1000;

void runDailyReportOnce();
setInterval(() => {
  void runDailyReportOnce();
}, DAY_MS);
