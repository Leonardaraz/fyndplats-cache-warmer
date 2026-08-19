// Admin-vy: moderera ALLA recensioner (importerade AE + framtida riktiga kund-
// recensioner). Status: pending | approved | rejected | edited. Importerade auto-
// godkänns; riktiga kundrecensioner (framöver) landar som pending. Endast
// approved/edited visas publikt på produktsidan.
import { getReviewStore, type ReviewStatus, type StoredReview } from "@/lib/store/reviews";
import { getStore } from "@/lib/store/factory";
import { reviewDisplayMode } from "@/lib/import/review-display";
import { setReviewStatus, editReviewText, runReviewBackfillAction } from "./actions";

export const dynamic = "force-dynamic";
// Hämtningen gör ett AE-anrop per produkt — 25 produkter tar ~1 min.
export const maxDuration = 300;

const STATUS_STYLE: Record<ReviewStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#fef9c3", fg: "#854d0e", label: "Väntar" },
  approved: { bg: "#dcfce7", fg: "#166534", label: "Godkänd" },
  rejected: { bg: "#fee2e2", fg: "#991b1b", label: "Avvisad" },
  edited: { bg: "#e0e7ff", fg: "#3730a3", label: "Redigerad" },
};

function StatusPill({ status }: { status: ReviewStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
      {s.label}
    </span>
  );
}

