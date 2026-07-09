# SEO-fix: medvetet borttagna (icke-EU) produkter som fortfarande rankar

**Status:** Del B (redirect-data + generator) ligger i detta repo. Del A (systemisk
404) + inklistring av redirectsen görs i **`fyndplats-headless`** (storefronten) —
paste-ready kod finns längst ned.

---

## Problemet (verifierat 2026-07-09)

Sex produkter som vi **medvetet tagit bort** (icke-EU-lager) rankar fortfarande i
Google. De stod för **~44 % av exponeringarna i vår topp-20** — bl.a. **#1 (paraply)**
och **#3 (träningsvästar)**.

Alla sex returnerar i dag **HTTP 200** och renderar den generiska
**"Alla produkter"-fallbacken** i storefronten (verifierat: identisk
`og:title = "Alla produkter – hela sortimentet | Fyndplats"`, 417-produkters grid,
**ingen** Product-JSON-LD). Det är en klassisk **soft-404** och den läcker på tre sätt:

1. **SEO-hygien:** Google släpper aldrig de döda URL:erna (de svarar 200), slösar
   crawl-budget och ser sex URL:er med **identisk** titel/innehåll → dubblettsignal
   som drar ner hela domänens kvalitetsintryck.
2. **Försäljning:** en köpare som klickar "Robust paraply" i Google landar på en
   osorterad 417-produkters vägg i stället för en relevant, köpbar EU-produkt →
   studs.
3. **Mätning:** exponeringarna ligger kvar i Search Console och döljer hur våra
   *levande* produkter faktiskt presterar.

---

## Lösningen — två delar som samverkar

### Del A — Systemisk 404 (headless, viktigast)

En saknad produkt ska svara **404** (`notFound()`), aldrig rendera katalog-fallbacken
med 200. Detta fixar läckan **för alla nuvarande OCH framtida** borttagna produkter i
ett svep — det är den långsiktiga roten.

### Del B — Kurerade 301-redirects (data här → klistras i headless)

För de sex som redan har rankning/exponeringar pekar vi om varje död
`/produkt/<slug>` → **närmaste levande, relevanta KATEGORI** (inte en enskild produkt).
Varför kategori och inte produkt:

- **Långsiktigt stabilt:** kategorier churnar inte som enskilda produkter — en
  produkt-redirect kan själv bli en död länk om målprodukten säljs slut/tas bort.
- **Topikal relevans:** Google flyttar då signalen till kategorin i stället för att
  soft-404:a en irrelevant redirect.
- **Mer försäljning:** besökaren landar på hela den relevanta EU-nischen och kan
  bläddra, inte en enda (kanske fel) produkt.

**Lagringsordning:** Next kör `redirects()` **före** route-renderingen. Alltså:
de sex kurerade sluggarna fångas av 301 → kategori; **alla övriga** saknade produkter
faller igenom till Del A:s rena 404. De två delarna krockar inte — de kompletterar
varandra.

---

## Mappningen (alla mål verifierade live 2026-07-09)

| # | Borttagen produkt (död `/produkt/…`) | 301 → mål | Motivering | Mål verifierat |
|---|---|---|---|---|
| 1 | `robust-paraply-med-uv-skydd` | `/kategori/tradgard-utemobler` | parasoll/UV-skydd = trädgård & utemöbler | 49 produkter ✓ |
| 2 | `traningsvastar-for-lag-numrerade-sportvastar` | `/kategori/traning-gym` | lag-/träningsvästar = träning & gym | 18 produkter ✓ |
| 3 | `vikbar-skotbadd-vattentat-och-portabel-skotmatta` | `/kategori/baby-smabarn` | skötbädd/skötmatta = baby & småbarn | 16 produkter ✓ |
| 4 | `vagghangd-utfallbar-kladhangare-i-tra-platsbesparande` | `/kategori/forvaring-organisering` | vägghängd klädhängare = förvaring & organisering | 16 produkter ✓ |
| 5 | `elektrisk-aggkokare` | `/kategori/koksmaskiner-apparater` | äggkokare = köksmaskin (exakt topikal match) | 3 produkter ✓ |
| 6 | `magnetiska-orhangen-clips-utan-hal-zirkonia` | `/alla-produkter` | ingen smycken-/accessoarkategori finns — shop-all är enda ärliga målet | 417 produkter ✓ |

Källa till sanning: **`lib/seo/removed-redirects.ts`** (golden-testad i
`removed-redirects.test.ts`). Endpoint: **`GET /api/seo/removed-redirects`**
(`?format=csv` för nedladdning). Lägg till fler rader där när fler icke-EU-produkter
tas bort och kör om endpointen för att få den uppdaterade blocken nedan.

