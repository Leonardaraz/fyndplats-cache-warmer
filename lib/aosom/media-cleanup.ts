// Städar bort föräldralösa Aosom-bilder ur Wix Media Manager.
//
// ☠️ VARFÖR LAGRINGEN TOG SLUT (2026-08-28)
//
// `image-repair.ts` laddar upp ALLA fem bilderna på nytt för varje produkt den
// lagar och ersätter produktens medialista. De gamla filerna blir kvar i Media
// Manager, och ingenting städar dem. Kommentaren i den filen säger att det
// "kostar några hundra extra uppladdningar totalt" — den skrevs när katalogen
// var 744 produkter och en enda reparationskörning var planerad.
//
// Verkligheten blev fyra körningar mot en katalog som växte till 2 712 produkter.
// Varje lagad produkt lämnade fem filer à drygt en megabyte efter sig, och
// lagringen tog slut mitt under den fjärde körningen.
//
// ☠️ OCH VARFÖR DET ÄR DUBBELT SÅ MYCKET SOM DET BORDE
//
// Uppmätt 2026-08-28: **591 av 595 granskade wixstatic-filer var KOPIOR av
// bilder vi själva laddat upp.** V3:s dokumentation säger att `url` i ett
// media-item betyder "an external media URL" — och vi skickade wixstatic-
// adresser, alltså bilder som redan låg i Media Manager. Wix importerade om
// varenda en till en ny fil. Varje produktbild fanns därför i två exemplar.
//
// Det är lagat i lib/wix/client.ts (skicka `id`, inte `url`), men de befintliga
// kopiorna ligger kvar och måste städas bort här.
//
// VAD "FÖRÄLDRALÖS" BETYDER HÄR
//
// En fil som (a) VÅR kod skapat och (b) inte sitter på någon produkt.
//
// Punkt (a) är den svåra, för `addedBy` är identiskt för allt: vår API-nyckel
// agerar som sajtägaren, så en bild Leonard dragit in i editorn ser likadan ut
// som en vi importerat. Det som SKILJER dem är `sourceUrl`:
//
//   • En importerad fil bär adressen den hämtades från. Våra kommer från
//     leverantörernas CDN — `img.aosomcdn.com`, `alicdn.com`,
//     `aliexpress-media.com`.
//   • Wix egna kopior bär en `static.wixstatic.com`-adress som pekar tillbaka på
//     en av VÅRA filer. Två hopp, men entydigt.
//   • En bild som laddats upp för hand i editorn har INGEN sourceUrl alls, och
//     kan därför aldrig komma i fråga. Det är skyddet för logotyper, banners och
//     allt annat som hör till sajtens design — sådant syns inte i något API vi
//     kan lista, så det måste undantas på egenskap, inte på uppräkning.
//
// Referenslistan byggs ur ALLA produkter, inte bara Aosom-produkterna.
//
// ☠️ SPÄRREN SOM INTE FÅR TAS BORT
//
// Om produktlistningen halvfallerar ser VARENDA fil föräldralös ut, och en
// körning skulle radera hela butikens bildbank permanent. Därför kastar
// `planeraStadning` när referenslistan är misstänkt liten i förhållande till
// antalet produkter. Samma tanke som `MIN_FEED_RADER` i sync.ts: när en körning
// kan röra allt på en gång är massfelet det enda som är värt att skydda mot.

const MIN_BILDER_PER_PRODUKT = 0.5;

export interface MediaFil {
  id: string;
  displayName: string;
  url: string;
  sizeInBytes: number;
  /** Adressen filen importerades från. Saknas = uppladdad för hand. */
  sourceUrl?: string;
}

/** Leverantörernas CDN. En fil därifrån är alltid vår import. */
const VARA_KALLHOSTAR = ["img.aosomcdn.com", "alicdn.com", "aliexpress-media.com"];

function host(url: string): string {
  try { return new URL(url).hostname; } catch { return ""; }
}

/**
 * Är filen skapad av VÅR kod?
 *
 * @param franOss Nycklarna för filer vi redan vet är våra — används för att
 *                känna igen Wix egna kopior, som pekar tillbaka på dem.
 */
export function arVarFil(f: MediaFil, franOss: ReadonlySet<string>): boolean {
  const src = f.sourceUrl ?? "";
  // Ingen källadress = handuppladdad. Rör aldrig.
  if (!src) return false;
  const h = host(src);
  if (VARA_KALLHOSTAR.some((k) => h === k || h.endsWith(`.${k}`))) return true;
  // Wix omimport: en wixstatic-adress som pekar på en fil vi äger.
  if (h === "static.wixstatic.com") return franOss.has(mediaNyckel(src));
  return false;
}

