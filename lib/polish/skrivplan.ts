// Poleringens Wix-skrivning, flyttad från chatten till servern (2026-09-24).
//
// Fram till N56 skrevs varje runda till Wix genom att hela skrivskriptet —
// texter, SEO, bildlistor, kategorier och SKU:er, ~87 000 tecken per runda —
// skrevs av i chatten och kördes i Wix körmiljö. Kontrollsumman i samma anrop
// fångade avskriftsfel, men själva avskriften var rundans största tidstjuv.
// Wix körmiljö får inte hämta filer från GitHub (uppmätt: 403 "requests to
// raw.githubusercontent.com not allowed"), så filerna kan inte läsas där.
//
// Här läses i stället rundans `skrivplan.json` (byggd ur rundans filer av
// tools/polish-gates/bygg-skrivplan.py) av en workflow och skickas hit.
// Ingenting skrivs av, så avskriftsfelet finns inte längre att fånga.
//
// Stegen är desamma som i steg1–5.js, och i samma ordning:
//   text        namn, slug, brödtext, SEO (två taggar, tomma nyckelord), synlig
//   media       bildlistan ENSAM, `media.main` skickas aldrig
//   kategorier  namn → id i en färsk fråga; okänt namn skriver ingenting
//   sku         variantens SKU SIST och ENSAM, round-trip ur en färsk GET
//   verifiera   separat återläsning av allt ovan mot planen
//
// ☠️ INGET ARTIKELNUMMER OCH INGEN KOSTNAD LÄMNAR RUTTEN. Svaret går till en
// PUBLIK Actions-logg. Planen innehåller inga sådana fält, valideringen vägrar
// strängar med artikelnummerform, och felmeddelandena citerar aldrig träffen.

export const MAX_PRODUKTER = 20;
export const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const TRAD = { appNamespace: "@wix/stores" } as const;

export const STEG = ["text", "media", "kategorier", "sku", "verifiera"] as const;
export type Steg = (typeof STEG)[number];

export interface SkrivMedia {
  id: string;
  altText: string;
}

export interface SkrivProdukt {
  kort: string;
  pid: string;
  namn: string;
  slug: string;
  /** Brödtexten SOM DEN SKICKAS, utan avslutande radbrytning. */
  html: string;
  seoTitel: string;
  seoBesk: string;
  media: SkrivMedia[];
  kat: string[];
  sku: string;
  variantId: string;
  /** FNV-1a 64 av texten så som Wix lagrar den (wixnorm), ur vantat-hash.tsv. */
  textHash: string;
  textTecken: number;
}

export interface Skrivplan {
  runda: string;
  produkter: SkrivProdukt[];
}

/** Ett Wix-anrop mot butikens sajt. Kastar på allt utom 2xx. */
export type WixAnrop = (metod: "GET" | "PATCH" | "POST", sokvag: string, kropp?: unknown) => Promise<unknown>;

export interface StegRad {
  kort?: string;
  ok: boolean;
  [falt: string]: unknown;
}

export interface StegUtfall {
  ok: boolean;
  rader: StegRad[];
  sammanfattning: string;
  avbrutet?: string;
}

// ── validering ──────────────────────────────────────────────────────────────

const HEX8 = /^[0-9a-f]{8}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKU = /^FP-[a-z0-9]+(-[a-z0-9]+)*$/;
const MEDIA_ID = /^[0-9a-z]+_[0-9a-f]{32}~mv2\.[a-z]{3,4}$/;
const RUNDA = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Två former, och en träff i någon av dem fäller:
//
//   ARTNR  gatelibs uppmätta form, TECKEN FÖR TECKEN — samma som läcktestet
//          kör över tools/polish-assets. Testet jämför mot Python-originalet,
//          så de två kan inte glida isär. Allt läcktestet fäller, fäller rutten.
//   FORM   formsvepets bredare form: tre tecken, bindestreck, minst tre till,
//          minst en siffra — oavsett versaler. Mått och spänningar släpps.
//
// Den bredare formen fäller ibland en oskyldig fras ("100-pack"). Det är rätt
// riktning: en vägrad plan skriver ingenting och skrivs om, ett läckt
// artikelnummer går inte att ta tillbaka.
export const ARTNR =
  /\b\d{2}[A-Z]-\d{3}(?!\d)[A-Z0-9]*\b|\b[A-Z]\d{2}-\d{3}(?!\d)[A-Z0-9]*\b|\b\d{3}-\d{3}(?!\d)[A-Z0-9]{2,}\b/g;
