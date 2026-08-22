// Admin-vy: moderera ALLA recensioner (importerade AE + riktiga kundrecensioner).
// Status: pending | approved | rejected | edited. Endast approved/edited visas
// publikt på produktsidan.
//
// Sedan DeepL togs bort (2026-08-19) är den här sidan ENDA vägen från importerad
// till publicerad: allt som importeras landar som `pending` med KÄLLTEXTEN, och
// blir svenskt först när någon skriver om det här. Två följder styr designen:
//
//   1. Sidan måste kunna hitta varenda väntande rad. Kollektionen har fler än
//      1000 rader, så listningen paginerar (lib/store/reviews.ts) och status-
//      filtret körs hos Wix — en väntande rad kan ha vilket AE-datum som helst.
//   2. En oöversatt rad måste SE oöversatt ut. Den gamla "Original:"-raden
//      visades bara när texterna skilde sig, vilket de aldrig gör för en
//      nyimporterad rad — så en engelsk recension såg identisk ut med en färdig.
import { getReviewStore, type ReviewStatus, type StoredReview } from "@/lib/store/reviews";
import { getStore } from "@/lib/store/factory";
import { reviewDisplayMode } from "@/lib/import/review-display";
import { isAwaitingTranslation, isCustomerReview } from "@/lib/reviews/queue";
import { buildTranslatePrompt, groupForTranslation, TRANSLATE_BATCH } from "@/lib/reviews/translate";
import { TranslateButton } from "./translate-button";
import {
  setReviewStatus,
  editReviewText,
  runReviewBackfillAction,
  applyReviewTranslations,
} from "./actions";

export const dynamic = "force-dynamic";
// Hämtningen gör ett AE-anrop per produkt — 25 produkter tar ~1 min.
export const maxDuration = 300;

/** Rader per sidvisning. Alla hämtas (för räknarna) men allt renderas inte. */
const MAX_RENDER = 300;

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

