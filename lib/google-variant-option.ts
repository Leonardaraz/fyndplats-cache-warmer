// Googles variant_option och item_group_title i flödet (2026-10-30).
//
// Flödet skickar en rad per variant med item_group_id, och färg, storlek,
// material och mönster som egna attribut. En annan axel (Förpackning, Effekt,
// Modell) skickades bara som storlek, eftersom Google kräver ett särskiljande
// attribut per grupp. variant_option bär varje axel med sitt eget namn, och
// item_group_title ger gruppen en gemensam titel. Båda är frivilliga och gäller
// bara produkter med fler än en variant.
//
// Googles krav (Merchant Center Help, variant_option och item_group_title):
// - varje variant i gruppen har samma uppsättning namn,
// - högst 30 par, namn och värde högst 250 tecken,
// - gruppens titel 1–150 tecken, samma för alla varianter.

export type Optionspar = { name: string; value: string };

const MAX_PAR = 30;
const MAX_TECKEN = 250;

/** Variantens par i optionernas ordning: ett per namn, utan tomma. */
export function variantOptioner(
  val: readonly { option: string; choice: string }[],
  visaNamn: (s: string) => string = (s) => s,
  visaVarde: (s: string) => string = (s) => s,
): Optionspar[] {
  const ut: Optionspar[] = [];
  const sedda = new Set<string>();
  for (const v of val) {
    const name = visaNamn((v.option || "").trim()).slice(0, MAX_TECKEN);
    const value = visaVarde((v.choice || "").trim()).slice(0, MAX_TECKEN);
    if (!name || !value || sedda.has(name.toLowerCase())) continue;
    sedda.add(name.toLowerCase());
    ut.push({ name, value });
    if (ut.length >= MAX_PAR) break;
  }
  return ut;
}

/** XML-raderna för en variant, eller "" när produkten inte har varianter. */
export function variantOptionXml(
  produktnamn: string,
  par: readonly Optionspar[],
  flerVarianter: boolean,
  esc: (s: string) => string,
): string {
  if (!flerVarianter || par.length === 0) return "";
  const titel = produktnamn.trim().slice(0, 150);
  const rader = par.map(
    (p) => `\n      <g:variant_option>\n        <g:name>${esc(p.name)}</g:name>\n        <g:value>${esc(p.value)}</g:value>\n      </g:variant_option>`,
  );
  return (titel ? `\n      <g:item_group_title>${esc(titel)}</g:item_group_title>` : "") + rader.join("");
}
