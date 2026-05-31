import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocka @anthropic-ai/sdk. Konstruktorn returnerar en stub med messages.create
// som vi kan styra per-test via mockCreate.
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = { create: mockCreate };
    },
  };
});

// Hämta modulen FÖRST efter mock-registrering.
import {
  analyzeImages,
  categoryCacheKey,
  getCachedCategory,
  isAutoCategorizationEnabled,
  isImageAnalysisEnabled,
  setCachedCategory,
  suggestCategory,
  __testing,
  type CollectionOption,
} from "./client";
import { __resetLlmMemoryStore } from "../llm/storage";
import { __clearMemCache } from "../llm/cache";

function textMessage(text: string, usage: { input_tokens?: number; output_tokens?: number } = {}) {
  return {
    content: [{ type: "text", text }],
    usage: { input_tokens: usage.input_tokens ?? 0, output_tokens: usage.output_tokens ?? 0 },
  };
}

beforeEach(() => {
  mockCreate.mockReset();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  delete process.env.CLAUDE_IMAGE_ANALYSIS;
  delete process.env.CLAUDE_AUTO_CATEGORIZATION;
  delete process.env.GEMINI_API_KEY;
  delete process.env.LLM_PROVIDER_DEFAULT;
  delete process.env.ANTHROPIC_DAILY_BUDGET_USD;
  // Rensa både persistent (Wix Data fake-bucket) och in-memory cache så tester är isolerade.
  __resetLlmMemoryStore();
  __clearMemCache();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("feature flags", () => {
  it("image analysis is on by default", () => {
    expect(isImageAnalysisEnabled()).toBe(true);
  });
  it("image analysis can be turned off", () => {
    process.env.CLAUDE_IMAGE_ANALYSIS = "off";
    expect(isImageAnalysisEnabled()).toBe(false);
  });
  it("auto categorization is on by default", () => {
    expect(isAutoCategorizationEnabled()).toBe(true);
  });
  it("auto categorization can be turned off", () => {
    process.env.CLAUDE_AUTO_CATEGORIZATION = "off";
    expect(isAutoCategorizationEnabled()).toBe(false);
  });
});

describe("analyzeImages", () => {
  it("returns ok for all when feature is off (no Claude call)", async () => {
    process.env.CLAUDE_IMAGE_ANALYSIS = "off";
    const res = await analyzeImages(["https://example.com/a.jpg", "https://example.com/b.jpg"]);
    expect(res).toEqual([
      { url: "https://example.com/a.jpg", verdict: "ok", reason: "" },
      { url: "https://example.com/b.jpg", verdict: "ok", reason: "" },
    ]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("batches by 5 — 7 images = 2 calls", async () => {
    mockCreate
      .mockResolvedValueOnce(
        textMessage(
          JSON.stringify([
            { verdict: "ok", reason: "" },
            { verdict: "warn", reason: "lifestyle-bild" },
            { verdict: "reject", reason: "vattenstämpel" },
            { verdict: "ok", reason: "" },
            { verdict: "ok", reason: "" },
          ]),
        ),
      )
      .mockResolvedValueOnce(
        textMessage(
          JSON.stringify([
            { verdict: "ok", reason: "" },
            { verdict: "reject", reason: "kinesisk text i bilden" },
          ]),
        ),
      );

    const urls = Array.from({ length: 7 }, (_, i) => `https://example.com/${i}.jpg`);
    const res = await analyzeImages(urls);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(res).toHaveLength(7);
    expect(res[1]).toEqual({
      url: "https://example.com/1.jpg",
      verdict: "warn",
      reason: "lifestyle-bild",
    });
    expect(res[2].verdict).toBe("reject");
    expect(res[6]).toEqual({
      url: "https://example.com/6.jpg",
      verdict: "reject",
      reason: "kinesisk text i bilden",
    });
  });

  it("fail-open: returns ok for whole batch when Claude throws (no Gemini key)", async () => {
    mockCreate.mockRejectedValueOnce(new Error("rate limit"));
    const res = await analyzeImages(["https://example.com/a.jpg"]);
    expect(res).toEqual([{ url: "https://example.com/a.jpg", verdict: "ok", reason: "" }]);
  });

  it("handles JSON wrapped in code fences", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage("```json\n[{\"verdict\":\"reject\",\"reason\":\"NSFW\"}]\n```"),
    );
    const res = await analyzeImages(["https://example.com/x.jpg"]);
    expect(res[0].verdict).toBe("reject");
    expect(res[0].reason).toBe("NSFW");
  });

  it("pads with ok when Claude returns too few entries", async () => {
    mockCreate.mockResolvedValueOnce(textMessage("[]"));
    const res = await analyzeImages(["https://example.com/a.jpg", "https://example.com/b.jpg"]);
    expect(res).toHaveLength(2);
    expect(res.every((r) => r.verdict === "ok")).toBe(true);
  });

  it("clamps unknown verdict strings to ok", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(JSON.stringify([{ verdict: "nuke", reason: "weird" }])),
    );
    const res = await analyzeImages(["https://example.com/a.jpg"]);
    expect(res[0].verdict).toBe("ok");
  });

  it("sends image blocks as URL sources, not base64", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(JSON.stringify([{ verdict: "ok", reason: "" }])),
    );
    await analyzeImages(["https://example.com/foo.jpg"]);
    const callArgs = mockCreate.mock.calls[0][0];
    const userMsg = callArgs.messages[0];
    const imageBlock = userMsg.content.find((c: { type: string }) => c.type === "image");
    expect(imageBlock.source.type).toBe("url");
    expect(imageBlock.source.url).toBe("https://example.com/foo.jpg");
  });

  it("uses prompt-caching cache_control on the system prompt", async () => {
    mockCreate.mockResolvedValueOnce(textMessage(JSON.stringify([{ verdict: "ok", reason: "" }])));
    await analyzeImages(["https://example.com/q.jpg"]);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(Array.isArray(callArgs.system)).toBe(true);
    expect(callArgs.system[0].cache_control).toEqual({ type: "ephemeral" });
  });
});

