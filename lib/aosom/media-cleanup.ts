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
// VAD "FÖRÄLDRALÖS" BETYDER HÄR
//
// En fil vars namn börjar med `aosom-` och vars URL INTE sitter på någon produkt
// i katalogen. Definitionen är avsiktligt smal:
//
//   • Bara `aosom-`-prefixet. AliExpress-produkternas bilder heter efter sin
//     slug, recensionsbilderna efter sin recension, och sajtens egna resurser
//     (logotyper, banners) heter vad de heter. Ingen av dem kan matcha.
//   • Referenslistan byggs ur ALLA produkter, inte bara Aosom-produkterna. En
//     fil som mot förmodan återanvänds någon annanstans räknas som använd.
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
}

export interface StadningsPlan {
  /** Filer som är trygga att radera. */
  attRadera: MediaFil[];
  /** Aosom-filer som sitter på en produkt. */
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
  const attRadera: MediaFil[] = [];
  let anvanda = 0;

  for (const f of filer) {
    // Bara våra egna Aosom-uppladdningar. Allt annat rörs aldrig.
    if (!(f.displayName || "").startsWith("aosom-")) continue;
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
  /** Alla filer i Media Manager. */
  listaFiler: () => Promise<MediaFil[]>;
  /** Alla media-URL:er som sitter på en produkt, plus antalet produkter. */
  listaAnvanda: () => Promise<{ urls: string[]; antalProdukter: number }>;
  /** Raderar PERMANENT — papperskorgen räknas fortfarande mot lagringen. */
  raderaPermanent: (fileIds: string[]) => Promise<void>;
}

export interface MediaCleanupSummary {
  dryRun: boolean;
  filerTotalt: number;
  anvandaAosomFiler: number;
  foraldralosa: number;
  raderade: number;
  frigjordMb: number;
  misslyckade: number;
  errors: string[];
}

/** Wix tar emot flera id:n per anrop; håll skoporna lagom stora. */
const BATCH = 50;

export async function runMediaCleanup(
  deps: MediaCleanupDeps,
  opts: { dryRun?: boolean; limit?: number } = {},
): Promise<MediaCleanupSummary> {
  const dryRun = opts.dryRun !== false;

  const [filer, { urls, antalProdukter }] = await Promise.all([
    deps.listaFiler(),
    deps.listaAnvanda(),
  ]);

  const plan = planeraStadning(filer, urls, antalProdukter);
  const attRadera = opts.limit ? plan.attRadera.slice(0, opts.limit) : plan.attRadera;

  const summary: MediaCleanupSummary = {
    dryRun,
    filerTotalt: plan.filerTotalt,
    anvandaAosomFiler: plan.anvanda,
    foraldralosa: plan.attRadera.length,
    raderade: 0,
    frigjordMb: 0,
    misslyckade: 0,
    errors: [],
  };

  if (dryRun) {
    summary.frigjordMb = Math.round(plan.bytes / 1e6);
    return summary;
  }

  let frigjort = 0;
  for (let i = 0; i < attRadera.length; i += BATCH) {
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

  const post = async (url: string, body: unknown): Promise<Record<string, unknown>> => {
    const res = await fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) {
      throw new Error(`${url} svarade ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    return (await res.json()) as Record<string, unknown>;
  };

  return {
    listaFiler: async () => {
      const ut: MediaFil[] = [];
      let cursor: string | null = null;
      for (let i = 0; i < 500; i++) {
        const data = (await post(`${WIX_BASE}/site-media/v1/files/search`, {
          paging: { limit: 100, ...(cursor ? { cursor } : {}) },
        })) as { files?: Record<string, string>[]; nextCursor?: { hasNext?: boolean; cursors?: { next?: string } } };
        for (const f of data.files ?? []) {
          ut.push({
            id: String(f.id ?? ""),
            displayName: String(f.displayName ?? ""),
            url: String(f.url ?? ""),
            sizeInBytes: Number(f.sizeInBytes ?? 0),
          });
        }
        cursor = data.nextCursor?.hasNext ? (data.nextCursor.cursors?.next ?? null) : null;
        if (!cursor) break;
        await paus(120);
      }
      return ut;
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
