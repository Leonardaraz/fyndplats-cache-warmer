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
// ☠️ BARA DET SOM SAKNAS LADDAS OM (sedan 2026-08-28)
//
// Reparationen laddade tidigare om ALLA fem bilderna för varje produkt den
// lagade och ersatte medialistan. Skälet stod i den här kommentaren: en
// wixstatic-adress avslöjar inte vilken källbild den kom från, så det gick inte
// att veta vilka av fem som fattades på en produkt med tre.
//
// Priset blev en incident. Varje lagad produkt lämnade fem filer à drygt en
// megabyte efter sig, kommentaren påstod att det "kostar några hundra extra
// uppladdningar totalt" — skriven när katalogen var 744 produkter och EN
// körning var planerad — och verkligheten blev fyra körningar mot en katalog
// som växte till 2 712. Wix-lagringen tog slut mitt under den fjärde, och
// 37 000 föräldralösa filer fick städas bort efteråt.
//
// Kopplingen finns nu i stället för att gissas, från två håll:
//
//   • `aosomBildFiler` på mappningen, som sparas efter varje verifierad
//     skrivning. Kostar ingenting att läsa.
//   • Wix egen `sourceUrl` (`getMediaSourceUrls`), för allt som importerades
//     innan fältet fanns. Ett anrop per produkt, och bara en gång — efteråt är
//     kopplingen sparad.
//
// Med den känd behålls det som redan sitter rätt VID SITT ID och bara luckorna
// fylls. Då uppstår inga föräldralösa alls.
//
// Går kopplingen ändå inte att härleda faller reparationen tillbaka på den
// gamla vägen och laddar om allt. Det är med flit: vet vi inte vad produkten
// har kan en påfyllning ge samma bild två gånger på en kundsida, och en
// dubblett är värre än en extra uppladdning.
//
// Städningen av det som redan hunnit bli föräldralöst ligger kvar i
// `/api/cron/aosom-media-cleanup`. Den är avsiktligt en SEPARAT körning: en
// radering inne i reparationen hade skett innan skrivningen verifierats, och en
// produkt vars nya bilder inte fastnade hade då förlorat även de gamla.
//
// VAD DEN INTE RÖR
//
// setProductMedia skickar `fieldMask: ["media"]`, så synlighet, varianter,
// priser och texter är orörda. En Aosom-produkt är ett osynligt utkast och ska
// förbli det — reparationen får aldrig bli en publicering.

import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import { fetchAosomFeed, isShippableToSe } from "./feed";
import { toImportProduct, aosomSupplierProductId, RENA_BILDPOSITIONER, type AosomFx } from "./to-product";

const DEFAULT_LIMIT = 25;
const DEFAULT_TIME_BUDGET_MS = 240_000;

/** En bild på produkten: Wix-filens id och adress. */
export interface ProduktBild {
  id?: string;
  url: string;
}

export interface BildPlan {
  /**
   * Filer som ska sitta kvar, i önskad ordning. Behålls VID SITT ID.
   *
   * `fileId` är avsiktligt inte valfritt: skickas en tom sträng vidare faller
   * `setProductMedia` tillbaka på adressen, och då importerar Wix om bilden
   * till en ny fil — precis den bugg som fyllde lagringen. En bild utan id
   * hamnar därför i `oidentifierade`, aldrig här.
   */
  behall: { kalla: string; fileId: string; url: string }[];
  /** Källbilder som måste laddas upp — och bara de. */
  saknas: string[];
  /**
   * Bilder på produkten som inte gick att härleda till en källbild.
   *
   * Är den > 0 vet vi inte vad produkten redan har, och då är det inte säkert
   * att fylla på: en felgissning ger en dubblettbild på en kundsida. Då laddas
   * allt om, precis som förr — men bara för den produkten, och bara en gång,
   * eftersom kopplingen sparas efteråt.
   */
  oidentifierade: number;
}

