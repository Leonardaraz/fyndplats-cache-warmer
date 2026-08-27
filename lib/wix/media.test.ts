import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { importMediaByUrl, importMediaUrls } from "./media";

const FORRA = { token: process.env.WIX_API_TOKEN, dry: process.env.SYNC_DRY_RUN };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  // isDryRun() får inte kortsluta testerna — de handlar om skarpa anrop.
  process.env.SYNC_DRY_RUN = "false";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  if (FORRA.token === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA.token;
  if (FORRA.dry === undefined) delete process.env.SYNC_DRY_RUN;
  else process.env.SYNC_DRY_RUN = FORRA.dry;
});

const ok = (id = "f1") =>
  new Response(JSON.stringify({ file: { id, url: `https://static.wixstatic.com/${id}.jpg` } }), { status: 200 });

/** Svarar med kön av responser, en per anrop; räknar anropen. */
function svarar(...ko: (Response | (() => Response) | Error)[]) {
  let i = 0;
  const anrop: string[] = [];
  const f = (async (url: RequestInfo | URL, init?: RequestInit) => {
    anrop.push(JSON.parse(String(init?.body)).url);
    const nasta = ko[Math.min(i++, ko.length - 1)];
    if (nasta instanceof Error) throw nasta;
    return typeof nasta === "function" ? nasta() : nasta;
  }) as unknown as typeof fetch;
  return { f, anrop: () => anrop };
}

/** Kör klart en promise som väntar på timers. */
async function kor<T>(p: Promise<T>): Promise<T> {
  const r = p.then((v) => ({ v }), (e) => ({ e }));
  await vi.runAllTimersAsync();
  const utfall = (await r) as { v?: T; e?: unknown };
  if ("e" in utfall && utfall.e !== undefined) throw utfall.e;
  return utfall.v as T;
}

describe("importMediaByUrl — återförsök", () => {
  it("försöker igen vid 429 och lyckas", async () => {
    const { f, anrop } = svarar(new Response("slow down", { status: 429 }), ok());
    const r = await kor(importMediaByUrl("https://x.test/a.jpg", "a", f));
    expect(r.url).toBe("https://static.wixstatic.com/f1.jpg");
    expect(anrop()).toHaveLength(2);
  });

  it("försöker igen vid 5xx och vid nätverksfel", async () => {
    const a = svarar(new Response("", { status: 503 }), ok());
    await expect(kor(importMediaByUrl("https://x.test/a.jpg", "a", a.f))).resolves.toBeTruthy();

    const b = svarar(new Error("ECONNRESET"), ok());
    await expect(kor(importMediaByUrl("https://x.test/b.jpg", "b", b.f))).resolves.toBeTruthy();
  });

  it("ger UPP vid 404 — en trasig adress blir inte bra av att fråga igen", async () => {
    const { f, anrop } = svarar(new Response("not found", { status: 404 }));
    await expect(kor(importMediaByUrl("https://x.test/a.jpg", "a", f))).rejects.toThrow(/404/);
    expect(anrop()).toHaveLength(1);
  });

  it("KASTAR när återförsöken tar slut — felet får inte tappas bort", async () => {
    const { f, anrop } = svarar(new Response("", { status: 429 }));
    await expect(kor(importMediaByUrl("https://x.test/a.jpg", "a", f)))
      .rejects.toThrow(/misslyckades för https:\/\/x\.test\/a\.jpg/);
    expect(anrop()).toHaveLength(4); // första + tre återförsök
  });

  it("kastar när svaret saknar URL i stället för att returnera skräp", async () => {
    const { f } = svarar(new Response(JSON.stringify({ file: {} }), { status: 200 }));
    await expect(kor(importMediaByUrl("https://x.test/a.jpg", "a", f))).rejects.toThrow(/ingen URL/);
  });
});

describe("importMediaUrls — missar rapporteras", () => {
  const tre = [
    { url: "https://x.test/1.jpg", displayName: "1" },
    { url: "https://x.test/2.jpg", displayName: "2" },
    { url: "https://x.test/3.jpg", displayName: "3" },
  ];

  it("rapporterar varje miss via onMiss — det här är hela buggfixen", async () => {
    // Bild 2 är trasig; 1 och 3 går igenom.
    let n = 0;
    const f = (async (url: RequestInfo | URL, init?: RequestInit) => {
      const bild = JSON.parse(String(init?.body)).url as string;
      n++;
      return bild.endsWith("2.jpg") ? new Response("borta", { status: 404 }) : ok(`f${n}`);
    }) as unknown as typeof fetch;

    const missar: string[] = [];
    const media = await kor(importMediaUrls(tre, { fetchImpl: f, onMiss: (u) => missar.push(u) }));

    expect(media).toHaveLength(2);
    expect(missar).toEqual(["https://x.test/2.jpg"]);
  });

  it("en trasig bild fäller inte de andra", async () => {
    const f = (async (url: RequestInfo | URL, init?: RequestInit) => {
      const bild = JSON.parse(String(init?.body)).url as string;
      return bild.endsWith("1.jpg") ? new Response("", { status: 404 }) : ok();
    }) as unknown as typeof fetch;
    const media = await kor(importMediaUrls(tre, { fetchImpl: f }));
    expect(media).toHaveLength(2);
  });

  it("laddar upp EN I TAGET — parallellt var det som drev Wix till 429", async () => {
    let samtidiga = 0;
    let max = 0;
    const f = (async () => {
      samtidiga++;
      max = Math.max(max, samtidiga);
      await new Promise((r) => setTimeout(r, 10));
      samtidiga--;
      return ok();
    }) as unknown as typeof fetch;

    await kor(importMediaUrls(tre, { fetchImpl: f }));
    expect(max).toBe(1);
  });

  it("håller ordningen — bild 1 ska bli huvudbild", async () => {
    let n = 0;
    const f = (async () => ok(`f${++n}`)) as unknown as typeof fetch;
    const media = await kor(importMediaUrls(tre, { fetchImpl: f }));
    expect(media.map((m) => m.id)).toEqual(["f1", "f2", "f3"]);
  });
});
