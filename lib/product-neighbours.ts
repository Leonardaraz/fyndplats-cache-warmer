// lib/product-neighbours.ts
//
// "Föregående / Nästa produkt" på produktsidan, så besökaren kan bläddra vidare
// i avdelningen utan att backa till kategorisidan varje gång.
//
// ORDNINGEN ÄR INTE FRI. Pilarna måste peka på de produkter som faktiskt stod
// bredvid varandra på kategorisidan besökaren kom ifrån — annars känns "nästa"
// slumpmässig. Därför speglar kategoriOrdning() exakt vad
// app/kategori/[slug]/page.tsx gör när den bygger sin lista:
//
//   1. filtrera på kategori + underkategorier (collectionIds-membership)
//   2. de tre högsta bild-poängen först (bästa bilderna möter besökaren)
//   3. resten i katalogordning
//   4. dedupeProducts() — släpper produkter som delar bild med en tidigare
//
// Steg 4 kommer in som en funktion utifrån (`efterbehandla`) i stället för att
// importeras: dedupeProducts bor i lib/products.ts, som drar in JSON och IO och
// därför inte kan laddas av node --test. Att skriva av den här hade gett två
// kopior som glider isär. Anroparen skickar in originalet.
//
// Utan steg 4 kunde "nästa" peka på en produkt som ALDRIG syntes på
// kategorisidan — den hade filtrerats bort där som dubblett-bild — och
// räknaren ("12 av 48") hade räknat produkter besökaren inte kan nå därifrån.
//
// Ändras ordningen på kategorisidan MÅSTE den ändras här. Testfilen har fall
// för steg 2 och steg 4, eftersom det är de två icke-uppenbara leden.
//
// EN AVVIKELSE FRÅN KATEGORISIDAN, med flit: slutsålda produkter hoppas över
// (se utanSlutsalda längst ned). Kategorisidan visar dem med en bricka —
// bläddringen ska inte leda in i en återvändsgränd.
//
// KEDJAN GÅR VIDARE I NÄSTA UNDERKATEGORI (2026-08-26, tredje vändan).
//
// Första versionen bläddrade bara inom EN underkategori, och tog slut där.
// Skarpt exempel: "Pop up-paviljong med myggnät" är 19 av 19 i Solskydd &
// Paviljonger, så raden visade bara FÖREGÅENDE. Det såg ut som att något gått
// sönder — särskilt på mobil, där räknaren som förklarat saken var dold.
//
// Nu byggs i stället HELA huvudavdelningen som EN kedja av avsnitt: ett avsnitt
// per underkategori i menyordning, plus ett sista för de produkter som ligger
// direkt i avdelningen. Sista produkten i ett avsnitt får därmed nästa produkt i
// FÖLJANDE avsnitt, och etiketten säger vart man går ("Nästa i Grillar &
// Utekök") så hoppet aldrig känns slumpmässigt. Inom ett avsnitt är ordningen
// fortfarande exakt kategorisidans.
//
// Att avdelningen är EN kedja är också vad som gör steget tillbaka pålitligt —
// se den mätta 26-procentsbuggen i avdelningsKedja() nedan.
//
// Räknaren räknar fortfarande inom det EGNA avsnittet ("19 av 19 i Solskydd &
// Paviljonger"), inte i hela kedjan: det är den listan besökaren kom ifrån, och
// "19 av 213" hade inte sagt någonting.
//
// VAD VI MEDVETET INTE GÖR:
//
// • Ingen rundgång. Första produkten i avdelningen har ingen föregående, sista
//   ingen nästa. Ett varv tillbaka till början ser ut som en bugg för den som
//   bläddrat långt. I de två ändarna renderas en utgång till kategorisidan i
//   stället — se product-browse.tsx.
// • Kedjan korsar inte huvudavdelningar. Solskydd → Grillar är en rimlig
//   fortsättning; Trädgård → Skönhet & Hälsa är det inte. En produkt som ligger
//   i två avdelningar hamnar i EXAKT en kedja — se HEMVIST i avdelningsKedja.
//   Utan det gick bläddringen bevisligen i ring.
// • Vi följer inte besökarens faktiska väg in. Kom hen via sök, startsidan eller
//   en kampanjlänk finns ingen lista att gå vidare i — avdelningen är den enda
//   ordning som alltid finns och alltid är densamma. Att i stället skicka
//   listan via query-parametrar hade gett delade länkar olika innehåll och
//   spätt ut ISR-cachen per inkommande väg.
// • REA och Populära hanteras inte särskilt. De är merchandising-sidor som
//   byggs av produktflaggor, inte kategorier, och en produkt kan ligga i båda.
//   Huvudavdelningen är entydig.
//
// Ren funktion, inga sidoeffekter, bara typ-import av Product (raderas vid
// kompilering) — därför enhetstestbar i node --test.

