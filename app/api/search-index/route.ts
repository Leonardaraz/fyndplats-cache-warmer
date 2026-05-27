import { NextResponse } from "next/server";
import { getProducts } from "../../../lib/products";

// Lightweight product index for the search autocomplete: name / slug / image / price.
// Cached and revalidated hourly so the dropdown filters instantly client-side after a
// single fetch (no per-keystroke network round-trips).
export const revalidate = 3600;

export async function GET() {
  const products = await getProducts();
  const index = products.map((p) => ({ n: p.name, s: p.slug, i: p.img, p: p.price }));
  return NextResponse.json(index);
}
