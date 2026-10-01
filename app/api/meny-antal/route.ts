import { NextResponse } from "next/server";
import { getCategoryTree } from "../../../lib/category-groups";
import { menyAntal } from "../../../lib/meny-antal";

// GET /api/meny-antal — menyns produktantal, slug → antal.
//
// Siffrorna låg förut i varje sidas HTML, och ändrades de blev alla ~3 700
// produktsidor "nya" för Vercel (lib/meny-antal.ts). Nu hämtar mega-menyn och
// mobilmenyn dem härifrån, en gång per sidvisning, och svaret delas av alla
// besökare via CDN:n. Samma träd som menyn (getCategoryTree), så siffrorna är
// exakt desamma som förut.
export const revalidate = 900;
// Explicit huvud: `revalidate` ensam räcker inte för en route handler
// (se app/api/lista/route.ts).
const CACHE = "public, max-age=300, s-maxage=900, stale-while-revalidate=3600";

export async function GET() {
  const antal = menyAntal(await getCategoryTree());
  return NextResponse.json({ antal }, { headers: { "Cache-Control": CACHE } });
}
