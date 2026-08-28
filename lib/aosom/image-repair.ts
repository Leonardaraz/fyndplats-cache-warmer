// Reparerar Aosom-produkter som fick för få bilder vid importen.
//
// BAKGRUNDEN (2026-08-27)
//
// Svepet importerade 675 produkter. 397 fick NOLL bilder och 87 fick färre än
// fem, medan importen rapporterade `failed: 0` — produkten skapades ju, det var
// bara bilderna som föll bort. Två tysta fel i lib/wix/media.ts: rejectade
// uppladdningar filtrerades bort utan logg, och det fanns inget återförsök mot
// Wix 429. Båda är lagade där; den här filen städar upp efter dem.
//
// VARFÖR ALLA BILDER LADDAS OM, INTE BARA DE SAKNADE
//
// En wixstatic-adress avslöjar inte vilken källbild den kom från, så det går
// inte att veta VILKA av de fem som saknas på en produkt med tre. Att ladda om
// alla fem och ersätta listan är enkelt och idempotent.
//
// ☠️ MEN DET LÄMNAR DE GAMLA FILERNA KVAR, OCH DET FYLLDE LAGRINGEN (2026-08-28)
//
// Den här kommentaren sa tidigare att omladdningen "kostar några hundra extra
// uppladdningar totalt". Den skrevs när katalogen var 744 produkter och EN
// reparationskörning var planerad. Verkligheten blev fyra körningar mot en
// katalog som växte till 2 712 produkter: varje lagad produkt lämnar fem filer
// à drygt en megabyte i Media Manager, och Wix-lagringen tog slut mitt under den
// fjärde körningen.
//
// Filerna städas av `/api/cron/aosom-media-cleanup`, som raderar Aosom-bilder
// som ingen produkt använder. Den är avsiktligt en SEPARAT körning och inte
// inbakad här: en radering inne i reparationen hade skett innan skrivningen
// verifierats, och en produkt vars nya bilder inte fastnade hade då förlorat
// även de gamla.
//
// Den riktiga lösningen är att spara vilken KÄLLBILD varje wixstatic-adress kom
// från, så bara det som saknas laddas om. Det kräver ett nytt fält på mappningen
// och är inte gjort.
//
// VAD DEN INTE RÖR
//
// setProductMedia skickar `fieldMask: ["media"]`, så synlighet, varianter,
// priser och texter är orörda. En Aosom-produkt är ett osynligt utkast och ska
// förbli det — reparationen får aldrig bli en publicering.

import type { AosomRow } from "./feed";
import { fetchAosomFeed, isShippableToSe } from "./feed";
import { toImportProduct, aosomSupplierProductId, RENA_BILDPOSITIONER, type AosomFx } from "./to-product";

const DEFAULT_LIMIT = 25;
const DEFAULT_TIME_BUDGET_MS = 240_000;

export interface ImageRepairOptions {
  /** Torrkörning. DEFAULT TRUE — samma husregel som svepet och price-repair. */
  dryRun?: boolean;
  limit?: number;
  timeBudgetMs?: number;
  /** Fortsätt EFTER det här artikelnumret (markören ur föregående svar). */
  after?: string;
  /** Bara dessa artikelnummer. För riktad omkörning. */
  onlySkus?: string[];
  bildpositioner?: readonly number[];
}

export interface ImageRepairSummary {
  dryRun: boolean;
  /** Aosom-produkter i katalogen. */
  aosomProdukter: number;
  /** De som har färre bilder än feeden kan ge. */
  trasiga: number;
  /** Undersökta i den här körningen. */
  granskade: number;
  reparerade: number;
  /** Bilder som fortfarande inte gick att hämta — de får en ny runda. */
  kvarstaendeMissar: number;
  misslyckade: number;
  kvar: number;
  cursor: string | null;
  stoppedBy: "klart" | "limit" | "tidsbudget";
  errors: { sku: string; error: string }[];
}

export interface ImageRepairDeps {
  fetchFeed: () => Promise<AosomRow[]>;
  /** Aosom-mappningar: artikelnummer → Wix-produkt. */
  listAosom: () => Promise<{ sku: string; wixProductId: string }[]>;
  /** Nuvarande bilder på produkten, eller null om den är borta. */
  getMedia: (wixProductId: string) => Promise<{ revision: string; antal: number } | null>;
  /** Laddar upp och returnerar wixstatic-adresserna. Missar utelämnas. */
  importImages: (urls: string[], slug: string) => Promise<string[]>;
  setMedia: (wixProductId: string, revision: string, urls: string[]) => Promise<void>;
  fx: AosomFx;
  now?: () => number;
}

/**
 * Kör en tugga av reparationen.
 *
 * Ordningen är densamma som svepets — artikelnummer stigande — så markören
 * betyder samma sak i båda och går att läsa av samma väg.
 */
