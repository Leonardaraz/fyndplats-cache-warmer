"use client";

import { useState } from "react";

/**
 * Kopierar en OMGÅNG av översättningskön till urklipp — samma mönster som
 * SEO-poleringens "✨ Be Claude i chatten att polera" (app/admin/queue/
 * polish-button.tsx).
 *
 * Prompten byggs server-side (lib/reviews/translate.ts → buildTranslatePrompt)
 * och skickas hit färdig, så det bara finns EN sanningskälla för formatet:
 * ändras reglerna i prompten gäller de direkt, utan att den här filen rörs.
 */
export function TranslateButton({ prompt, antal }: { prompt: string; antal: number }) {
  const [kopierad, setKopierad] = useState(false);
  const [misslyckades, setMisslyckades] = useState(false);

  async function onClick() {
    setMisslyckades(false);
    try {
      await navigator.clipboard.writeText(prompt);
      setKopierad(true);
      setTimeout(() => setKopierad(false), 5000);
    } catch {
      // Clipboard-API:t kan vara blockerat (t.ex. utan HTTPS).
      setMisslyckades(true);
    }
  }

  if (antal === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          padding: "7px 14px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        ✨ Kopiera {antal} till chatten
      </button>
      {kopierad ? (
        <span style={{ marginLeft: 10, fontSize: 12, color: "#065f46" }}>
          Kopierat! Klistra in i chatten och säg <b>&quot;översätt dessa&quot;</b> — klistra sedan
          tillbaka JSON-svaret i rutan nedan.
        </span>
      ) : null}
      {misslyckades ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 12, color: "#991b1b", cursor: "pointer" }}>
            Kunde inte kopiera automatiskt — visa texten att kopiera för hand
          </summary>
          <textarea
            readOnly
            value={prompt}
            rows={12}
            style={{ width: "100%", fontSize: 11, marginTop: 6, fontFamily: "monospace" }}
          />
        </details>
      ) : null}
    </div>
  );
}