export interface StadningsPlan {
  /** Filer som är trygga att radera. */
  attRadera: MediaFil[];
  /** Våra filer som sitter på en produkt. */
  anvanda: number;
  /** Byte som frigörs. */
  bytes: number;
  /** Filer i Media Manager totalt (alla namn). */
  filerTotalt: number;
}

/** Wix media-URL:er kan bära query-parametrar; nyckeln är filens id-del. */
export function mediaNyckel(url: string): string {
  const utanQuery = (url || "").split("?")[0];
  return utanQuery.split("/").pop() ?? utanQuery;
}

/**
 * Bygger raderingsplanen.
 *
 * @param filer     Alla filer i Media Manager.
 * @param ianvandning Alla media-URL:er som sitter på en produkt just nu.
 * @param antalProdukter Antal produkter listningen såg — bara för spärren.
 */
export function planeraStadning(
  filer: ReadonlyArray<MediaFil>,
  ianvandning: ReadonlyArray<string>,
  antalProdukter: number,
): StadningsPlan {
  // ☠️ MASSFEL-SPÄRREN. En halvläst produktlistning gör varje fil föräldralös.
  // Butikens produkter har mätbart flera bilder styck, så en referenslista som
  // är mindre än en halv bild per produkt är ett läsfel — inte en tom katalog.
  if (antalProdukter > 0 && ianvandning.length < antalProdukter * MIN_BILDER_PER_PRODUKT) {
    throw new Error(
      `Referenslistan har bara ${ianvandning.length} bilder för ${antalProdukter} produkter. `
        + `Det är ett läsfel, inte en tom katalog — ingen fil raderas.`,
    );
  }

  const anvandaNycklar = new Set(ianvandning.map(mediaNyckel));

  // Första passet: filer som kommer direkt från en leverantörs CDN. Andra passet
  // känner igen Wix kopior på att de pekar tillbaka på dem.
  const varaNycklar = new Set<string>();
  for (const f of filer) {
    if (arVarFil(f, varaNycklar)) varaNycklar.add(mediaNyckel(f.url));
  }
  for (const f of filer) {
    if (arVarFil(f, varaNycklar)) varaNycklar.add(mediaNyckel(f.url));
  }

  const attRadera: MediaFil[] = [];
  let anvanda = 0;

  for (const f of filer) {
    // Bara filer vår kod skapat. En handuppladdad bild rörs aldrig.
    if (!varaNycklar.has(mediaNyckel(f.url))) continue;
    if (anvandaNycklar.has(mediaNyckel(f.url))) {
      anvanda++;
      continue;
    }
    attRadera.push(f);
  }

  return {
    attRadera,
    anvanda,
    bytes: attRadera.reduce((s, f) => s + (f.sizeInBytes || 0), 0),
    filerTotalt: filer.length,
  };
}

export interface MediaCleanupDeps {
  /**
   * Filer i Media Manager. `komplett: false` betyder att listningen stannade på
   * tidsgränsen eller sidtaket — planen görs då på det som HANN läsas.
   */
  listaFiler: (stoppaVid?: number) => Promise<{ filer: MediaFil[]; komplett: boolean }>;
  /** Alla media-URL:er som sitter på en produkt, plus antalet produkter. */
  listaAnvanda: () => Promise<{ urls: string[]; antalProdukter: number }>;
  /** Raderar PERMANENT — papperskorgen räknas fortfarande mot lagringen. */
  raderaPermanent: (fileIds: string[]) => Promise<void>;
  /** Injicerbar klocka för tidsbudgeten. */
  now?: () => number;
}

export interface MediaCleanupSummary {
  dryRun: boolean;
  filerTotalt: number;
  anvandaEgnaFiler: number;
  foraldralosa: number;
  raderade: number;
  frigjordMb: number;
  misslyckade: number;
  errors: string[];
  /**
   * Läste listningen HELA Media Manager? `false` = siffrorna beskriver bara den
   * del som hanns med, och `filerTotalt` är alltså inte beståndet. Körningen är
   * ändå meningsfull: det som raderas är föräldralöst, och nästa körning når
   * längre eftersom listan blivit kortare.
   */
  komplettListning: boolean;
  /** Varför körningen slutade. `klart` = allt planerat blev gjort. */
  stoppedBy: "klart" | "tidsbudget" | "limit";
}