const FORM = /\b[0-9A-Za-z]{3}-[0-9A-Za-z]{3,}\b/g;
const TILLATEN_FORM = /^\d{2,4}-\d{2,4}(V|W|HZ|MM|CM)?$/i;

/** Träffarnas intervall i strängen, sammanslagna där de två formerna överlappar. */
function traffar(s: string): Array<[number, number]> {
  const r: Array<[number, number]> = [];
  for (const m of s.matchAll(FORM)) {
    if (/\d/.test(m[0]) && !TILLATEN_FORM.test(m[0])) r.push([m.index, m.index + m[0].length]);
  }
  for (const m of s.matchAll(ARTNR)) r.push([m.index, m.index + m[0].length]);
  r.sort((a, b) => a[0] - b[0]);
  const ut: Array<[number, number]> = [];
  for (const [a, b] of r) {
    const sista = ut[ut.length - 1];
    if (sista && a < sista[1]) sista[1] = Math.max(sista[1], b);
    else ut.push([a, b]);
  }
  return ut;
}

/** Antal träffar med artikelnummerform. Returnerar aldrig själva träffen. */
export function artikelnummerformer(s: string): number {
  return traffar(s).length;
}

/**
 * Byter varje artikelnummerform mot en markör. Planen kan inte bära en sådan,
 * men ett felsvar från Wix kan citera data vi aldrig skickade — t.ex. den
 * gamla variant-SKU:n, som är härledd ur den tyska titeln. Svaret går till en
 * publik logg, så felet tvättas i stället för att litas på.
 */
export function redigera(s: string): string {
  let ut = s;
  for (const [a, b] of traffar(s).reverse()) ut = `${ut.slice(0, a)}‹REDIGERAT›${ut.slice(b)}`;
  return ut;
}

function strang(x: unknown, max: number): x is string {
  return typeof x === "string" && x.length > 0 && x.length <= max;
}

