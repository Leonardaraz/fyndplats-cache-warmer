// VEVOR-utkast som importerades före 2026-10-31 får sin avdelning och
// underkategori i efterhand, och vapenskåpen märks (lib/vevor/kategorier.ts).
// Workflowen "VEVOR — kategorier till utkasten" → /api/admin/vevor-kategorier.
//
// Importen kopplar kategorierna själv sedan 2026-10-31. Verktyget är för det
// som redan låg i Wix, och för en import där kopplingen föll.
//
// Sju egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara opolerade, dolda VEVOR-utkast. En polerad sida har kategorier som
//    en människa valt (kategori.tsv), och dem rör verktyget aldrig.
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

import type { ProductMappingRecord } from "@/lib/store";
import { mappingSupplier, vevorSkuOf } from "@/lib/store/supplier";
import {
  kopplaTillKategori,
  lasKategoritradet,
  produkterIKategori,
  type Anrop,
} from "@/lib/wix/kategoritrad";
import { VAPENSKAP, byggUppslag, klassa, malNyckel, type Mal, type MalIdn } from "./kategorier";
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
  vapenskap: { totalt: number; attMarka: number; markta: number; fel: number };
  /** Regelmål som saknas i Wix-trädet. Ska vara tom. */
  tradFel: string[];
  kopplade: number;
  fel: number;
  /** Upp till tre felmeddelanden från Wix, utan identifierare. */
  felExempel: string[];
  kvar: number;
  stoppadAv: "klart" | "tidsbudget" | "fel" | null;
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

function felUtanId(text: string): string {
  // Wix felkroppar kan bära produkt- och kategori-id. De är våra egna id, men
  // ett svar i en publik logg ska bara säga vad som hände.
  return text.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>").slice(0, 160);
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
  const rader = (await deps.mappningar()).filter(arKategoriUtkast);
  const svar: KategoriSvar = {
    dryRun: val.dryRun,
    utkast: rader.length,
    attKoppla: 0,
    redanKopplade: 0,
    perKategori: {},
    utanRegel: 0,
    avlasningSaknas: 0,
    vapenskap: { totalt: 0, attMarka: 0, markta: 0, fel: 0 },
    tradFel: [],
    kopplade: 0,
    fel: 0,
    felExempel: [],
    kvar: 0,
    stoppadAv: null,
    idn: [],
  };

  // ☠️ Hela trädet först: ett regelmål som saknas stoppar allt (egenskap 3).
  const uppslag = byggUppslag(await lasKategoritradet(deps.wix));
  svar.tradFel = uppslag.fel;
  if (uppslag.fel.length > 0 && !val.dryRun) {
    throw new KategoriFel(`kategoriträdet saknar regelmål, ingenting kopplat: ${uppslag.fel.slice(0, 3).join("; ")}`);
  }

  const skus = [...new Set(rader.map((r) => vevorSkuOf(r)).filter((s): s is string => Boolean(s)))];
  const avl = await deps.avlasningar(skus);
  const attKlassa: { r: ProductMappingRecord; mal: Mal }[] = [];
  const vapen: ProductMappingRecord[] = [];
  for (const r of rader) {
    const sku = vevorSkuOf(r);
    const a = sku ? avl.get(sku) : undefined;
    if (!a) {
      svar.avlasningSaknas++;
      continue;
    }
    const k = klassa(a);
    if (k.typ === "omappad") svar.utanRegel++;
    else if (k.typ === VAPENSKAP) {
      svar.vapenskap.totalt++;
      if (r.vevorGranskning?.vapenskap !== true) vapen.push(r);
    } else attKlassa.push({ r, mal: k.mal });
  }
  svar.vapenskap.attMarka = vapen.length;

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
    throw new KategoriFel(`planen har ${plan.length} produkter att koppla, fler än bekrafta (${val.bekrafta}): kör planen igen`);
  }

  // Vapenskåpen märks först: få rader, och de ska aldrig kunna publiceras.
  if (vapen.length > 0) {
    const farska = await deps.lasMappningar(vapen.map((r) => r.wixProductId));
    const nya: ProductMappingRecord[] = [];
    for (const r of vapen) {
      const f = farska.get(r.wixProductId);
      if (!f || !arKategoriUtkast(f)) continue;
      const g = f.vevorGranskning ?? { gpsr: "ingen_manual" as const, medicinteknik: false, bildmonster: "okant" as const, bildgranskning: true };
      nya.push({ ...f, vevorGranskning: { ...g, vapenskap: true } });
    }
    const sparat = await deps.sparaMappningar(nya);
    const efter = await deps.lasMappningar(nya.map((r) => r.wixProductId));
    for (const r of nya) {
      if (efter.get(r.wixProductId)?.vevorGranskning?.vapenskap === true) svar.vapenskap.markta++;
      else svar.vapenskap.fel++;
    }
    for (const f of sparat.fel.slice(0, 3)) svar.felExempel.push(felUtanId(f.fel));
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
