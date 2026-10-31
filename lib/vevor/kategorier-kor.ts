// VEVOR-utkast som importerades före 2026-10-31 får sin avdelning och
// underkategori i efterhand, och vapenskåpen och spritapparaterna märks
// (lib/vevor/kategorier.ts).
// Workflowen "VEVOR — kategorier till utkasten" → /api/admin/vevor-kategorier.
//
// Importen kopplar kategorierna själv sedan 2026-10-31. Verktyget är för det
// som redan låg i Wix, och för en import där kopplingen föll.
//
// Tio egenskaper som inte ska tas bort:
//
// 1. ☠️ Kategorier kopplas bara på opolerade, dolda VEVOR-utkast. En polerad
//    sida har kategorier som en människa valt (kategori.tsv), och dem rör
//    verktyget aldrig.
// 2. ☠️ Verktyget lägger bara till. Det tar aldrig bort en produkt ur en
//    kategori, och skriver aldrig pris, text eller synlighet.
// 3. ☠️ Saknas något regelmål i Wix-trädet (fel namn, två kategorier med samma
//    namn, en underkategori under fel avdelning) kopplas ingenting i körningen.
// 4. Det som redan är kopplat läses ur kategorierna (list-items), så planen
//    räknar bara det som saknas och krymper för varje varv.
// 5. ☠️ En skarp körning kräver `bekrafta` = planens antal produkter att
//    koppla, och planen får krympa men aldrig växa.
// 6. ☠️ Bulk-svaret är facit per produkt (lib/wix/kategoritrad.ts). En produkt
//    räknas som kopplad först när Wix bekräftat både avdelningen och
//    underkategorin. Ett vapenskåp räknas som märkt först när raden läses
//    tillbaka med flaggan.
// 7. ☠️ Svaret bär bara antal, kategorinamn och Wix-id, aldrig artikelnummer
//    eller produktnamn: loggen är publik.
// 8. ☠️ Vapenskåpen märks på ALLA VEVOR-rader, också polerade, och på varje
//    artikel i en familj. Märkningen görs före kontrollen av kategoriträdet
//    och av `bekrafta`, för den hänger inte på något av dem
//    (kodgranskningen 2026-10-31). Ett vapenskåp som redan är publicerat räknas
//    i `vapenskap.publicerade`; dölj det i Wix.
// 9. ☠️ En vara vars artikel hamnar i Hjälpmedel får
//    `vevorGranskning.medicinteknik` på samma sätt och i samma steg: Leonard
//    granskar varje sådan vara före publiceringen (beslut 4, 2026-10-31), och
//    poleringen stannar på flaggan. Granskningen 2026-10-31 fann 36 av 119
//    utkast i Hjälpmedel utan den. Ett vapenskåp får inte flaggan, för det
//    publiceras aldrig.
// 10. ☠️ Spritapparaterna märks som vapenskåpen, på alla VEVOR-rader och i
//    samma steg (`vevorGranskning.spritapparat`). Alkohollagen 2 kap. 1 §
//    förbjuder att överlåta dem, så de får ingen kategori och publiceras inte.
//    En publicerad spritapparat räknas i `spritapparat.publicerade`; dölj den i
//    Wix.

import type { ProductMappingRecord } from "@/lib/store";
import { mappingSupplier, vevorSkuOf } from "@/lib/store/supplier";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import {
  kopplaTillKategori,
  lasKategoritradet,
  produkterIKategori,
  type Anrop,
} from "@/lib/wix/kategoritrad";
import { SPRITAPPARAT, VAPENSKAP, arHjalpmedel, byggUppslag, klassa, malNyckel, type Mal, type MalIdn } from "./kategorier";
import type { Avlasning } from "./lager";

export interface KategoriDeps {
  wix: Anrop;
  /** VEVOR:s mappningsrader (prefixet vevor:). */
  mappningar: () => Promise<ProductMappingRecord[]>;
  avlasningar: (skus: string[]) => Promise<Map<string, Avlasning>>;
  /** Färska rader precis före märkningen. */
  lasMappningar: (wixProductIds: string[]) => Promise<Map<string, ProductMappingRecord>>;
  sparaMappningar: (rader: ProductMappingRecord[]) => Promise<{ fel: { wixProductId: string; fel: string }[] }>;
  klocka?: () => number;
}

export interface KategoriVal {
  dryRun: boolean;
  /** Planens antal produkter att koppla. Krävs för en skarp körning. */
  bekrafta: number | null;
  budgetMs: number;
}

