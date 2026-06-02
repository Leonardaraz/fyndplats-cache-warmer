// Fyndplats brand voice + few-shot-exempel för premium-läget.
//
// Den HÄR modulen är den enda källan till "hur låter Fyndplats". Den exporterar
// en stabil system-prompt-prefix (varumärkesspec + guldexempel) som alla
// premium-text-anrop (beskrivning, self-critique, FAQ, SEO-judge, kvalitets-judge)
// delar IDENTISKT. Eftersom strängen är byte-identisk över alla anrop cachas den
// av Anthropic prompt caching (completeJsonRouted sätter cache_control på system-
// blocket) → exemplen betalas i praktiken en gång och återanvänds i resten.
//
// Guldexemplen laddas från brand-voice-examples.json. Kör
// `node scripts/extract-brand-voice-examples.mjs` för att fylla på den med
// Leonards faktiskt polerade Wix-produkter (kräver WIX_API_KEY + WIX_SITE_ID).

import rawExamples from "./brand-voice-examples.json";

export interface BrandVoiceExample {
  productType: string;
  category?: string;
  title: string;
  metaDescription?: string;
  descriptionHtml: string;
  faq?: { q: string; a: string }[];
  altTextSample?: string;
}

interface ExamplesFile {
  version?: number;
  source?: string;
  examples?: BrandVoiceExample[];
}

/**
 * Fyndplats varumärkesröst i klartext. Skriven som instruktion till modellen —
 * vänlig expert med lite värme och torr humor, aldrig stel, fokuserad på själva
 * produkten och den lilla vardagsglädjen, med svensk e-handelstrygghet i ryggen.
 */
export const BRAND_VOICE_SPEC = `Du skriver produkttexter för Fyndplats, en svensk webshop som säljer smarta
prylar, skönhet och heminredning. Du är varumärkets röst.

RÖST & TON:
- Vänlig och personlig, som en kunnig vän som tipsar – aldrig en stel produktkatalog.
- Expert men ödmjuk: du kan produkten, men du skryter inte och överdriver aldrig.
- En nypa torr, varm humor är välkommen där den passar – men säljet får aldrig bli larvigt.
- Måla upp ÖGONBLICKET produkten används i (den lugna kvällsrutinen, det nattliga
  köksbesöket, morgonstressen som släpper) så att kunden känner igen sig.
- Svensk vardagskänsla och trygghet: rak, ärlig, konkret. Inga amerikanska superlativ.

ABSOLUTA REGLER (bryt dem aldrig):
- Skriv ALDRIG om butiken, sajten eller varumärket "Fyndplats". Ingen "Välkommen till …",
  inga "bästa deals", ingen startsidescopy. Texten handlar om PRODUKTEN.
- Hitta ALDRIG på mått, material, batteritid eller funktioner som inte framgår av rådatan.
  Hellre utelämna än att gissa. Säljet ska vara ärligt.
- Inga tomma fraser ("högsta kvalitet", "perfekt för alla", "marknadens bästa") utan täckning.
  Varje påstående ska gå att koppla till något konkret i produktdatan.
- Skriv flytande, idiomatisk svenska. Inga maskinöversatta ordföljder, inga kinesiska/engelska rester.
- Undvik klyschor och AI-platthet: variera meningslängd, våga en konkret detalj, en mänsklig vinkel.

MÅL: en text som känns skriven av en människa som faktiskt bryr sig om kunden och
produkten – så bra att den inte behöver poleras för hand efteråt.`;

/** Laddar guldexemplen (validerade) från JSON. Tom lista om filen saknar exempel. */
export function loadBrandVoiceExamples(): BrandVoiceExample[] {
  const file = rawExamples as ExamplesFile;
  const list = Array.isArray(file?.examples) ? file.examples : [];
  return list.filter(
    (e): e is BrandVoiceExample =>
      !!e && typeof e.title === "string" && typeof e.descriptionHtml === "string",
  );
}

/** True om guldexemplen fortfarande är de handskrivna seed-exemplen (ej Wix-extraherade). */
export function usingSeedExamples(): boolean {
  return (rawExamples as ExamplesFile)?.source === "seed-handwritten";
}

/** Renderar guldexemplen som few-shot-text. `max` kapar antalet (default alla). */
export function formatExamplesForPrompt(examples: BrandVoiceExample[], max = 10): string {
  const chosen = examples.slice(0, max);
  if (chosen.length === 0) return "";
  const blocks = chosen.map((e, i) => {
    const faq = (e.faq ?? [])
      .map((f) => `    • ${f.q}\n      ${f.a}`)
      .join("\n");
    return [
      `EXEMPEL ${i + 1} — ${e.productType}${e.category ? ` (${e.category})` : ""}`,
      `Titel: ${e.title}`,
      e.metaDescription ? `Meta: ${e.metaDescription}` : null,
      `Beskrivning:\n${e.descriptionHtml}`,
      faq ? `FAQ:\n${faq}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });
  return blocks.join("\n\n———\n\n");
}

let _cachedPrefix: string | null = null;

/**
 * Den stabila system-prompt-prefixen för ALLA premium-text-anrop: varumärkesspec
 * + guldexempel. Memoiseras så strängen blir byte-identisk mellan anrop (krav för
 * att Anthropic prompt caching ska träffa). Lägg ALDRIG till produkt-specifik data
 * här – den hör hemma i user-meddelandet, annars bryts cachen.
 */
export function brandVoiceSystemPrefix(): string {
  if (_cachedPrefix) return _cachedPrefix;
  const examples = loadBrandVoiceExamples();
  const examplesText = formatExamplesForPrompt(examples);
  _cachedPrefix = examplesText
    ? `${BRAND_VOICE_SPEC}\n\nGULDEXEMPEL — så här låter en färdigpolerad Fyndplats-text. ` +
      `Studera tonen, rytmen och hur konkreta detaljer vävs in. Härma KÄNSLAN, kopiera inte orden:\n\n${examplesText}`
    : BRAND_VOICE_SPEC;
  return _cachedPrefix;
}

/** Testhjälp: nollställ memoiseringen (när env/exempel ändras i ett test). */
export function __resetBrandVoiceCache(): void {
  _cachedPrefix = null;
}
