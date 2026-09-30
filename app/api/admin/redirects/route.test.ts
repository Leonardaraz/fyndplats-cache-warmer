// POST /api/admin/redirects — grinden och skrivningen tillsammans.
//
// Katalogkontrollen (lib/wix/redirects.ts) svarar bara med konflikter. Att en
// konflikt stoppar HELA anropet innan någon rad skrivs är ruttens sak, och det
// är den halvan som låses här: ett läsfel skriver ingenting, en batch där en
// rad faller skriver ingen av dem, och `force=1` hoppar över kontrollen helt.
//
// Wix fejkas på nätnivå, så testerna ser både frågorna mot katalogen och
// skrivningarna mot FyndplatsRedirects.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

import { POST } from "./route";

interface Katalograd {
  slug: string;
  visible?: boolean;
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function falskWix(katalog: Katalograd[], opts: { trasigSlug?: string } = {}) {
  const slugFragor: string[] = [];
  const sparade: string[] = [];
  let kontroller = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    const u = String(url);
    const kropp = JSON.parse(String(init?.body ?? "{}"));
    if (u.endsWith("/stores/v3/products/query")) {
      const filter = kropp.query?.filter ?? {};
      if (typeof filter.slug === "string") {
        slugFragor.push(filter.slug);
        if (filter.slug === opts.trasigSlug) return new Response("upstream request timeout", { status: 504 });
        return json({ products: katalog.filter((p) => p.slug === filter.slug) });
      }
      kontroller++;
      return json({ products: katalog.filter((p) => p.visible !== false).slice(0, 1) });
    }
    if (u.endsWith("/wix-data/v2/items/save")) {
      sparade.push(kropp.dataItem.id);
      return json({ dataItem: kropp.dataItem });
    }
    throw new Error(`oväntat anrop: ${u}`);
  });
  return { slugFragor, sparade, kontroller: () => kontroller };
}

function post(rader: unknown[], query = ""): NextRequest {
  return new Request(`https://motor.example/api/admin/redirects${query}`, {
    method: "POST",
    body: JSON.stringify({ redirects: rader }),
    headers: { "content-type": "application/json" },
  }) as unknown as NextRequest;
}

const KATALOG: Katalograd[] = [
  { slug: "skrivbord-hogglans-100x50-cm", visible: true },
  { slug: "fortfarande-till-salu", visible: true },
];

beforeEach(() => vi.stubEnv("WIX_API_TOKEN", "token-abc"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/admin/redirects", () => {
  it("skriver raden efter en kontrollfråga och två slug-frågor", async () => {
    // Raden som dog på 60 sekunder två gånger 2026-09-30.
    const wix = falskWix(KATALOG);
    const res = await POST(post([
      { fromSlug: "skrivbord-hogglans-vit-100x50cm", toPath: "/produkt/skrivbord-hogglans-100x50-cm" },
    ]));
    expect(res.status).toBe(200);
    expect(wix.sparade).toEqual(["skrivbord-hogglans-vit-100x50cm"]);
    expect(wix.kontroller()).toBe(1);
    expect([...wix.slugFragor].sort()).toEqual(["skrivbord-hogglans-100x50-cm", "skrivbord-hogglans-vit-100x50cm"]);
  });

  it("☠️ ett läsfel skriver INGENTING — 409 och noll skrivningar", async () => {
    const wix = falskWix(KATALOG, { trasigSlug: "raderad-a" });
    const res = await POST(post([
      { fromSlug: "raderad-a", toPath: "/kategori/leksaker-spel" },
      { fromSlug: "raderad-b", toPath: "/kategori/leksaker-spel" },
    ]));
    expect(res.status).toBe(409);
    const kropp = (await res.json()) as { details: string[] };
    expect(kropp.details).toHaveLength(2);
    for (const rad of kropp.details) expect(rad).toMatch(/kunde inte verifiera/);
    expect(wix.sparade).toEqual([]);
  });

  it("☠️ en batch där EN rad faller skriver ingen av dem", async () => {
    const wix = falskWix(KATALOG);
    const res = await POST(post([
      { fromSlug: "raderad-a", toPath: "/produkt/skrivbord-hogglans-100x50-cm" },
      { fromSlug: "fortfarande-till-salu", toPath: "/kategori/leksaker-spel" },
      { fromSlug: "raderad-b", toPath: "/kategori/leksaker-spel" },
    ]));
    expect(res.status).toBe(409);
    const kropp = (await res.json()) as { details: string[] };
    expect(kropp.details).toHaveLength(1);
    expect(kropp.details[0]).toMatch(/^fortfarande-till-salu: .*synlig produkt/);
    expect(wix.sparade).toEqual([]);
  });

  it("force=1 hoppar över kontrollen helt — och skriver", async () => {
    const wix = falskWix(KATALOG);
    const res = await POST(post(
      [{ fromSlug: "fortfarande-till-salu", toPath: "/produkt/skrivbord-hogglans-100x50-cm" }],
      "?force=1",
    ));
    expect(res.status).toBe(200);
    expect(wix.kontroller()).toBe(0);
    expect(wix.slugFragor).toEqual([]);
    expect(wix.sparade).toEqual(["fortfarande-till-salu"]);
  });
});
