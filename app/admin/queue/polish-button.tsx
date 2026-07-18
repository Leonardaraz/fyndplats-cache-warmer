"use client";

import { useState } from "react";

/**
 * Bygger polerings-prompten som kopieras till urklipp. Ren funktion → testbar +
 * EN sanningskälla.
 *
 * DRIFT-SKYDD (varför den ser ut så här): prompten pekar på
 * `docs/seo-polish-runbook.md` som ENDA auktoritet och räknar MEDVETET INTE upp
 * runbookens steg med nummer. Tidigare listade den bara "Steg 1b/3b/3c + publicera"
 * och hamnade ur synk när runbooken växte — chatten missade då sökordsvalidering
 * (Steg 0), SKU-resync (2b), kategori (4) och varianter (6). Nu påminner den bara
 * om de lätt-missade MOMENTEN (koncept, inte stegnummer), så den håller sig i synk
 * även när runbooken numreras om.
 */
export function buildPolishPrompt(wixProductId: string, title?: string, sourceUrl?: string): string {
  return [
    "SEO-polera denna RÅ-importerade produkt.",
    "FÖRST: läs HELA docs/seo-polish-runbook.md och följ ALLA steg i ordning, EXAKT —",
    "hoppa inte över något. Runbooken (inte den här texten) är sanningskällan; listan",
    "nedan är bara en påminnelse om de lätt-missade momenten:",
    "• validera fokussökordet mot verklig sökdata INNAN du skriver något",
    "• analysera ALLA bilder visuellt INNAN sökord/beskrivning/alt-texter",
    "• tvätta bort dropship-loggor och inbränd text (spanska/engelska/kinesiska) där det går",
    "• gör HJÄLTEBILDEN till en ren produktbild på vit studio-bakgrund (mjuk skugga) vid ful/mörk/rörig bakgrund — behåll nyttiga kontextbilder, släng infografik",
    "• re-synka SKU till den nya sluggen",
    "• koppla rätt kategori",
    "• kontrollera varianterna (lager/dubbletter/koppling)",
    "Granska resultatet med Read och PUBLICERA produkten (visible:true) först när allt är klart och verifierat.",
    "",
    `Wix-produkt-ID: ${wixProductId}`,
    title ? `Titel (rå): ${title}` : null,
    sourceUrl ? `AliExpress-källa: ${sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

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

  const payload = buildPolishPrompt(wixProductId, title, sourceUrl);

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
