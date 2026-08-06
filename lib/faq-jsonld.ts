/**
 * FAQPage-JSON-LD ur produktbeskrivningens "Vanliga frågor"-sektion.
 *
 * Sektionen skrivs av `lib/import/tabs.ts` som `<p><strong>F</strong><br/>S</p>`,
 * men Wix Ricos normaliserar HTML:en vid sparning, så det som faktiskt ligger i
 * katalogen är `<p><span style="font-weight: 700">F</span></p><p>S</p>`. Båda
 * formerna förekommer därför i produktionsdata och parsern hanterar bägge.
 *
 * Parsern bor här — bredvid generatorn — så att formen bara är definierad på ett
 * ställe. Storefronten (headless Next.js) importerar `faqPageJsonLd` och skriver
 * ut resultatet i en `<script type="application/ld+json">` på produktsidan.
 */

export interface FaqPar {
  q: string;
  a: string;
}

const RUBRIK = /<h2[^>]*>\s*Vanliga\s+fr[åa]gor\s*<\/h2>/i;

/** Klipper ut FAQ-sektionen: från dess H2 fram till nästa H2 (eller slutet). */
export function extractFaqSection(descriptionHtml: string): string {
  const m = RUBRIK.exec(descriptionHtml || "");
  if (!m) return "";
  const efter = descriptionHtml.slice(m.index + m[0].length);
  const nasta = efter.search(/<h2[^>]*>/i);
  return nasta < 0 ? efter : efter.slice(0, nasta);
}

function avkoda(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Är stycket en fråga? Fetstil markerar frågan i båda HTML-formerna. */
function fetText(styckeInnehall: string): string | null {
  const fet = /<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/i.exec(styckeInnehall)
    || /<span[^>]*font-weight:\s*(?:700|bold)[^>]*>([\s\S]*?)<\/span>/i.exec(styckeInnehall);
  return fet ? avkoda(fet[1]) : null;
}

/**
 * Plockar ut fråga/svar-paren. Två former stöds:
 *   A) `<p><strong>F</strong><br/>S</p>`  — ett stycke per par (generatorns form)
 *   B) `<p><b>F</b></p><p>S</p>`          — två stycken per par (Ricos form)
 * Ett par tas bara med när BÅDE fråga och svar har innehåll.
 */
export function parseFaq(descriptionHtml: string): FaqPar[] {
  const sektion = extractFaqSection(descriptionHtml);
  if (!sektion) return [];

  const stycken = [...sektion.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  const par: FaqPar[] = [];
  let oppenFraga: string | null = null;

  for (const inre of stycken) {
    const fraga = fetText(inre);
    if (fraga) {
      // Form A: resten av samma stycke är svaret.
      const rest = avkoda(
        inre.replace(/<(?:strong|b)\b[^>]*>[\s\S]*?<\/(?:strong|b)>/i, "")
            .replace(/<span[^>]*font-weight:\s*(?:700|bold)[^>]*>[\s\S]*?<\/span>/i, "")
      );
      if (rest) {
        par.push({ q: fraga, a: rest });
        oppenFraga = null;
      } else {
        // Form B: svaret kommer i nästa stycke. En fråga utan svar kastas.
        oppenFraga = fraga;
      }
      continue;
    }
    const text = avkoda(inre);
    if (oppenFraga && text) {
      par.push({ q: oppenFraga, a: text });
      oppenFraga = null;
    }
  }
  return par;
}

/**
 * Bygger FAQPage-JSON-LD. Returnerar `null` när produkten saknar användbara par
 * — Google flaggar en tom eller ofullständig FAQPage som strukturfel, så det är
 * bättre att inte skriva ut något alls.
 */
export function faqPageJsonLd(descriptionHtml: string): object | null {
  const par = parseFaq(descriptionHtml);
  if (!par.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: par.map((p) => ({
      "@type": "Question",
      name: p.q,
      acceptedAnswer: { "@type": "Answer", text: p.a },
    })),
  };
}

/**
 * Serialiserar schemat för inbäddning i `<script type="application/ld+json">`.
 *
 * ANVÄND DENNA, inte `JSON.stringify` rakt av: ett svar som innehåller texten
 * `</script>` skulle annars stänga script-taggen i förtid och spilla ut resten
 * som synlig sidtext (och i värsta fall exekverbar markup). `<` escapas därför
 * som `<`, vilket JSON-parsern läser identiskt men HTML-parsern inte
 * känner igen som en tagg. Returnerar tom sträng när schema saknas — skriv då
 * ingen script-tagg alls.
 */
export function faqPageJsonLdScript(descriptionHtml: string): string {
  const ld = faqPageJsonLd(descriptionHtml);
  return ld ? JSON.stringify(ld).replace(/</g, "\\u003c") : "";
}
