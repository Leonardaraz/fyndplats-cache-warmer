import Image from "next/image";
import { getProducts } from "../../../lib/products";
import {
  allScores,
  scoresMeta,
  flagLabel,
  suggestedAction,
  getWixScoreRows,
  PROBLEM_MAX_SCORE,
  type ImageScoreRecord,
} from "../../../lib/image-scores";
import { AdminHideToggle } from "../../../components/admin-hide-toggle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Bildproblem – admin", robots: { index: false, follow: false } };

export default async function ImageIssues() {
  const [products, wixRows] = await Promise.all([getProducts(), getWixScoreRows().catch(() => new Map())]);
  const meta = scoresMeta();
  const scores = allScores();
  const productById = new Map(products.map((p) => [p.id, p]));

  // Problembilder: score < 50, lägst först.
  const issues = Object.entries(scores)
    .filter(([, r]) => r.mainImageScore < PROBLEM_MAX_SCORE)
    .map(([id, r]) => ({ id, r: r as ImageScoreRecord }))
    .sort((a, b) => a.r.mainImageScore - b.r.mainImageScore);

  const all = Object.values(scores).map((r) => r.mainImageScore);
  const hi = all.filter((s) => s > 75).length;
  const mid = all.filter((s) => s >= 50 && s <= 75).length;
  const lo = all.filter((s) => s < 50).length;
  const hiddenCount = [...(wixRows as Map<string, { hidden: boolean }>).values()].filter((x) => x.hidden).length;

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 20px 80px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Bildproblem</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Produkter med bildkvalitets-poäng under {PROBLEM_MAX_SCORE}. Poäng från Claude Haiku-vision
        ({meta.model}), {meta.count} produkter analyserade {new Date(meta.generatedAt).toLocaleString("sv-SE")}.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0 28px" }}>
        {[
          { label: "Topp (>75)", v: hi, c: "#16804a" },
          { label: "OK (50–75)", v: mid, c: "#a16207" },
          { label: "Problem (<50)", v: lo, c: "#b91c1c" },
          { label: "Gömda från fynd", v: hiddenCount, c: "#475569" },
        ].map((s) => (
          <div key={s.label} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 16px", minWidth: 120 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <a href="/admin/rerun-image-scores" style={{ fontSize: 14, color: "#C2410C", fontWeight: 600 }}>
          → Kör om bildpoängsättning
        </a>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {issues.map(({ id, r }) => {
          const p = productById.get(id);
          const img = p?.img || "";
          const wix = (wixRows as Map<string, { hidden: boolean }>).get(id);
          const slug = p?.slug || r.slug;
          return (
            <div key={id} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: 16, alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <div style={{ position: "relative", width: 84, height: 84, borderRadius: 8, overflow: "hidden", background: "#f3f4f6" }}>
                {img && <Image src={img} alt="" fill sizes="84px" style={{ objectFit: "cover" }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{
                    fontWeight: 700, fontSize: 18,
                    color: r.mainImageScore < 35 ? "#b91c1c" : "#a16207",
                  }}>{r.mainImageScore}</span>
                  {slug
                    ? <a href={`/produkt/${slug}`} style={{ fontWeight: 600 }}>{r.name}</a>
                    : <span style={{ fontWeight: 600 }}>{r.name}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
                  {r.flags.length === 0 && <span style={{ fontSize: 12, color: "#999" }}>inga flaggor</span>}
                  {r.flags.map((f) => (
                    <span key={f} style={{ fontSize: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 999, padding: "2px 9px" }}>{flagLabel(f)}</span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>
                  {r.reason && <span style={{ fontStyle: "italic" }}>{r.reason}. </span>}
                  Förslag: <b>{suggestedAction(r.mainImageScore)}</b>
                </div>
              </div>
              <AdminHideToggle productId={id} initialHidden={Boolean(wix?.hidden)} />
            </div>
          );
        })}
        {issues.length === 0 && <p style={{ color: "#666" }}>Inga produkter under {PROBLEM_MAX_SCORE} poäng. 🎉</p>}
      </div>
    </main>
  );
}