describe("suggestCategory", () => {
  const collections: CollectionOption[] = [
    { slug: "skonhet", name: "Skönhet", description: "Hudvård, smink" },
    { slug: "kok", name: "Kök", description: "Köksredskap" },
    { slug: "leksaker", name: "Leksaker" },
  ];

  it("returns uncategorized when feature is off (no Claude call)", async () => {
    process.env.CLAUDE_AUTO_CATEGORIZATION = "off";
    const r = await suggestCategory("Ansiktsmask", "<p>Hudvårdsmask</p>", collections);
    expect(r).toEqual({ collectionSlug: null, confidence: 0, reason: "" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns uncategorized when collections are empty", async () => {
    const r = await suggestCategory("Whatever", "...", []);
    expect(r.collectionSlug).toBe(null);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("maps Claude response to suggestion with valid slug + clamped confidence", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(
        JSON.stringify({
          collection_slug: "skonhet",
          confidence: 0.92,
          reason: "produkten är en ansiktsmask",
        }),
      ),
    );
    const r = await suggestCategory("Hyaluron-mask", "Återfuktande ansiktsmask", collections);
    expect(r.collectionSlug).toBe("skonhet");
    expect(r.confidence).toBe(0.92);
    expect(r.reason).toContain("ansiktsmask");
  });

  it("rejects slugs that aren't in the supplied collection list", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(
        JSON.stringify({
          collection_slug: "påhittad-kategori",
          confidence: 0.9,
          reason: "...",
        }),
      ),
    );
    const r = await suggestCategory("X", "Y", collections);
    expect(r.collectionSlug).toBe(null);
    expect(r.confidence).toBe(0); // nollad eftersom slug:en var ogiltig
  });

  it("clamps confidence to [0,1]", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(
        JSON.stringify({ collection_slug: "kok", confidence: 2.5, reason: "" }),
      ),
    );
    const r = await suggestCategory("Stekspade", "kök", collections);
    expect(r.confidence).toBe(1);
  });

  it("fail-open: returns null suggestion when Claude throws and no Gemini key", async () => {
    mockCreate.mockRejectedValueOnce(new Error("boom"));
    const r = await suggestCategory("UniqueProduct123", "Description", collections);
    expect(r.collectionSlug).toBe(null);
    expect(r.confidence).toBe(0);
  });

  it("caches by name+description+collections fingerprint", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(
        JSON.stringify({ collection_slug: "leksaker", confidence: 0.8, reason: "leksak" }),
      ),
    );
    const r1 = await suggestCategory("Plastbil", "Liten leksaksbil", collections);
    const r2 = await suggestCategory("Plastbil", "Liten leksaksbil", collections);
    expect(r1).toEqual(r2);
    expect(mockCreate).toHaveBeenCalledTimes(1); // andra anropet träffade cachen
  });

  it("uses prompt-caching on system + static collections prefix", async () => {
    mockCreate.mockResolvedValueOnce(
      textMessage(JSON.stringify({ collection_slug: "skonhet", confidence: 0.9, reason: "" })),
    );
    await suggestCategory("Cachetest", "x", collections);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(Array.isArray(callArgs.system)).toBe(true);
    expect(callArgs.system[0].cache_control).toEqual({ type: "ephemeral" });
    const userBlocks = callArgs.messages[0].content;
    expect(userBlocks[0].cache_control).toEqual({ type: "ephemeral" });
  });
});

