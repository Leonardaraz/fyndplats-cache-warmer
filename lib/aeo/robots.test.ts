import { describe, expect, it } from "vitest";
import { analyzeRobotsAndFiles, blockedAiBots } from "./robots";

describe("blockedAiBots", () => {
  it("detects a specifically blocked AI crawler", () => {
    const robots = `User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin`;
    expect(blockedAiBots(robots)).toContain("gptbot");
  });

  it("does not flag an AI bot that is only partially disallowed", () => {
    const robots = `User-agent: GPTBot\nDisallow: /private\n`;
    expect(blockedAiBots(robots)).not.toContain("gptbot");
  });

  it("detects a global block via User-agent: *", () => {
    expect(blockedAiBots(`User-agent: *\nDisallow: /`)).toContain("*");
  });

  it("starts a new group when an agent follows a rule", () => {
    const robots = `User-agent: *\nDisallow: /tmp\nUser-agent: ClaudeBot\nDisallow: /`;
    const blocked = blockedAiBots(robots);
    expect(blocked).toContain("claudebot");
    expect(blocked).not.toContain("*");
  });
});

describe("analyzeRobotsAndFiles", () => {
  it("flags missing robots and llms", () => {
    const ids = analyzeRobotsAndFiles({ robotsTxt: null, llmsTxt: null }).map((f) => f.id);
    expect(ids).toContain("no-robots");
    expect(ids).toContain("no-llms-txt");
  });

  it("flags AI blocking and missing sitemap", () => {
    const robots = `User-agent: GPTBot\nDisallow: /`;
    const ids = analyzeRobotsAndFiles({ robotsTxt: robots, llmsTxt: "x" }).map((f) => f.id);
    expect(ids).toContain("blocks-ai-crawlers");
    expect(ids).toContain("no-sitemap");
    expect(ids).not.toContain("no-llms-txt");
  });

  it("is clean for a friendly robots with sitemap + llms present", () => {
    const robots = `User-agent: *\nAllow: /\nSitemap: https://x.se/sitemap.xml`;
    const findings = analyzeRobotsAndFiles({ robotsTxt: robots, llmsTxt: "# llms" });
    expect(findings).toHaveLength(0);
  });
});