export function valideraPlan(x: unknown): { plan: Skrivplan } | { fel: string[] } {
  const fel: string[] = [];
  if (typeof x !== "object" || x === null || Array.isArray(x)) return { fel: ["planen måste vara ett objekt"] };
  const p = x as Record<string, unknown>;
  if (!strang(p.runda, 60) || !RUNDA.test(p.runda)) fel.push("runda saknas eller har fel form");
  if (!Array.isArray(p.produkter) || p.produkter.length === 0) return { fel: [...fel, "produkter saknas"] };
  if (p.produkter.length > MAX_PRODUKTER) return { fel: [...fel, `högst ${MAX_PRODUKTER} produkter per plan`] };

  const sedda = { kort: new Set<string>(), pid: new Set<string>(), slug: new Set<string>(), sku: new Set<string>() };
  p.produkter.forEach((r: unknown, i: number) => {
    const d = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
    const var_ = typeof d.kort === "string" && HEX8.test(d.kort) ? d.kort : `rad ${i + 1}`;
    const f = (t: string) => fel.push(`${var_}: ${t}`);

    if (!strang(d.kort, 8) || !HEX8.test(d.kort)) f("kort ska vara 8 hextecken");
    if (!strang(d.pid, 36) || !UUID.test(d.pid)) f("pid ska vara ett uuid");
    else if (typeof d.kort === "string" && !d.pid.startsWith(d.kort)) f("pid börjar inte med kort");
    if (!strang(d.namn, 80)) f("namn saknas eller är längre än 80 tecken");
    if (!strang(d.slug, 100) || !SLUG.test(d.slug)) f("slug har fel form");
    if (!strang(d.html, 30000)) f("html saknas");
    else if (d.html.endsWith("\n")) f("html slutar på radbrytning (skickas utan)");
    if (!strang(d.seoTitel, 100)) f("seoTitel saknas");
    if (!strang(d.seoBesk, 300)) f("seoBesk saknas");
    if (!strang(d.sku, 40) || !SKU.test(d.sku)) f("sku har fel form");
    if (!strang(d.variantId, 36) || !UUID.test(d.variantId)) f("variantId ska vara ett uuid");
    if (!strang(d.textHash, 16) || !/^[0-9a-f]{16}$/.test(d.textHash)) f("textHash ska vara 16 hextecken");
    if (!Number.isInteger(d.textTecken) || (d.textTecken as number) <= 0) f("textTecken ska vara ett positivt heltal");

    if (!Array.isArray(d.media) || d.media.length === 0 || d.media.length > 15) f("media ska ha 1–15 bilder");
    else {
      d.media.forEach((m: unknown, j: number) => {
        const mm = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
        if (!strang(mm.id, 80) || !MEDIA_ID.test(mm.id)) f(`bild ${j + 1}: id har fel form`);
        if (!strang(mm.altText, 250)) f(`bild ${j + 1}: altText saknas`);
      });
    }
    if (!Array.isArray(d.kat) || d.kat.length === 0 || d.kat.length > 6 || !d.kat.every((k) => strang(k, 60))) {
      f("kat ska vara 1–6 kategorinamn");
    }

    // ☠️ Artikelnummerform i något fält som når kunden fäller hela planen.
    // Felet namnger fältet, aldrig träffen — svaret går till en publik logg.
    const texter: Array<[string, unknown]> = [
      ["namn", d.namn], ["slug", d.slug], ["html", d.html], ["seoTitel", d.seoTitel],
      ["seoBesk", d.seoBesk], ["sku", d.sku],
      ...(Array.isArray(d.media) ? d.media.map((m: unknown, j: number): [string, unknown] =>
        [`bild ${j + 1} altText`, (m as Record<string, unknown>)?.altText]) : []),
      ...(Array.isArray(d.kat) ? d.kat.map((k: unknown, j: number): [string, unknown] => [`kat ${j + 1}`, k]) : []),
    ];
    for (const [namn, v] of texter) {
      if (typeof v === "string" && artikelnummerformer(v) > 0) f(`${namn} har artikelnummerform`);
    }

    for (const nyckel of ["kort", "pid", "slug", "sku"] as const) {
      const v = d[nyckel];
      if (typeof v !== "string") continue;
      if (sedda[nyckel].has(v)) f(`${nyckel} förekommer två gånger i planen`);
      sedda[nyckel].add(v);
    }
  });

  return fel.length ? { fel } : { plan: x as Skrivplan };
}

// ── hjälpare ────────────────────────────────────────────────────────────────

