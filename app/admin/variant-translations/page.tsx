// Admin-vy: stickprov på AI-översatta variantvärden (engelska → svenska).
//
// Den statiska tabellen översätter kända värden ($0); för svansen den missar
// fyller Haiku i. De gissningarna är oprövade och kan bli fel-men-svenska —
// något review-kön (needsAiPolish) INTE fångar. Denna vy listar dem nyast först
// så Leonard kan ögna de första batcherna. Ser han en fel: en rad i den statiska
// tabellen slår permanent ut AI:n (värdet blir då ingen AI-kandidat).

import { listVariantTranslations } from "@/lib/llm/variant-log";

export const dynamic = "force-dynamic";

export default async function VariantTranslationsPage() {
  const rows = await listVariantTranslations(500);

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <a href="/admin">← Tillbaka till admin</a>
      </p>
      <h1>AI-översatta variantvärden (stickprov)</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Råengelska → svenska som <strong>Haiku</strong> gissade för värden den statiska tabellen
        missade. Nyast först. Ser du en felöversättning: lägg en rad i{" "}
        <code>lib/import/variant-translations.ts</code> — en tabellrad slår <strong>permanent</strong> ut
        AI:n, eftersom värdet då inte längre är en AI-kandidat (och cachen kringgås).
      </p>
      <p style={{ fontSize: 13, color: "#666" }}>
        {rows.length} unika värden loggade. Bara genuina översättningar visas (oförändrade
        modellnamn/koder loggas inte). Halv-engelska värden fångas separat av{" "}
        <a href="/admin/queue">granskningskön</a> (✨ Behöver AI-polering).
      </p>

      {rows.length === 0 ? (
        <p style={{ marginTop: 24 }}>Inga AI-översatta variantvärden loggade ännu.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
              <th style={{ padding: "6px 8px" }}>Råvärde (en)</th>
              <th style={{ padding: "6px 8px" }}>Svenska</th>
              <th style={{ padding: "6px 8px" }}>Produkt</th>
              <th style={{ padding: "6px 8px" }}>När</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "6px 8px" }}>
                  <code>{r.raw}</code>
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <code>{r.sv}</code>
                </td>
                <td style={{ padding: "6px 8px", color: "#666" }}>{r.productTitle ?? "—"}</td>
                <td style={{ padding: "6px 8px", color: "#666" }}>
                  {r.at?.slice(0, 19).replace("T", " ") ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
