// Strukturerad data per variant (2026-10-30).
//
// Produktsidan beskrev en produkt med varianter som EN Product med förvalets
// erbjudande. Google kände alltså bara ett pris och ett lager per sida, och en
// variant som var slut eller kostade mer syntes inte. Googles dokumentation för
// varianter vill ha en ProductGroup med en Product per variant (hasVariant),
// var och en med eget pris, lager och en adress som förväljer varianten.
// Sidan förväljer varianten ur ?variant= (components/productview.tsx), samma
// adress som Google-flödet länkar till.
//
// Modulen räknar fram varianterna ur sidans egna data, samma som väljaren
// visar. Sidan bygger erbjudandena.
//
// Tre egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara när produkten har minst två varianter med var sitt variant-id.
//    En produkt utan val, eller där valen saknar id, beskrivs som förut.
// 2. ☠️ variesBy tar bara de egenskaper Google stöder (färg, storlek, material,
//    mönster). Andra axlar (Förpackning, Effekt, Längd) står i variantens namn.
// 3. Ett val utan eget pris får produktens pris, och ett val utan bild
//    produktens huvudbild.
// 4. ☠️ Varje variant bär en egen beskrivning (2026-11-20). Search Console
//    (Säljaruppgifter) räknar varje variant som ett eget objekt, och
//    beskrivningen stod bara på gruppen: "Fältet description saknas" på
//    1 434 objekt, alla varianter (60 sidor på www, 32 varianter av 32).
//    Beskrivningen är produktens, följd av variantens val.

type Val = { label: string; image: string; variantId: string; priceNum: number; inStock?: boolean };
type Rad = { choices: Record<string, string>; variantId: string; priceNum: number; inStock: boolean; image: string };

export type JsonLdVariant = {
  variantId: string;
  /** Axel och etikett, i axlarnas ordning. */
  val: { axel: string; etikett: string }[];
  priceNum: number;
  inStock: boolean;
  image: string;
};

export type Schemaegenskap = "color" | "size" | "material" | "pattern";

const EGENSKAPER: { re: RegExp; egenskap: Schemaegenskap }[] = [
  { re: /^\s*f[äa]rg\s*$/i, egenskap: "color" },
  { re: /^\s*storlek\s*$/i, egenskap: "size" },
  { re: /^\s*material\s*$/i, egenskap: "material" },
  { re: /^\s*m[öo]nster\s*$/i, egenskap: "pattern" },
];

/** Schema.org-egenskapen för en axel, eller null när Google inte stöder den. */
export function schemaegenskap(axel: string): Schemaegenskap | null {
  return EGENSKAPER.find((e) => e.re.test(axel || ""))?.egenskap ?? null;
}

/** Sidans varianter, eller null när produkten inte har minst två med eget id. */
export function jsonLdVarianter(p: {
  priceNum: number;
  inStock: boolean;
  img: string;
  options?: { name: string; choices: readonly Val[] } | null;
  variantAxes?: readonly { name: string }[];
  variantTable?: readonly Rad[];
}): { axlar: string[]; varianter: JsonLdVariant[] } | null {
  const pris = (n: number) => (n > 0 ? n : p.priceNum);
  const ut: JsonLdVariant[] = [];
  const sedda = new Set<string>();
  let axlar: string[] = [];
  if ((p.variantAxes?.length ?? 0) >= 2 && (p.variantTable?.length ?? 0) >= 2) {
    axlar = p.variantAxes!.map((a) => a.name);
    for (const r of p.variantTable!) {
      const val = axlar.map((axel) => ({ axel, etikett: r.choices[axel] ?? "" }));
      if (!r.variantId || sedda.has(r.variantId) || val.some((v) => !v.etikett)) continue;
      sedda.add(r.variantId);
      ut.push({ variantId: r.variantId, val, priceNum: pris(r.priceNum), inStock: r.inStock, image: r.image || p.img });
    }
  } else if ((p.options?.choices.length ?? 0) >= 2) {
    axlar = [p.options!.name];
    for (const c of p.options!.choices) {
      if (!c.variantId || !c.label || sedda.has(c.variantId)) continue;
      sedda.add(c.variantId);
      ut.push({
        variantId: c.variantId,
        val: [{ axel: p.options!.name, etikett: c.label }],
        priceNum: pris(c.priceNum),
        inStock: c.inStock ?? p.inStock,
        image: c.image || p.img,
      });
    }
  }
  return ut.length >= 2 ? { axlar, varianter: ut } : null;
}

/** variesBy: de stödda egenskaperna, som fullständiga Schema.org-adresser. */
export function variesBy(axlar: readonly string[]): string[] {
  const ut: string[] = [];
  for (const a of axlar) {
    const e = schemaegenskap(a);
    if (e && !ut.includes(`https://schema.org/${e}`)) ut.push(`https://schema.org/${e}`);
  }
  return ut;
}

/**
 * Variantens namn, beskrivning och egenskaper. Namnet är produktens namn och
 * valen, så att varje variant heter något eget även när axeln inte är en
 * Schema.org-egenskap.
 *
 * `beskrivning` är produktens beskrivning (den som står på gruppen). Variantens
 * blir samma text följd av valen: "… Färg: Svart, Antal: 4 st." Utan
 * argumentet skrivs ingen beskrivning, och en produkt utan egen text får bara
 * valen.
 */
export function variantBeskrivning(
  produktnamn: string,
  v: JsonLdVariant,
  visaEtikett: (etikett: string) => string = (e) => e,
  beskrivning?: string,
): { name: string; description?: string } & Partial<Record<Schemaegenskap, string>> {
  const ut: { name: string; description?: string } & Partial<Record<Schemaegenskap, string>> = {
    name: `${produktnamn} – ${v.val.map((x) => visaEtikett(x.etikett)).join(", ")}`,
  };
  if (beskrivning !== undefined) {
    const text = beskrivning.trim();
    // Valen står som en egen mening, så texten före ska vara avslutad.
    const bas = text && !/[.!?…]$/.test(text) ? `${text}.` : text;
    const valen = v.val.map((x) => `${x.axel.trim()}: ${visaEtikett(x.etikett)}`).join(", ");
    ut.description = bas ? `${bas} ${valen}.` : `${valen}.`;
  }
  for (const x of v.val) {
    const e = schemaegenskap(x.axel);
    if (e && !ut[e]) ut[e] = visaEtikett(x.etikett);
  }
  return ut;
}

/** Adressen som förväljer varianten. */
export function variantUrl(bas: string, variantId: string): string {
  return `${bas}?variant=${encodeURIComponent(variantId)}`;
}
