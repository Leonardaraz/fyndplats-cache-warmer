import { describe, expect, it } from "vitest";
import {
  arAliExpressCdn,
  arAosomCdn,
  hamtaKalla,
  importeraOchBekrafta,
  laddaUppOchBekrafta,
} from "./bekraftad-bild";

/** De första byten i en JPEG räcker för `bildtypUrSignatur`. */
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);

type Svar = { status?: number; json?: unknown; url?: string; body?: Uint8Array };

/** En låtsas-fetch som svarar i tur och ordning och minns anropen. */
function fejkFetch(svar: Svar[]) {
  const anrop: { url: string; method: string }[] = [];
  const f = (async (url: string | URL, init?: RequestInit) => {
    anrop.push({ url: String(url), method: init?.method ?? "GET" });
    const s = svar.shift();
    if (!s) throw new Error(`oväntat anrop ${String(url)}`);
    const status = s.status ?? 200;
    const body = s.body ?? JSON.stringify(s.json ?? {});
    const res = new Response(body as BodyInit, { status });
    Object.defineProperty(res, "url", { value: s.url ?? String(url) });
    return res;
  }) as typeof fetch;
  return { f, anrop };
}

const deps = (f: typeof fetch) => ({
  fetch: f,
  sov: async () => {},
  rubriker: () => ({ Authorization: "test" }),
  vantaMs: 4500,
});

describe("värdarna", () => {
  it("Aosom och AliExpress, inget annat", () => {
    expect(arAosomCdn("img.aosomcdn.com")).toBe(true);
    expect(arAosomCdn("evil.com")).toBe(false);
    expect(arAliExpressCdn("ae01.alicdn.com")).toBe(true);
    expect(arAliExpressCdn("ae-pic-a1.aliexpress-media.com")).toBe(true);
    expect(arAliExpressCdn("alicdn.com.evil.com")).toBe(false);
    expect(arAliExpressCdn("static.wixstatic.com")).toBe(false);
  });
});

describe("hamtaKalla", () => {
  it("vägrar en värd utanför listan utan att hämta", async () => {
    const { f, anrop } = fejkFetch([]);
    expect(await hamtaKalla("https://evil.com/a.jpg", arAliExpressCdn, deps(f))).toBeNull();
    expect(anrop).toEqual([]);
  });

  it("☠️ vägrar en omdirigering till en annan värd", async () => {
    const { f } = fejkFetch([{ body: JPEG, url: "https://evil.com/a.jpg" }]);
    expect(await hamtaKalla("https://ae01.alicdn.com/kf/a.jpg", arAliExpressCdn, deps(f))).toBeNull();
  });

  it("ger bytena från en tillåten värd", async () => {
    const { f } = fejkFetch([{ body: JPEG }]);
    const b = await hamtaKalla("https://ae01.alicdn.com/kf/a.jpg", arAliExpressCdn, deps(f));
    expect(b?.byteLength).toBe(JPEG.byteLength);
  });
});

describe("laddaUppOchBekrafta", () => {
  const UPP = "https://upload.wixmp.com/upload/x";
  const FIL = "https://static.wixstatic.com/media/b379ce_ny~mv2.jpg";

  it("ger adressen först när Wix svarat READY", async () => {
    const { f, anrop } = fejkFetch([
      { json: { uploadUrl: UPP } },
      { json: { file: { id: "fil-1", url: FIL, operationStatus: "PENDING" } } },
      { json: { file: { operationStatus: "PENDING" } } },
      { json: { file: { operationStatus: "READY" } } },
    ]);
    expect(await laddaUppOchBekrafta(JPEG, "kundbild-1.jpg", deps(f))).toBe(FIL);
    expect(anrop.map((a) => a.method)).toEqual(["POST", "PUT", "GET", "GET"]);
  });

  it("☠️ FAILED ger null — ingen död adress skrivs", async () => {
    const { f } = fejkFetch([
      { json: { uploadUrl: UPP } },
      { json: { file: { id: "fil-1", url: FIL, operationStatus: "PENDING" } } },
      { json: { file: { operationStatus: "FAILED" } } },
    ]);
    expect(await laddaUppOchBekrafta(JPEG, "kundbild-1.jpg", deps(f))).toBeNull();
  });

  it("☠️ aldrig READY inom väntetiden ger null", async () => {
    const { f } = fejkFetch([
      { json: { uploadUrl: UPP } },
      { json: { file: { id: "fil-1", url: FIL, operationStatus: "PENDING" } } },
      { json: { file: { operationStatus: "PENDING" } } },
      { json: { file: { operationStatus: "PENDING" } } },
      { json: { file: { operationStatus: "PENDING" } } },
    ]);
    expect(await laddaUppOchBekrafta(JPEG, "kundbild-1.jpg", deps(f))).toBeNull();
  });

  it("vägrar byte som inte är en bild", async () => {
    const { f, anrop } = fejkFetch([]);
    expect(await laddaUppOchBekrafta(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), "x.jpg", deps(f))).toBeNull();
    expect(anrop).toEqual([]);
  });
});

describe("importeraOchBekrafta", () => {
  it("hämtar, laddar upp och ger adressen vid READY", async () => {
    const FIL = "https://static.wixstatic.com/media/b379ce_ny~mv2.jpg";
    const { f } = fejkFetch([
      { body: JPEG },
      { json: { uploadUrl: "https://upload.wixmp.com/u" } },
      { json: { file: { id: "fil-1", url: FIL, operationStatus: "READY" } } },
    ]);
    expect(await importeraOchBekrafta("https://ae01.alicdn.com/kf/a.jpg", "kundbild-1.jpg", arAliExpressCdn, deps(f))).toBe(FIL);
  });
});