/** FNV-1a 64 över UTF-8, samma som hasha.py och steg5.js. */
export function fnv1a64(s: string): string {
  let h = 0xcbf29ce484222325n;
  for (const c of new TextEncoder().encode(s)) {
    h ^= BigInt(c);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}

type Obj = Record<string, unknown>;

// ☠️ Svarets form läses tolerant (#280): produkten ligger antingen direkt i
// svaret eller under `.data`. Att välja en av dem är ett antagande om miljön.
function produktAv(svar: unknown): Obj {
  const s = (svar ?? {}) as Obj;
  const p = ((s.data as Obj | undefined)?.product ?? s.product) as Obj | undefined;
  if (!p || typeof p !== "object") throw new Error("svaret saknar product");
  return p;
}

export function felText(e: unknown): string {
  return redigera(String((e as Error)?.message ?? e)).slice(0, 300);
}

async function kategoriIdn(wix: WixAnrop): Promise<Map<string, string>> {
  const svar = (await wix("POST", "/categories/v1/categories/query", {
    query: { cursorPaging: { limit: 200 } },
    treeReference: TRAD,
  })) as Obj;
  const lista = ((svar.data as Obj | undefined)?.categories ?? svar.categories ?? []) as Obj[];
  const ut = new Map<string, string>();
  for (const c of lista) {
    if (typeof c.name === "string" && typeof c.id === "string") ut.set(c.name, c.id);
  }
  return ut;
}

function summera(rader: StegRad[], ord: string): StegUtfall {
  const ok = rader.filter((r) => r.ok).length;
  return { ok: ok === rader.length, rader, sammanfattning: `${ok} av ${rader.length} ${ord}` };
}

// ── stegen ──────────────────────────────────────────────────────────────────

export async function stegText(plan: Skrivplan, wix: WixAnrop, torr: boolean): Promise<StegUtfall> {
  const rader: StegRad[] = [];
  for (const p of plan.produkter) {
    try {
      // ⚠️ Revisionen läses färskt — en fältmask-PATCH utan aktuell revision avvisas.
      const fore = produktAv(await wix("GET", `/stores/v3/products/${p.pid}`));
      if (torr) {
        rader.push({ kort: p.kort, ok: true, revision: fore.revision, synligFore: fore.visible === true });
        continue;
      }
      const kropp = {
        product: {
          revision: fore.revision,
          name: p.namn,
          slug: p.slug,
          plainDescription: p.html,
          visible: true,
          seoData: {
            tags: [
              { type: "title", children: p.seoTitel },
              { type: "meta", props: { name: "description", content: p.seoBesk } },
            ],
            settings: { keywords: [] },
          },
        },
        fieldMask: { paths: ["name", "slug", "plainDescription", "visible", "seoData"] },
      };
      const efter = produktAv(await wix("PATCH", `/stores/v3/products/${p.pid}`, kropp));
      rader.push({ kort: p.kort, ok: true, revisionFore: fore.revision, revisionEfter: efter.revision });
    } catch (e) {
      rader.push({ kort: p.kort, ok: false, fel: felText(e) });
    }
  }
  // ⚠️ PATCH-svaret är ingen återläsning — dess projektion saknar brödtexten.
  return summera(rader, torr ? "lästa (torrt)" : "skrivna");
}

export async function stegMedia(plan: Skrivplan, wix: WixAnrop, torr: boolean): Promise<StegUtfall> {
  const rader: StegRad[] = [];
  for (const p of plan.produkter) {
    try {
      const fore = produktAv(await wix("GET", `/stores/v3/products/${p.pid}`));
      if (torr) {
        rader.push({ kort: p.kort, ok: true, revision: fore.revision, bilder: p.media.length });
        continue;
      }
      // ⚠️ MEDIA SKRIVS ENSAM, och `media.main` skickas aldrig — den är read-only
      // i V3 och gav en extra omimport av huvudbilden. Listan ersätter allt.
      const kropp = {
        product: { revision: fore.revision, media: { itemsInfo: { items: p.media } } },
        fieldMask: { paths: ["media"] },
      };
      const efter = produktAv(await wix("PATCH", `/stores/v3/products/${p.pid}`, kropp));
      rader.push({ kort: p.kort, ok: true, bilder: p.media.length, revisionEfter: efter.revision });
    } catch (e) {
      rader.push({ kort: p.kort, ok: false, fel: felText(e) });
    }
  }
  return summera(rader, torr ? "lästa (torrt)" : "skrivna");
}

export async function stegKategorier(plan: Skrivplan, wix: WixAnrop, torr: boolean): Promise<StegUtfall> {
  const idn = await kategoriIdn(wix);
  const saknas = [...new Set(plan.produkter.flatMap((p) => p.kat).filter((n) => !idn.has(n)))];
  if (saknas.length) {
    // ☠️ Ett okänt namn skriver INGENTING — inte ens för de andra produkterna.
    return {
      ok: false,
      rader: [],
      avbrutet: `okänt kategorinamn: ${saknas.join(", ")} — ingenting skrivet`,
      sammanfattning: "0 skrivna",
    };
  }

  const perKat = new Map<string, SkrivProdukt[]>();
  for (const p of plan.produkter) for (const n of p.kat) perKat.set(n, [...(perKat.get(n) ?? []), p]);

  const rader: StegRad[] = [];
  for (const [namn, produkter] of perKat) {
    if (torr) {
      for (const p of produkter) rader.push({ kort: p.kort, kat: namn, ok: true, torr: true });
      continue;
    }
    try {
      const svar = (await wix("POST", `/categories/v1/bulk/categories/${idn.get(namn)}/add-items`, {
        items: produkter.map((p) => ({ catalogItemId: p.pid, appId: WIX_STORES_APP_ID })),
        treeReference: TRAD,
      })) as Obj;
      const d = ((svar.data as Obj | undefined) ?? svar) as Obj;
      const res = (d.results ?? []) as Obj[];
      produkter.forEach((p, i) => {
        // Facit är bulk-svarets rad per produkt. Saknas id i raden härleds den ur
        // originalIndex mot det vi faktiskt skickade.
        const traff =
          res.find((x) => ((x.itemMetadata as Obj | undefined)?.item as Obj | undefined)?.catalogItemId === p.pid)
          ?? res.find((x) => (((x.itemMetadata as Obj | undefined)?.originalIndex as number | undefined) ?? -1) === i);
        const m = (traff?.itemMetadata ?? null) as Obj | null;
        const felJson = m?.error ? JSON.stringify(m.error) : "";
        // En omkörning svarar ALREADY_EXISTS — produkten ÄR då kopplad.
        const redan = felJson.includes("ALREADY_EXISTS");
        rader.push({
          kort: p.kort,
          kat: namn,
          ok: m?.success === true || redan,
          ...(redan ? { redan: true } : {}),
          ...(m?.success !== true && !redan ? { fel: redigera(felJson).slice(0, 200) || "inget utfall för raden" } : {}),
        });
      });
    } catch (e) {
      for (const p of produkter) rader.push({ kort: p.kort, kat: namn, ok: false, fel: felText(e) });
    }
  }
  return summera(rader, torr ? "rader planerade (torrt)" : "rader kopplade");
}

export async function stegSku(plan: Skrivplan, wix: WixAnrop, torr: boolean): Promise<StegUtfall> {
  const rader: StegRad[] = [];
  for (const p of plan.produkter) {
    try {
      // Färsk GET med valens namn — variantobjektet byggs ALDRIG från grunden.
      const prod = produktAv(await wix("GET", `/stores/v3/products/${p.pid}?fields=VARIANT_OPTION_CHOICE_NAMES`));
      const vs = (((prod.variantsInfo as Obj | undefined)?.variants ?? []) as Obj[]);
      if (vs.length !== 1) {
        rader.push({ kort: p.kort, ok: false, fel: `oväntat antal varianter: ${vs.length} — hoppad` });
        continue;
      }
      if (vs[0].id !== p.variantId) {
        rader.push({ kort: p.kort, ok: false, fel: "variantens id stämmer inte med planen — hoppad" });
        continue;
      }
      const pris = ((vs[0].price as Obj | undefined)?.actualPrice as Obj | undefined)?.amount ?? null;
      // ☠️ Den gamla SKU:n skrivs aldrig ut: den är härledd ur den tyska titeln,
      // och en titel kan bära leverantörens artikelnummer.
      const rad: StegRad = {
        kort: p.kort,
        ok: true,
        skuAndras: vs[0].sku !== p.sku,
        variantSynligFore: vs[0].visible === true,
        prisFore: pris,
      };
      if (torr) {
        rader.push(rad);
        continue;
      }
      // Ändra BARA sku; allt annat följer med ur GET:en. `visible` skickas med
      // explicit (en variantsInfo-PATCH publicerar annars ett utkast), och
      // `options` måste stå i fältmasken på en flervariantsprodukt.
      const produkt: Obj = {
        revision: prod.revision,
        visible: prod.visible,
        variantsInfo: { variants: vs.map((v) => ({ ...v, sku: p.sku })) },
      };
      const vagar = ["variantsInfo", "visible"];
      if (Array.isArray(prod.options)) {
        produkt.options = prod.options;
        vagar.push("options");
      }
      const efter = produktAv(await wix("PATCH", `/stores/v3/products/${p.pid}`, { product: produkt, fieldMask: { paths: vagar } }));
      rader.push({ ...rad, revisionEfter: efter.revision });
    } catch (e) {
      rader.push({ kort: p.kort, ok: false, fel: felText(e) });
    }
  }
  return summera(rader, torr ? "lästa (torrt)" : "skrivna");
}

export async function stegVerifiera(plan: Skrivplan, wix: WixAnrop): Promise<StegUtfall> {
  const idn = await kategoriIdn(wix);
  const rader: StegRad[] = [];
  for (const p of plan.produkter) {
    try {
      const prod = produktAv(
        await wix(
          "GET",
          `/stores/v3/products/${p.pid}?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES`,
        ),
      );
      // ☠️ Bevisa att fälten FANNS i projektionen innan en nolla tolkas som fel.
      const items = ((prod.media as Obj | undefined)?.itemsInfo as Obj | undefined)?.items;
      const kat = (prod.directCategoriesInfo as Obj | undefined)?.categories;
      const vs = (prod.variantsInfo as Obj | undefined)?.variants;
      const saknas = [
        typeof prod.plainDescription !== "string" && "plainDescription",
        !Array.isArray(items) && "media.itemsInfo",
        !Array.isArray(kat) && "directCategoriesInfo",
        !Array.isArray(vs) && "variantsInfo",
      ].filter(Boolean);
      if (saknas.length) {
        rader.push({ kort: p.kort, ok: false, fel: `fält saknas i projektionen: ${saknas.join(", ")}` });
        continue;
      }

      const text = prod.plainDescription as string;
      const tags = ((((prod.seoData as Obj | undefined)?.tags) ?? []) as Obj[]);
      const titel = tags.filter((t) => t.type === "title");
      const meta = tags.filter((t) => t.type === "meta" && (t.props as Obj | undefined)?.name === "description");
      const nyckelord = ((((prod.seoData as Obj | undefined)?.settings as Obj | undefined)?.keywords) ?? []) as unknown[];
      const bilder = items as Obj[];
      const katIdn = (kat as Obj[]).map((c) => c.id);
      const varianter = vs as Obj[];

      const kontroller: Record<string, boolean> = {
        text: fnv1a64(text) === p.textHash && text.length === p.textTecken,
        namn: prod.name === p.namn,
        slug: prod.slug === p.slug,
        synlig: prod.visible === true,
        seo:
          tags.length === 2 && titel.length === 1 && titel[0].children === p.seoTitel
          && meta.length === 1 && (meta[0].props as Obj).content === p.seoBesk && nyckelord.length === 0,
        media:
          bilder.length === p.media.length
          && bilder.every((b, i) => b.id === p.media[i].id && (b.altText ?? "") === p.media[i].altText),
        kategorier: p.kat.every((n) => idn.has(n) && katIdn.includes(idn.get(n))),
        sku: varianter.length === 1 && varianter[0].sku === p.sku,
        variantSynlig: varianter.length === 1 && varianter[0].visible === true,
        variantId: varianter.length === 1 && varianter[0].id === p.variantId,
      };
      const fel = Object.entries(kontroller).filter(([, v]) => !v).map(([k]) => k);
      rader.push({
        kort: p.kort,
        ok: fel.length === 0,
        ...(fel.length ? { fel: fel.join(", ") } : {}),
        rev: prod.revision,
        bilder: bilder.length,
        kategorier: katIdn.length,
        pris: varianter.length === 1 ? ((varianter[0].price as Obj | undefined)?.actualPrice as Obj | undefined)?.amount ?? null : null,
        lager: (prod.inventory as Obj | undefined)?.availabilityStatus ?? null,
      });
    } catch (e) {
      rader.push({ kort: p.kort, ok: false, fel: felText(e) });
    }
  }
  return summera(rader, "helt verifierade");
}

export async function korSteg(steg: Steg, plan: Skrivplan, wix: WixAnrop, torr: boolean): Promise<StegUtfall> {
  switch (steg) {
    case "text":
      return stegText(plan, wix, torr);
    case "media":
      return stegMedia(plan, wix, torr);
    case "kategorier":
      return stegKategorier(plan, wix, torr);
    case "sku":
      return stegSku(plan, wix, torr);
    case "verifiera":
      return stegVerifiera(plan, wix);
  }
}
