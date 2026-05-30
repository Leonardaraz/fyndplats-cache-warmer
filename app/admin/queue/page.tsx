// Granskningskö för nyimporterade produkter.
// Default: produkter får visible:false + draftStatus="pending_review" i import-flödet.
// Leonard öppnar denna sida, granskar SEO+pris+bilder, och publicerar.

import Link from "next/link";
import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store/index";
import { publishProducts, rejectProducts } from "./actions";

export const dynamic = "force-dynamic";

function pendingFirst(a: ProductMappingRecord, b: ProductMappingRecord): number {
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

export default async function QueuePage() {
  const store = getStore();
  const all = await store.listMappings();
  const pending = all
    .filter((m) => (m.draftStatus ?? "published") === "pending_review")
    .sort(pendingFirst);
  const recent = all
    .filter((m) => m.draftStatus === "published" || m.draftStatus === "rejected")
    .sort(pendingFirst)
    .slice(0, 10);

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Granskningskö</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Nyimporterade produkter är dolda i butiken tills du publicerar. Granska
        titel, beskrivning, pris och bilder — gå till Wix-redigeraren via
        produktnamnet om något behöver justeras. Klicka sedan{" "}
        <b>Publicera</b> (eller bocka för flera och klicka{" "}
        <b>Publicera valda</b>).
      </p>

      <h2>Väntar på granskning ({pending.length})</h2>
      {pending.length === 0 ? (
        <p style={{ color: "#888" }}>Inga produkter väntar på granskning.</p>
      ) : (
        <form>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "8px 4px" }}>
                  <input type="checkbox" disabled aria-label="markera alla (klient-JS krävs)" />
                </th>
                <th>Titel (SEO)</th>
                <th>Varianter</th>
                <th>Källa</th>
                <th>Importerad</th>
                <th>Wix-produkt</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.wixProductId} style={{ borderBottom: "1px solid #f1f1f1" }}>
                  <td style={{ padding: "8px 4px" }}>
                    <input type="checkbox" name="wixProductId" value={p.wixProductId} />
                  </td>
                  <td>{p.seoTitle ?? <code>{p.wixProductId}</code>}</td>
                  <td>{p.variants.length}</td>
                  <td>
                    {p.sourceUrl ? (
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                        AliExpress
                      </a>
                    ) : (
                      <span style={{ color: "#aaa" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {p.createdAt ? p.createdAt.slice(0, 16).replace("T", " ") : "—"}
                  </td>
                  <td>
                    <code style={{ fontSize: 11 }}>{p.wixProductId}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              formAction={publishProducts}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Publicera valda
            </button>
            <button
              formAction={rejectProducts}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Avvisa valda
            </button>
          </div>
        </form>
      )}

      <h2 style={{ marginTop: 28 }}>Senast granskade (10)</h2>
      {recent.length === 0 ? (
        <p style={{ color: "#888" }}>Inga granskade produkter än.</p>
      ) : (
        <ul style={{ fontSize: 13 }}>
          {recent.map((p) => (
            <li key={p.wixProductId}>
              [{p.draftStatus}] {p.seoTitle ?? p.wixProductId}
              {p.reviewedAt ? (
                <span style={{ color: "#888" }}> — {p.reviewedAt.slice(0, 16).replace("T", " ")}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
