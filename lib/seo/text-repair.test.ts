import { describe, it, expect } from "vitest";
import { runTextRepair, stada, type TextProdukt, type TextRepairDeps } from "./text-repair";
import { BUTIKENS_URL } from "./relativa-lankar";

const SMUTSIG = "<h2>Tekniska specifikationer</h2><ul>"
  + "<li><p>Färg: vit</p></li>"
  + "<li><p>Artikelnummer: Z00-111V00XX</p></li>"
  + "</ul>";
const REN = "<h2>Tekniska specifikationer</h2><ul><li><p>Färg: vit</p></li></ul>";

function prod(over: Partial<TextProdukt> = {}): TextProdukt {
  return {
    id: over.id ?? "p1",
    slug: over.slug ?? "skoskap-4-speglade-luckor-17-cm",
    name: over.name ?? "Skoskåp med fyra speglade luckor",
    visible: over.visible ?? true,
    plainDescription: over.plainDescription ?? SMUTSIG,
  };
}

function deps(produkter: TextProdukt[], over: Partial<TextRepairDeps> = {}): TextRepairDeps & {
  skrivna: { id: string; html: string }[];
} {
  const lager = new Map(produkter.map((p) => [p.id, p.plainDescription]));
  const skrivna: { id: string; html: string }[] = [];
  return {
    skrivna,
    listaProdukter: over.listaProdukter ?? (async () => ({ produkter })),
    hamtaRevision: over.hamtaRevision ?? (async () => "3"),
    skrivBeskrivning:
      over.skrivBeskrivning
      ?? (async (id, _rev, html) => {
        skrivna.push({ id, html });
        lager.set(id, html);
        return { revision: "4" };
      }),
    hamtaProdukt:
      over.hamtaProdukt
      ?? (async (id) => ({ revision: "4", name: "x", plainDescription: lager.get(id) ?? "" })),
    nu: over.nu ?? (() => 0),
  };
}

