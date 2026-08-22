// lib/reviews/translate.ts
//
// Recensionsöversättning VIA CHATTEN — samma mönster som SEO-poleringen.
//
// Recensionerna hamnar i en kö (status `pending`, ingen svensk text). Knappen i
// /admin/reviews kopierar en omgång till urklipp, Leonard klistrar in i chatten
// och säger "översätt dessa", och klistrar tillbaka svaret i EN ruta. Ingen
// översättningstjänst, inga credits — samma beslut som när DeepL togs bort
// 2026-08-19 ("vi polerar alla via chatten").
//
// Två saker gör att det inte blir tjugo klipp-och-klistra per omgång:
//   1. Prompten bär HELA omgången, grupperad per produkt (modellen måste veta
//      vad varan är — en italienare skrev "ballongerna" om en bollkastare
//      2026-08-17, och det går bara att översätta rätt med produkten framför sig).
//   2. Svaret kommer tillbaka som ETT JSON-block som klistras in en gång.
//
// GRANSKNINGEN ÄR INTE VALFRI. Det som gjorde DeepL fel var inte att en maskin
// översatte — det var att en tyst fallback lade ut ORIGINALTEXTEN som "svensk".
// Därför passerar varje inklistrad rad validateTranslation innan den får bli
// synlig; det som underkänns ligger kvar i kön.

import type { StoredReview } from "../store/reviews";

/** Rader per omgång. Lagom att klistra in i chatten utan att svaret blir ohanterligt. */
export const TRANSLATE_BATCH = 25;

/**
 * Ord som ALDRIG får nå kundtext. Att marknadsplatsen syns i ett omdöme röjer
 * varifrån varan kommer — samma regel som gäller produktbeskrivningarna.
 */
const FÖRBJUDNA = /\b(aliexpress|ali\s?express|alibaba|taobao|wish\.com|1688)\b/i;

/** Kvar-på-engelska-markörer som avslöjar en halvgjord översättning. */
const ENGELSKA_MARKÖRER =
  /\b(the|and|very|good|quality|shipping|delivery|product|received|recommend|thanks|fast)\b/i;

/**
 * Kinesiska, japanska (kanji/kana) och koreanska (hangul) — skrifter där ett
 * tecken ofta bär ett helt ord. Tröskeln är låg (15 %) för att fånga blandad
 * text; en svensk eller engelsk recension innehåller noll sådana tecken, så
 * det finns ingen risk att träffa fel.
 */
function ärTätSkrift(text: string): boolean {
  const träffar = text.match(/[぀-ヿ㐀-䶿一-鿿가-힯]/gu);
  return (träffar?.length ?? 0) / Math.max(1, text.length) > 0.15;
}

export interface TranslationVerdict {
  ok: boolean;
  reason?:
    | "tom"
    | "oöversatt"
    | "marknadsplats-nämnd"
    | "för-kort"
    | "för-lång"
    | "engelska-kvar";
}

/**
 * Granskar en översättning INNAN den får bli synlig.
 *
 * Grindarna lutar åt det säkra hållet: hellre lämna en rad i kön än publicera
 * något halvfärdigt. Avslagen räknas och visas, så en grind som slår för hårt
 * syns direkt i stället för att tyst äta rader.
 */
export function validateTranslation(källa: string, kandidat: string): TranslationVerdict {
  const s = String(källa ?? "").trim();
  const k = String(kandidat ?? "").trim();
  if (!k) return { ok: false, reason: "tom" };
  if (k === s) return { ok: false, reason: "oöversatt" };
  if (FÖRBJUDNA.test(k)) return { ok: false, reason: "marknadsplats-nämnd" };

  // Längdrimlighet — men mätt mot RÄTT skrift.
  //
  // Japanska, koreanska och kinesiska packar ett helt ord i ett tecken. En
  // trogen svensk översättning av en japansk recension blir därför två till
  // tre gånger så många tecken utan att ett ord är påhittat. Med det latinska
  // taket (2,5×) underkändes en helt korrekt översättning som "för lång"
  // 2026-08-20: 92 tecken japanska blev 275 tecken svenska.
  //
  // Åt andra hållet gäller det omvända: blir svenskan KORTARE än en tät
  // CJK-källa har innehåll nästan säkert fallit bort, så golvet höjs till 1×.
  const tät = ärTätSkrift(s);
  const kvot = k.length / Math.max(1, s.length);
  if (kvot < (tät ? 1 : 0.4)) return { ok: false, reason: "för-kort" };
  if (kvot > (tät ? 6 : 2.5)) return { ok: false, reason: "för-lång" };

  // Svenska och engelska delar många ord, men de här är vanliga nog att TVÅ
  // träffar betyder att texten inte blivit svensk. En enstaka kan vara ett
  // produktnamn ("Fast Charge").
  const träffar = (k.match(new RegExp(ENGELSKA_MARKÖRER, "gi")) ?? []).length;
  if (träffar >= 2) return { ok: false, reason: "engelska-kvar" };

  return { ok: true };
}