/** Kvitto efter en inklistrad omgång — inklusive det som INTE skrevs in. */
function TranslateResult({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const tr = get("tr");
  if (!tr) return null;

  if (tr === "parsefel") {
    return (
      <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 12px", borderRadius: 8, fontSize: 13, margin: "14px 0" }}>
        Kunde inte läsa JSON-svaret. Klistra in hela blocket från chatten — kodstaket och text
        runt omkring går bra, men själva <code>{"{ … }"}</code> måste vara komplett.
      </div>
    );
  }

  const n = (k: string) => Number(get(k) ?? 0);
  const skäl = get("sk");
  return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 12px", borderRadius: 8, fontSize: 13, margin: "14px 0" }}>
      <b>{n("s")} recensioner översatta</b> och synliga på produktsidan.
      {n("a") > 0 ? (
        <>
          {" "}· <span style={{ color: "#b45309" }}>{n("a")} underkända</span> (ligger kvar i kön
          {skäl ? `: ${skäl}` : ""})
        </>
      ) : null}
      {n("o") > 0 ? <> · {n("o")} id fanns inte i kön</> : null}
      {n("f") > 0 ? <> · {n("f")} skrivfel</> : null}
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
  const oversattaKvar = reviews.filter(isAwaitingTranslation).length;

  // Filtret på status: default "väntar", eftersom det är det enda som kräver
  // handpåläggning. Utan filter drunknar de nya raderna bland ~1900 godkända.
  // "kund" är inte en status utan ett URSPRUNG — egen gren nedan. Butikens egna
  // kunder är förstahandsdata och de enda rader som får räknas mot Google, så de
  // ska gå att plocka fram oavsett var i modereringen de befinner sig.
  const valdStatus = ((): ReviewStatus | "alla" | "kund" => {
    const v = typeof sp.status === "string" ? sp.status : "pending";
    return v === "alla" || v === "kund" || v === "pending" || v === "approved" || v === "edited" || v === "rejected"
      ? (v as ReviewStatus | "alla" | "kund")
      : "pending";
  })();
  const egnaKunder = reviews.filter(isCustomerReview).length;
  const filtrerade =
    valdStatus === "alla"
      ? reviews
      : valdStatus === "kund"
        ? reviews.filter(isCustomerReview)
        : reviews.filter((r) => r.status === valdStatus);
  const visade = filtrerade.slice(0, MAX_RENDER);

  // Översättningskön: en OMGÅNG i taget, grupperad per produkt så chatten vet
  // vad varan är. Prompten byggs här (server) — knappen kopierar bara.
  const kö = reviews.filter(isAwaitingTranslation);
  const omgång = groupForTranslation(kö, (id) => nameById.get(id), TRANSLATE_BATCH);
  const omgångAntal = omgång.reduce((n, g) => n + g.rader.length, 0);
  const översättPrompt = omgångAntal > 0 ? buildTranslatePrompt(omgång) : "";

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <a href="/admin">← Admin</a>
      </p>
      <h1>Recensioner (moderering)</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        Alla recensioner (importerade omdömen + riktiga kundrecensioner). Allt importerat
        landar som <b>Väntar</b> med texten på <b>originalspråket</b> — skriv om den till
        svenska under &quot;Redigera text&quot;, så blir raden <b>Redigerad</b> och syns publikt.
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
          utan att spara. Skarpt läge <b>publicerar ingenting</b>: raderna sparas som
          <b> Väntar</b> med originaltexten och blir svenska först när du skriver om dem
          nedan. Gratis — hämtningen är ett vanligt AE-anrop.
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
            Kör skarpt (sparar som väntande)
          </button>
        </div>
      </form>

      <TranslateResult sp={sp} />

      {oversattaKvar > 0 ? (
        <div
          style={{
            border: "1px solid #ddd6fe",
            background: "#faf5ff",
            borderRadius: 8,
            padding: "12px 14px",
            margin: "14px 0",
          }}
        >
          <b style={{ fontSize: 15 }}>Översätt kön i chatten</b>
          <p style={{ color: "#555", fontSize: 13, margin: "6px 0 0" }}>
            <b>{oversattaKvar}</b> recensioner väntar på svensk text. Knappen kopierar en omgång
            om högst {TRANSLATE_BATCH} — grupperade per produkt, så chatten vet vad varan är.
            Klistra in svaret nedan så skrivs hela omgången in på en gång. Gratis, samma
            arbetssätt som SEO-poleringen.
          </p>

          <TranslateButton prompt={översättPrompt} antal={omgångAntal} />

          <form action={applyReviewTranslations} style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Klistra in JSON-svaret från chatten
            </label>
            <textarea
              name="json"
              rows={5}
              placeholder={'{"1234567890": "Toppenprodukt, monterad på tjugo minuter …"}'}
              style={{
                width: "100%",
                fontSize: 12,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontFamily: "monospace",
                marginTop: 4,
              }}
            />
            <button
              type="submit"
              style={{
                padding: "6px 14px",
                fontWeight: 700,
                background: "#4c1d95",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Skriv in översättningarna
            </button>
          </form>
        </div>
      ) : null}

      <p style={{ fontSize: 14 }}>
        Totalt: <b>{reviews.length}</b> · Väntar: <b>{counts.pending ?? 0}</b> · Godkända:{" "}
        <b>{counts.approved ?? 0}</b> · Redigerade: <b>{counts.edited ?? 0}</b> · Avvisade:{" "}
        <b>{counts.rejected ?? 0}</b>
        {oversattaKvar > 0 ? (
          <>
            {" "}
            · <span style={{ color: "#b45309", fontWeight: 700 }}>{oversattaKvar} oöversatta</span>
          </>
        ) : null}
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
        {(
          [
            ["pending", `Väntar (${counts.pending ?? 0})`],
            ["edited", `Redigerade (${counts.edited ?? 0})`],
            ["approved", `Godkända (${counts.approved ?? 0})`],
            ["rejected", `Avvisade (${counts.rejected ?? 0})`],
            ["kund", `✓ Egna kunder (${egnaKunder})`],
            ["alla", `Alla (${reviews.length})`],
          ] as const
        ).map(([v, label]) => (
          <a
            key={v}
            href={`/admin/reviews?status=${v}`}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              textDecoration: "none",
              color: valdStatus === v ? "#fff" : "#374151",
              background: valdStatus === v ? "#374151" : "#fff",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {filtrerade.length > visade.length ? (
        <p style={{ fontSize: 12, color: "#6b7280" }}>
          Visar <b>{visade.length}</b> av <b>{filtrerade.length}</b> — ta de här först, ladda om
          för nästa omgång.
        </p>
      ) : null}

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
          {visade.map((r) => (
            <tr key={`${r.productId}__${r.reviewIdAE}`} style={{ borderBottom: "1px solid #f1f1f1", verticalAlign: "top" }}>
              <td style={{ padding: "10px 4px" }}>
                <StatusPill status={r.status} />
                {isAwaitingTranslation(r) ? (
                  <div
                    style={{
                      marginTop: 4,
                      background: "#ffedd5",
                      color: "#9a3412",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      display: "inline-block",
                    }}
                  >
                    ⚠️ Oöversatt
                  </div>
                ) : null}
              </td>
              <td style={{ padding: "10px 4px", maxWidth: 200 }}>
                <div>
                  {nameById.get(r.productId) ?? <code>{r.productId}</code>}
                  {/* FÖRSTAHANDSDATA. Enda spåret av att raden kom från en av
                      butikens egna kunder var tidigare prefixet "kund-" inne i
                      dokument-id:t — man fick läsa id-strängen. De här raderna
                      är dessutom de enda som någonsin får räknas in i
                      aggregateRating mot Google, så de är värda mest. */}
                  {isCustomerReview(r) ? (
                    <span
                      title="Skriven av en kund som handlat hos oss — verifierat köp"
                      style={{
                        marginLeft: 6, fontSize: 11, fontWeight: 700,
                        color: "#166534", background: "#dcfce7",
                        borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap",
                      }}
                    >
                      ✓ Egen kund
                    </span>
                  ) : null}
                </div>
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
                    {/* Knappen finns kvar även för oöversatta rader — en del
                        AE-omdömen är redan skrivna på svenska, och de ska
                        kunna godkännas som de är. Men den ska inte se ut som
                        det självklara nästa steget: för allt annat publicerar
                        den originalspråket. */}
                    <button
                      type="submit"
                      style={btn(isAwaitingTranslation(r) ? "#fff7ed" : "#dcfce7")}
                      title={
                        isAwaitingTranslation(r)
                          ? "Texten är inte omskriven — godkänn bara om den redan är på svenska."
                          : undefined
                      }
                    >
                      {isAwaitingTranslation(r) ? "Godkänn ändå" : "Godkänn"}
                    </button>
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
      {!loadError && reviews.length > 0 && filtrerade.length === 0 ? (
        <p style={{ color: "#888" }}>Inget med den statusen.</p>
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
