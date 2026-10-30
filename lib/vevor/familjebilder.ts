// VEVOR-familjernas bilder rättas i efterhand (Leonard 2026-10-30: "Ja gör det
// noggrant"). Importen gav först en familj ankarets sex bilder och bara
// huvudbilden från varje syskon, och ankarets huvudbild låg två gånger i
// galleriet. Importen gör rätt sedan samma dag (lib/vevor/familj.ts,
// `familjensBilder`). Den här modulen ger de familjer som redan importerats
// samma galleri: varje artikels egna bilder, ankaret först, kopplade till
// artikelns värde på bildaxeln, och varje bild en gång.
//
// Planen är ren (`planeraFamilj`). Skrivningen (`skrivFamilj`) går i steg, som
// färgbilderna (lib/aosom/fargbilder-kor.ts), eftersom en kopplad bild som
// faller ur galleriet ger 404 PRODUCT_MEDIA_NOT_EXIST:
//
//   1. De bilder som saknas laddas upp. Faller en uppladdning rörs Wix inte.
//   2. Galleriet skrivs ensamt: planens bilder i ordning, med de gamla bilder
//      som något val fortfarande pekar på sist.
//   3. Valens `linkedMedia` skrivs med options + variantsInfo ordagrant ur
//      GET:en och `visible` med. Försöks om bara vid 404 eller 409, och bara
//      när det enda som avviker är länkarna.
//   4. Galleriet skrivs en gång till, nu utan de gamla bilderna.
//   5. Återläsning: galleriet, alt-texterna, varje vals lista, de andra
//      axlarnas länkar, synligheten och varje variants synlighet, pris, SKU,
//      val och kostnad. Minsta avvikelse stoppar körningen.
//   6. Variantbilden följs upp (lib/wix/variant-media.ts).
//
// Sju egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara opolerade, dolda VEVOR-utkast med fler än en artikel. En polerad
//    eller publicerad sida rörs aldrig: där har en människa tittat.
// 2. ☠️ Bilderna känns igen på sin källa (Wix `sourceUrl`), aldrig på plats
//    eller alt-text. En bild vars källa inte är någon av artiklarnas egna
//    stoppar familjen (`okand_kalla`): har VEVOR bytt bildadresser sedan
//    importen hade samma foto laddats upp en gång till.
// 3. ☠️ Planen räknas om ur färska läsningar i skrivningen. Har sidan ändrats
//    sedan planen skrivs ingenting.
// 4. ☠️ Varje artikels avläsning måste finnas. Annars hade dess färg fått tomt.
// 5. Samma regel som importen: sex bilder per artikel, högst 50 på sidan, och
//    alt-texten "<namn> – <värde>" med ", bild N" från den andra.
// 6. ☠️ Första misslyckade sidan stoppar körningen. Den sida som föll är
//    ofarlig: varje länkad bild sitter kvar i galleriet.
// 7. ☠️ Svaret bär bara Wix-id och antal, aldrig artikelnummer eller adresser:
//    loggen är publik.

import type { ProductMappingRecord } from "@/lib/store";
import { mappingSupplier, vevorSkuOf } from "@/lib/store/supplier";
import {
  GALLERI_OMLASNINGAR,
  KOPPLING_FORSOK,
  KOPPLING_PAUS_MS,
  arOvergaende,
  lasProdukt,
  mediaPost,
  type ProduktLast,
} from "@/lib/aosom/fargbilder-kor";
import type { Bild } from "@/lib/aosom/fargbilder";
import { felText, type WixAnrop } from "@/lib/polish/skrivplan";
import { likaKostnad } from "@/lib/wix/produkt-kostnad";
import { refreshVariantMedia, variantbildSteg, type VariantbildUtfall } from "@/lib/wix/variant-media";
import { valjVevorBilder } from "./bilder";
import { familjensBilder } from "./familj";
import type { Avlasning } from "./lager";

type Obj = Record<string, unknown>;

export type FamiljHinder =
  | "publicerad"
  | "polerad"
  | "ingen_bildaxel"
  | "avlasning_saknas"
  | "val_saknas"
  | "okand_kalla"
  | "las_fel";

