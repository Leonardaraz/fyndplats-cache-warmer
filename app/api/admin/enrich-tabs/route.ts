import { NextResponse } from "next/server";
import { enrichProductTabs } from "../../../../lib/enrich-tabs";

// Genererar (och, om ej dryRun, sparar) de tabbade PDP-flikarna för EN produkt.
// Skyddas av proxy.ts (ADMIN_SECRET) eftersom sökvägen ligger under /api/admin.
// Bulk hanteras av klienten som loopar denna route med progress + budgetcap.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }
  const { productId, categoryName, dryRun } = (body || {}) as {
    productId?: string;
    categoryName?: string | null;
    dryRun?: boolean;
  };
  if (!productId) {
    return NextResponse.json({ error: "productId krävs" }, { status: 400 });
  }
  try {
    const result = await enrichProductTabs(productId, { categoryName: categoryName ?? null, dryRun: !!dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    // Budgettak → 429 så klientens bulk-loop kan stanna kontrollerat.
    const status = /budget/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
