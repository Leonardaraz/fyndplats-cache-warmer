import { NextResponse } from "next/server";
import { getProducts } from "../../../lib/products";

// Lightweight product index for the search autocomplete: name / slug / image / price.
// Cached and revalidated hourly so the dropdown filters instantly client-side after a
// single fetch (no per-keystroke network round-trips).
export const revalidate = 3600;

// `o: 1` = slutsåld. Sätts BARA på slutsålda (39 av ~455) så payloaden knappt
// växer. Autocomplete använder den till två saker: hålla slutsålt utanför
// "Populära produkter" (tomt sökfält = bläddring) och lägga slutsålda träffar
// sist med en diskret etikett (ifylld sökning = avsikt). Se components/searchbox.
export async function GET() {
  const products = await getProducts();
  const index = products.map((p) => ({
    n: p.name,
    s: p.slug,
    i: p.img,
    p: p.price,
    ...(p.inStock ? {} : { o: 1 }),
  }));
  return NextResponse.json(index);
}
