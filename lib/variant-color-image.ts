// Färg-val → produktbild via galleri-bildens alt-text (positions-OBEROENDE).
//
// VARFÖR detta finns
// ------------------
// Importen skapar IDENTISK Wix-variantdata för alla färg-produkter
// (optionRenderType = TEXT_CHOICES, choiceType = CHOICE_TEXT, INGEN colorCode,
// TOMT linkedMedia). Bubbla-vs-bild i variant-pickern avgörs alltså HELT av
// storefronten: en produkt vars val har en `image` renderas som bild-swatch
// (önskat, som sportflaskan), en utan faller tillbaka på en enfärgad cirkel
// (som hundvagnen). Skillnaden var att flaskan låg i data/variant-images.json
// men hundvagnen inte — trots att hundvagnens galleri HAR en bild per färg.
//
// De per-färg-bilderna känns igen på sin alt-text (importen lägger färgnamnet
// där, t.ex. "… i grått" = Grå) och ligger ofta SIST i galleriet. Positionsbero-
// ende mappning (bild[i] = val[i]) duger därför inte — vi matchar på innehåll.
//
// Strategin: för varje BILDLÖST val, hitta en galleribild vars alt-text nämner
// samma färg som valets namn, och sätt den som valets bild. Då flippar pickern
// till bild-läge (productview kräver att ALLA val har bild). Matchar inget val
// → ingen ändring (dagens bubbla/text-beteende behålls). Detta täcker hela
// katalogen + alla framtida importer automatiskt, utan Wix-ändringar.

// Kanoniska färgnycklar. Ett enskilt ord (gemener) → en nyckel som är gemensam
// för svenska grund-/böjningsformer (grå/grått/gråa) OCH engelska namn
// (gray/grey/blue …). Matchningen körs på RÅvärdet före svensk översättning, och
// importörens alt-text kan vara svensk även när choice-värdet är engelskt, så
// båda språken måste falla på samma nyckel. Oregelbundna böjningar (röd→rött,
// grön→grönt) listas explicit — de kan inte härledas via ren prefix-/suffixregel.
const COLOR_WORD_TO_KEY: Record<string, string> = {
  // grå
  "grå": "grå", "grått": "grå", "gråa": "grå", "gray": "grå", "grey": "grå",
  "ljusgrå": "grå", "ljusgrått": "grå", "mörkgrå": "grå", "mörkgrått": "grå",
  // blå
  "blå": "blå", "blått": "blå", "blåa": "blå", "blue": "blå",
  "ljusblå": "blå", "ljusblått": "blå", "mörkblå": "blå", "mörkblått": "blå",
  // röd
  "röd": "röd", "rött": "röd", "röda": "röd", "red": "röd",
  // grön
  "grön": "grön", "grönt": "grön", "gröna": "grön", "green": "grön",
  "mörkgrön": "grön", "mörkgrönt": "grön", "ljusgrön": "grön", "ljusgrönt": "grön",
  // gul
  "gul": "gul", "gult": "gul", "gula": "gul", "yellow": "gul",
  // vit
  "vit": "vit", "vitt": "vit", "vita": "vit", "white": "vit",
  // svart
  "svart": "svart", "svarta": "svart", "black": "svart",
  // beige / khaki / natur
  "beige": "beige",
  "khaki": "khaki", "kaki": "khaki",
  "natur": "natur", "naturlig": "natur", "naturligt": "natur",
  // rosa
  "rosa": "rosa", "pink": "rosa", "ljusrosa": "rosa",
  // lila / violett
  "lila": "lila", "purple": "lila", "violett": "lila", "violet": "lila",
  // brun
  "brun": "brun", "brunt": "brun", "bruna": "brun", "brown": "brun",
  // orange
  "orange": "orange",
  // guld
  "guld": "guld", "gold": "guld", "golden": "guld", "gyllene": "guld",
  // silver
  "silver": "silver", "silvrig": "silver",
  // turkos
  "turkos": "turkos", "turkost": "turkos", "turquoise": "turkos", "teal": "turkos",
  // marin / navy
  "marin": "marin", "marinblå": "marin", "marinblått": "marin", "navy": "marin",
  // vinröd / bordeaux
  "vinröd": "vinröd", "vinrött": "vinröd", "bordeaux": "vinröd", "burgundy": "vinröd",
  // champagne
  "champagne": "champagne",
  // kräm / gräddvit / elfenben (AE: "Cream"). Egen nyckel — visuellt skild från
  // beige/vit. "gräddvit"/"gräddvitt" exakt-mappas hit så de INTE suffix-faller till "vit".
  "kräm": "kräm", "kräme": "kräm", "krämvit": "kräm", "cream": "kräm", "creme": "kräm",
  "gräddvit": "kräm", "gräddvitt": "kräm", "elfenben": "kräm", "ivory": "kräm",
};