import type { Product } from "./products";

/** Minsta form funktionerna behöver. Listsidorna skickar en smalare produkt. */
type Bladdringsbar = {
  id: string;
  slug: string;
  name: string;
  imageScore?: number;
  collectionIds?: string[];
  inStock?: boolean;
};

/** Kategorierna funktionerna behöver. Speglar Collection i lib/products.ts. */
type Kategori = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  index: number;
};

/** Ett led i kedjan: en underkategori och dess färdiga ordning. */
export type Avsnitt<T> = { namn: string; slug: string; produkter: T[] };

export type Grannar<T> = {
  forra: T | null;
  nasta: T | null;
  /** Avsnittets namn när grannen ligger i ett ANNAT avsnitt, annars null.
   *  Driver etiketten "Nästa i Grillar & Utekök" i product-browse.tsx. */
  forraFran: string | null;
  nastaFran: string | null;
  /** 1-baserat läge i det EGNA avsnittet, för "19 av 19". Null om produkten
   *  inte finns i kedjan alls. */
  position: number | null;
  /** Antal BLÄDDRINGSBARA produkter i det egna avsnittet — inte i hela kedjan. */
  antal: number;
  /** Är produkten man står på själv en av dem? Falskt för en slutsåld produkt,
   *  som finns i sin egen kedja men i ingen annans (se utanSlutsalda). Då är
   *  `position` meningslös och raden skriver bara antalet. */
  raknasMed: boolean;
  /** Avsnittet produkten själv ligger i. Räknaren och utgången pekar hit. */
  avsnitt: { namn: string; slug: string } | null;
};

const TOMMA: Grannar<never> = {
  forra: null,
  nasta: null,
  forraFran: null,
  nastaFran: null,
  position: null,
  antal: 0,
  raknasMed: false,
  avsnitt: null,
};

/**
 * Kategorisidans ordning, återskapad.
 *
 * `katIds` ska innehålla avdelningens id OCH dess underkategoriers — samma
 * mängd som kategorisidan bygger. Skickas en tom mängd blir listan tom.
 */
export function kategoriOrdning<T extends Bladdringsbar>(
  alla: T[],
  katIds: Set<string>,
  /** Kategorisidans dedupeProducts. Utelämnad → ingen efterbehandling. */
  efterbehandla?: (lista: T[]) => T[],
): T[] {
  if (!katIds.size) return [];
  const iKategorin = alla.filter((p) =>
    (p.collectionIds || []).some((cid) => katIds.has(cid)),
  );
  // Steg 2: samma "tre bästa bilderna först" som kategorisidan. Sorteringen
  // görs på en kopia — alla får aldrig muteras, den delas med anroparen.
  const topp3 = [...iKategorin]
    .sort((a, b) => (b.imageScore ?? 60) - (a.imageScore ?? 60))
    .slice(0, 3);
  const toppIds = new Set(topp3.map((p) => p.id));
  const ordnad = [...topp3, ...iKategorin.filter((p) => !toppIds.has(p.id))];
  return efterbehandla ? efterbehandla(ordnad) : ordnad;
}