describe("categoryCacheKey", () => {
  const cols: CollectionOption[] = [
    { slug: "a", name: "A" },
    { slug: "b", name: "B" },
  ];

  it("is stable across reorderings of collections", () => {
    const k1 = categoryCacheKey("x", "y", cols);
    const k2 = categoryCacheKey("x", "y", [cols[1], cols[0]]);
    expect(k1).toBe(k2);
  });

  it("differs when name/description differs", () => {
    expect(categoryCacheKey("x", "y", cols)).not.toBe(categoryCacheKey("x", "z", cols));
    expect(categoryCacheKey("x", "y", cols)).not.toBe(categoryCacheKey("y", "y", cols));
  });
});

describe("get/setCachedCategory (legacy in-process helpers)", () => {
  it("round-trips a suggestion", () => {
    const key = "test-key-1";
    expect(getCachedCategory(key)).toBe(null);
    setCachedCategory(key, {
      collectionSlug: "test",
      confidence: 0.5,
      reason: "r",
    });
    expect(getCachedCategory(key)?.collectionSlug).toBe("test");
  });
});

describe("internal helpers", () => {
  it("stripHtml removes tags and collapses whitespace", () => {
    expect(__testing.stripHtml("<p>Hej   <b>där</b></p>")).toBe("Hej där");
  });
  it("clamp01 clamps and handles NaN", () => {
    expect(__testing.clamp01(-1)).toBe(0);
    expect(__testing.clamp01(0.5)).toBe(0.5);
    expect(__testing.clamp01(2)).toBe(1);
    expect(__testing.clamp01(Number.NaN)).toBe(0);
  });
  it("parseJsonObject tolerates surrounding prose", () => {
    expect(__testing.parseJsonObject<{ a: number }>('Här kommer svaret: {"a": 1}.')).toEqual({
      a: 1,
    });
  });
  it("parseJsonArray returns empty array on garbage", () => {
    expect(__testing.parseJsonArray<unknown>("not json at all")).toEqual([]);
  });

  it("mapAnthropicError detects credit-balance errors", () => {
    const err = Object.assign(new Error("Your credit balance is too low to access the API."), {
      status: 400,
      error: { error: { type: "invalid_request_error", message: "credit balance too low" } },
    });
    const mapped = __testing.mapAnthropicError(err);
    expect(mapped.name).toBe("CreditBalanceError");
  });

  it("mapAnthropicError wraps generic 4xx as ProviderClientError", () => {
    const err = Object.assign(new Error("bad request"), {
      status: 400,
      error: { error: { type: "invalid_request_error", message: "something else" } },
    });
    const mapped = __testing.mapAnthropicError(err) as Error & { status?: number };
    expect(mapped.name).toBe("ProviderClientError");
    expect(mapped.status).toBe(400);
  });
});