export const FAMILJ_HINDER: readonly FamiljHinder[] = [
  "publicerad",
  "polerad",
  "ingen_bildaxel",
  "avlasning_saknas",
  "val_saknas",
  "okand_kalla",
  "las_fel",
];

/** En bild i planens galleri: en befintlig fil (id) eller en som ska laddas upp (id null). */
export interface PlaneradBild {
  id: string | null;
  kalla: string;
  alt: string;
}

export interface ValPlan {
  valId: string;
  namn: string;
  lankadeFore: string[];
  /** Valets bilder efter rättningen, som källor i ordning. */
  kallorEfter: string[];
}

export interface FamiljPlan {
  id: string;
  hinder: FamiljHinder[];
  axel: string | null;
  galleriFore: Bild[];
  galleriEfter: PlaneradBild[];
  /** Bilder i galleriet som inte står i planen: dubbletter och de gamla swatch-bilderna. */
  utgar: Bild[];
  val: ValPlan[];
  /** Bilder som ska laddas upp. */
  nya: number;
  andrar: boolean;
}

/** En källadress utan fråga och med avkodade tecken, för att jämföra två adresser. */
export function normKalla(url: string): string {
  let u = url.split("#")[0].split("?")[0];
  try {
    u = decodeURIComponent(u);
  } catch {
    // Ett ensamt % i adressen: jämför den som den står.
  }
  return u.trim();
}

/** Bildaxeln ur mappningens varianter: den första axel vars värden är olika för varje artikel. */
export function bildaxelFor(varianter: ProductMappingRecord["variants"]): string | null {
  if (varianter.length < 2) return null;
  const axlar = Object.keys(varianter[0].choices ?? {});
  return (
    axlar.find(
      (k) =>
        varianter.every((v) => typeof v.choices?.[k] === "string" && v.choices[k].trim() !== "") &&
        new Set(varianter.map((v) => v.choices[k].toLowerCase())).size === varianter.length,
    ) ?? null
  );
}

/** Ankaret först, sedan syskonen i mappningens ordning: samma ordning som importen. */
export function medlemsordning(rad: ProductMappingRecord): ProductMappingRecord["variants"] {
  const ankare = vevorSkuOf(rad);
  return [...rad.variants].sort(
    (a, b) => Number(b.supplierVariantId === ankare) - Number(a.supplierVariantId === ankare),
  );
}

/** Alt-texten för valets bild nummer `nr` (1-indexerat), som importen sätter den. */
export function altFor(namn: string, varde: string, nr: number): string {
  return nr === 1 ? `${namn} – ${varde}` : `${namn} – ${varde}, bild ${nr}`;
}

/** Är familjen ett opolerat VEVOR-utkast med fler än en artikel? */
export function arKandidat(rad: ProductMappingRecord): boolean {
  return mappingSupplier(rad) === "vevor" && rad.variants.length > 1;
}

/** Innehållet bakom bilderna: fil-id → Wix `hash`, och VEVOR-adress → md5 (lib/vevor/bildinnehall.ts). */
export interface Innehall {
  filer: ReadonlyMap<string, string>;
  adresser: ReadonlyMap<string, string>;
}

const INGET_INNEHALL: Innehall = { filer: new Map(), adresser: new Map() };

/**
 * Planen för en familj. `kallor` är galleribildernas källor (fil-id → adress),
 * `avlasningar` artiklarnas senaste avläsningar och `innehall` fotonas md5.
 *
 * ☠️ Ett foto känns igen på sitt innehåll när det är känt, annars på sin
 * källa. VEVOR lägger samma foto under olika adresser för varje storlek, och
 * en fil som redan har samma innehåll som en planerad bild används i stället
 * för att ladda upp den igen.
 */
