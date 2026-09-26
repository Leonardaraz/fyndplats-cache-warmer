// Prov för den varaktiga filen.
//
// Det som provas är inte att Vercel Blob fungerar — det är deras sak. Det som
// provas är REGLERNA runt filen, och de handlar alla om samma sak: vad som
// händer när något går fel. En fil som skrivs över med tomhet är värre än
// ingen fil alls.

import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const rot = fileURLToPath(new URL("../../", import.meta.url));
const las = (p: string) => readFileSync(rot + p, "utf8");

const put = vi.fn();
vi.mock("@vercel/blob", () => ({ put }));

const { blobKonfigurerad, blobUrl, skrivSnapshotTillBlob, lasSnapshotFranBlob, BLOB_SOKVAG } =
  await import("./snapshot-blob");

const bild = {
  genereradAt: "2026-09-18T00:00:00.000Z",
  antal: 3,
  produkter: 2,
  perProdukt: { a: [], b: [] },
  antalPerProdukt: { a: 2, b: 1 },
};

afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.REVIEWS_SNAPSHOT_BLOB_URL;
  put.mockReset();
  vi.restoreAllMocks();
});

describe("helt valfri — utan store händer ingenting", () => {
  it("blobKonfigurerad är falsk utan token", () => {
    expect(blobKonfigurerad()).toBe(false);
  });

  it("skrivningen hoppas över helt, inte ens ett försök", async () => {
    // ☠️ Utan store ska allt bete sig EXAKT som förut. Ett anrop som failar
    // vore inte samma sak som inget anrop: det hade loggat fel varje timme.
    expect(await skrivSnapshotTillBlob(bild)).toBeNull();
    expect(put).not.toHaveBeenCalled();
  });

  it("läsningen ger null utan adress", async () => {
    expect(await lasSnapshotFranBlob()).toBeNull();
  });

  it("tom sträng räknas som osatt, inte som satt", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "   ";
    expect(blobKonfigurerad()).toBe(false);
  });
});

describe("skrivning", () => {
  it("komprimerar, skriver till fast sökväg och skriver över", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "tok";
    put.mockResolvedValue({ url: "https://x.blob.vercel-storage.com/reviews/snapshot.json.gz" });
    const url = await skrivSnapshotTillBlob(bild);

    expect(url).toContain("snapshot.json.gz");
    const [sokvag, kropp, opts] = put.mock.calls[0];
    expect(sokvag).toBe(BLOB_SOKVAG);
    // ☠️ Fast adress: utan detta får varje skrivning en ny URL och läsarna
    // skulle peka på en fil som aldrig uppdateras.
    expect(opts.addRandomSuffix).toBe(false);
    expect(opts.allowOverwrite).toBe(true);
    // Komprimerad — se modulens huvud, det är en kostnadsfråga.
    expect(kropp.length).toBeLessThan(JSON.stringify(bild).length);
  });

  it("ett skrivfel blir null, aldrig ett kast", async () => {
    // Faller skrivningen ligger den FÖRRA filen kvar. Att låta felet bubbla
    // hade gjort cronen röd och tagit bort poängen med att ha en fil.
    process.env.BLOB_READ_WRITE_TOKEN = "tok";
    vi.spyOn(console, "error").mockImplementation(() => {});
    put.mockRejectedValue(new Error("nät nere"));
    expect(await skrivSnapshotTillBlob(bild)).toBeNull();
  });
});

describe("läsning", () => {
  const riktig = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = riktig;
  });

  it("packar upp och ger bilden", async () => {
    process.env.REVIEWS_SNAPSHOT_BLOB_URL = "https://x/reviews/snapshot.json.gz";
    const paket = gzipSync(Buffer.from(JSON.stringify(bild), "utf8"));
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => paket.buffer.slice(paket.byteOffset, paket.byteOffset + paket.byteLength),
    }) as never;
    const ut = await lasSnapshotFranBlob();
    expect(ut?.antal).toBe(3);
    expect(ut?.antalPerProdukt.a).toBe(2);
  });

  it("null när filen svarar fel status", async () => {
    process.env.REVIEWS_SNAPSHOT_BLOB_URL = "https://x/f.gz";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }) as never;
    expect(await lasSnapshotFranBlob()).toBeNull();
  });

  it("null när innehållet är skräp — aldrig ett kast", async () => {
    process.env.REVIEWS_SNAPSHOT_BLOB_URL = "https://x/f.gz";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("inte gzip").buffer,
    }) as never;
    expect(await lasSnapshotFranBlob()).toBeNull();
  });

  it("null när formen är fel trots 200", async () => {
    process.env.REVIEWS_SNAPSHOT_BLOB_URL = "https://x/f.gz";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const paket = gzipSync(Buffer.from(JSON.stringify({ ok: true }), "utf8"));
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => paket.buffer.slice(paket.byteOffset, paket.byteOffset + paket.byteLength),
    }) as never;
    expect(await lasSnapshotFranBlob()).toBeNull();
  });
});

describe("reglerna i källkoden", () => {
  it("cronen skriver ALDRIG en otrovärdig bild över en bra", () => {
    // ☠️ Är Neon avstängd blir bygget tomt. Skrivs tomheten till filen har vi
    // kastat bort precis det varaktigheten fanns till för — och gjort det i
    // samma sekund som den behövdes.
    const cron = las("app/api/cron/reviews-snapshot/route.ts");
    expect(cron).toMatch(/if \(!bild \|\| !arTrovardig\(bild\)\)/);
    expect(cron, "skrivningen sker före trovärdighetskollen").toMatch(
      /arTrovardig\(bild\)[\s\S]*skrivSnapshotTillBlob/,
    );
  });

  it("läsvägen tar filen före lagret", () => {
    const modul = las("lib/reviews/snapshot.ts");
    expect(modul).toMatch(/blobKonfigurerad\(\)[\s\S]*lasSnapshotFranBlob\(\)[\s\S]*byggSnapshot\(\)/);
  });
});