// Den kortaste nyckeln vi tillåter suffix-fallbacken att matcha på. Färgord är
// distinkta, men 1–2-teckens-suffix skulle ge falska träffar.
const MIN_SUFFIX_LEN = 3;

/**
 * Plockar ut alla kanoniska färgnycklar ur en text (choice-värde eller alt-text).
 * Tokeniserar på bokstäver, slår först på exakt ord, sedan på längsta färgord
 * som token SLUTAR på (fångar sammansättningar som "ljusgrått" → grå utan att
 * lista varje variant). Tom mängd = ingen färg hittad.
 */
export function colorKeysOf(text: string): Set<string> {
  const keys = new Set<string>();
  const tokens = (text || "").toLowerCase().match(/[a-zåäöé]+/g) || [];
  for (const tok of tokens) {
    const exact = COLOR_WORD_TO_KEY[tok];
    if (exact) { keys.add(exact); continue; }
    let best = "";
    for (const w in COLOR_WORD_TO_KEY) {
      if (w.length >= MIN_SUFFIX_LEN && w.length > best.length && tok.endsWith(w)) best = w;
    }
    if (best) keys.add(COLOR_WORD_TO_KEY[best]);
  }
  return keys;
}

type ChoiceLike = { name?: string | null; visible?: boolean | null };
type OptionLike = { choicesSettings?: { choices?: ChoiceLike[] | null } | null };

/**
 * Kanoniska färgnycklar ur en produkts V3-options — underlaget för färgfiltret
 * på listsidorna (hämtningen ligger i lib/product-colors.ts).
 *
 * Vi läser VÄRDET, inte optionsnamnet. Katalogen har färger under "Färg" (99
 * produkter), "Variant" (49), "Metallfärg", "Color" och "Artikel", och värdena
 * är ofta inte rena färgord: "1-pack Borstad silver", "6mm Stil D". colorKeysOf
 * ovan avgör därför saken, med samma böjnings-medvetna ordlista som
 * variantväljaren använder — en egen lista här hade garanterat glidit isär.
 *
 * Ordningen är butikens (första förekomsten vinner), inte bokstavsordning, så
 * färgprickarna hamnar som valen är upplagda.
 */
export function colorKeysFromOptions(options: OptionLike[] | null | undefined): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const opt of options || []) {
    for (const choice of opt?.choicesSettings?.choices || []) {
      if (choice?.visible === false) continue;
      const namn = typeof choice?.name === "string" ? choice.name : "";
      if (!namn) continue;
      for (const key of colorKeysOf(namn)) {
        if (seen.has(key)) continue;
        seen.add(key);
        keys.push(key);
      }
    }
  }
  return keys;
}

/** Färgnyckel → visningsnamn. Nycklarna ÄR svenska basord ("svart", "vinröd"). */
export function colorLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