export function planeraFamilj(
  rad: ProductMappingRecord,
  produkt: ProduktLast,
  kallor: ReadonlyMap<string, string>,
  avlasningar: ReadonlyMap<string, Avlasning>,
  innehall: Innehall = INGET_INNEHALL,
): FamiljPlan {
  const hinder: FamiljHinder[] = [];
  const tom = (axel: string | null): FamiljPlan => ({
    id: produkt.id,
    hinder,
    axel,
    galleriFore: produkt.bilder,
    galleriEfter: [],
    utgar: [],
    val: [],
    nya: 0,
    andrar: false,
  });
  if (produkt.synlig) hinder.push("publicerad");
  if (rad.needsAiPolish !== true) hinder.push("polerad");
  const ordning = medlemsordning(rad);
  const axel = bildaxelFor(ordning);
  if (!axel) hinder.push("ingen_bildaxel");
  const medlemmar = ordning.map((v) => avlasningar.get(v.supplierVariantId));
  if (medlemmar.some((m) => !m)) hinder.push("avlasning_saknas");
  if (hinder.length > 0 || !axel) return tom(axel);

  const option = produkt.optioner.find((o) => o.namn.trim().toLowerCase() === axel.trim().toLowerCase());
  const valFor = (varde: string) => option?.val.find((c) => c.namn.trim().toLowerCase() === varde.trim().toLowerCase());
  if (!option || ordning.some((v) => !valFor(v.choices[axel]))) {
    hinder.push("val_saknas");
    return tom(axel);
  }

  // Varje fils nyckel: innehållet när Wix räknat det, annars källan.
  const filNyckel = (b: Bild): string | null => {
    const h = innehall.filer.get(b.id);
    if (h) return `md5:${h}`;
    const k = kallor.get(b.id);
    return k ? `kalla:${normKalla(k)}` : null;
  };
  const nyckelForKalla = new Map<string, string>();
  for (const b of produkt.bilder) {
    const k = kallor.get(b.id);
    const n = filNyckel(b);
    if (k && n && !nyckelForKalla.has(normKalla(k))) nyckelForKalla.set(normKalla(k), n);
  }
  const nyckel = (u: string): string => {
    const md5 = innehall.adresser.get(u);
    if (md5) return `md5:${md5}`;
    return nyckelForKalla.get(normKalla(u)) ?? `kalla:${normKalla(u)}`;
  };

  const { imageUrls, perVarde, gemensamma } = familjensBilder(
    medlemmar as Avlasning[],
    (m) => valjVevorBilder(m.bilder),
    (i) => ordning[i].choices[axel],
    nyckel,
  );
  // Alla artiklarnas egna bilder, inte bara de valda: en sådan bild som inte
  // står i planen är en gammal kopia och får gå.
  const familjens = new Set(
    (medlemmar as Avlasning[]).flatMap((m) => m.bilder.filter((b) => b.egen).map((b) => normKalla(b.url))),
  );

  // Befintliga bilder per innehåll, i galleriets ordning: den första behålls.
  const befintlig = new Map<string, Bild>();
  for (const b of produkt.bilder) {
    const n = filNyckel(b);
    if (n && !befintlig.has(n)) befintlig.set(n, b);
  }

  const altPerNyckel = new Map<string, string>();
  for (const [varde, urls] of Object.entries(perVarde)) {
    urls.forEach((u, i) => altPerNyckel.set(nyckel(u), altFor(produkt.namn, varde, i + 1)));
  }
  gemensamma.forEach((u, i) => altPerNyckel.set(nyckel(u), i === 0 ? produkt.namn : `${produkt.namn}, bild ${i + 1}`));
  const galleriEfter: PlaneradBild[] = imageUrls.map((u) => ({
    id: befintlig.get(nyckel(u))?.id ?? null,
    kalla: u,
    alt: altPerNyckel.get(nyckel(u)) ?? produkt.namn,
  }));
  const behallna = new Set(galleriEfter.map((b) => b.id).filter((id): id is string => !!id));
  const planerade = new Set(imageUrls.map(nyckel));
  // ☠️ En bild utan känd källa, eller med en källa utanför familjen, stoppar
  // familjen. Det betyder oftast att VEVOR bytt bildadresser sedan importen,
  // och då hade samma foto laddats upp en gång till bredvid det gamla. En fil
  // med samma innehåll som en planerad bild är en kopia och går ut.
  const utgar: Bild[] = [];
  for (const b of produkt.bilder) {
    if (behallna.has(b.id)) continue;
    const k = kallor.get(b.id);
    const n = filNyckel(b);
    if ((k && familjens.has(normKalla(k))) || (n && planerade.has(n))) utgar.push(b);
    else {
      hinder.push("okand_kalla");
      return tom(axel);
    }
  }

  const val: ValPlan[] = ordning.map((v) => {
    const c = valFor(v.choices[axel])!;
    return { valId: c.id, namn: c.namn, lankadeFore: c.lankade, kallorEfter: perVarde[v.choices[axel]] ?? [] };
  });

  const nya = galleriEfter.filter((b) => b.id === null).length;
  const galleriLika =
    nya === 0 &&
    galleriEfter.length === produkt.bilder.length &&
    galleriEfter.every((b, i) => b.id === produkt.bilder[i].id && b.alt === produkt.bilder[i].alt);
  const idForKalla = (u: string) => galleriEfter.find((b) => nyckel(b.kalla) === nyckel(u))?.id ?? null;
  const lankarLika = val.every(
    (v) => v.lankadeFore.join("|") === v.kallorEfter.map(idForKalla).join("|"),
  );
  return {
    id: produkt.id,
    hinder,
    axel,
    galleriFore: produkt.bilder,
    galleriEfter,
    utgar,
    val,
    nya,
    andrar: !(galleriLika && lankarLika),
  };
}

