// lib/slutsalda-lankar.ts
//
// Vilka SLUTSÅLDA produkter en listsida ska länka till, som rena textlänkar.
//
// ☠️ VARFÖR (2026-11-11). Slutsålda produkter döljs i alla listor (forListings i
// lib/products.ts) men står kvar i sitemapen, eftersom sidan lever: den har
// bevakningsformuläret och sin historik hos sökmotorerna. Följden var att ingen
// sida i butiken länkade till dem. Semrush räknade 475 sidor i sitemapen utan
// en enda intern länk, och 208 sidor fler än tre klick från startsidan. En sida
// som bara nås via sitemapen tappar sitt interna länkvärde just när den ska
// hållas vid liv tills varan är tillbaka.
//
// Rutnätet rörs inte: kunden ser fortfarande bara det som går att köpa. Listan
// "Slut i lager just nu" är textlänkar i en hopfälld ruta under kategorins
// A–Ö-lista (components/product-index.tsx).
//
// LÖVMODUL utan importer, så `node --test` kan ladda den. Regeln för vilka
// produkter som hör till en kategorisida (lib/bara-i-underkategorin.ts) skickas
// därför in av anroparen.

type Kategori = { id: string; slug: string; parentId: string | null };
type Produkt = { id: string; inStock: boolean; collectionIds?: string[] };

/** Kategorier vars sida inte listar sina egna produkter. "ovrigt" omdirigeras
 *  till /alla-produkter; rea och populara fylls från produktflaggor. */
export const UTAN_EGEN_LISTA: ReadonlySet<string> = new Set(["ovrigt", "rea", "populara"]);

/** Produkter som inte ligger i någon kategori med egen lista. */
export function utanKategorisidaAv<P extends { collectionIds?: string[] }>(
  produkter: readonly P[],
  kategorier: readonly Kategori[],
): P[] {
  const medSida = new Set(kategorier.filter((c) => !UTAN_EGEN_LISTA.has(c.slug)).map((c) => c.id));
  return produkter.filter((p) => !(p.collectionIds || []).some((id) => medSida.has(id)));
}

/**
 * Kategorins slutsålda produkter: samma urval som kategorisidans lista
 * (kategorin och, för en avdelning, de direkta underkategorierna), men bara
 * det som är slut.
 *
 * `dolda` är sant när listorna döljer slutsålt (det vanliga). Visar listorna
 * redan slutsålt finns länkarna där, och svaret är tomt. Tomt också för
 * kategorierna vars sida inte listar sina egna produkter. `iKategorin` är
 * produkterIKategorin ur lib/bara-i-underkategorin.ts.
 */
export function slutsaldaIKategorinAv<P extends Produkt>(
  kategori: Kategori,
  kategorier: readonly Kategori[],
  allaProdukter: readonly P[],
  dolda: boolean,
  iKategorin: (produkter: readonly P[], kategori: Kategori, kategorier: readonly Kategori[]) => P[],
): P[] {
  if (!dolda || UTAN_EGEN_LISTA.has(kategori.slug)) return [];
  return iKategorin(allaProdukter.filter((p) => !p.inStock), kategori, kategorier);
}

/**
 * Slutsålda produkter som ingen kategorisida kan länka till: de ligger bara i
 * kategorier utan egen lista, eller i en kategori som saknar sida just nu för
 * att allt i den är slut (då finns den inte i `kategorier`). /alla-produkter
 * listar dem, så att ingen publicerad sida blir utan intern länk.
 */
export function slutsaldaUtanKategorisidaAv<P extends Produkt>(
  allaProdukter: readonly P[],
  kategorier: readonly Kategori[],
  dolda: boolean,
): P[] {
  if (!dolda) return [];
  return utanKategorisidaAv(allaProdukter.filter((p) => !p.inStock), kategorier);
}