/**
 * Produkterna före och efter `slug` i en KEDJA av avsnitt.
 *
 * Avsnitten fogas ihop i den ordning de kommer, så sista produkten i ett avsnitt
 * får sin nästa i följande avsnitt. `forraFran`/`nastaFran` sätts bara när
 * grannen ligger på andra sidan en avsnittsgräns — det är den signalen
 * etiketten behöver för att hoppet ska kännas avsiktligt i stället för
 * slumpmässigt.
 *
 * Returnerar null i båda ändarna av kedjan (ingen rundgång), och för en produkt
 * som inte finns i kedjan alls (kan hända om katalogen ändrats mellan två
 * ISR-renderingar).
 */
export function grannarIKedja<T extends Bladdringsbar>(
  avsnitt: Avsnitt<T>[],
  slug: string,
): Grannar<T> {
  // Samma produkt kan ligga i två syskonunderkategorier. Första förekomsten
  // vinner — annars dyker den upp två gånger i kedjan, och den som bläddrar
  // framåt landar plötsligt på något hen redan sett.
  const sedda = new Set<string>();
  const platt: { p: T; i: number }[] = [];
  avsnitt.forEach((a, i) => {
    for (const p of a.produkter) {
      if (sedda.has(p.id)) continue;
      sedda.add(p.id);
      platt.push({ p, i });
    }
  });

  const n = platt.findIndex((x) => x.p.slug === slug);
  if (n < 0) return TOMMA;

  const eget = platt[n].i;
  const iEget = platt.filter((x) => x.i === eget);
  const f = n > 0 ? platt[n - 1] : null;
  const na = n < platt.length - 1 ? platt[n + 1] : null;

  return {
    forra: f ? f.p : null,
    nasta: na ? na.p : null,
    forraFran: f && f.i !== eget ? avsnitt[f.i].namn : null,
    nastaFran: na && na.i !== eget ? avsnitt[na.i].namn : null,
    position: iEget.findIndex((x) => x.p.slug === slug) + 1,
    antal: iEget.length,
    raknasMed: true,
    avsnitt: { namn: avsnitt[eget].namn, slug: avsnitt[eget].slug },
  };
}

/**
 * Huvudavdelningen en produkt hör hemma i.
 *
 * Är någon av produktens kategorier föräldralös är DEN avdelningen. Ligger
 * produkten bara i underkategorier klättrar vi upp till förälderns post i
 * `kategorier`. Finns ingen av delarna faller vi tillbaka på första kategorin
 * (då blir kedjan ett enda avsnitt, vilket är bättre än ingen bläddring alls).
 */
export function avdelningFor(
  kategorier: Kategori[],
  egna: Kategori[],
): Kategori | null {
  if (!egna.length) return null;
  const huvud = egna.find((c) => c.parentId === null);
  if (huvud) return huvud;
  // Klättra HELA vägen upp, inte ett steg. Ligger produkten bara i en
  // underkategoris underkategori gav ett enda steg en underkategori tillbaka —
  // och sedan hemvist() blev load-bearing betydde det att produkten filtrerades
  // bort ur sin egen avdelnings kedja och blev utan bläddring.
  let c = egna[0];
  const sedda = new Set<string>([c.id]);
  while (c.parentId) {
    const f = kategorier.find((x) => x.id === c.parentId);
    // Saknad förälder eller cirkulär hierarki i datan → stanna hellre här än
    // att snurra. Kedjan blir smalare, men sidan renderar.
    if (!f || sedda.has(f.id)) break;
    sedda.add(f.id);
    c = f;
  }
  return c;
}

/**
 * Produktens hemvist: avdelningFor() applicerad på produktens egna kategorier.
 *
 * Tar en färdig id→kategori-karta eftersom den anropas en gång per produkt i
 * katalogen och en linjär find() per collectionId hade blivit kvadratiskt.
 */
function hemvist<T extends Bladdringsbar>(
  katMap: Map<string, Kategori>,
  kategorier: Kategori[],
  p: T,
): Kategori | null {
  const egna = (p.collectionIds || [])
    .map((id) => katMap.get(id))
    .filter((c): c is Kategori => c !== undefined);
  return avdelningFor(kategorier, egna);
}