// ── skrivningen ──────────────────────────────────────────────────────────────

export interface FamiljebildDeps {
  wix: WixAnrop;
  /** VEVOR-raderna (Store.listMappingsMedPrefix). */
  mappningar(): Promise<ProductMappingRecord[]>;
  avlasningar(skus: string[]): Promise<Map<string, Avlasning>>;
  /** Galleribildernas källor: fil-id → adress (lib/wix/media.ts, getMediaSourceUrls). */
  kallor(filIdn: string[]): Promise<Map<string, string>>;
  /** Galleribildernas innehåll: fil-id → Wix `hash` (lib/wix/media.ts, getMediaHashes). */
  hashar(filIdn: string[]): Promise<Map<string, string>>;
  /** VEVOR-bildernas innehåll: adress → md5 (lib/vevor/bildinnehall.ts). */
  bildnycklar(urls: string[]): Promise<Map<string, string>>;
  /** Laddar upp en bild till Media Manager och svarar med fil-id:t. */
  laddaUpp(url: string, namn: string): Promise<{ id: string }>;
  variantbild?: (id: string) => Promise<VariantbildUtfall>;
  vanta?: (ms: number) => Promise<void>;
  klocka?: () => number;
}

/** Varför en sida stoppade körningen. Bara koden går ut i svaret: felets text kan bära en bildadress. */
export type FelOrsak = "las" | "hinder" | "uppladdning" | "strypt" | "skrivning" | "avvikelse";

export interface SkrivUtfall {
  id: string;
  ok: boolean;
  steg: string[];
  fel?: string;
  orsak?: FelOrsak;
}

/** Paus mellan två uppladdningar. Importen laddar upp samtidigt mot samma gräns. */
export const UPPLADDNING_PAUS_MS = 400;