/** En märkning på mappningsraden: vapenskåp eller hjälpmedel. */
export interface Markning {
  totalt: number;
  attMarka: number;
  markta: number;
  fel: number;
  /** Märkta varor som redan är publicerade. Ska vara 0. */
  publicerade: number;
  /** Upp till 50 Wix-id för de publicerade. */
  publiceradeIdn: string[];
}

export type Vapenskap = Markning;

export interface KategoriSvar {
  dryRun: boolean;
  /** Opolerade, dolda VEVOR-utkast. */
  utkast: number;
  /** Produkter som saknar avdelningen, underkategorin eller båda. */
  attKoppla: number;
  redanKopplade: number;
  /** Per mål ("Avdelning/Underkategori"): produkter att koppla. */
  perKategori: Record<string, number>;
  /** Ingen regel passar varans VEVOR-kategori och namn. */
  utanRegel: number;
  avlasningSaknas: number;
  vapenskap: Markning;
  /** Spritapparater: märks och publiceras inte (egenskap 10). */
  spritapparat: Markning;
  /** Varor i Hjälpmedel: flaggas för Leonards granskning (egenskap 9). */
  hjalpmedel: Markning;
  /** Regelmål som saknas i Wix-trädet. Ska vara tom. */
  tradFel: string[];
  kopplade: number;
  fel: number;
  /** Upp till tre felmeddelanden från Wix, utan identifierare. */
  felExempel: string[];
  kvar: number;
  /** "trad": ett regelmål saknas i Wix, och ingenting kopplades (spärrarna märktes ändå). */
  stoppadAv: "klart" | "tidsbudget" | "fel" | "trad" | null;
  /** Upp till 50 Wix-id för produkter att koppla (torrt) eller kopplade (skarpt). */
  idn: string[];
}

export class KategoriFel extends Error {}

const MARGINAL_MS = 30_000;
/** Produkter per tugga. Sorterade på mål blir det få anrop per tugga. */
const TUGGA = 100;
/** Så många tuggor i följd där allt föll stoppar körningen. */
const HELA_TUGGOR_FEL = 2;

/** Är raden ett opolerat, dolt VEVOR-utkast? */
export function arKategoriUtkast(r: ProductMappingRecord): boolean {
  return (
    mappingSupplier(r) === "vevor" &&
    !r.wixRaderad &&
    !!r.wixProductId &&
    r.needsAiPolish === true &&
    r.draftStatus !== "published" &&
    r.draftStatus !== "rejected"
  );
}

/** En VEVOR-rad som finns i Wix, polerad eller inte: den får märkningarna. */
export function arVapenKandidat(r: ProductMappingRecord): boolean {
  return mappingSupplier(r) === "vevor" && !r.wixRaderad && !!r.wixProductId;
}

/** Radens egen artikel och, på en familj, varje variants. */
function artiklarFor(r: ProductMappingRecord): string[] {
  const egen = vevorSkuOf(r);
  const fam = (r.vevorArtiklar ?? []).map((a) => (a.startsWith(VEVOR_ID_PREFIX) ? a.slice(VEVOR_ID_PREFIX.length) : a));
  return [...new Set([...(egen ? [egen] : []), ...fam])];
}

function felUtanId(text: string): string {
  // Wix felkroppar kan bära produkt- och kategori-id. De är våra egna id, men
  // ett svar i en publik logg ska bara säga vad som hände.
  return text.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>").slice(0, 160);
}

function tomMarkning(): Markning {
  return { totalt: 0, attMarka: 0, markta: 0, fel: 0, publicerade: 0, publiceradeIdn: [] };
}

/** Räknar raden i märkningen. Svarar sant när flaggan saknas och ska sättas. */
function raknaMarkning(m: Markning, r: ProductMappingRecord, redan: boolean): boolean {
  m.totalt++;
  if (r.draftStatus === "published") {
    m.publicerade++;
    if (m.publiceradeIdn.length < 50) m.publiceradeIdn.push(r.wixProductId);
  }
  if (redan) return false;
  m.attMarka++;
  return true;
}

interface Planrad {
  pid: string;
  mal: Mal;
  ids: MalIdn;
  /** Kategorierna produkten saknar: avdelningen, underkategorin eller båda. */
  saknas: string[];
}

