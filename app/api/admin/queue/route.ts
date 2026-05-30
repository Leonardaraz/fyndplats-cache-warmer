// /api/admin/queue
//
// GET  → lista alla pending_review-mappningar.
// POST → publicera eller avvisa (bulk eller en).
//
// Body för POST:
//   { action: "publish" | "reject", wixProductIds: string[] }
//
// publish → sätter Wix visible:true + draftStatus="published"
// reject  → sätter draftStatus="rejected" (lämnar produkten dold;
//           du kan ta bort den manuellt i Wix om du vill).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { checkToken } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getProduct, setProductVisibility } from "@/lib/wix/client";

export const runtime = "nodejs";

const ActionSchema = z.object({
  action: z.enum(["publish", "reject"]),
  wixProductIds: z.array(z.string().min(1)).min(1),
});

export async function GET(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  const store = getStore();
  const all = await store.listMappings();
  const pending = all
    .filter((m) => (m.draftStatus ?? "published") === "pending_review")
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return NextResponse.json({ count: pending.length, items: pending });
}

export async function POST(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valideringsfel", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { action, wixProductIds } = parsed.data;
  const store = getStore();
  const errors: string[] = [];
  let processed = 0;

  for (const id of wixProductIds) {
    try {
      const mapping = await store.getMappingByWixProductId(id);
      if (!mapping) {
        errors.push(`${id}: mappning saknas`);
        continue;
      }

      if (action === "publish") {
        const snapshot = await getProduct(id);
        if (!snapshot) {
          errors.push(`${id}: produkt finns inte i Wix`);
          continue;
        }
        await setProductVisibility(id, snapshot.revision, true);
      }

      mapping.draftStatus = action === "publish" ? "published" : "rejected";
      mapping.reviewedAt = new Date().toISOString();
      await store.saveMapping(mapping);

      await audit(
        action === "publish" ? "review-publish" : "review-reject",
        id,
        mapping.seoTitle?.slice(0, 100),
      );
      processed++;
    } catch (err) {
      const msg = `${id}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    processed,
    failed: errors.length,
    errors,
  });
}
