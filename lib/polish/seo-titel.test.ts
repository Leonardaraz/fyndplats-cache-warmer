// SEO-titel och metabeskrivning på publicerade sidor.
//
// Proven låser det som gör skrivvägen smal: bara `seoData` med fältmask, bara
// publicerade sidor, ingen titel som redan står på en annan sida, alla villkor
// före första skrivningen, och antalet från torrkörningen i skarpt läge.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { seoSvar } from "./seo-svar.provhjalp";
import type { WixAnrop } from "./skrivplan";
import { korSeoTitel, MAX_SEO_RADER, SKRIVPAUS_MS, valideraSeoPlan, type SeoPlan, type SeoRad } from "./seo-titel";

const TITEL = "Smalt badrumsskåp i bambu, 120 cm | Fyndplats";
const BESK = "Smalt badrumsskåp i bambu med öppet fack och lamelldörr. 120 cm högt och 30 cm brett.";

function rad(over: Partial<SeoRad> = {}): SeoRad {
  return { kort: "1a2b3c4d", pid: "1a2b3c4d-0000-4000-8000-000000000001", seoTitel: TITEL, seoBesk: BESK, ...over };
}

const ANDRA = rad({
  kort: "2b3c4d5e",
  pid: "2b3c4d5e-0000-4000-8000-000000000001",
  seoTitel: "Smalt badrumsskåp i bambu, 80 cm | Fyndplats",
  seoBesk: "Smalt badrumsskåp i bambu med öppet fack och lamelldörr. 80 cm högt och 30 cm brett.",
});

function plan(rader: SeoRad[] = [rad()]): SeoPlan {
  return { namn: "semrush-1", rader };
}

const felI = (x: unknown): string[] => {
  const v = valideraSeoPlan(x);
  return "fel" in v ? v.fel : [];
};