/**
 * Vilka bilder ska laddas om?
 *
 * ☠️ HELA POÄNGEN ÄR ATT SVARET SÄLLAN ÄR "ALLA".
 *
 * Reparationen laddade tidigare om alla fem bilderna för varje produkt den
 * lagade och ersatte medialistan. De gamla filerna blev föräldralösa, och fyra
 * körningar mot en växande katalog tog slut på Wix-lagringen (2026-08-28):
 * 37 000 filer fick städas bort efteråt.
 *
 * Med kopplingen källbild → fil-id känd behålls det som redan sitter rätt VID
 * SITT ID, och bara luckorna fylls. Då uppstår inga föräldralösa alls.
 *
 * @param onskade    Källbilderna produkten ska ha, i ordning.
 * @param paProdukten Bilderna som sitter på produkten just nu.
 * @param kalla      Fil-id → källbild, från mappningen eller Wix `sourceUrl`.
 */
export function planeraBilder(
  onskade: readonly string[],
  paProdukten: readonly ProduktBild[],
  kalla: ReadonlyMap<string, string>,
): BildPlan {
  const perKalla = new Map<string, ProduktBild>();
  let oidentifierade = 0;

  for (const bild of paProdukten) {
    const k = bild.id ? kalla.get(bild.id) : undefined;
    // Utan id eller utan känd källa går bilden inte att placera. Vi vet då inte
    // vad produkten har, och får inte gissa.
    if (!k) {
      oidentifierade++;
      continue;
    }
    // Först till kvarn: sitter samma källbild två gånger räknas den en gång,
    // och dubbletten faller bort ur den nya listan.
    if (!perKalla.has(k)) perKalla.set(k, bild);
  }

  const behall: { kalla: string; fileId: string; url: string }[] = [];
  const saknas: string[] = [];
  for (const k of onskade) {
    const bild = perKalla.get(k);
    // `bild.id` är satt: utan id kom bilden aldrig in i perKalla ovan.
    if (bild?.id) behall.push({ kalla: k, fileId: bild.id, url: bild.url });
    else saknas.push(k);
  }

  return { behall, saknas, oidentifierade };
}

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
  /**
   * Bilder som INTE behövde laddas om — de satt redan rätt och behölls vid sitt
   * id. Måttet på vad kopplingen sparar: varje sådan bild är en fil som förut
   * hade laddats upp på nytt och lämnat en föräldralös efter sig.
   */
  atervandaBilder: number;
  /**
   * Produkter där kopplingen inte gick att härleda och allt fick laddas om.
   * Ska sjunka mot noll — kopplingen sparas efter varje lagning.
   */
  fullOmladdning: number;
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
  getMedia: (wixProductId: string) => Promise<{ revision: string; media: ProduktBild[] } | null>;
  /** Sparad koppling fil-id → källbild för produkten. Tom om den aldrig sparats. */
  kandaBildFiler: (sku: string) => Promise<{ kalla: string; fileId: string }[]>;
  /**
   * Härleder källbilden ur Wix egen `sourceUrl` för fil-id vi inte har sparade.
   *
   * Bootstrappen för allt som importerades innan kopplingen sparades. Ett anrop
   * per produkt, och bara för de id:n mappningen inte redan känner.
   */
  hamtaKallor: (fileIds: string[]) => Promise<Map<string, string>>;
  /** Sparar kopplingen på mappningen så nästa körning slipper härleda den. */
  sparaBildFiler: (sku: string, filer: { kalla: string; fileId: string }[]) => Promise<void>;
  /**
   * Laddar upp och returnerar de uppladdade filerna. Missar utelämnas.
   *
   * ☠️ ID:T MÅSTE FÖLJA MED. Skickas bara adressen vidare till setProductMedia
   * tolkar V3 den som extern och importerar om bilden till en NY fil — se
   * lib/wix/client.ts#WixProductInput.mediaItems. Det var så lagringen tog slut,
   * och så produkter kunde få fyra av fem bilder trots fem lyckade uppladdningar.
   */
  importImages: (urls: string[], slug: string) => Promise<{ id: string; url: string; kalla: string }[]>;
  setMedia: (
    wixProductId: string,
    revision: string,
    bilder: { id: string; url: string }[],
  ) => Promise<void>;
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
    atervandaBilder: 0,
    fullOmladdning: 0,
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
      if (nu.media.length >= onskade.length) continue;

      summary.trasiga++;
      if (dryRun) continue;

      // ── VILKA BILDER SAKNAS? ──────────────────────────────────────────────
      //
      // Mappningen först: den är sparad av oss och kostar ingenting. Bara för
      // de fil-id den inte känner frågas Wix om `sourceUrl`, och det är ett
      // anrop per produkt som dessutom upphör när kopplingen väl är sparad.
      const kalla = new Map<string, string>();
      for (const f of await deps.kandaBildFiler(m.sku)) kalla.set(f.fileId, f.kalla);
      const okanda = nu.media
        .flatMap((b) => (b.id ? [b.id] : []))
        .filter((id) => !kalla.has(id));
      if (okanda.length) {
        for (const [id, src] of await deps.hamtaKallor(okanda)) kalla.set(id, src);
      }

      const plan = planeraBilder(onskade, nu.media, kalla);

      // Går kopplingen inte att härleda vet vi inte vad produkten redan har.
      // Att fylla på då kan ge en dubblettbild på en kundsida, så hellre den
      // gamla vägen: ladda om allt. Det händer en gång per produkt — efteråt
      // är kopplingen sparad.
      const laddaOmAllt = plan.oidentifierade > 0;
      if (laddaOmAllt) summary.fullOmladdning++;

      const attLadda = laddaOmAllt ? [...onskade] : plan.saknas;
      const behall = laddaOmAllt ? [] : plan.behall;
      summary.atervandaBilder += behall.length;

      // Inget att ladda och inget att skriva — produkten är redan hel.
      if (attLadda.length === 0) continue;

      const uppladdade = await deps.importImages(attLadda, `aosom-${m.sku}`);

      // ☠️ LISTAN BYGGS I ÖNSKAD ORDNING, INTE "BEHÅLLNA FÖRST".
      //
      // Wix visar FÖRSTA objektet som huvudbild, och position 1 är den vita
      // produktbilden medan 2 är livsstilsbilden. En produkt som har 2 och 3
      // men saknar 1 hade med en enkel hopslagning fått livsstilsbilden som
      // huvudbild — i butiken, i sitemapen och i varje delning.
      const perKalla = new Map<string, { id: string; url: string; kalla: string }>();
      for (const b of behall) perKalla.set(b.kalla, { id: b.fileId, url: b.url, kalla: b.kalla });
      for (const u of uppladdade) if (!perKalla.has(u.kalla)) perKalla.set(u.kalla, u);
      const nyLista = onskade.flatMap((k) => {
        const b = perKalla.get(k);
        return b ? [b] : [];
      });

      // Skriv ALDRIG en tommare lista än den som redan ligger där. Går
      // uppladdningen dåligt igen är det bättre att lämna produkten orörd och
      // ta den i nästa runda än att göra den sämre.
      if (nyLista.length <= nu.media.length) {
        summary.kvarstaendeMissar += onskade.length - nyLista.length;
        continue;
      }

      await deps.setMedia(
        m.wixProductId,
        nu.revision,
        nyLista.map((b) => ({ id: b.id, url: b.url })),
      );

      // ☠️ ETT SVAR UTAN FEL ÄR INGET BEVIS. Läs tillbaka och räkna.
      //
      // Bildfixen 2026-08-27 rapporterade 524 lagade av 524 trasiga och NOLL
      // missar. Efteråt hade 214 produkter fortfarande färre än fem bilder —
      // och för dem satt INGEN av de fem uppladdade filerna på produkten.
      // Uppladdningarna gick igenom (filerna ligger READY i Media Manager),
      // skrivningen svarade utan fel, och ändå ändrades ingenting.
      //
      // Orsaken är sedan dess känd — Wix importerade om varje bild vi skickade
      // som `url`, och omimporten är asynkron, så produkten bar Wix kopior i
      // stället för våra filer. Kontrollen står kvar ändå: en produkt är lagad
      // först när den läser tillbaka fler bilder än den hade.
      const efter = await deps.getMedia(m.wixProductId);
      if (!efter || efter.media.length <= nu.media.length) {
        summary.misslyckade++;
        summary.errors.push({
          sku: m.sku,
          error: `skrivningen tog inte: ${efter?.media.length ?? 0} bilder på produkten `
            + `efter ${uppladdade.length} uppladdade (hade ${nu.media.length})`,
        });
        continue;
      }

      summary.reparerade++;

      // ── KOPPLINGEN SPARAS SIST, OCH BARA EFTER EN VERIFIERAD SKRIVNING ────
      //
      // Sparas den före, eller efter en skrivning som inte tog, pekar den på
      // filer som inte sitter på produkten — och nästa körning tror att bilder
      // finns som inte gör det. Ordningen är densamma som i synken och
      // price-repair: Wix först, bokföringen sedan.
      await deps.sparaBildFiler(
        m.sku,
        nyLista.filter((b) => b.id).map((b) => ({ kalla: b.kalla, fileId: b.id })),
      );

      // Räkna på vad som FAKTISKT sitter där, inte på vad vi laddade upp.
      if (efter.media.length < onskade.length) {
        summary.kvarstaendeMissar += onskade.length - efter.media.length;
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

  let cache: Promise<Map<string, ProductMappingRecord>> | null = null;
  const mappningar = () => {
    cache ??= store.listMappings().then((rader) =>
      new Map(rader.map((r) => [r.supplierProductId, r])),
    );
    return cache;
  };
  const mappningFor = async (sku: string) =>
    (await mappningar()).get(aosomSupplierProductId(sku));

  return {
    fetchFeed: () => fetchAosomFeed(),
    listAosom: async () =>
      [...(await mappningar()).values()]
        .filter((m) => (m.supplierProductId ?? "").startsWith("aosom:") && m.wixProductId)
        .map((m) => ({
          sku: (m.supplierProductId ?? "").slice(aosomSupplierProductId("").length),
          wixProductId: m.wixProductId,
        })),
    getMedia: async (id) => {
      const snap = await wix.getProductMedia(id);
      return snap ? { revision: snap.revision, media: snap.media } : null;
    },
    // ⚠️ MAPPNINGARNA LÄSES EN GÅNG, INTE EN GÅNG PER PRODUKT.
    //
    // `listMappings()` hämtar HELA katalogen ur Wix. Anropad per produkt — och
    // två gånger till, en för läsningen och en för skrivningen — hade en
    // körning på 400 produkter blivit 800 fulla katalogläsningar och ätit
    // tidsbudgeten långt innan den hann laga något.
    //
    // Cachen är medvetet bara en körning lång. Reparationen är den enda som
    // rör `aosomBildFiler`, så inom en körning kan ingen annan ha ändrat den,
    // och nästa körning läser om.
    kandaBildFiler: async (sku) => (await mappningFor(sku))?.aosomBildFiler ?? [],
    hamtaKallor: (fileIds) => media.getMediaSourceUrls(fileIds),
    sparaBildFiler: async (sku, filer) => {
      const rad = await mappningFor(sku);
      if (!rad) return;
      const uppdaterad = { ...rad, aosomBildFiler: filer };
      await store.saveMapping(uppdaterad);
      // Håll cachen i takt så en senare läsning i samma körning inte ser gammalt.
      (await mappningar()).set(rad.supplierProductId, uppdaterad);
    },
    importImages: async (urls, slug) =>
      await media.importMediaUrls(
        urls.map((url, i) => ({ url, displayName: `${slug}-${i + 1}` })),
        { delayMs: 150 },
      ),
    setMedia: async (id, revision, bilder) => {
      await wix.setProductMedia(id, revision, bilder);
    },
    fx: { eurToSek: eurToSekFromEnv(), usdToSek: rules.usdToSek },
  };
}
