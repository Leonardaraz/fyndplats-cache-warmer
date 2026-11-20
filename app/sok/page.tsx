import type { Metadata } from "next";
import { after } from "next/server";
import { getCollections, getProducts, katalogenLaddad, MAIN_ORDER, type Product } from "../../lib/products";
import { forListClient, forSokClient } from "../../lib/list-payload";
import { SokVy } from "../../components/sok-vy";
import { SokKall } from "../../components/sok-kall";
import { populartNu } from "../../lib/sok-tom";
import { sidhuvudsdata } from "../../lib/sidhuvud-data";
import { populara } from "../../lib/sidhuvud-val";
import { attachRatings } from "../../lib/review-aggregates";
import { kortOrd, matchaKategorier, normalize, rankaMedForslag, type Kategoridata } from "../../lib/search";
import { BARA_I_UNDERKATEGORIN } from "../../lib/bara-i-underkategorin";
import { sokKategorier, varansKategorier, type Sokkategorier } from "../../lib/sok-begrepp";
import { plattaKategorier, type SokKategori } from "../../lib/sok-kategorier";
import { harPris, tolkaPris } from "../../lib/sok-pris";
import { katalogensSokordning, kopbaraForst } from "../../lib/sok-ordning";

export const metadata: Metadata = {
  title: "Sök",
  robots: { index: false, follow: true },
  // Egen canonical — annars ärvs root-layoutens (= startsidan), vilket ger den
  // noindexade söksidan en motsägelsefull "jag är startsidan"-signal.
  alternates: { canonical: "https://www.fyndplats.se/sok" },
};

// Kategorierna i sökningens form, en gång per kategorilista: sökningen sparar
// varornas tillhörighet per tabell (lib/search.ts, medlemskapFor), så tabellen
// ska vara samma objekt mellan sökningarna.
const sokKat = new WeakMap<object, Sokkategorier>();

/**
 * Kategorierna för sökningen, med samma tillhörighet som sökindexet bär
 * (lib/sok-begrepp.ts): sökrutan och sidan visar då samma varor. Undefined
 * när kategorierna inte gick att läsa, och sökningen söker då i namnen.
 */
async function kategoridata(): Promise<Kategoridata<Product> | undefined> {
  const kategorier = await getCollections().catch(() => []);
  if (kategorier.length === 0) return undefined;
  let k = sokKat.get(kategorier);
  if (!k) {
    k = sokKategorier(kategorier);
    sokKat.set(kategorier, k);
  }
  const tabell = k;
  return { kat: tabell.kat, av: (p) => varansKategorier(p, tabell, BARA_I_UNDERKATEGORIN) };
}

