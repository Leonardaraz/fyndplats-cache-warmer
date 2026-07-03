"use client";

import { useState } from "react";

/**
 * Knapp för RÅ-importerade produkter (AI_ENRICHMENT_ENABLED=false). Kopierar
 * produkt-info + Wix-ID till urklipp och visar instruktionen att klistra in i
 * Cowork-chatten och säga "polera denna". Poleringen körs gratis i chatten
 * (ingen import-pipeline-AI), så Leonard behåller full kontroll på kostnaden.
 */
export function PolishButton({
  wixProductId,
  title,
  sourceUrl,
}: {
  wixProductId: string;
  title?: string;
  sourceUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const payload = [
    "SEO-polera denna RÅ-importerade produkt.",
    "FÖRST: läs och följ instruktionerna i docs/seo-polish-runbook.md (exakt, i ordning) —",
    "inkl. Steg 1b: ANALYSERA alla bilder visuellt INNAN du skriver sökord/beskrivning/",
    "alt-texter, Steg 3b: TVÄTTA bort dropship-loggor och inbränd text (spanska/engelska/",
    "kinesiska) där det går, samt att PUBLICERA produkten (visible:true) när poleringen",
    "är klar och verifierad.",
    "",
    `Wix-produkt-ID: ${wixProductId}`,
    title ? `Titel (rå): ${title}` : null,
    sourceUrl ? `AliExpress-källa: ${sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  async function onClick() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard-API kan vara blockerat (t.ex. ej HTTPS) → visa fallback-text.
      setFailed(true);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        ✨ Be Claude i chatten att polera
      </button>
      {copied ? (
        <span style={{ marginLeft: 10, fontSize: 12, color: "#065f46" }}>
          Kopierat! Klistra in i Cowork-chatten och säg <b>&quot;polera denna&quot;</b>.
        </span>
      ) : null}
      {failed ? (
        <span style={{ marginLeft: 10, fontSize: 12, color: "#991b1b" }}>
          Kunde inte kopiera automatiskt — kopiera Wix-ID <code>{wixProductId}</code> manuellt och
          säg &quot;polera denna&quot; i chatten.
        </span>
      ) : null}
    </div>
  );
}