describe("runTextRepair", () => {
  it("torrkör som default och skriver ingenting", async () => {
    const d = deps([prod()]);
    const s = await runTextRepair(d);
    expect(s.torrkorning).toBe(true);
    expect(s.traffar).toBe(1);
    expect(s.lagade).toBe(0);
    expect(d.skrivna).toEqual([]);
    expect(s.plan[0].kodrader).toEqual(["<li><p>Artikelnummer: Z00-111V00XX</p></li>"]);
  });

  it("skriver den rensade texten i skarpt läge", async () => {
    const d = deps([prod()]);
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.lagade).toBe(1);
    expect(s.misslyckade).toBe(0);
    expect(d.skrivna).toEqual([{ id: "p1", html: REN }]);
  });

  // ☠️ Kvittot. En skrivning som svarar OK men inte tar ska bli `misslyckade`,
  // aldrig `lagade` — huset har bränt sig fyra gånger på motsatsen.
  it("räknar INTE en skrivning som inte tog", async () => {
    const d = deps([prod()], {
      skrivBeskrivning: async () => ({ revision: "4" }), // sväljer skrivningen
      hamtaProdukt: async () => ({ revision: "3", name: "x", plainDescription: SMUTSIG }),
    });
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.lagade).toBe(0);
    expect(s.misslyckade).toBe(1);
    expect(s.fel[0]).toContain("står kvar");
  });

  it("hoppar över osynliga utkast", async () => {
    const d = deps([prod({ visible: false })]);
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.lasta).toBe(0);
    expect(s.traffar).toBe(0);
    expect(d.skrivna).toEqual([]);
  });

  it("tar med utkast när onlyPublished är av", async () => {
    const d = deps([prod({ visible: false })]);
    const s = await runTextRepair(d, { dryRun: false, onlyPublished: false });
    expect(s.lagade).toBe(1);
  });

  it("rapporterar kod i namnet men lagar den inte", async () => {
    const d = deps([prod({ name: "Skoskåp Artikelnummer: Z00-111V00XX", plainDescription: REN })]);
    const s = await runTextRepair(d);
    expect(s.kodINamn).toEqual(["skoskap-4-speglade-luckor-17-cm"]);
    expect(s.traffar).toBe(0);
  });

  // ☠️ Massfel-spärren. En regex som matchar allt får inte skriva något alls.
  it("kastar när andelen träffar spränger taket", async () => {
    const manga = Array.from({ length: 60 }, (_, i) => prod({ id: `p${i}`, slug: `s${i}` }));
    const d = deps(manga);
    await expect(runTextRepair(d, { dryRun: false })).rejects.toThrow(/Massfel/);
    // Spärren står före skrivningen: ingenting hann skrivas efter att taket sprack.
    expect(d.skrivna).toEqual([]);
  });

  it("respekterar limit på antalet skrivningar", async () => {
    const tre = [prod({ id: "a", slug: "a" }), prod({ id: "b", slug: "b" }), prod({ id: "c", slug: "c" })];
    const d = deps(tre);
    const s = await runTextRepair(d, { dryRun: false, limit: 2 });
    expect(s.traffar).toBe(3);
    expect(s.lagade).toBe(2);
    expect(d.skrivna).toHaveLength(2);
  });

  it("bär markören vidare när tidsbudgeten tar slut", async () => {
    let t = 0;
    const d = deps([prod()], {
      nu: () => (t += 200_000),
      listaProdukter: async () => ({ produkter: [prod()], cursor: "c2" }),
    });
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.fullstandig).toBe(false);
    expect(s.cursor).toBeDefined();
  });

  it("är fullständig när listningen tar slut", async () => {
    const s = await runTextRepair(deps([prod({ plainDescription: REN })]));
    expect(s.fullstandig).toBe(true);
    expect(s.cursor).toBeNull();
  });

  // Andra saxen: den trasiga syskonlänken.
  it("lagar en trasig syskonlänk", async () => {
    const trasig = `<p>Se även <a href="https:/produkt/x">x</a>.</p>${REN}`;
    const d = deps([prod({ plainDescription: trasig })]);
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.medTrasigLank).toBe(1);
    expect(s.medKod).toBe(0);
    expect(s.lagade).toBe(1);
    expect(d.skrivna[0].html).toContain(`href="${BUTIKENS_URL}/produkt/x"`);
    expect(d.skrivna[0].html).not.toContain('href="https:/produkt');
  });

  it("lagar båda felen i samma skrivning", async () => {
    const bada = `<p>Se även <a href="https:/produkt/x">x</a>.</p>${SMUTSIG}`;
    const d = deps([prod({ plainDescription: bada })]);
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.traffar).toBe(1);
    expect(s.medKod).toBe(1);
    expect(s.medTrasigLank).toBe(1);
    expect(s.lagade).toBe(1);
    expect(d.skrivna[0].html).toBe(`<p>Se även <a href="${BUTIKENS_URL}/produkt/x">x</a>.</p>${REN}`);
  });

  // ☠️ Massfel-taket gäller bara KODsaxen. Länkfixen tar inte bort någonting,
  // och en hög andel där är ett skäl att köra, inte att stoppa.
  it("massfel-taket bromsar INTE en utbredd länkfix", async () => {
    const manga = Array.from({ length: 60 }, (_, i) =>
      prod({ id: `p${i}`, slug: `s${i}`, plainDescription: `<a href="https:/produkt/x">x</a>${REN}` }));
    const d = deps(manga);
    const s = await runTextRepair(d, { dryRun: false });
    expect(s.medTrasigLank).toBe(60);
    expect(s.lagade).toBe(60);
  });

  it("stada är idempotent", () => {
    const smutsig = `<p><a href="https:/produkt/x">x</a></p>${SMUTSIG}`;
    expect(stada(stada(smutsig))).toBe(stada(smutsig));
  });
});