/** Wix tar emot flera id:n per anrop; håll skoporna lagom stora. */
const BATCH = 50;

export async function runMediaCleanup(
  deps: MediaCleanupDeps,
  opts: { dryRun?: boolean; limit?: number; timeBudgetMs?: number } = {},
): Promise<MediaCleanupSummary> {
  const dryRun = opts.dryRun !== false;
  const now = deps.now ?? (() => Date.now());
  const start = now();
  const budget = opts.timeBudgetMs ?? 240_000;

  // ☠️ LISTNINGARNA KÖRS EFTER VARANDRA, INTE MED Promise.all.
  //
  // De gick parallellt fram till 2026-08-28 och dubblade därmed anropstakten mot
  // samma Wix-värd. Wix svarade 429 efter ~30 sekunder, `post` kastade, och hela
  // rutten föll med 500 utan att radera en enda fil. Det ser ut som en
  // optimering och är i själva verket det som fäller körningen.
  //
  // Referenslistan först, med flit: den är massfel-spärrens underlag och måste
  // vara KOMPLETT, medan fillistningen tål att kapas på tidsbudgeten.
  // Listningen får en DEL av budgeten, inte hela: äter den allt finns ingen tid
  // kvar att radera på, och en körning som bara listar frigör noll byte.
  const { urls, antalProdukter } = await deps.listaAnvanda();
  const { filer, komplett } = await deps.listaFiler(start + Math.round(budget * 0.7));

  const plan = planeraStadning(filer, urls, antalProdukter);
  const attRadera = opts.limit ? plan.attRadera.slice(0, opts.limit) : plan.attRadera;

  const summary: MediaCleanupSummary = {
    dryRun,
    filerTotalt: plan.filerTotalt,
    anvandaEgnaFiler: plan.anvanda,
    foraldralosa: plan.attRadera.length,
    raderade: 0,
    frigjordMb: 0,
    misslyckade: 0,
    errors: [],
    komplettListning: komplett,
    stoppedBy: opts.limit && plan.attRadera.length > opts.limit ? "limit" : "klart",
  };

  if (dryRun) {
    summary.frigjordMb = Math.round(plan.bytes / 1e6);
    return summary;
  }

  let frigjort = 0;
  for (let i = 0; i < attRadera.length; i += BATCH) {
    // ☠️ Raderingen är också tidsbudgeterad. Utan det kan en stor `limit` dra
    // förbi ruttens maxDuration, och då dödas svaret mitt i: filerna ÄR
    // raderade men ingen siffra kommer tillbaka, så nästa körning vet inte
    // vad som hände. Hellre ett ärligt "tidsbudget" än ett tyst avbrott.
    if (now() - start >= budget) {
      summary.stoppedBy = "tidsbudget";
      break;
    }
    const skopa = attRadera.slice(i, i + BATCH);
    try {
      await deps.raderaPermanent(skopa.map((f) => f.id));
      summary.raderade += skopa.length;
      frigjort += skopa.reduce((s, f) => s + (f.sizeInBytes || 0), 0);
    } catch (err) {
      summary.misslyckade += skopa.length;
      summary.errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  summary.frigjordMb = Math.round(frigjort / 1e6);
  return summary;
}

/**
 * Standard-deps mot skarpa systemet.
 *
 * Både listningarna sidbryts, och båda pausar mellan sidorna: Media Manager
 * svarar 429 vid ~50 sidor i rad (uppmätt 2026-08-28 under felsökningen av just
 * det här problemet). En städning som dör halvvägs är inte farlig, men den är
 * onödig.
 */
export async function liveDeps(): Promise<MediaCleanupDeps> {
  const WIX_BASE = "https://www.wixapis.com";
  const paus = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const headers = (): Record<string, string> => {
    const token = process.env.WIX_API_TOKEN;
    if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
    const h: Record<string, string> = { Authorization: token, "Content-Type": "application/json" };
    const siteId = process.env.WIX_SITE_ID;
    if (siteId) h["wix-site-id"] = siteId;
    return h;
  };

  // ☠️ WIX SVARAR 429 EFTER ~40-50 SIDOR I RAD.
  //
  // Media Manager har 58 160 filer = 582 sidor. Utan återförsök är en hel
  // genomgång en kastning av tärning: bildstädningen 2026-08-28 föll efter 30
  // sekunder med 500, och eftersom workflowens felutskrift slukades av en
  // kommandosubstitution såg det ut som ett tomt misslyckande.
  //
  // Backoffen följer `Retry-After` när Wix skickar den. Samma mönster som
  // `importMediaByUrl` fick 2026-08-27, och av exakt samma skäl.
  const paus_ms = [1_000, 3_000, 8_000];
  const post = async (url: string, body: unknown): Promise<Record<string, unknown>> => {
    let sist = "";
    for (let forsok = 0; forsok <= paus_ms.length; forsok++) {
      let res: Response;
      try {
        res = await fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(body) });
      } catch (err) {
        sist = err instanceof Error ? err.message : String(err);
        if (forsok === paus_ms.length) break;
        await paus(paus_ms[forsok]);
        continue;
      }
      if (res.ok) return (await res.json()) as Record<string, unknown>;

      sist = `${res.status}: ${(await res.text()).slice(0, 200)}`;
      // 4xx utom 429 blir inte bättre av att frågas igen.
      if (res.status !== 429 && res.status < 500) break;
      if (forsok === paus_ms.length) break;
      const retryAfter = Number(res.headers.get("retry-after"));
      await paus(Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 15_000)
        : paus_ms[forsok]);
    }
    throw new Error(`${url} svarade ${sist}`);
  };

  return {
    // Sidtaket räcker till hela beståndet: 58 160 filer = 582 sidor. Det gamla
    // taket på 500 hade tyst kapat listningen vid 50 000 och gjort resten
    // osynlig — en tyst trunkering är samma sorts fel som allt annat i den här
    // filen handlar om.
    listaFiler: async (stoppaVid?: number) => {
      const ut: MediaFil[] = [];
      let cursor: string | null = null;
      let komplett = false;
      for (let i = 0; i < 1200; i++) {
        if (stoppaVid !== undefined && Date.now() >= stoppaVid) break;
        const data = (await post(`${WIX_BASE}/site-media/v1/files/search`, {
          paging: { limit: 100, ...(cursor ? { cursor } : {}) },
        })) as { files?: Record<string, string>[]; nextCursor?: { hasNext?: boolean; cursors?: { next?: string } } };
        for (const f of data.files ?? []) {
          ut.push({
            id: String(f.id ?? ""),
            displayName: String(f.displayName ?? ""),
            url: String(f.url ?? ""),
            sizeInBytes: Number(f.sizeInBytes ?? 0),
            sourceUrl: f.sourceUrl ? String(f.sourceUrl) : undefined,
          });
        }
        cursor = data.nextCursor?.hasNext ? (data.nextCursor.cursors?.next ?? null) : null;
        if (!cursor) { komplett = true; break; }
        await paus(120);
      }
      return { filer: ut, komplett };
    },

    listaAnvanda: async () => {
      const urls: string[] = [];
      let antalProdukter = 0;
      let cursor: string | null = null;
      for (let i = 0; i < 500; i++) {
        // ☠️ fields: MEDIA_ITEMS_INFO krävs. Utan det svarar V3 med media.main
        // ifylld men itemsInfo.items TOM — och då ser varje fil föräldralös ut.
        // Exakt samma projektionsfälla som kostade en runda 2026-08-27.
        const data = (await post(`${WIX_BASE}/stores/v3/products/search`, {
          search: { cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) } },
          fields: ["MEDIA_ITEMS_INFO"],
        })) as {
          products?: { media?: { main?: { url?: string; image?: { url?: string } };
                                itemsInfo?: { items?: { url?: string; image?: { url?: string } }[] } } }[];
          pagingMetadata?: { cursors?: { next?: string } };
        };
        for (const p of data.products ?? []) {
          antalProdukter++;
          const huvud = p.media?.main?.image?.url ?? p.media?.main?.url;
          if (huvud) urls.push(huvud);
          for (const it of p.media?.itemsInfo?.items ?? []) {
            const u = it.image?.url ?? it.url;
            if (u) urls.push(u);
          }
        }
        cursor = data.pagingMetadata?.cursors?.next ?? null;
        if (!cursor || (data.products ?? []).length === 0) break;
        await paus(120);
      }
      return { urls, antalProdukter };
    },

    // permanent: true — papperskorgen räknas fortfarande mot lagringen, så en
    // vanlig radering frigör ingenting alls.
    raderaPermanent: async (fileIds) => {
      await post(`${WIX_BASE}/site-media/v1/bulk/files/delete`, { fileIds, permanent: true });
    },
  };
}