// Kanonisk bas-färg → CSS-hex för färgpricken i variantväljaren (när per-val-bild
// saknas). Återanvänder colorKeysOf ovan → samma böjnings-medvetna detektering
// (exakt + suffix ≥3) utan falska delsträngsträffar.
const BASE_HEX: Record<string, string> = {
  grå: "#9ca3af", blå: "#2563eb", röd: "#dc2626", grön: "#16804a", gul: "#fbbc05",
  vit: "#FFFFFF", svart: "#1c1c1c", beige: "#e8d4b3", khaki: "#c3b091", natur: "#e0d3c1",
  rosa: "#fbcfe8", lila: "#a855f7", brun: "#92400e", orange: "#f47a35", guld: "#d4af37",
  silver: "#c0c0c0", turkos: "#06b6d4", marin: "#1e3a8a", vinröd: "#7f1d1d", champagne: "#f7e7ce",
  kräm: "#f0e4cb",
};

// Visningsordning för färgskenan i filterpanelen: neutraler först, sedan varmt
// till kallt. Sorterar man i stället på antal eller bokstav blir skenan ett
// hopp mellan orelaterade kulörer — och hela poängen med att dra längs den är
// att ögat ska kunna sikta. Färger som saknas i listan hoppas över, så en
// kategori med tre färger får en kortare skena i samma ordning.
const RAIL_ORDER = [
  "svart", "grå", "silver", "vit", "kräm", "champagne", "beige", "natur", "khaki",
  "brun", "guld", "gul", "orange", "röd", "vinröd", "rosa", "lila", "marin", "blå",
  "turkos", "grön",
];

/** Färgnycklar i skenans ordning. Okända nycklar hamnar sist, i sin egen ordning. */
export function sortColorKeys(keys: readonly string[]): string[] {
  const rank = (k: string) => {
    const i = RAIL_ORDER.indexOf(k);
    return i === -1 ? RAIL_ORDER.length : i;
  };
  return [...keys].sort((a, z) => rank(a) - rank(z) || a.localeCompare(z, "sv"));
}

/** CSS-hex för ett färgnamn (böjnings-medvetet via colorKeysOf), annars "". */
export function colorOf(name: string): string {
  for (const base of colorKeysOf(name)) {
    const hex = BASE_HEX[base];
    if (hex) return hex;
  }
  return "";
}

// Wixstatic-bildens fil-id (samma fil kan levereras med olika transform-params),
// så vi jämför på id:t — inte hela URL:en. Annars kunde samma bild tilldelas två
// val bara för att transformerna skiljer sig.
function mediaKeyOf(url: string): string {
  return (url || "").match(/\/media\/([^/?#]+)/)?.[1] || url || "";
}

export type AltTextMediaItem = { url?: string | null; altText?: string | null };

/**
 * Fyller `image` på varje BILDLÖST färg-val genom att matcha valets namn mot en
 * galleribilds alt-text (positions-oberoende). Muterar `choices` på plats.
 *
 * - Hoppar över val som redan har en bild (explicit linkedMedia / variant-
 *   images.json vinner — denna funktion är lägsta prioritet).
 * - Varje galleribild används för HÖGST ett val (ingen färg får en annan färgs
 *   bild i andra hand). Räcker inte bilderna till alla val lämnas resten
 *   bildlösa → productview faller tillbaka på bubbla/text (ingen regression).
 */
export function linkVariantImagesByAltText(
  choices: { label: string; image: string }[],
  mediaItems: ReadonlyArray<AltTextMediaItem> | null | undefined,
): void {
  if (!choices?.length || !mediaItems?.length) return;
  const imgs = mediaItems
    .map((m) => ({ url: m?.url || "", key: mediaKeyOf(m?.url || ""), keys: colorKeysOf(m?.altText || "") }))
    .filter((m) => m.url && m.keys.size > 0);
  if (imgs.length === 0) return;

  // Lås bilder som redan är knutna till ett val så de inte återanvänds.
  const usedKeys = new Set<string>();
  for (const ch of choices) if (ch.image) usedKeys.add(mediaKeyOf(ch.image));

  for (const ch of choices) {
    if (ch.image) continue;
    const want = colorKeysOf(ch.label);
    if (want.size === 0) continue;
    const hit = imgs.find((im) => !usedKeys.has(im.key) && intersects(im.keys, want));
    if (!hit) continue; // ingen ledig matchande bild → behåll dagens beteende
    ch.image = hit.url;
    usedKeys.add(hit.key);
  }
}
