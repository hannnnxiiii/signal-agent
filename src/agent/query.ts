import { query } from "@anthropic-ai/claude-agent-sdk";

import { getRuntimeConfig } from "../config/runtime.js";
import { buildAgentOptions } from "./options.js";

const DAILY_PROMPT = `生成今天的 GitHub Trending 中文日报。

- 聚焦前端、全栈和 Agent 相关仓库
- 所有对外动作都必须通过 MCP tools 完成
- 最多收录五个仓库
- 跳过近期历史中已经出现过的仓库
- 最终日报必须使用简体中文输出
- 仓库名、链接和不适合翻译的技术名词保留原文`;

export function runDailyReportQuery() {
  const config = getRuntimeConfig();

  return query({
    prompt: DAILY_PROMPT,
    options: buildAgentOptions(config)
  });
}
