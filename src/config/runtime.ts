interface RuntimeEnv {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_MODEL?: string;
  GITHUB_TOKEN?: string;
}

export interface RuntimeConfig {
  anthropicApiKey: string;
  anthropicBaseUrl?: string;
  githubToken?: string;
  model?: string;
}

export function getRuntimeConfig(env: RuntimeEnv = process.env): RuntimeConfig {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Missing Claude Agent SDK credentials. Set ANTHROPIC_API_KEY and optionally ANTHROPIC_BASE_URL in .env before running daily."
    );
  }

  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicBaseUrl: env.ANTHROPIC_BASE_URL,
    githubToken: env.GITHUB_TOKEN,
    model: env.ANTHROPIC_MODEL
  };
}
