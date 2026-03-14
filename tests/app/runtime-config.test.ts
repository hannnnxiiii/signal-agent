import { describe, expect, it } from "vitest";

import { getRuntimeConfig } from "../../src/config/runtime.js";

describe("getRuntimeConfig", () => {
  it("throws a helpful error when Anthropic credentials are missing", () => {
    expect(() =>
      getRuntimeConfig({
        GITHUB_TOKEN: "github-token"
      })
    ).toThrow("Missing Claude Agent SDK credentials");
  });

  it("accepts an Anthropic-compatible configuration from env", () => {
    const config = getRuntimeConfig({
      ANTHROPIC_API_KEY: "kimi-key",
      ANTHROPIC_BASE_URL: "https://kimi.example.com/anthropic",
      GITHUB_TOKEN: "github-token",
      ANTHROPIC_MODEL: "kimi-compatible-model",
      HX_BLOG_DATABASE_URL: "mysql://hx_blog:hx_blog_password@127.0.0.1:3306/hx_blog"
    });

    expect(config.anthropicApiKey).toBe("kimi-key");
    expect(config.anthropicBaseUrl).toBe("https://kimi.example.com/anthropic");
    expect(config.model).toBe("kimi-compatible-model");
    expect(config.hxBlogDatabaseUrl).toBe(
      "mysql://hx_blog:hx_blog_password@127.0.0.1:3306/hx_blog"
    );
  });
});