/**
 * HELA huvudavdelningen som EN kedja av avsnitt.
 *
 * Ett avsnitt per underkategori i menyordning, plus ett SISTA avsnitt för de
 * produkter som ligger direkt i avdelningen utan att tillhöra någon
 * underkategori. Det sista ledet är inte kosmetik — det är rättelsen av en
 * riktig bugg:
 *
 * MÄTT 2026-08-26 på 60 slumpade produkter: 26 % av alla "Nästa" ledde till en
 * sida vars "Föregående" pekade NÅGON ANNANSTANS. Orsaken var att en produkt
 * utan underkategori fick en helt egen ordning — hela avdelningen i ett svep —
 * medan grannen med underkategori fick syskonkedjan. Två produkter i samma
 * avdelning bläddrade alltså i två olika listor, och steget tillbaka landade
 * fel. Exempel: "Minifrys 35 liter" bläddrade i Hem & Inredning (99 st) medan
 * grannen "Skafferiskap 104 cm" bläddrade i Förvaring & Organisering (46 st).
 *
 * Med avdelningen som EN kedja hamnar båda i samma ordning, och steget tillbaka
 * går dit man kom ifrån.
 *
 * HEMVIST: EN PRODUKT LIGGER I EXAKT EN KEDJA. Detta är rättelsen av en andra
 * mätt bugg, allvarligare än den ovan. En produkt kan tillhöra kategorier i TVÅ
 * huvudavdelningar (duschpallen ligger i Hem & Inredning enligt brödsmulan, men
 * också i en underkategori under Skönhet & Hälsa). Utan filtret nedan hamnade
 * den i BÅDA avdelningarnas kedjor — och eftersom varje sida bygger sin egen
 * kedja kunde man då gå Skönhet → Hem → tillbaka till Skönhet:
 *
 *   MÄTT 2026-08-27, framåtvandring från en kedjestart: en sluten ring på 23
 *   produkter. Den som klickade "Nästa" tillräckligt länge kom aldrig fram —
 *   den gick runt, runt.
 *
 * Därför filtreras kedjan på hemvist(): bara produkter vars EGEN avdelning är
 * den här kedjans avdelning kommer med. Partitionen blir global och entydig —
 * varje produkt i exakt en kedja — och då kan ringar inte uppstå: varje kedja
 * är en ändlig stig utan rundgång.
 *
 * Det gör också steget tillbaka pålitligt: två grannar delar alltid kedja.
 * Enda kvarvarande asymmetrin är den slutsålda man står på (se utanSlutsalda),
 * som med flit finns i sin egen kedja men inte i grannarnas.
 */
export function avdelningsKedja<T extends Bladdringsbar>(
  kategorier: Kategori[],
  avdelning: Kategori,
  alla: T[],
  slug: string,
  efterbehandla?: (lista: T[]) => T[],
): Avsnitt<T>[] {
  // EN PRODUKT HÖR HEMMA I EXAKT EN AVDELNING — hemvist() avgör vilken, och
  // bara de produkterna kommer med. Se HEMVIST-kommentaren ovan: utan det här
  // ledet kunde en produkt i två avdelningar ligga i BÅDA kedjorna, och då
  // gick bläddringen i ring.
  const katMap = new Map(kategorier.map((c) => [c.id, c]));
  const kopbara = utanSlutsalda(alla, slug).filter(
    (p) => hemvist(katMap, kategorier, p)?.id === avdelning.id,
  );
  // Promo-kollektionerna (REA, Populära, All Products) är föräldralösa och kan
  // aldrig råka bli underkategorier här.
  const under = kategorier
    .filter((c) => c.parentId === avdelning.id)
    .sort((a, b) => a.index - b.index);

  const avsnitt: Avsnitt<T>[] = under
    .map((c) => ({
      namn: c.name,
      slug: c.slug,
      produkter: kategoriOrdning(
        kopbara,
        // Underkategorin OCH dess egna barn, precis som kategorisidan.
        new Set([c.id, ...kategorier.filter((x) => x.parentId === c.id).map((x) => x.id)]),
        efterbehandla,
      ),
    }))
    // Tomma avsnitt bär ingenting — en underkategori vars enda produkter är
    // slutsålda ska inte kunna bli etiketten "Nästa i …" för ett hopp som i
    // själva verket landar två avsnitt bort.
    .filter((a) => a.produkter.length > 0);

  // Sista ledet: ligger direkt i avdelningen och i ingen av underkategorierna.
  // Utan det försvinner de produkterna ur kedjan helt, och de som saknar
  // underkategori (de flesta i en nyimporterad avdelning) blir utan bläddring.
  const tackta = new Set(avsnitt.flatMap((a) => a.produkter.map((p) => p.id)));
  const direkt = kategoriOrdning(kopbara, new Set([avdelning.id]), efterbehandla).filter(
    (p) => !tackta.has(p.id),
  );
  if (direkt.length) {
    avsnitt.push({ namn: avdelning.name, slug: avdelning.slug, produkter: direkt });
  }
  return avsnitt;
}

