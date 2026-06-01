// Admin-vy: moderera importerade AliExpress-recensioner. Leonard kan dölja/visa
// enskilda recensioner per produkt. Dolda recensioner exkluderas på produktsidan
// (headless-PDP) och från snittbetyg/schema.org.
import { getReviewStore, type StoredReview } from "@/lib/store/reviews";
import { getStore } from "@/lib/store/factory";
import { setReviewHidden } from "./actions";

export const dynamic = "force-dynamic";

function groupByProduct(reviews: StoredReview[]): Map<string, StoredReview[]> {
  const map = new Map<string, StoredReview[]>();
  for (const r of reviews) {
    if (!map.has(r.productId)) map.set(r.productId, []);
    map.get(r.productId)!.push(r);
  }
  return map;
}

export default async function ReviewsAdminPage() {
  let reviews: StoredReview[] = [];
  let loadError: string | null = null;
  const nameById = new Map<string, string>();

  try {
    const [all, mappings] = await Promise.all([
      getReviewStore().listAll(),
      getStore().listMappings(),
    ]);
    reviews = all;
    for (const m of mappings) nameById.set(m.wixProductId, m.seoTitle ?? m.wixProductId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  const byProduct = groupByProduct(reviews);
  const totalVisible = reviews.filter((r) => !r.hidden).length;

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <a href="/admin">← Admin</a>
      </p>
      <h1>Recensioner (moderering)</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        Importerade AliExpress-recensioner översatta till svenska (DeepL). Dölj enskilda
        recensioner som inte passar — dolda visas inte på produktsidan och räknas inte med i
        snittbetyget eller schema.org-datan.
      </p>

      {loadError ? (
        <p style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
          Kunde inte läsa recensioner: <code>{loadError}</code>
          <br />
          (Kollektionen <code>FyndplatsImportedReviews</code> skapas via{" "}
          <code>node scripts/ensure-reviews-collection.mjs</code> — tom tills första importen.)
        </p>
      ) : null}

      <p style={{ fontSize: 14 }}>
        Totalt: <b>{reviews.length}</b> · Synliga: <b>{totalVisible}</b> · Produkter:{" "}
        <b>{byProduct.size}</b>
      </p>

      {[...byProduct.entries()].map(([productId, list]) => {
        const visible = list.filter((r) => !r.hidden);
        const avg =
          visible.length > 0
            ? (visible.reduce((s, r) => s + r.rating, 0) / visible.length).toFixed(1)
            : "—";
        return (
          <section key={productId} style={{ marginTop: 28, borderTop: "2px solid #eee", paddingTop: 16 }}>
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>
              {nameById.get(productId) ?? <code>{productId}</code>}
            </h2>
            <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 12 }}>
              <code>{productId}</code> · ⭐ {avg} · {visible.length}/{list.length} synliga
            </div>
            {list.map((r) => (
              <div
                key={r.reviewIdAE}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: r.hidden ? "#fafafa" : "#fff",
                  opacity: r.hidden ? 0.55 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13 }}>
                    <b>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</b>{" "}
                    <span style={{ color: "#6b7280" }}>
                      {r.customerName}
                      {r.date ? ` · ${r.date.slice(0, 10)}` : ""}
                      {r.hasImage ? " · 📷" : ""}
                    </span>
                  </div>
                  <form action={setReviewHidden.bind(null, r.productId, r.reviewIdAE, !r.hidden)}>
                    <button
                      type="submit"
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        background: r.hidden ? "#dcfce7" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {r.hidden ? "Visa" : "Dölj"}
                    </button>
                  </form>
                </div>
                <p style={{ fontSize: 14, margin: "6px 0 2px" }}>{r.textSwedish}</p>
                {r.textOriginal !== r.textSwedish ? (
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, fontStyle: "italic" }}>
                    Original: {r.textOriginal}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        );
      })}

      {!loadError && reviews.length === 0 ? (
        <p style={{ color: "#888" }}>Inga recensioner importerade än.</p>
      ) : null}
    </main>
  );
}