/** Resultatbanner efter en körning (siffrorna kommer tillbaka via query). */
function BackfillResult({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const kind = get("k");
  if (kind !== "dry" && kind !== "live") return null;

  const n = (k: string) => Number(get(k) ?? 0);
  const dry = kind === "dry";
  const stopText: Record<string, string> = {
    klar: "hela urvalet gicks igenom",
    gräns: "antalsgränsen nåddes — kör igen för nästa omgång",
    tid: "tidsbudgeten nåddes — kör igen för nästa omgång",
  };

  return (
    <div
      style={{
        background: dry ? "#eff6ff" : "#f0fdf4",
        border: `1px solid ${dry ? "#bfdbfe" : "#bbf7d0"}`,
        borderRadius: 8,
        padding: "12px 14px",
        margin: "14px 0",
        fontSize: 14,
      }}
    >
      <b>
        {dry ? "Torrkörning klar — inget sparades." : "Hämtning klar."}
      </b>
      <br />
      Produkter genomgångna: <b>{n("p")}</b> · med recensioner: <b>{n("w")}</b> ·{" "}
      {dry ? (
        <>skulle spara: <b>{n("e")}</b> recensioner</>
      ) : (
        <>
          sparade: <b>{n("i")}</b> recensioner{" "}
          <span style={{ color: "#b45309" }}>(väntar på översättning nedan)</span>
        </>
      )}
      {n("t") > 0 ? <> · strypta av AE: <b>{n("t")}</b> (tas om nästa körning)</> : null}
      {n("f") > 0 ? <> · fel: <b>{n("f")}</b></> : null}
      <br />
      <span style={{ color: "#555" }}>
        Stopp: {stopText[get("s") ?? ""] ?? get("s")}
      </span>
    </div>
  );
}

export default async function ReviewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
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

  // Väntande först (kräver åtgärd), sedan resten.
  const order: Record<ReviewStatus, number> = { pending: 0, edited: 1, approved: 2, rejected: 3 };
  reviews.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  const counts = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <a href="/admin">← Admin</a>
      </p>
      <h1>Recensioner (moderering)</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        Alla recensioner (importerade AliExpress-omdömen + framtida riktiga kundrecensioner).
        Importerade auto-godkänns; riktiga landar som <b>Väntar</b> och kräver ditt godkännande.
        Endast <b>Godkänd</b>/<b>Redigerad</b> visas på produktsidan. Publik visning:{" "}
        <code>REVIEW_DISPLAY_MODE={reviewDisplayMode()}</code> (sätt{" "}
        <code>verified_buyer</code> för panic-läge).
      </p>

      {loadError ? (
        <p style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
          Kunde inte läsa recensioner: <code>{loadError}</code>
          <br />
          (Kollektionen <code>FyndplatsImportedReviews</code> skapas via{" "}
          <code>node scripts/ensure-reviews-collection.mjs</code> — tom tills första importen.)
        </p>
      ) : null}

      <BackfillResult sp={sp} />

      <form
        action={runReviewBackfillAction}
        style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", margin: "14px 0" }}
      >
        <b style={{ fontSize: 15 }}>Hämta recensioner från AliExpress</b>
        <p style={{ color: "#555", fontSize: 13, margin: "6px 0 10px" }}>
          Hämtar för produkter som <b>saknar</b> recensioner. Torrkör först — den räknar
          utan att spara. Skarpt läge <b>publicerar direkt</b> (importerade auto-godkänns)
          och tänder <code>aggregateRating</code> i produktsidans strukturerade data.
          Gratis — hämtningen är ett vanligt AE-anrop. Recensionerna sparas som
          väntande och blir svenska när du skriver om dem nedan.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
          <label>
            Produkter:{" "}
            <select name="limit" defaultValue="25">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <label>
            Max per produkt:{" "}
            <select name="maxPerProduct" defaultValue="8">
              <option value="5">5</option>
              <option value="8">8</option>
              <option value="15">15</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="onlyPublished" value="1" defaultChecked /> Bara publicerade
          </label>
          <button type="submit" name="mode" value="dry" style={{ padding: "6px 12px", fontWeight: 600 }}>
            Torrkör (räkna)
          </button>
          <button
            type="submit"
            name="mode"
            value="live"
            style={{ padding: "6px 12px", fontWeight: 700, background: "#166534", color: "#fff", border: 0, borderRadius: 6 }}
          >
            Kör skarpt (publicerar)
          </button>
        </div>
      </form>

      <p style={{ fontSize: 14 }}>
        Totalt: <b>{reviews.length}</b> · Väntar: <b>{counts.pending ?? 0}</b> · Godkända:{" "}
        <b>{counts.approved ?? 0}</b> · Redigerade: <b>{counts.edited ?? 0}</b> · Avvisade:{" "}
        <b>{counts.rejected ?? 0}</b>
      </p>

      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: "8px 4px" }}>Status</th>
            <th style={{ padding: "8px 4px" }}>Produkt / källa</th>
            <th style={{ padding: "8px 4px" }}>Recension</th>
            <th style={{ padding: "8px 4px" }}>Åtgärd</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={`${r.productId}__${r.reviewIdAE}`} style={{ borderBottom: "1px solid #f1f1f1", verticalAlign: "top" }}>
              <td style={{ padding: "10px 4px" }}>
                <StatusPill status={r.status} />
              </td>
              <td style={{ padding: "10px 4px", maxWidth: 200 }}>
                <div>{nameById.get(r.productId) ?? <code>{r.productId}</code>}</div>
                <div style={{ color: "#9ca3af", fontSize: 11 }}>
                  Wix Data: <code>FyndplatsImportedReviews/{r.productId}__{r.reviewIdAE}</code>
                </div>
                <div style={{ color: "#9ca3af", fontSize: 11 }}>
                  {r.initials} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  {r.date ? ` · ${r.date.slice(0, 10)}` : ""}
                  {r.sourceLanguage ? ` · ${r.sourceLanguage}` : ""}
                  {r.customerCountry ? ` · ${r.customerCountry}` : ""}
                  {r.hasImage ? " · 📷" : ""}
                </div>
              </td>
              <td style={{ padding: "10px 4px", maxWidth: 380 }}>
                <p style={{ margin: "0 0 4px" }}>{r.textSwedish}</p>
                {r.textOriginal !== r.textSwedish ? (
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: 11, fontStyle: "italic" }}>
                    Original: {r.textOriginal}
                  </p>
                ) : null}
                <details style={{ marginTop: 6 }}>
                  <summary style={{ fontSize: 11, color: "#6b7280", cursor: "pointer" }}>Redigera text</summary>
                  <form action={editReviewText} style={{ marginTop: 6 }}>
                    <input type="hidden" name="productId" value={r.productId} />
                    <input type="hidden" name="reviewIdAE" value={r.reviewIdAE} />
                    <textarea
                      name="text"
                      defaultValue={r.textSwedish}
                      rows={3}
                      style={{ width: "100%", fontSize: 13, padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                    <button type="submit" style={btn("#e0e7ff")}>Spara ändring</button>
                  </form>
                </details>
              </td>
              <td style={{ padding: "10px 4px", whiteSpace: "nowrap" }}>
                {r.status !== "approved" ? (
                  <form action={setReviewStatus.bind(null, r.productId, r.reviewIdAE, "approved")} style={{ display: "inline" }}>
                    <button type="submit" style={btn("#dcfce7")}>Godkänn</button>
                  </form>
                ) : null}
                {r.status !== "rejected" ? (
                  <form action={setReviewStatus.bind(null, r.productId, r.reviewIdAE, "rejected")} style={{ display: "inline" }}>
                    <button type="submit" style={btn("#fee2e2")}>Avvisa</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loadError && reviews.length === 0 ? (
        <p style={{ color: "#888" }}>Inga recensioner importerade än.</p>
      ) : null}
    </main>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    fontSize: 12,
    padding: "4px 10px",
    margin: "0 4px 4px 0",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: bg,
    cursor: "pointer",
  };
}