/** Kön grupperad per produkt — så prompten kan bära produktnamnet. */
export function groupForTranslation(
  rows: ReadonlyArray<StoredReview>,
  namnFör: (productId: string) => string | undefined,
  limit = TRANSLATE_BATCH,
): { productId: string; namn?: string; rader: StoredReview[] }[] {
  const per = new Map<string, StoredReview[]>();
  for (const r of rows.slice(0, limit)) {
    const lista = per.get(r.productId) ?? [];
    lista.push(r);
    per.set(r.productId, lista);
  }
  return [...per.entries()].map(([productId, rader]) => ({
    productId,
    namn: namnFör(productId),
    rader,
  }));
}

/**
 * Texten som kopieras till urklipp och klistras in i chatten.
 *
 * Formatet är gjort för att svaret ska kunna klistras tillbaka i ETT stycke:
 * varje recension bär sitt `reviewIdAE`, och instruktionen ber uttryckligen om
 * ett enda JSON-block nycklat på de id:na.
 */
export function buildTranslatePrompt(
  grupper: ReadonlyArray<{ productId: string; namn?: string; rader: ReadonlyArray<StoredReview> }>,
): string {
  const antal = grupper.reduce((n, g) => n + g.rader.length, 0);
  const huvud = [
    `Översätt dessa ${antal} kundrecensioner till naturlig svenska.`,
    "",
    "Regler:",
    "- Översätt INNEHÅLLET troget. Hitta aldrig på detaljer, betyg eller egenskaper.",
    "- Skriv som en svensk kund skriver: vardagligt, inte marknadsföring.",
    "- Behåll längd och ton. En kort recension ska förbli kort.",
    "- Nämn ALDRIG var varan är köpt eller vilken marknadsplats den kommer från.",
    "- Nämns leverans till ett ANNAT land än Sverige: stryk den delen, behåll resten.",
    "  Skriv aldrig om landet till Sverige.",
    "- Är texten redan god svenska: låt den vara i stort sett oförändrad.",
    "",
    "Svara med ETT JSON-block och ingenting annat:",
    '{"<reviewIdAE>": "<svensk text>", ...}',
    "",
  ];

  const kroppar = grupper.map((g) => {
    const rader = g.rader.map(
      (r) =>
        `[${r.reviewIdAE}] ${r.rating}/5${r.customerCountry ? ` · ${r.customerCountry}` : ""}\n${r.textOriginal}`,
    );
    return [`### Produkt: ${g.namn ?? g.productId}`, "", ...rader].join("\n\n");
  });

  return [...huvud, ...kroppar].join("\n");
}

/**
 * Läser tillbaka chattens svar.
 *
 * Tål att svaret kommer i en ```json-fence eller med text runt omkring — det
 * gör det ofta — genom att plocka det yttersta {...}-blocket. Trasig JSON ger
 * `null` i stället för ett kast, så admin-sidan kan säga vad som gick fel.
 */
export function parseTranslations(text: string): Record<string, string> | null {
  const rå = String(text ?? "").trim();
  if (!rå) return null;
  const start = rå.indexOf("{");
  const slut = rå.lastIndexOf("}");
  if (start < 0 || slut <= start) return null;
  let tolkad: unknown;
  try {
    tolkad = JSON.parse(rå.slice(start, slut + 1));
  } catch {
    return null;
  }
  if (!tolkad || typeof tolkad !== "object" || Array.isArray(tolkad)) return null;
  const ut: Record<string, string> = {};
  for (const [k, v] of Object.entries(tolkad as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) ut[k.trim()] = v.trim();
  }
  return Object.keys(ut).length > 0 ? ut : null;
}

export interface ApplyResult {
  saved: number;
  /** Id:n i svaret som inte finns i kön (t.ex. redan översatta). */
  unknown: string[];
  /** Rader som underkändes av granskningen — de ligger kvar i kön. */
  rejected: { reviewIdAE: string; reason: string }[];
  errors: number;
}

/**
 * Skriver in de inklistrade översättningarna.
 *
 * `save` sätter status `edited` (lib/store/reviews.ts → editText), vilket är
 * det som gör raden synlig. Underkända rader rörs inte alls.
 */
export async function applyTranslations(
  pending: ReadonlyArray<StoredReview>,
  översättningar: Record<string, string>,
  save: (productId: string, reviewIdAE: string, svenska: string) => Promise<void>,
): Promise<ApplyResult> {
  const resultat: ApplyResult = { saved: 0, unknown: [], rejected: [], errors: 0 };
  const iKön = new Map(pending.map((r) => [r.reviewIdAE, r]));

  for (const [id, svenska] of Object.entries(översättningar)) {
    const rad = iKön.get(id);
    if (!rad) {
      resultat.unknown.push(id);
      continue;
    }
    const dom = validateTranslation(rad.textOriginal, svenska);
    if (!dom.ok) {
      resultat.rejected.push({ reviewIdAE: id, reason: dom.reason ?? "okänd" });
      continue;
    }
    try {
      await save(rad.productId, id, svenska);
      resultat.saved++;
    } catch {
      resultat.errors++;
    }
  }
  return resultat;
}
