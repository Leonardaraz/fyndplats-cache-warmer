// Kurerade 301-redirects för produkter vi MEDVETET tagit bort (icke-EU-lager)
// men som fortfarande rankar i Google och "soft-404:ar" mot katalogen.
//
// Bakgrund: sex borttagna produkter stod 2026-07 för ~44 % av exponeringarna i
// vår topp-20 (bl.a. #1 paraply och #3 träningsvästar). De returnerar HTTP 200
// och renderar "Alla produkter"-fallbacken i headless-storefronten, vilket gör
// att Google behåller dem indexerade, slösar crawl-budget och skickar köpare
// till en återvändsgränd i stället för en köpbar EU-produkt.
//
// Varje död `/produkt/<slug>` pekas här om till närmaste LEVANDE, relevanta
// KATEGORI — inte en enskild produkt. Kategorier är stabila över tid (enskilda
// produkter churnar och skulle skapa nya trasiga redirects), de håller topikal
// relevans så att Google flyttar signalen i stället för att soft-404:a, och de
// låter besökaren bläddra hela den relevanta EU-nischen (→ mer försäljning).
//
// Detta KOMPLETTERAR (ersätter inte) den systemiska fixen som måste göras i
// headless-repot: en saknad produkt ska returnera 404 (notFound()) i stället
// för att rendera katalog-fallbacken med 200. Redirectsen körs före route-
// renderingen, så de sex kurerade sluggarna får 301 → kategori, medan alla
// ÖVRIGA saknade produkter faller igenom till en ren 404. Se
// docs/removed-products-seo-fix.md för hela handoffen.

export interface RemovedRedirect {
  /** Gammal, Google-indexerad produkt-URL som nu är borttagen. */
  from: string;
  /** Levande mål-URL att peka om till (kategori eller shop-all). */
  to: string;
  /** Varför produkten togs bort (spårbarhet). */
  reason: string;
  /** Kort, granskningsbar motivering till valt mål. */
  targetNote: string;
}

/**
 * Källa till sanning för borttagna icke-EU-produkter som ska pekas om.
 * Lägg till en rad här när fler icke-EU-produkter tas bort och kör om
 * `/api/seo/removed-redirects` för att få den uppdaterade next.config-blocken.
 */
export const REMOVED_REDIRECTS: RemovedRedirect[] = [
  {
    from: "/produkt/robust-paraply-med-uv-skydd",
    to: "/kategori/tradgard-utemobler",
    reason: "icke-EU-lager, borttagen med flit",
    targetNote: "parasoll med UV-skydd hör hemma bland trädgård & utemöbler (49 produkter)",
  },
  {
    from: "/produkt/traningsvastar-for-lag-numrerade-sportvastar",
    to: "/kategori/traning-gym",
    reason: "icke-EU-lager, borttagen med flit",
    targetNote: "numrerade lag-/träningsvästar hör hemma under träning & gym (18 produkter)",
  },
  {
    from: "/produkt/vikbar-skotbadd-vattentat-och-portabel-skotmatta",
    to: "/kategori/baby-smabarn",
    reason: "icke-EU-lager, borttagen med flit",
    targetNote: "skötbädd/skötmatta hör hemma under baby & småbarn (16 produkter)",
  },
  {
    from: "/produkt/vagghangd-utfallbar-kladhangare-i-tra-platsbesparande",
    to: "/kategori/forvaring-organisering",
    reason: "icke-EU-lager, borttagen med flit",
    targetNote: "vägghängd klädhängare hör hemma under förvaring & organisering (16 produkter)",
  },
  {
    from: "/produkt/elektrisk-aggkokare",
    to: "/kategori/koksmaskiner-apparater",
    reason: "icke-EU-lager, borttagen med flit",
    targetNote: "äggkokare är en köksmaskin — köksmaskiner & apparater är exakt topikal match",
  },
  {
    // Ingen smycken-/accessoarkategori finns (vi säljer inte längre den nischen),
    // så ingen kategori är topikalt korrekt. Pekas mot shop-all: behåller den
    // mänskliga besökaren i butiken medan Google får en tydlig 301 och släpper
    // den döda URL:en (equity går ändå inte att rädda utan relevant mål).
    from: "/produkt/magnetiska-orhangen-clips-utan-hal-zirkonia",
    to: "/alla-produkter",
    reason: "icke-EU-lager, borttagen med flit",
    targetNote: "ingen smycken-/accessoarkategori finns — shop-all är enda ärliga målet",
  },
];

/** Tillåtna mål-prefix: en kategori, en enskild produkt, eller shop-all. */
const VALID_TARGET = /^\/(kategori\/[a-z0-9-]+|produkt\/[a-z0-9-]+)$/;

/**
 * Validerar redirect-listan och kastar vid inkonsekvens. Anropas av testerna
 * så att en trasig rad (fel prefix, dubblett, self-/kedje-redirect) fångas i CI
 * innan den kan skeppas till headless.
 */
export function validateRemovedRedirects(list: RemovedRedirect[] = REMOVED_REDIRECTS): void {
  const froms = new Set<string>();
  for (const r of list) {
    if (!r.from.startsWith("/produkt/")) {
      throw new Error(`from måste vara en /produkt/-URL: ${r.from}`);
    }
    if (r.to !== "/alla-produkter" && !VALID_TARGET.test(r.to)) {
      throw new Error(`to måste vara /kategori/…, /produkt/… eller /alla-produkter: ${r.to}`);
    }
    if (r.from === r.to) {
      throw new Error(`self-redirect ej tillåten: ${r.from}`);
    }
    if (froms.has(r.from)) {
      throw new Error(`dubblett-from ej tillåten: ${r.from}`);
    }
    froms.add(r.from);
  }
  // Inga kedjor: inget mål får själv vara en källa som pekas bort.
  for (const r of list) {
    if (r.to.startsWith("/produkt/") && froms.has(r.to)) {
      throw new Error(`redirect-kedja: ${r.from} → ${r.to} (målet är också borttaget)`);
    }
  }
}

/**
 * Slår upp redirect-målet för en gammal produkt-sökväg (t.ex. för att spegla
 * logiken i ett API eller test). Returnerar null om ingen redirect finns.
 */
export function findRemovedRedirect(
  fromPath: string,
  list: RemovedRedirect[] = REMOVED_REDIRECTS,
): RemovedRedirect | null {
  return list.find((r) => r.from === fromPath) ?? null;
}

/**
 * Genererar en Next.js redirects-array som klistras rakt in i headless-repots
 * `next.config.js` under `async redirects()`. `permanent: true` → HTTP 308/301.
 */
export function toRemovedRedirectsNextConfig(
  list: RemovedRedirect[] = REMOVED_REDIRECTS,
): Array<{ source: string; destination: string; permanent: true }> {
  return list.map((r) => ({ source: r.from, destination: r.to, permanent: true }));
}

/**
 * CSV-export: `from_url,to_url,reason,target_note`. För manuell granskning eller
 * import i annat redirect-system (Cloudflare, Vercel-dashboard, .htaccess).
 */
export function toRemovedRedirectsCsv(list: RemovedRedirect[] = REMOVED_REDIRECTS): string {
  const header = "from_url,to_url,reason,target_note";
  const rows = list.map((r) => [r.from, r.to, r.reason, r.targetNote].map(csvCell).join(","));
  return [header, ...rows].join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