export default async function Sok({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  // PRISET I SÖKNINGEN (lib/sok-pris.ts): "soffa under 2000" rankas som "soffa",
  // och vyn visar träffarna inom priset med en knapp för alla.
  const prisfraga = tolkaPris(term);
  const fraga = prisfraga.fraga;
  const pris = harPris(prisfraga) ? { max: prisfraga.max, min: prisfraga.min } : undefined;

  // KATEGORIERNA SOM MATCHAR, ur menyns träd. sidhuvudsdata väntar aldrig in en
  // kall katalog (lib/sidhuvud-data.ts), och sidhuvudet läser samma data, så
  // det här kostar ingen egen hämtning.
  let kategorier: SokKategori[] = [];
  let popularaKategorier: SokKategori[] = [];
  let allaKategorier: SokKategori[] = [];
  try {
    const { tree } = await sidhuvudsdata();
    allaKategorier = plattaKategorier(tree);
    if (term) kategorier = matchaKategorier(fraga, allaKategorier, 3);
    popularaKategorier = populara(tree, MAIN_ORDER).map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    // hellre inga kategorier än en trasig söksida
  }

  // ☠️ VÄNTA ALDRIG PÅ EN KALL KATALOG (2026-11-19). En ny instans läser hela
  // katalogen innan getProducts svarar: 7 617 varor, 25–28 sekunder. Två av 125
  // provsökningar mot butiken tog 14 och 29 sekunder. Har instansen inte
  // katalogen i minnet svarar sidan direkt, och webbläsaren söker i den
  // CDN-cachade varulistan (components/sok-kall.tsx). Instansen läser in
  // katalogen i bakgrunden, så nästa sökning får den varma vägen.
  if (term && !katalogenLaddad()) {
    after(() => getProducts().then(() => undefined, () => undefined));
    return <SokKall kategorier={kategorier} popularaKategorier={popularaKategorier} q={q} />;
  }

  // Katalogen i sökningens ordning, nyast först: lika bra träffar står då i
  // samma ordning här som i sökrutan och på den kalla vägen (lib/sok-ordning.ts).
  const all = term ? katalogensSokordning(await getProducts()) : [];
  // Tokeniserad, stam-medveten matchning (lib/search) — samma som autocomplete:
  // NAMN-träffar först, rankade på relevans-score ("knivset" → knivhållare,
  // "halsband" → kedjehalsband). Beskrivning/specs-matchning används BARA som
  // fallback när namnet inte ger NÅGON träff (t.ex. material-/varumärkessök som
  // "akacia"). Så snart riktiga namn-träffar finns visar vi bara dem — annars
  // drar en lös omnämning i en produkttext in fel resultat (re-audit: "halsband"
  // tog tidigare med en halloween-kattdräkt vars text nämnde ordet).
  //
  // LAGER I SÖK: till skillnad från bläddring (kategori/butik) filtreras slutsålda
  // INTE bort här. En sökning är avsiktsstyrd — skriver någon in produktnamnet de
  // just sett ska varan hittas, med "Slutsåld"-badge + bevakningsformulär på
  // produktsidan. Att svara "inga resultat" på en vara som finns vore sämre. Men
  // de köpbara går alltid först (stabil partition, relevansordningen behålls inom
  // varje grupp) så det man faktiskt kan handla möter ögat överst. Sökrutan och
  // den kalla vägen använder samma regel (kopbaraForst i lib/sok-ordning.ts).
  let results: typeof all = [];
  let strukna: string[] = [];
  let utan: string[] | undefined;
  let hela: number | undefined;
  // Ordet som sidan visar varor för, när sökningen är två bokstäver ("få" →
  // fåtölj). Regeln står i lib/search.ts (rankaMedForslag), och sökrutan har samma.
  let visar = "";
  let liknande = false;
  if (term) {
    const { utfall, visar: ordet } = rankaMedForslag(all, (p) => p.name, fraga, await kategoridata());
    visar = ordet;
    if (visar) kategorier = matchaKategorier(visar, allaKategorier, 3);
    if (utfall.traffar.length > 0) {
      results = utfall.traffar;
      ({ strukna, utan, hela } = utfall);
      liknande = utfall.liknande === true;
    } else if (kategorier.length === 0 && !kortOrd(fraga)) {
      // ☠️ Aldrig för två bokstäver: de står i nästan varje beskrivning.
      // Reserven i beskrivningarna, bara när varken ett namn eller en kategori
      // matchar. "trädgårdsmöbler" gav förut en presenning, en högtryckstvätt
      // och en plåtbod härifrån, fast kategorin Utemöbler fanns.
      const phrase = normalize(fraga);
      results = all.filter(
        (p) => normalize(p.blurb || "").includes(phrase) || normalize(p.specs || "").includes(phrase)
      );
    }
    results = await attachRatings(kopbaraForst(results, (p) => !p.inStock));
  }

  // UTAN TRÄFF: samma vägar vidare som 404-sidan, och fyra varor som säljer
  // just nu (lib/sok-tom.ts). Förut var sidan en mening och en länk.
  const tom = Boolean(term) && results.length === 0;
  const populart = tom ? await attachRatings(populartNu(all, 4)) : [];

  // forSokClient, inte results rakt av. Product är strukturellt
  // tilldelningsbar till ListProduct, så det HAR kompilerat — men då
  // serialiserades hela Product-objektet in i klient-nyttolasten: gallery,
  // imageAlts, blurb, specs, variants, descriptionHtml. Mätt på skarp sajt
  // 2026-09-04 vägde /sok?q=bord 791 kB HTML, varav 465 kB flight-payload.
  return (
    <SokVy
      q={q}
      data={{
        traffar: forSokClient(results), strukna, utan, hela, kategorier, pris, visar, liknande,
        populart: forListClient(populart), popularaKategorier,
      }}
    />
  );
}