export async function runImageRepair(
  deps: ImageRepairDeps,
  opts: ImageRepairOptions = {},
): Promise<ImageRepairSummary> {
  const dryRun = opts.dryRun !== false;
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const now = deps.now ?? (() => Date.now());
  const positioner = opts.bildpositioner ?? RENA_BILDPOSITIONER;
  const start = now();

  const feed = await deps.fetchFeed();
  const perSku = new Map(feed.filter(isShippableToSe).map((r) => [r.sku, r]));

  const onlySkus = opts.onlySkus?.length ? new Set(opts.onlySkus) : null;
  const aosom = (await deps.listAosom())
    .filter((m) => !onlySkus || onlySkus.has(m.sku))
    .filter((m) => !opts.after || m.sku.localeCompare(opts.after) > 0)
    .sort((a, b) => a.sku.localeCompare(b.sku));

  const summary: ImageRepairSummary = {
    dryRun,
    aosomProdukter: aosom.length,
    trasiga: 0,
    granskade: 0,
    reparerade: 0,
    kvarstaendeMissar: 0,
    misslyckade: 0,
    kvar: aosom.length,
    cursor: null,
    stoppedBy: "klart",
    errors: [],
  };

  for (const m of aosom) {
    if (summary.granskade >= limit) {
      summary.stoppedBy = "limit";
      break;
    }
    // Budgeten kollas FÖRE varje produkt — aldrig mitt i en halvskriven media-lista.
    if (now() - start >= timeBudgetMs) {
      summary.stoppedBy = "tidsbudget";
      break;
    }

    summary.granskade++;
    summary.kvar--;
    summary.cursor = m.sku;

    const row = perSku.get(m.sku);
    // Raden kan ha försvunnit ur feeden sedan importen. Då finns inga källbilder
    // att hämta, och produkten lämnas som den är — inte tömd.
    if (!row) continue;

    const onskade = toImportProduct(row, deps.fx, { positioner }).imageUrls;
    if (onskade.length === 0) continue;

    try {
      const nu = await deps.getMedia(m.wixProductId);
      if (!nu) continue;
      if (nu.antal >= onskade.length) continue;

      summary.trasiga++;
      if (dryRun) continue;

      const uppladdade = await deps.importImages(onskade, `aosom-${m.sku}`);
      // Skriv ALDRIG en tommare lista än den som redan ligger där. Går
      // uppladdningen dåligt igen är det bättre att lämna produkten orörd och
      // ta den i nästa runda än att göra den sämre.
      if (uppladdade.length <= nu.antal) {
        summary.kvarstaendeMissar += onskade.length - uppladdade.length;
        continue;
      }

      await deps.setMedia(m.wixProductId, nu.revision, uppladdade);

      // ☠️ ETT SVAR UTAN FEL ÄR INGET BEVIS. Läs tillbaka och räkna.
      //
      // Bildfixen 2026-08-27 rapporterade 524 lagade av 524 trasiga och NOLL
      // missar. Efteråt hade 214 produkter fortfarande färre än fem bilder —
      // och för dem satt INGEN av de fem uppladdade filerna på produkten.
      // Uppladdningarna gick igenom (filerna ligger READY i Media Manager),
      // skrivningen svarade utan fel, och ändå ändrades ingenting. Mönstret var
      // jämnt över hela körningen, så det är inte en degradering över tid.
      //
      // Mekanismen är fortfarande oförklarad. Det som INTE får stå kvar är att
      // felet är osynligt: en produkt är lagad först när den läser tillbaka
      // fler bilder än den hade. Samma läxa som lib/wix/media.ts bär i sitt
      // filhuvud, och som recensionsbilderna bar före den.
      const efter = await deps.getMedia(m.wixProductId);
      if (!efter || efter.antal <= nu.antal) {
        summary.misslyckade++;
        summary.errors.push({
          sku: m.sku,
          error: `skrivningen tog inte: ${efter?.antal ?? 0} bilder på produkten `
            + `efter ${uppladdade.length} uppladdade (hade ${nu.antal})`,
        });
        continue;
      }

      summary.reparerade++;
      // Räkna på vad som FAKTISKT sitter där, inte på vad vi laddade upp.
      if (efter.antal < onskade.length) {
        summary.kvarstaendeMissar += onskade.length - efter.antal;
      }
    } catch (err) {
      summary.misslyckade++;
      summary.errors.push({ sku: m.sku, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (summary.kvar <= 0) summary.cursor = null;
  return summary;
}

/** Standard-deps mot skarpa systemet. Bryts ut så testerna slipper mocka moduler. */
export async function liveDeps(): Promise<ImageRepairDeps> {
  const [{ getStore }, { getPricingRules }, { eurToSekFromEnv }, wix, media] = await Promise.all([
    import("../store/factory"),
    import("../store/pricing-config"),
    import("../config"),
    import("../wix/client"),
    import("../wix/media"),
  ]);
  const rules = await getPricingRules();
  const store = getStore();

  return {
    fetchFeed: () => fetchAosomFeed(),
    listAosom: async () =>
      (await store.listMappings())
        .filter((m) => (m.supplierProductId ?? "").startsWith("aosom:") && m.wixProductId)
        .map((m) => ({
          sku: (m.supplierProductId ?? "").slice(aosomSupplierProductId("").length),
          wixProductId: m.wixProductId,
        })),
    getMedia: async (id) => {
      const snap = await wix.getProductMedia(id);
      return snap ? { revision: snap.revision, antal: snap.media.length } : null;
    },
    importImages: async (urls, slug) =>
      (await media.importMediaUrls(
        urls.map((url, i) => ({ url, displayName: `${slug}-${i + 1}` })),
        { delayMs: 150 },
      )).map((m) => m.url),
    setMedia: async (id, revision, urls) => {
      await wix.setProductMedia(id, revision, urls.map((url) => ({ url })));
    },
    fx: { eurToSek: eurToSekFromEnv(), usdToSek: rules.usdToSek },
  };
}