export async function korKategorier(deps: KategoriDeps, val: KategoriVal): Promise<KategoriSvar> {
  const klocka = deps.klocka ?? Date.now;
  const start = klocka();
  if (!val.dryRun && (val.bekrafta === null || !Number.isInteger(val.bekrafta) || val.bekrafta < 0)) {
    throw new KategoriFel("en skarp körning kräver bekrafta = planens antal produkter att koppla");
  }
  const alla = await deps.mappningar();
  const rader = alla.filter(arKategoriUtkast);
  const kandidater = alla.filter(arVapenKandidat);
  const svar: KategoriSvar = {
    dryRun: val.dryRun,
    utkast: rader.length,
    attKoppla: 0,
    redanKopplade: 0,
    perKategori: {},
    utanRegel: 0,
    avlasningSaknas: 0,
    vapenskap: tomMarkning(),
    spritapparat: tomMarkning(),
    hjalpmedel: tomMarkning(),
    tradFel: [],
    kopplade: 0,
    fel: 0,
    felExempel: [],
    kvar: 0,
    stoppadAv: null,
    idn: [],
  };

  const skus = [...new Set(kandidater.flatMap(artiklarFor))];
  const avl = await deps.avlasningar(skus);

  // ☠️ Märkningarna först, på alla VEVOR-rader och varje artikel i en familj
  // (egenskap 8–10). Ett vapenskåp och en spritapparat får aldrig en kategori,
  // och en vara i Hjälpmedel granskas av Leonard före publiceringen.
  const sparradeIdn = new Set<string>();
  const attMarka = new Map<string, { vapen: boolean; sprit: boolean; hjalp: boolean }>();
  for (const r of kandidater) {
    const klasser = artiklarFor(r)
      .map((sku) => avl.get(sku))
      .filter((a): a is Avlasning => a !== undefined)
      .map((a) => klassa(a));
    const arVapen = klasser.some((k) => k.typ === VAPENSKAP);
    const arSprit = !arVapen && klasser.some((k) => k.typ === SPRITAPPARAT);
    const arHjalp = !arVapen && !arSprit && klasser.some(arHjalpmedel);
    const g = r.vevorGranskning;
    const vapen = arVapen && raknaMarkning(svar.vapenskap, r, g?.vapenskap === true);
    const sprit = arSprit && raknaMarkning(svar.spritapparat, r, g?.spritapparat === true);
    const hjalp = arHjalp && raknaMarkning(svar.hjalpmedel, r, g?.medicinteknik === true);
    if (arVapen || arSprit) sparradeIdn.add(r.wixProductId);
    if (vapen || sprit || hjalp) attMarka.set(r.wixProductId, { vapen, sprit, hjalp });
  }
  if (!val.dryRun && attMarka.size > 0) {
    const farska = await deps.lasMappningar([...attMarka.keys()]);
    const nya: ProductMappingRecord[] = [];
    for (const [id, m] of attMarka) {
      const f = farska.get(id);
      if (!f || !arVapenKandidat(f)) continue;
      const g = f.vevorGranskning ?? { gpsr: "ingen_manual" as const, medicinteknik: false, bildmonster: "okant" as const, bildgranskning: true };
      nya.push({
        ...f,
        vevorGranskning: {
          ...g,
          ...(m.vapen ? { vapenskap: true } : {}),
          ...(m.sprit ? { spritapparat: true } : {}),
          ...(m.hjalp ? { medicinteknik: true } : {}),
        },
      });
    }
    const sparat = await deps.sparaMappningar(nya);
    const efter = await deps.lasMappningar(nya.map((r) => r.wixProductId));
    for (const r of nya) {
      const m = attMarka.get(r.wixProductId)!;
      const g = efter.get(r.wixProductId)?.vevorGranskning;
      if (m.vapen) {
        if (g?.vapenskap === true) svar.vapenskap.markta++;
        else svar.vapenskap.fel++;
      }
      if (m.sprit) {
        if (g?.spritapparat === true) svar.spritapparat.markta++;
        else svar.spritapparat.fel++;
      }
      if (m.hjalp) {
        if (g?.medicinteknik === true) svar.hjalpmedel.markta++;
        else svar.hjalpmedel.fel++;
      }
    }
    for (const f of sparat.fel.slice(0, 3)) svar.felExempel.push(felUtanId(f.fel));
  }

  // ☠️ Hela trädet: ett regelmål som saknas stoppar kopplingen (egenskap 3).
  const uppslag = byggUppslag(await lasKategoritradet(deps.wix));
  svar.tradFel = uppslag.fel;
  if (uppslag.fel.length > 0 && !val.dryRun) {
    svar.stoppadAv = "trad";
    return svar;
  }

  const attKlassa: { r: ProductMappingRecord; mal: Mal }[] = [];
  for (const r of rader) {
    if (sparradeIdn.has(r.wixProductId)) continue;
    const sku = vevorSkuOf(r);
    const a = sku ? avl.get(sku) : undefined;
    if (!a) {
      svar.avlasningSaknas++;
      continue;
    }
    const k = klassa(a);
    if (k.typ === "omappad") svar.utanRegel++;
    else if (k.typ === "kategori") attKlassa.push({ r, mal: k.mal });
  }

  // Det som redan är kopplat, per kategori som planen rör.
  const plan: Planrad[] = [];
  if (uppslag.fel.length === 0) {
    const kategoriIds = new Set<string>();
    for (const { mal } of attKlassa) {
      const ids = uppslag.idn.get(malNyckel(mal));
      if (ids) {
        kategoriIds.add(ids.avdelning);
        kategoriIds.add(ids.kategori);
      }
    }
    const innehall = new Map<string, Set<string>>();
    for (const id of kategoriIds) innehall.set(id, await produkterIKategori(deps.wix, id));
    for (const { r, mal } of attKlassa) {
      const ids = uppslag.idn.get(malNyckel(mal))!;
      const saknas = [ids.avdelning, ids.kategori].filter((id) => !innehall.get(id)!.has(r.wixProductId));
      if (saknas.length === 0) {
        svar.redanKopplade++;
        continue;
      }
      plan.push({ pid: r.wixProductId, mal, ids, saknas });
      const n = malNyckel(mal);
      svar.perKategori[n] = (svar.perKategori[n] ?? 0) + 1;
    }
  }
  svar.attKoppla = plan.length;

  if (val.dryRun) {
    svar.kvar = plan.length;
    svar.stoppadAv = "klart";
    svar.idn = plan.slice(0, 50).map((p) => p.pid);
    return svar;
  }
  if (plan.length > (val.bekrafta ?? 0)) {
    throw new KategoriFel(
      `planen har ${plan.length} produkter att koppla, fler än bekrafta (${val.bekrafta}): kör planen igen ` +
        `(vapenskåp märkta ${svar.vapenskap.markta}, fel ${svar.vapenskap.fel}; ` +
        `spritapparater märkta ${svar.spritapparat.markta}, fel ${svar.spritapparat.fel})`,
    );
  }

  // Sorterade på mål, så att en tugga rör få kategorier.
  plan.sort((a, b) => malNyckel(a.mal).localeCompare(malNyckel(b.mal), "sv") || a.pid.localeCompare(b.pid));
  let helaFel = 0;
  for (let i = 0; i < plan.length; i += TUGGA) {
    if (klocka() - start > val.budgetMs - MARGINAL_MS) {
      svar.stoppadAv = "tidsbudget";
      svar.kvar = plan.length - i;
      return svar;
    }
    const tugga = plan.slice(i, i + TUGGA);
    const perKategori = new Map<string, string[]>();
    for (const p of tugga) for (const id of p.saknas) perKategori.set(id, [...(perKategori.get(id) ?? []), p.pid]);
    const utfall = new Map<string, string | null>(tugga.map((p) => [p.pid, null]));
    for (const [kategoriId, pids] of perKategori) {
      const u = await kopplaTillKategori(deps.wix, kategoriId, pids);
      for (const pid of pids) {
        const x = u.get(pid);
        if (!x || typeof x === "object") utfall.set(pid, x && typeof x === "object" ? x.fel : "inget svar");
      }
    }
    let felITugga = 0;
    for (const p of tugga) {
      const f = utfall.get(p.pid);
      if (f) {
        felITugga++;
        svar.fel++;
        if (svar.felExempel.length < 3) svar.felExempel.push(felUtanId(f));
      } else {
        svar.kopplade++;
        if (svar.idn.length < 50) svar.idn.push(p.pid);
      }
    }
    helaFel = felITugga === tugga.length ? helaFel + 1 : 0;
    if (helaFel >= HELA_TUGGOR_FEL) {
      svar.stoppadAv = "fel";
      svar.kvar = plan.length - (i + tugga.length);
      return svar;
    }
  }
  svar.stoppadAv = "klart";
  return svar;
}