---

## Paste-ready: Del B → headless `next.config.js`

Lägg dessa i `async redirects()` (append till ev. befintliga migrations-redirects
från `/api/seo/migration-map`). `permanent: true` → 308/301.

```js
// Borttagna icke-EU-produkter som fortfarande rankar → närmaste levande kategori.
// Genereras av fyndplats-cache-warmer: GET /api/seo/removed-redirects
{ source: "/produkt/robust-paraply-med-uv-skydd",                      destination: "/kategori/tradgard-utemobler",     permanent: true },
{ source: "/produkt/traningsvastar-for-lag-numrerade-sportvastar",     destination: "/kategori/traning-gym",            permanent: true },
{ source: "/produkt/vikbar-skotbadd-vattentat-och-portabel-skotmatta", destination: "/kategori/baby-smabarn",           permanent: true },
{ source: "/produkt/vagghangd-utfallbar-kladhangare-i-tra-platsbesparande", destination: "/kategori/forvaring-organisering", permanent: true },
{ source: "/produkt/elektrisk-aggkokare",                              destination: "/kategori/koksmaskiner-apparater", permanent: true },
{ source: "/produkt/magnetiska-orhangen-clips-utan-hal-zirkonia",      destination: "/alla-produkter",                  permanent: true },
```

---

## Paste-ready: Del A → headless produkt-route

Exakt filnamn beror på headless-implementationen, men mönstret i App Router är:

```tsx
// app/produkt/[slug]/page.tsx  (fyndplats-headless)
import { notFound } from "next/navigation";

export default async function ProduktSida({ params }) {
  const { slug } = await params;
  const produkt = await hamtaProduktViaSlug(slug); // befintlig hämtning

  // ⛔️ Ta bort ev. fallback som renderar "Alla produkter"/katalogen när produkten
  //    saknas. Rendera 404 i stället:
  if (!produkt) {
    notFound(); // → renderar app/not-found.tsx med HTTP 404
  }

  // ... resten oförändrat
}

// Samma guard i generateMetadata så metadatan inte råkar bygga katalog-taggar:
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const produkt = await hamtaProduktViaSlug(slug);
  if (!produkt) return {}; // Next sätter noindex på not-found automatiskt
  // ... befintlig metadata
}
```

**Checklista i headless:**

1. Hitta var produkt-route i dag faller tillbaka till katalogen när slug inte matchar
   (det är den som ger 200 + "Alla produkter"). Byt den mot `notFound()`.
2. Säkerställ att `app/not-found.tsx` finns och är hjälpsam (sökruta + länkar till
   populära kategorier) — bra för både UX och SEO.
3. Om ni hellre vill signalera "borta för gott" ännu tydligare kan produkter som är
   *kända borttagna* svara **410 Gone** i stället för 404 (valfritt; 404 räcker och är
   enklast). De sex i tabellen ovan behöver det inte — de fångas ju av 301:orna före
   route:en.

---

## Sitemap-hygien — redan OK

Sitemapen (`/api/seo/sitemap`, `buildSitemapXml`) byggs från **`listAllV3Products()`
= endast levande produkter**. De borttagna finns därför redan **inte** med. Inget att
göra — men skicka gärna in den färska sitemapen i Search Console efter deployen så
Google recrawlar snabbare.

---

## Verifiering efter deploy (headless)

```bash
# Ska ge 308/301 → rätt kategori (inte 200):
curl -sI https://www.fyndplats.se/produkt/robust-paraply-med-uv-skydd | grep -iE 'HTTP/|location'

# En slug som varken finns eller har redirect ska ge 404 (inte 200 + katalog):
curl -sI https://www.fyndplats.se/produkt/finns-inte-slug-xyz | grep -i 'HTTP/'
```

I Search Console: **URL-inspektion** på de sex → "Sidan är en omdirigering" → begär
omindexering. Följ upp i *Sidor*-rapporten att de flyttas från "Indexerad" till
"Sida med omdirigering" över de kommande veckorna.

---

## Underhåll

När fler icke-EU-produkter tas bort:

1. Lägg till en rad i **`lib/seo/removed-redirects.ts`** (`from`, `to`, `reason`,
   `targetNote`). Testet validerar prefix, dubbletter, self-/kedje-redirects i CI.
2. Kör `GET /api/seo/removed-redirects`, kopiera `redirects`-blocken → klistra i
   headless `next.config.js`, deploya.

Del A (404-fixen) gör att även produkter man *inte* hinner kurera ändå slutar
soft-404:a — kurering behövs bara för de som har rankning värd att rädda.
