// lib/gpsr/fyll.ts
//
// Fyller FyndplatsGpsr: en post per Aosom-produkt med märke och svensk
// säkerhetstext. Körs av /api/cron/gpsr-fill.
//
// Posten görs om bara när källan ändrats (kallHash) eller märket gjort det.
// Första körningarna tar hela katalogen; därefter rör en körning bara det
// Aosom skrivit om, och kostar en feed-hämtning och en tabelläsning.
//
// Publicerade produkter går först, så att det kunder ser blir klart först.
// En produkt som försvunnit ur feeden behåller sin post — varan har inte
// blivit osäkrare för att Aosom slutat sälja den.

import type { AosomRow } from "../aosom/feed";
import type { ProductMappingRecord } from "../store";
import { aosomSkuOf } from "../store/supplier";
import { mapWithConcurrency } from "../concurrency";
import { kallHash, kallText, markeUrAosomUrl, type GpsrPost } from "./aosom";
import type { Utvinnare } from "./sakerhet";

export interface FyllDeps {
  listaMappningar: () => Promise<ProductMappingRecord[]>;
  hamtaFeed: () => Promise<AosomRow[]>;
  listaPoster: () => Promise<GpsrPost[]>;
  spara: (p: GpsrPost) => Promise<void>;
  utvinn: Utvinnare;
  nu?: () => number;
}

export interface FyllOpts {
  dryRun: boolean;
  /** Högst så här många utvinningar denna körning. */
  limit?: number;
  samtidighet?: number;
  /** Ingen ny utvinning påbörjas efter så här lång tid. */
  timeBudgetMs?: number;
}

export interface FyllSummary {
  dryRun: boolean;
  aosomProdukter: number;
  saknarFeedrad: number;
  oforandrade: number;
  attGora: number;
  bearbetade: number;
  sparade: number;
  /** Utvinningar där modellen inte svarade. Försöks igen nästa körning. */
  fel: number;
  /** Poster utan känt märke — tillverkaren visas ändå. */
  utanMarke: number;
  /** Poster där källan saknade säkerhetsuppgifter. */
  utanSakerhet: number;
  /** Kvar efter den här körningen (limit eller tidsbudget). */
  kvar: number;
  /** Några färdiga poster i publik form, för torrkörningens granskning. */
  prov: { wixProductId: string; marke: string | null; sakerhet: string[] }[];
}

const DEFAULT_LIMIT = 400;
const DEFAULT_SAMTIDIGHET = 6;
const PROV = 5;

interface Jobb {
  wixProductId: string;
  sku: string;
  marke: string | null;
  text: string;
  hash: string;
}

export async function fyllGpsr(deps: FyllDeps, opts: FyllOpts): Promise<FyllSummary> {
  const nu = deps.nu ?? Date.now;
  const start = nu();
  const [mappningar, feed, poster] = await Promise.all([
    deps.listaMappningar(),
    deps.hamtaFeed(),
    deps.listaPoster(),
  ]);
  // En tom feed är ett fel hos Aosom eller i hämtningen, inte ett besked om
  // att sortimentet försvunnit.
  if (feed.length === 0) throw new Error("Aosom-feeden var tom — ingen GPSR-fyllning.");

  const rader = new Map(feed.map((r) => [r.sku, r]));
  const befintliga = new Map(poster.map((p) => [p.wixProductId, p]));

  const aosom = mappningar
    .map((m) => ({ m, sku: aosomSkuOf(m) }))
    .filter((x): x is { m: ProductMappingRecord; sku: string } => !!x.sku && !!x.m.wixProductId)
    .sort((a, b) => Number(b.m.draftStatus === "published") - Number(a.m.draftStatus === "published"));

  const summary: FyllSummary = {
    dryRun: opts.dryRun,
    aosomProdukter: aosom.length,
    saknarFeedrad: 0,
    oforandrade: 0,
    attGora: 0,
    bearbetade: 0,
    sparade: 0,
    fel: 0,
    utanMarke: 0,
    utanSakerhet: 0,
    kvar: 0,
    prov: [],
  };

  const jobb: Jobb[] = [];
  for (const { m, sku } of aosom) {
    const rad = rader.get(sku);
    if (!rad) { summary.saknarFeedrad++; continue; }
    const marke = markeUrAosomUrl(rad.url);
    const text = kallText({
      namn: rad.name,
      beskrivningHtml: rad.descriptionHtml,
      punkterHtml: rad.bulletsHtml,
      kategori: rad.category,
    });
    const hash = kallHash(text);
    const gammal = befintliga.get(m.wixProductId);
    if (gammal && gammal.kallHash === hash && gammal.marke === marke) {
      summary.oforandrade++;
      continue;
    }
    jobb.push({ wixProductId: m.wixProductId, sku, marke, text, hash });
  }
  summary.attGora = jobb.length;

  const limit = Math.max(0, Math.trunc(opts.limit ?? DEFAULT_LIMIT));
  const urval = jobb.slice(0, limit);
  const budget = opts.timeBudgetMs ?? Infinity;

  const resultat = await mapWithConcurrency(urval, opts.samtidighet ?? DEFAULT_SAMTIDIGHET, async (j) => {
    if (nu() - start > budget) return "hoppad" as const;
    let sakerhet: string[] | null;
    try {
      sakerhet = await deps.utvinn(j.text);
    } catch (err) {
      console.warn(`[gpsr] utvinning kastade för ${j.wixProductId}: ${String(err).slice(0, 200)}`);
      sakerhet = null;
    }
    if (sakerhet === null) return "fel" as const;
    const post: GpsrPost = {
      wixProductId: j.wixProductId,
      sku: j.sku,
      marke: j.marke,
      sakerhet,
      kallHash: j.hash,
      at: new Date(nu()).toISOString(),
    };
    if (!opts.dryRun) await deps.spara(post);
    return post;
  });

  for (const r of resultat) {
    if (r === "hoppad") continue;
    summary.bearbetade++;
    if (r === "fel") { summary.fel++; continue; }
    if (!opts.dryRun) summary.sparade++;
    if (!r.marke) summary.utanMarke++;
    if (r.sakerhet.length === 0) summary.utanSakerhet++;
    if (summary.prov.length < PROV) {
      summary.prov.push({ wixProductId: r.wixProductId, marke: r.marke, sakerhet: r.sakerhet });
    }
  }
  summary.kvar = summary.attGora - (summary.bearbetade - summary.fel);
  return summary;
}