describe("valideraSeoPlan", () => {
  it("släpper igenom en riktig plan", () => {
    expect("plan" in valideraSeoPlan(plan([rad(), ANDRA]))).toBe(true);
  });

  it("vägrar fel form på planen", () => {
    expect(felI(null)).toEqual(["planen måste vara ett objekt"]);
    expect(felI({ namn: "Fel Namn", rader: [rad()] })).toEqual(["namn saknas eller har fel form"]);
    expect(felI({ namn: "semrush-1", rader: [] })).toEqual(["rader saknas"]);
    expect(felI(plan(Array.from({ length: MAX_SEO_RADER + 1 }, () => rad())))).toEqual([`högst ${MAX_SEO_RADER} rader per plan`]);
  });

  it("kort och pid ska höra ihop", () => {
    expect(felI(plan([rad({ kort: "zzzz" })]))).toContain("rad 1: kort ska vara 8 hextecken");
    expect(felI(plan([rad({ pid: "2b3c4d5e-0000-4000-8000-000000000001" })]))).toEqual(["1a2b3c4d: pid börjar inte med kort"]);
    expect(felI(plan([rad(), rad({ seoTitel: "En annan titel på sidan | Fyndplats", seoBesk: `${BESK} Mer.` })]))).toEqual([
      "1a2b3c4d: kort förekommer två gånger i planen",
      "1a2b3c4d: pid förekommer två gånger i planen",
    ]);
  });

  it("titeln: suffix, högst 60 tecken och inte bara ett par ord", () => {
    expect(felI(plan([rad({ seoTitel: "Smalt badrumsskåp i bambu, 120 cm" })]))).toEqual(['1a2b3c4d: seoTitel slutar inte på " | Fyndplats"']);
    expect(felI(plan([rad({ seoTitel: `${"a".repeat(49)} | Fyndplats` })]))).toEqual(["1a2b3c4d: seoTitel saknas eller är längre än 60 tecken"]);
    expect("plan" in valideraSeoPlan(plan([rad({ seoTitel: `${"a".repeat(48)} | Fyndplats` })]))).toBe(true);
    expect(felI(plan([rad({ seoTitel: "Badrumsskåp | Fyndplats" })]))).toEqual(['1a2b3c4d: seoTitel är kortare än 20 tecken före " | Fyndplats"']);
  });

  it("beskrivningen: 50 till 160 tecken", () => {
    expect(felI(plan([rad({ seoBesk: "För kort." })]))).toEqual(["1a2b3c4d: seoBesk är kortare än 50 tecken"]);
    expect(felI(plan([rad({ seoBesk: "a".repeat(161) })]))).toEqual(["1a2b3c4d: seoBesk saknas eller är längre än 160 tecken"]);
    expect("plan" in valideraSeoPlan(plan([rad({ seoBesk: "a".repeat(160) })]))).toBe(true);
  });

  it("inga lösa mellanslag eller radbrytningar", () => {
    expect(felI(plan([rad({ seoBesk: `${BESK} ` })]))[0]).toContain("seoBesk har mellanslag");
    expect(felI(plan([rad({ seoBesk: BESK.replace("bambu med", "bambu  med") })]))[0]).toContain("seoBesk har mellanslag");
    expect(felI(plan([rad({ seoBesk: BESK.replace(". ", ".\n") })]))[0]).toContain("radbrytning");
  });

  it("☠️ artikelnummerform fäller, och felet citerar aldrig träffen", () => {
    // Syntetiskt nummer med leverantörens form.
    const fel = felI(plan([rad({ seoBesk: `${BESK} Art 999-000Z00ZZ.` })]));
    expect(fel).toEqual(["1a2b3c4d: seoBesk har artikelnummerform"]);
    expect(JSON.stringify(fel)).not.toContain("999-000");
  });

  it("☠️ två rader i planen får inte dela titel eller beskrivning, inte ens med ett kommatecken emellan", () => {
    const tvilling = { ...ANDRA, seoTitel: TITEL.replace(", 120", " 120"), seoBesk: BESK };
    expect(felI(plan([rad(), tvilling]))).toEqual([
      "2b3c4d5e: seoTitel är densamma som hos 1a2b3c4d i planen",
      "2b3c4d5e: seoBesk är densamma som hos 1a2b3c4d i planen",
    ]);
  });
});

// ── körningen ───────────────────────────────────────────────────────────────

interface Anrop {
  metod: string;
  sokvag: string;
  kropp?: unknown;
}

interface Sida {
  visible?: boolean;
  revision?: string;
  titel?: string;
  besk?: string;
  /** Extra taggar utöver titel och beskrivning, som importens og-taggar. */
  extra?: number;
}

/**
 * En låtsas-butik. `sidor` är planens produkter per pid; `andra` är de övriga
 * publicerade sidorna som frågan om titlar ser. En PATCH ändrar sidan, så en
 * läsning efteråt ser det skrivna.
 */
function butik(sidor: Record<string, Sida>, andra: Array<{ id: string; titel: string; besk?: string }> = []) {
  const anrop: Anrop[] = [];
  const pauser: number[] = [];
  const felPa = new Set<string>();
  const tags = (s: Sida) => [
    ...(s.titel !== undefined ? [{ type: "title", children: s.titel }] : []),
    ...(s.besk !== undefined ? [{ type: "meta", props: { name: "description", content: s.besk } }] : []),
    ...Array.from({ length: s.extra ?? 0 }, (_, i) => ({ type: "meta", props: { property: `og:x${i}`, content: "x" } })),
  ];
  const produkt = (pid: string) => {
    const s = sidor[pid];
    return { id: pid, visible: s.visible ?? true, revision: s.revision ?? "5", seoData: { tags: tags(s) } };
  };
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "POST" && sokvag === "/stores/v3/products/query") {
      // Som Wix: två per svar, markören bär läget, och filter + markör ger 400.
      return seoSvar(
        [
          ...Object.keys(sidor).filter((pid) => sidor[pid].visible ?? true).map(produkt),
          ...andra.map((a) => ({ id: a.id, visible: true, seoData: { tags: tags({ titel: a.titel, besk: a.besk ?? "En annan sidas beskrivning." }) } })),
        ],
        kropp,
      );
    }
    const pid = sokvag.split("/").pop()!;
    if (!(pid in sidor)) throw new Error("Wix 404: PRODUCT_NOT_FOUND");
    if (metod === "GET") return { product: produkt(pid) };
    if (metod === "PATCH") {
      if (felPa.has(pid)) throw new Error("Wix 409: INVALID_REVISION");
      const p = (kropp as { product: { seoData: { tags: Array<{ type: string; children?: string; props?: { content?: string } }> } } }).product;
      const s = sidor[pid];
      s.titel = p.seoData.tags.find((t) => t.type === "title")?.children;
      s.besk = p.seoData.tags.find((t) => t.type === "meta")?.props?.content;
      s.extra = p.seoData.tags.length - 2;
      s.revision = String(Number(s.revision ?? "5") + 1);
      return { product: { revision: s.revision } };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, anrop, pauser, felPa, vanta: async (ms: number) => void pauser.push(ms) };
}

