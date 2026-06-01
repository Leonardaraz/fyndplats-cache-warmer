import { describe, expect, it, vi } from "vitest";
import { countChars, MAX_TEXTS_PER_REQUEST, translateBatch } from "./deepl";

describe("countChars", () => {
  it("summerar tecken över alla texter", () => {
    expect(countChars(["abc", "de", ""])).toBe(5);
  });
});

function okResponse(translations: { text: string }[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ translations }),
    text: async () => "",
  } as unknown as Response;
}

describe("translateBatch", () => {
  it("kastar utan API-nyckel", async () => {
    await expect(translateBatch(["x"], "SV", undefined)).rejects.toThrow(/DEEPL_API_KEY/);
  });

  it("översätter och behåller ordningen", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse([{ text: "Hej" }, { text: "Världen" }]),
    );
    const out = await translateBatch(["Hello", "World"], "SV", "key:fx", fetchMock as never);
    expect(out).toEqual(["Hej", "Världen"]);
    // Free-nyckel (":fx") → free-endpoint.
    expect(fetchMock.mock.calls[0][0]).toContain("api-free.deepl.com");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.target_lang).toBe("SV");
    expect(body.text).toEqual(["Hello", "World"]);
  });

  it("behåller tomma strängar utan att skicka dem till DeepL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([{ text: "Hej" }]));
    const out = await translateBatch(["", "Hello", ""], "SV", "key:fx", fetchMock as never);
    expect(out).toEqual(["", "Hej", ""]);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toEqual(["Hello"]);
  });

  it("chunkar i block om max 50 texter", async () => {
    const texts = Array.from({ length: 120 }, (_, i) => `t${i}`);
    const fetchMock = vi.fn().mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as { body: string }).body);
      return okResponse(body.text.map((t: string) => ({ text: `sv-${t}` })));
    });
    const out = await translateBatch(texts, "SV", "key:fx", fetchMock as never);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 50 + 50 + 20
    expect(out[0]).toBe("sv-t0");
    expect(out[119]).toBe("sv-t119");
    expect(MAX_TEXTS_PER_REQUEST).toBe(50);
  });

  it("kastar vid DeepL-fel", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 456,
      text: async () => "Quota exceeded",
    } as unknown as Response);
    await expect(translateBatch(["x"], "SV", "key:fx", fetchMock as never)).rejects.toThrow(/456/);
  });
});