/** Läser sidan och planerar den. null när sidan inte går att läsa. */
export async function lasOchPlanera(
  deps: Pick<FamiljebildDeps, "wix" | "avlasningar" | "kallor" | "hashar" | "bildnycklar">,
  rad: ProductMappingRecord,
): Promise<{ plan: FamiljPlan; produkt: ProduktLast } | null> {
  const produkt = await lasProdukt(deps.wix, rad.wixProductId);
  if (!produkt) return null;
  const idn = produkt.bilder.map((b) => b.id);
  const [kallor, filer] =
    idn.length > 0 ? await Promise.all([deps.kallor(idn), deps.hashar(idn)]) : [new Map<string, string>(), new Map<string, string>()];
  const avlasningar = await deps.avlasningar(rad.variants.map((v) => v.supplierVariantId));
  // Adressernas innehåll hämtas bara för en sida som kan rättas, och bara för
  // adresser som inte redan finns som en fil med känt innehåll.
  let adresser = new Map<string, string>();
  if (!produkt.synlig && rad.needsAiPolish === true) {
    const kanda = new Set([...kallor].filter(([id]) => filer.has(id)).map(([, u]) => normKalla(u)));
    const urls = rad.variants
      .flatMap((v) => {
        const a = avlasningar.get(v.supplierVariantId);
        return a ? valjVevorBilder(a.bilder).urls : [];
      })
      .filter((u) => !kanda.has(normKalla(u)));
    if (urls.length > 0) adresser = await deps.bildnycklar(urls);
  }
  return { plan: planeraFamilj(rad, produkt, kallor, avlasningar, { filer, adresser }), produkt };
}

/** Avvikelserna efter skrivningen. Tom lista = sidan är som planen. */
export function kontrollera(
  efter: ProduktLast,
  fore: ProduktLast,
  galleri: Bild[],
  lankar: ReadonlyMap<string, string[]>,
  axel: string,
): string[] {
  const fel: string[] = [];
  if (efter.synlig !== fore.synlig) fel.push("sidans synlighet ändrades");
  if (efter.bilder.map((b) => b.id).join("|") !== galleri.map((b) => b.id).join("|")) fel.push(GALLERI);
  else if (efter.bilder.some((b, i) => b.alt !== galleri[i].alt)) fel.push("en alt-text är inte den planerade");
  for (const o of efter.optioner) {
    const arAxel = o.namn.trim().toLowerCase() === axel.trim().toLowerCase();
    const fo = fore.optioner.find((x) => x.namn === o.namn);
    for (const c of o.val) {
      const vantat = arAxel ? lankar.get(c.id) ?? fo?.val.find((x) => x.id === c.id)?.lankade ?? [] : fo?.val.find((x) => x.id === c.id)?.lankade ?? [];
      if (c.lankade.join("|") !== vantat.join("|")) fel.push(arAxel ? LANK : "ett val på en annan axel ändrades");
    }
  }
  if (efter.optioner.length !== fore.optioner.length) fel.push("antalet optioner ändrades");
  if (efter.varianter.length !== fore.varianter.length) fel.push("antalet varianter ändrades");
  for (const v of fore.varianter) {
    const e = efter.varianter.find((x) => x.id === v.id);
    if (!e) {
      fel.push("en variant saknas");
      continue;
    }
    if (e.synlig !== v.synlig) fel.push("en variants synlighet ändrades");
    if (e.sku !== v.sku) fel.push("en variants SKU ändrades");
    if (e.pris !== v.pris) fel.push("en variants pris ändrades");
    if (e.val !== v.val) fel.push("en variants val ändrades");
    if (!likaKostnad(v.kostnad, e.kostnad)) fel.push("en variants kostnad ändrades");
  }
  return [...new Set(fel)];
}

const GALLERI = "galleriet är inte det planerade";
const LANK = "ett vals bilder är inte de planerade";

/** Galleriet som en PATCH. */
async function skrivGalleri(wix: WixAnrop, id: string, revision: unknown, bilder: Bild[]): Promise<void> {
  await wix("PATCH", `/stores/v3/products/${encodeURIComponent(id)}`, {
    product: { revision, media: { itemsInfo: { items: bilder.map(mediaPost) } } },
    fieldMask: { paths: ["media"] },
  });
}

