import { RerunButton } from "../../../components/admin-rerun-button";
import { scoresMeta } from "../../../lib/image-scores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Kör om bildpoäng – admin", robots: { index: false, follow: false } };

export default function RerunPage() {
  const meta = scoresMeta();
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Kör om bildpoängsättning</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Poängsätter produkternas huvudbilder med Claude Haiku-vision och skriver till
        Wix Data (FyndplatsImageScores). Senaste snapshot: {meta.count} produkter,
        {" "}{new Date(meta.generatedAt).toLocaleString("sv-SE")}.
      </p>
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", margin: "16px 0", fontSize: 14, color: "#92400e" }}>
        <b>Obs:</b> denna knapp uppdaterar poängen i Wix Data (syns i Bildproblem-vyn och
        styr gömda produkter). Storefrontens <i>sortering</i> läser den committade{" "}
        <code>data/image-scores.json</code> — för en full omsortering, kör{" "}
        <code>node scripts/score-images.mjs</code> och deploya. Budget-cap:
        {" "}ANTHROPIC_DAILY_BUDGET_USD respekteras.
      </div>
      <RerunButton />
      <p style={{ marginTop: 24 }}>
        <a href="/admin/image-issues" style={{ color: "#C2410C", fontWeight: 600 }}>← Tillbaka till Bildproblem</a>
      </p>
    </main>
  );
}