const GAMMAL = { titel: "Smalt badrumsskåp i bambu | Fyndplats", besk: "En gammal beskrivning som två sidor delade." };
const PID = rad().pid;

describe("korSeoTitel", () => {
  it("torrt: räknar sidorna som ska skrivas och skriver ingenting", async () => {
    const b = butik({ [PID]: { ...GAMMAL }, [ANDRA.pid]: { titel: ANDRA.seoTitel, besk: ANDRA.seoBesk } });
    const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, "torr", null, b.vanta);
    expect(u).toMatchObject({ ok: true, attSkriva: 1, sammanfattning: "1 sidor att skriva, 1 bär redan planens texter (torrt)" });
    expect(u.rader).toEqual([
      { kort: "1a2b3c4d", ok: true, torr: true, andras: "seoTitel+seoBesk" },
      { kort: "2b3c4d5e", ok: true, torr: true, redan: true },
    ]);
    expect(b.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("☠️ skriver BARA seoData, med fältmask, färsk revision, två taggar och tomma nyckelord", async () => {
    const b = butik({ [PID]: { ...GAMMAL, revision: "7" } });
    const u = await korSeoTitel(plan(), b.wix, "skriv", 1, b.vanta);
    expect(u).toMatchObject({ ok: true, attSkriva: 1, sammanfattning: "1 sidor skrivna, 0 bar redan planens texter, 0 fel" });
    const patchar = b.anrop.filter((a) => a.metod === "PATCH");
    expect(patchar).toEqual([
      {
        metod: "PATCH",
        sokvag: `/stores/v3/products/${PID}`,
        kropp: {
          product: {
            revision: "7",
            seoData: {
              tags: [
                { type: "title", children: TITEL },
                { type: "meta", props: { name: "description", content: BESK } },
              ],
              settings: { keywords: [] },
            },
          },
          fieldMask: { paths: ["seoData"] },
        },
      },
    ]);
    expect(u.rader).toEqual([{ kort: "1a2b3c4d", ok: true, revisionFore: "7", revisionEfter: "8" }]);
  });

  it("verifieringen läser tillbaka: grön efter skrivningen, röd före", async () => {
    const b = butik({ [PID]: { ...GAMMAL } });
    const fore = await korSeoTitel(plan(), b.wix, "verifiera", null, b.vanta);
    expect(fore.ok).toBe(false);
    expect(fore.rader[0].fel).toBe("titeln är inte planens · metabeskrivningen är inte planens");
    await korSeoTitel(plan(), b.wix, "skriv", 1, b.vanta);
    const efter = await korSeoTitel(plan(), b.wix, "verifiera", null, b.vanta);
    expect(efter).toMatchObject({ ok: true, sammanfattning: "1 av 1 sidor verifierade" });
  });

  it("verifieringen fäller en sida som blivit ett utkast, fast texterna stämmer", async () => {
    const b = butik({ [PID]: { titel: TITEL, besk: BESK, visible: false } });
    const u = await korSeoTitel(plan(), b.wix, "verifiera", null, b.vanta);
    expect(u.ok).toBe(false);
    expect(u.rader).toEqual([{ kort: "1a2b3c4d", ok: false, fel: "sidan är inte publicerad" }]);
  });

  it("☠️ skarpt läge kräver torrkörningens antal", async () => {
    for (const bekrafta of [null, 0, 2]) {
      const b = butik({ [PID]: { ...GAMMAL } });
      const u = await korSeoTitel(plan(), b.wix, "skriv", bekrafta, b.vanta);
      expect(u.ok).toBe(false);
      expect(u.avbrutet).toContain("bekrafta ska vara 1");
      expect(b.anrop.some((a) => a.metod === "PATCH")).toBe(false);
    }
  });

  it("☠️ en titel som redan står på en annan publicerad sida skriver ingenting, för någon rad", async () => {
    const b = butik({ [PID]: { ...GAMMAL }, [ANDRA.pid]: { ...GAMMAL } }, [{ id: "9f8e7d6c-0000-4000-8000-000000000009", titel: ANDRA.seoTitel.replace(", 80", " – 80") }]);
    for (const lage of ["torr", "skriv"] as const) {
      const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, lage, 2, b.vanta);
      expect(u.ok).toBe(false);
      expect(u.avbrutet).toContain("2b3c4d5e: titeln står redan på 9f8e7d6c");
      expect(u.rader).toEqual([{ kort: "2b3c4d5e", ok: false, fel: "seoTitel står redan på 9f8e7d6c" }]);
    }
    expect(b.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("två sidor i planen som i dag delar titel hindrar inte varandra", async () => {
    // Det är själva fallet: båda bär den gamla gemensamma titeln, och planen ger dem var sin.
    const b = butik({ [PID]: { ...GAMMAL }, [ANDRA.pid]: { ...GAMMAL } });
    const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, "skriv", 2, b.vanta);
    expect(u).toMatchObject({ ok: true, sammanfattning: "2 sidor skrivna, 0 bar redan planens texter, 0 fel" });
    // En paus mellan skrivningarna, ingen före den första.
    expect(b.pauser).toEqual([SKRIVPAUS_MS]);
  });

  it("☠️ ett utkast skrivs aldrig, och stoppar hela planen före första skrivningen", async () => {
    const b = butik({ [PID]: { ...GAMMAL }, [ANDRA.pid]: { ...GAMMAL, visible: false } });
    const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, "skriv", 2, b.vanta);
    expect(u.ok).toBe(false);
    expect(u.avbrutet).toBe("ett villkor föll — ingenting skrivet");
    expect(u.rader).toEqual([{ kort: "2b3c4d5e", ok: false, fel: "sidan är inte publicerad — ett utkast poleras i en runda" }]);
    expect(b.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("en sida som inte går att läsa stoppar planen", async () => {
    const b = butik({ [PID]: { ...GAMMAL } });
    const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, "skriv", 2, b.vanta);
    expect(u.avbrutet).toBe("en sida gick inte att läsa — ingenting skrivet");
    expect(u.rader).toEqual([{ kort: "2b3c4d5e", ok: false, fel: expect.stringContaining("PRODUCT_NOT_FOUND") }]);
    expect(b.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("en sida som redan bär planens texter skrivs inte om", async () => {
    const b = butik({ [PID]: { titel: TITEL, besk: BESK } });
    const u = await korSeoTitel(plan(), b.wix, "skriv", 0, b.vanta);
    expect(u).toMatchObject({ ok: true, attSkriva: 0 });
    expect(u.rader).toEqual([{ kort: "1a2b3c4d", ok: true, redan: true }]);
    expect(b.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("☠️ fler än två taggar är ett gömställe: sidan skrivs om fast texterna stämmer", async () => {
    const b = butik({ [PID]: { titel: TITEL, besk: BESK, extra: 3 } });
    const torr = await korSeoTitel(plan(), b.wix, "torr", null, b.vanta);
    expect(torr.rader).toEqual([{ kort: "1a2b3c4d", ok: true, torr: true, andras: "taggar" }]);
    const fore = await korSeoTitel(plan(), b.wix, "verifiera", null, b.vanta);
    expect(fore.rader[0].fel).toBe("fler eller färre än två SEO-taggar");
    await korSeoTitel(plan(), b.wix, "skriv", 1, b.vanta);
    expect((await korSeoTitel(plan(), b.wix, "verifiera", null, b.vanta)).ok).toBe(true);
  });

  it("ett fel på en sida stoppar inte nästa, syns i utfallet och tvättas", async () => {
    const b = butik({ [PID]: { ...GAMMAL }, [ANDRA.pid]: { ...GAMMAL } });
    b.felPa.add(PID);
    const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, "skriv", 2, b.vanta);
    expect(u.ok).toBe(false);
    expect(u.sammanfattning).toBe("1 sidor skrivna, 0 bar redan planens texter, 1 fel");
    expect(u.rader[0]).toMatchObject({ kort: "1a2b3c4d", ok: false, fel: expect.stringContaining("INVALID_REVISION") });
    expect(u.rader[1]).toMatchObject({ kort: "2b3c4d5e", ok: true });
  });

  it("☠️ texterna står aldrig i svaret, som går till en publik logg", async () => {
    const b = butik({ [PID]: { ...GAMMAL }, [ANDRA.pid]: { ...GAMMAL } });
    for (const lage of ["torr", "skriv", "verifiera"] as const) {
      const u = await korSeoTitel(plan([rad(), ANDRA]), b.wix, lage, 2, b.vanta);
      const ut = JSON.stringify(u);
      expect(ut).not.toContain("badrumsskåp");
      expect(ut).not.toContain("lamelldörr");
    }
  });
});

// ── planerna i grenen ───────────────────────────────────────────────────────

describe("planfilerna i tools/polish-assets/seo-titel/", () => {
  const MAPP = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "tools", "polish-assets", "seo-titel");
  const filer = readdirSync(MAPP).filter((f) => f.endsWith(".json"));

  it("det finns planer att pröva", () => {
    expect(filer.length).toBeGreaterThan(0);
  });

  for (const fil of filer) {
    it(`${fil} går igenom serverns regler och heter som sin fil`, () => {
      const plan = JSON.parse(readFileSync(join(MAPP, fil), "utf8")) as SeoPlan;
      const v = valideraSeoPlan(plan);
      expect("fel" in v ? v.fel : []).toEqual([]);
      expect(plan.namn).toBe(fil.replace(/\.json$/, ""));
    });
  }

  it("☠️ ingen titel och ingen beskrivning står i två planer", () => {
    // Varje plan prövas för sig av servern. Två planer som skrivs efter varandra
    // får inte ge samma titel till två sidor.
    const alla = filer.flatMap((f) => (JSON.parse(readFileSync(join(MAPP, f), "utf8")) as SeoPlan).rader);
    const v = valideraSeoPlan({ namn: "alla", rader: alla.slice(0, MAX_SEO_RADER) });
    expect("plan" in v).toBe(true);
    const nyckel = (t: string) => t.replace(/\s*\|\s*fyndplats\s*$/i, "").toLocaleLowerCase("sv").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    for (const falt of ["seoTitel", "seoBesk"] as const) {
      const sedda = new Map<string, string>();
      for (const r of alla) {
        const k = nyckel(r[falt]);
        expect(sedda.get(k), `${falt} hos ${r.kort} står också hos ${sedda.get(k)}`).toBeUndefined();
        sedda.set(k, r.kort);
      }
    }
    expect(new Set(alla.map((r) => r.pid)).size).toBe(alla.length);
  });
});
