// En bild per kategori i menyn: en produkt på ljus botten, som IKEA:s meny.
//
// VARFÖR EN EGEN FIL OCH EN EGEN HÄMTNING. Bilderna följer inte med trädet i
// sidans HTML, av samma skäl som produktantalen (lib/meny-antal.ts): menyn
// ligger på varje sida, och ett nytt bildval hade gjort alla ~7 000 sidor
// "nya" för Vercel. Menyn hämtar bilderna från /api/meny-bilder (CDN-cachad)
// först när någon rör menyn. Länkarna ligger kvar i server-HTML:en.
//
// URVALET, i den ordningen:
//   1. Ett handplockat val (lib/meny-bild-val.ts) om produkten finns, är i lager och
//      har en bild. Valen är granskade som bild, en och en.
//   2. Annars den mest sålda produkten i lager (sålda enheter senaste 90
//      dagarna), sedan den bästa bildpoängen, sedan den äldsta: en produkt som
//      funnits länge byter inte bild från dag till dag.
//   Bilder med text, kollage eller vattenstämpel (imageFlags) och produkter på
//   MOSAIC_DENYLIST hoppas över. Samma produkt används aldrig två gånger i
//   menyn: underkategorierna väljer först, minsta urvalet först, så att en
//   liten kategori inte blir utan för att en stor tog dess enda produkt.
//
// LÖVMODUL utan importer från Next eller Wix, prövad i lib/meny-bilder.test.ts.
// Handvalen står i lib/meny-bild-val.ts och skickas in av rutten (opts.val), så
// att modulen inte importerar något och kan prövas med node --test.

/** Det menyn behöver veta om en produkt. */
export type MenyKandidat = {
  slug: string;
  img: string;
  inStock: boolean;
  collectionIds: readonly string[];
  popularity?: number;
  imageScore?: number;
  imageFlags?: readonly string[];
  createdAt?: number;
};

/** Trädets form, utan antal. */
export type MenyNod = {
  id: string;
  slug: string;
  name: string;
  subs: readonly { id: string; slug: string; name: string }[];
};

/** Kategorislug → bildadress. */
export type MenyBilder = Record<string, string>;

/** Bildflaggor som aldrig blir en menybild (lib/image-scores.ts). */
export const MENY_BILD_NEKADE_FLAGGOR: ReadonlySet<string> = new Set([
  "collage", "baked_text", "watermark", "badge", "chinese_text",
]);

/** Menybildens kant i pixlar: 56 px i mobilen och 2× för skarpa skärmar. */
export const MENY_BILD_KANT = 112;


/** Wix media-nyckeln ur en bildadress, eller null för allt som inte är Wix. */
export function wixNyckel(url: string): string | null {
  if (!url) return null;
  const m = url.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  if (m) return m[1];
  if (!url.includes("/") && !url.includes(":")) return url;
  return null;
}

/**
 * Menybildens adress: hela bilden inpassad i en kvadrat (fit, aldrig
 * beskuren), webp. Samma adress i datorns panel och i mobilen, så webbläsaren
 * hämtar den en gång.
 */
export function menyBildAdress(img: string, kant: number = MENY_BILD_KANT): string | null {
  const nyckel = wixNyckel(img);
  if (!nyckel) return null;
  return `https://static.wixstatic.com/media/${nyckel}/v1/fit/w_${kant},h_${kant},q_80/file.webp`;
}

/**
 * Avdelningens produktbild i datorns stora ruta, när avdelningen saknar
 * miljöfoto. Rutan är 232 × 290 px och bilden har 16 % luft, alltså cirka
 * 160 px bred: 480 räcker också för en skärm med tre bildpunkter per px.
 * ☠️ Förut stod menyns miniatyr på 112 px där och blev suddig (mätt
 * 2026-11-15 på Bygg & Renovering, Bil & Garage och Företag & Proffs).
 */
export const AVDELNING_PRODUKT_KANT = 480;

const MINIATYR = new RegExp(`^(https://static\\.wixstatic\\.com/media/[^/?#]+/v1/fit/)w_${MENY_BILD_KANT},h_${MENY_BILD_KANT}(,q_80/file\\.webp)$`);

/** Menyns miniatyr i en annan storlek, eller null när adressen inte är en miniatyr ur menyBildAdress. */
export function menyBildIStorlek(url: string, kant: number): string | null {
  const m = url.match(MINIATYR);
  return m ? `${m[1]}w_${kant},h_${kant}${m[2]}` : null;
}