/**
 * Släpper slutsålda produkter ur en bläddringslista — utom den man tittar på.
 *
 * HÄR SKILJER SIG BLÄDDRINGEN FRÅN KATEGORISIDAN, med flit. Kategorisidan visar
 * slutsålda med en "Slutsåld"-bricka och dämpad bild: kunden ser dem, kan
 * bevaka dem, och de bär fortfarande SEO-värde. Men att BLÄDDRA in i en produkt
 * man inte kan köpa är en återvändsgränd — man klickade "Nästa" för att se
 * nästa sak att handla, inte nästa sak att inte kunna handla.
 *
 * Konsekvensen är att räknaren ("12 av 48") räknar KÖPBARA produkter, och alltså
 * kan visa ett lägre antal än kategorisidan listar. Det är rätt: den beskriver
 * hur många steg bläddringen har, inte hur många kort som finns.
 *
 * PRISET FÖR UNDANTAGET, mätt: står man på en slutsåld produkt finns den i sin
 * EGEN kedja men inte i grannens. Trycker man "Nästa" och sedan "Föregående"
 * kommer man därför inte alltid tillbaka dit man stod. Det är rätt avvägning —
 * alternativet är att slutsålda sidor blir helt utan bläddring, och det är den
 * sida där man mest vill vidare.
 *
 * Undantaget för `slug` är nödvändigt. Landar man på en slutsåld produkt (från
 * kategorisidan, sök eller en gammal länk) och den filtrerats bort finns den
 * inte i ordningen, och då hade grannar() svarat null i båda ändarna — man
 * hade blivit strandsatt utan bläddring alls, på precis den sida där man mest
 * vill vidare.
 */
function utanSlutsalda<T extends Bladdringsbar>(alla: T[], slug: string): T[] {
  // inStock === false är det enda som räknas som slutsåld. Saknas fältet
  // (smalare produkttyper på vissa ytor) behåller vi produkten hellre än att
  // gissa bort den.
  return alla.filter((p) => p.inStock !== false || p.slug === slug);
}

/** Bekvämlighet: bygger avdelningens kedja och plockar grannarna i ett svep. */
export function produktGrannar(
  kategorier: Kategori[],
  egnaKategorier: Kategori[],
  alla: Product[],
  slug: string,
  efterbehandla?: (lista: Product[]) => Product[],
): Grannar<Product> {
  const avdelning = avdelningFor(kategorier, egnaKategorier);
  if (!avdelning) return TOMMA;
  const g = grannarIKedja(
    avdelningsKedja(kategorier, avdelning, alla, slug, efterbehandla),
    slug,
  );
  // Står man på en SLUTSÅLD produkt är den med i kedjan bara tack vare
  // undantaget i utanSlutsalda — ingen annan sida räknar den. Att då skriva
  // "15 av 15" är fel: det finns 14 att bläddra bland, och man är inte en av
  // dem. Mätt 2026-08-27: 76 produkter (8 % av katalogen) visade den siffran.
  const slutsald = alla.some((p) => p.slug === slug && p.inStock === false);
  if (slutsald && g.position !== null) {
    return { ...g, position: null, antal: Math.max(0, g.antal - 1), raknasMed: false };
  }
  return g;
}

export { utanSlutsalda };