/** Axelns val med de nya `linkedMedia`, allt annat ordagrant ur GET:en. */
export function optionerMedLankar(p: ProduktLast, axel: string, lankar: ReadonlyMap<string, string[]>): Obj[] {
  return ((p.ra.options ?? []) as Obj[]).map((o) => {
    if (String(o.name ?? "").trim().toLowerCase() !== axel.trim().toLowerCase()) return o;
    const cs = (o.choicesSettings ?? {}) as Obj;
    return {
      ...o,
      choicesSettings: {
        ...cs,
        choices: ((cs.choices ?? []) as Obj[]).map((c) => {
          // ☠️ Ett val i planen får exakt planens lista, också en tom: annars
          // står en gammal koppling kvar på ett val som bara har gemensamma foton.
          const ids = lankar.get(String(c.choiceId ?? ""));
          return ids ? { ...c, linkedMedia: ids.map((id) => ({ id })) } : c;
        }),
      },
    };
  });
}

/**
 * Skriver en familjs plan och läser tillbaka. `ok: false` betyder att körningen
 * ska stanna.
 */
export async function skrivFamilj(rad: ProductMappingRecord, deps: FamiljebildDeps): Promise<SkrivUtfall> {
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const steg: string[] = [];
  const id = rad.wixProductId;
  const fall = (orsak: FelOrsak, fel: string): SkrivUtfall => ({ id, ok: false, steg, fel, orsak });

  // Planen räknas om ur färska läsningar: har sidan ändrats skrivs det nya läget.
  const last = await lasOchPlanera(deps, rad);
  if (!last) return fall("las", "sidan gick inte att läsa");
  const { plan, produkt: fore } = last;
  if (plan.hinder.length > 0) return fall("hinder", `hinder: ${plan.hinder.join(", ")}`);
  if (!plan.andrar || !plan.axel) return { id, ok: true, steg: ["redan rätt"] };
  const axel = plan.axel;

  // ── 1: uppladdningarna, före Wix ─────────────────────────────────────────
  const galleri: Bild[] = [];
  let nr = 0;
  for (const b of plan.galleriEfter) {
    if (b.id) {
      galleri.push({ id: b.id, alt: b.alt });
      continue;
    }
    if (nr > 0) await vanta(UPPLADDNING_PAUS_MS);
    nr++;
    try {
      const upp = await deps.laddaUpp(b.kalla, `familj-${id.slice(0, 8)}-${nr}`);
      if (!upp.id) return fall("uppladdning", "en uppladdning gav inget fil-id — Wix rördes INTE");
      galleri.push({ id: upp.id, alt: b.alt });
    } catch (e) {
      // ☠️ En 429 är Wix spärr mot takten, inget fel på sidan: körningen väntar och fortsätter.
      const text = felText(e);
      return fall(/HTTP 429\b/.test(text) ? "strypt" : "uppladdning", `en uppladdning föll: ${text} — Wix rördes INTE`);
    }
  }
  if (nr > 0) steg.push(`${nr} bilder uppladdade`);
  const idForKalla = new Map(plan.galleriEfter.map((b, i) => [normKalla(b.kalla), galleri[i].id]));
  const lankar = new Map(
    plan.val.map((v) => [v.valId, v.kallorEfter.map((u) => idForKalla.get(normKalla(u))).filter((x): x is string => !!x)]),
  );

  // ── 2: galleriet, med de gamla bilder som något val pekar på sist ────────
  const lankade = new Set(fore.optioner.flatMap((o) => o.val.flatMap((c) => c.lankade)));
  const kvarTills = plan.utgar.filter((b) => lankade.has(b.id));
  try {
    await skrivGalleri(deps.wix, id, fore.revision, [...galleri, ...kvarTills]);
    steg.push(`galleri ${fore.bilder.length} → ${galleri.length + kvarTills.length}`);
  } catch (e) {
    return fall("skrivning", `galleriet föll: ${felText(e)} — varje länkad bild sitter kvar`);
  }

  // ── 3: länkarna, med försök ──────────────────────────────────────────────
  const lasEfter = async (vantatGalleri: Bild[]) => {
    const p = await lasProdukt(deps.wix, id);
    return { p, avvikelser: p ? kontrollera(p, fore, vantatGalleri, lankar, axel) : ["sidan gick inte att läsa"] };
  };
  const mellan = [...galleri, ...kvarTills];
  let forsok = 0;
  let sistaFel = "";
  try {
    let { p, avvikelser } = await lasEfter(mellan);
    let omlasningar = 0;
    while (p && avvikelser.includes(GALLERI) && omlasningar < GALLERI_OMLASNINGAR) {
      omlasningar++;
      await vanta(KOPPLING_PAUS_MS);
      ({ p, avvikelser } = await lasEfter(mellan));
    }
    const baraLankar = () => avvikelser.length > 0 && avvikelser.every((a) => a === LANK);
    while (p && baraLankar() && forsok < KOPPLING_FORSOK) {
      forsok++;
      try {
        await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(id)}`, {
          product: {
            revision: p.revision,
            visible: p.ra.visible,
            options: optionerMedLankar(p, axel, lankar),
            variantsInfo: p.ra.variantsInfo,
          },
          fieldMask: { paths: ["options", "variantsInfo", "visible"] },
        });
      } catch (e) {
        sistaFel = felText(e);
        if (!arOvergaende(e)) return fall("skrivning", `länkningen föll: ${sistaFel} — varje länkad bild sitter kvar`);
      }
      await vanta(KOPPLING_PAUS_MS);
      ({ p, avvikelser } = await lasEfter(mellan));
    }
    if (avvikelser.length > 0) {
      return fall("avvikelse", `Wix stämmer inte med planen (${avvikelser.join("; ")})${sistaFel ? ` — sista fel: ${sistaFel}` : ""}`);
    }
    steg.push(`länkar: ${plan.val.length} val (${forsok} försök)`);

    // ── 4: galleriet utan de gamla bilderna ─────────────────────────────────
    if (kvarTills.length > 0) {
      await skrivGalleri(deps.wix, id, p!.revision, galleri);
      steg.push(`${kvarTills.length} gamla bilder ur galleriet`);
    }

    // ── 5: återläsning ────────────────────────────────────────────────────────
    ({ p, avvikelser } = await lasEfter(galleri));
    omlasningar = 0;
    while (p && avvikelser.includes(GALLERI) && omlasningar < GALLERI_OMLASNINGAR) {
      omlasningar++;
      await vanta(KOPPLING_PAUS_MS);
      ({ p, avvikelser } = await lasEfter(galleri));
    }
    if (avvikelser.length > 0) return fall("avvikelse", `återläsningen: ${avvikelser.join("; ")}`);
    steg.push("återläst");
  } catch (e) {
    return fall("skrivning", `skrivningen föll: ${felText(e)} — varje länkad bild sitter kvar`);
  }

  // ── 6: variantbilden ────────────────────────────────────────────────────────
  const vb = variantbildSteg(
    await (deps.variantbild ?? ((x: string) => refreshVariantMedia(deps.wix, x, { vanta })))(id),
  );
  steg.push(vb.rad);
  if (vb.stopp) return fall("avvikelse", `${vb.rad} — galleriet och länkarna är skrivna, kontrollera sidan`);
  return { id, ok: true, steg };
}

// ── körningen ───────────────────────────────────────────────────────────────

export interface FamiljebildVal {
  dryRun: boolean;
  /** Planens antal sidor att rätta. Krävs för en skarp körning; fler än så skrivs inte. */
  bekrafta: number | null;
  /** Bara de här sidorna (Wix-id), när det finns några. */
  idn?: string[];
  budgetMs: number;
}

export interface FamiljebildSvar {
  dryRun: boolean;
  familjer: number;
  attRatta: number;
  redanRatt: number;
  hinder: Record<FamiljHinder, number>;
  /** Bilder att ladda upp, över alla sidor att rätta. */
  nyaBilder: number;
  /** Gamla kopior som går ur galleriet, över alla sidor att rätta. */
  utgar: number;
  skrivna: number;
  kvar: number;
  /** `strypt`: Wix svarade 429 på en uppladdning. Inget är fel, körningen väntar och fortsätter. */
  stoppadAv: "klart" | "tidsbudget" | "strypt" | "fel" | null;
  /**
   * ☠️ Sidan som stoppade körningen och varför, som en kod. Felets text står
   * bara i Vercels logg: den kan bära leverantörens bildadress, och i den
   * står artikelnumret. Svaret skrivs ut i en publik Actions-logg.
   */
  fel: { id: string; orsak: FelOrsak } | null;
  /** Upp till 50 Wix-id för sidor att rätta (torrt) eller rättade (skarpt). */
  idn: string[];
}

export class FamiljebildFel extends Error {}

const MARGINAL_MS = 45_000;

export async function korFamiljebilder(deps: FamiljebildDeps, val: FamiljebildVal): Promise<FamiljebildSvar> {
  const klocka = deps.klocka ?? Date.now;
  const start = klocka();
  if (!val.dryRun && (val.bekrafta === null || !Number.isInteger(val.bekrafta) || val.bekrafta < 0)) {
    throw new FamiljebildFel("en skarp körning kräver bekrafta = planens antal sidor att rätta");
  }
  const urval = new Set(val.idn ?? []);
  const rader = (await deps.mappningar()).filter(
    (r) => arKandidat(r) && (urval.size === 0 || urval.has(r.wixProductId)),
  );
  const svar: FamiljebildSvar = {
    dryRun: val.dryRun,
    familjer: rader.length,
    attRatta: 0,
    redanRatt: 0,
    hinder: Object.fromEntries(FAMILJ_HINDER.map((h) => [h, 0])) as Record<FamiljHinder, number>,
    nyaBilder: 0,
    utgar: 0,
    skrivna: 0,
    kvar: 0,
    stoppadAv: null,
    fel: null,
    idn: [],
  };

  // Planen för alla, så att antalet är känt innan något skrivs.
  const att: ProductMappingRecord[] = [];
  for (const r of rader) {
    if (klocka() - start > val.budgetMs - MARGINAL_MS) {
      // Planen hann inte med alla: en skarp körning skriver inget på en halv plan.
      svar.stoppadAv = "tidsbudget";
      svar.kvar = rader.length;
      return svar;
    }
    let last: Awaited<ReturnType<typeof lasOchPlanera>>;
    try {
      last = await lasOchPlanera(deps, r);
    } catch (e) {
      console.warn("[vevor-familjebilder] läsningen föll:", r.wixProductId, felText(e));
      svar.hinder.las_fel++;
      continue;
    }
    if (!last) {
      svar.hinder.las_fel++;
      continue;
    }
    const { plan } = last;
    if (plan.hinder.length > 0) {
      for (const h of plan.hinder) svar.hinder[h]++;
      continue;
    }
    if (!plan.andrar) {
      svar.redanRatt++;
      continue;
    }
    svar.attRatta++;
    svar.nyaBilder += plan.nya;
    svar.utgar += plan.utgar.length;
    att.push(r);
  }

  if (val.dryRun) {
    svar.kvar = att.length;
    svar.stoppadAv = "klart";
    svar.idn = att.slice(0, 50).map((r) => r.wixProductId);
    return svar;
  }
  if (att.length > (val.bekrafta ?? 0)) {
    throw new FamiljebildFel(
      `planen har ${att.length} sidor att rätta, fler än bekrafta (${val.bekrafta}) — kör planen igen`,
    );
  }

  for (const [i, r] of att.entries()) {
    if (klocka() - start > val.budgetMs - MARGINAL_MS) {
      svar.stoppadAv = "tidsbudget";
      svar.kvar = att.length - i;
      return svar;
    }
    const u = await skrivFamilj(r, deps);
    if (!u.ok) {
      console.warn(`[vevor-familjebilder] ${u.id} stoppade körningen: ${u.fel} (${u.steg.join(", ")})`);
      svar.fel = { id: u.id, orsak: u.orsak ?? "skrivning" };
      svar.stoppadAv = u.orsak === "strypt" ? "strypt" : "fel";
      svar.kvar = att.length - i;
      return svar;
    }
    console.log(`[vevor-familjebilder] ${u.id}: ${u.steg.join(", ")}`);
    svar.skrivna++;
    if (svar.idn.length < 50) svar.idn.push(u.id);
  }
  svar.stoppadAv = "klart";
  return svar;
}