/**
 * srcset för en miniatyr: 112 px räcker för rutorna på 42 och 56 px med två
 * bildpunkter per px, men en telefon med tre fick en uppförstorad bild. Bara
 * miniatyren får en 3x-variant; andra adresser (miljöfotot, avdelningens stora
 * bild) står som de är.
 */
export function menyBildSrcSet(src: string): string | undefined {
  const tre = menyBildIStorlek(src, Math.round(MENY_BILD_KANT * 1.5));
  return tre ? `${src} 2x, ${tre} 3x` : undefined;
}

function duger(p: MenyKandidat, neka: ReadonlySet<string>): boolean {
  if (!p.inStock || !wixNyckel(p.img) || neka.has(p.slug)) return false;
  return !(p.imageFlags ?? []).some((f) => MENY_BILD_NEKADE_FLAGGOR.has(f));
}

/** Bäst först: mest såld, bäst bildpoäng, äldst, och sist slug så att ordningen alltid är densamma. */
export function rangordna(a: MenyKandidat, b: MenyKandidat): number {
  return (
    (b.popularity ?? 0) - (a.popularity ?? 0) ||
    (b.imageScore ?? 0) - (a.imageScore ?? 0) ||
    (a.createdAt || Number.MAX_SAFE_INTEGER) - (b.createdAt || Number.MAX_SAFE_INTEGER) ||
    (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)
  );
}

/**
 * Väljer en bild per avdelning och underkategori. En kategori utan en enda
 * produkt som duger saknas i svaret, och menyn visar då bara namnet.
 */
export function valjMenyBilder(
  trad: readonly MenyNod[],
  produkter: readonly MenyKandidat[],
  opts: { val?: Readonly<Record<string, string>>; neka?: ReadonlySet<string> } = {},
): MenyBilder {
  const val = opts.val ?? {};
  const neka = opts.neka ?? new Set<string>();
  const dugliga = produkter.filter((p) => duger(p, neka)).sort(rangordna);
  const perSlug = new Map(dugliga.map((p) => [p.slug, p]));

  // Kategorierna med sina urval. En avdelning omfattar sina underkategoriers produkter.
  type Uppgift = { slug: string; urval: MenyKandidat[] };
  const iKategori = (ids: ReadonlySet<string>) => dugliga.filter((p) => p.collectionIds.some((c) => ids.has(c)));
  const subs: Uppgift[] = [];
  const avdelningar: Uppgift[] = [];
  for (const m of trad) {
    for (const s of m.subs) subs.push({ slug: s.slug, urval: iKategori(new Set([s.id])) });
    avdelningar.push({ slug: m.slug, urval: iKategori(new Set([m.id, ...m.subs.map((s) => s.id)])) });
  }
  // Minsta urvalet väljer först; lika stora i trädets ordning (sort är stabil).
  const ordning = [...subs.sort((a, b) => a.urval.length - b.urval.length), ...avdelningar];

  const anvanda = new Set<string>();
  const ut: MenyBilder = {};
  for (const u of ordning) {
    const handplockad = val[u.slug] ? perSlug.get(val[u.slug]) : undefined;
    const vald =
      (handplockad && !anvanda.has(handplockad.slug) ? handplockad : undefined) ??
      u.urval.find((p) => !anvanda.has(p.slug));
    if (!vald) continue;
    const adress = menyBildAdress(vald.img);
    if (!adress) continue;
    anvanda.add(vald.slug);
    ut[u.slug] = adress;
  }
  return ut;
}

/**
 * Avdelningens miljöfoto (CATEGORY_HERO_IMAGES, Unsplash) i den form och bredd
 * menyn visar det: datorns panel 4:5, mobilens banderoll 12:5. Unsplash beskär
 * själv, så att webbläsaren inte beskär en gång till. Höjden tas bort: med både
 * w och h bortser Unsplash från ar. Allt som inte är Unsplash blir null.
 */
export function hjalteAdress(url: string, bredd: number, ar: `${number}:${number}`): string | null {
  if (!url || !url.includes("images.unsplash.com")) return null;
  try {
    const u = new URL(url);
    u.searchParams.delete("h");
    u.searchParams.set("w", String(bredd));
    u.searchParams.set("ar", ar);
    u.searchParams.set("fit", "crop");
    u.searchParams.set("crop", "center");
    u.searchParams.set("q", "75");
    u.searchParams.set("auto", "format");
    return u.toString();
  } catch {
    return null;
  }
}
