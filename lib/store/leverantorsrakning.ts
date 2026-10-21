// Mappningarna räknade per leverantör — ren logik, ingen IO.
//
// VARFÖR DEN FINNS (2026-10-21). VEVOR lades till som tredje leverantör, och
// klassningen (`mappingSupplier`) svarar sedan dess med fyra värden. Ändringen
// får inte flytta en enda befintlig rad till en annan klass, och det ska gå att
// visa i produktion, inte bara i tester. Räkningen svarar på tre frågor:
//
//   1. Hur många rader har varje leverantör, och hur många har ett okänt värde?
//   2. Hur många rader saknar `supplier`-fältet, och vilken form har deras id?
//      Default för en sådan rad är AliExpress, och det är den regeln uppdraget
//      vill skärpa (bara siffror räknas som AE). Talen avgör om det är värt det.
//   3. Hur många rader väljer AE-synken och Aosom-synken? Samma predikat som
//      synkerna själva använder, inte en kopia av villkoret.
//
// ☠️ SVARET BÄR BARA ANTAL. Inga id, inga artikelnummer, inga adresser: rutten
// anropas från en publik Actions-logg.
//
// ☠️ `vevorPrefix` UTAN FÄLT SKA VARA 0. Det är den enda väg en befintlig rad
// kunde byta klass genom ändringen: en rad utan fält vars id börjar med
// `vevor:` var AliExpress förut och är VEVOR nu. Ingen sådan rad kan finnas
// före VEVOR-importen, och talet bevisar det.

import { LEVERANTORER, type Leverantor, type MappingSupplier, type ProductMappingRecord } from "./index";
import { arIAeSynkensUrval, arKandLeverantor, mappingSupplier } from "./supplier";
import { AOSOM_ID_PREFIX, VEVOR_ID_PREFIX } from "./leverantorsprefix";
import { arIAosomSynkensUrval } from "../aosom/artiklar";

export type IdForm = "aosomPrefix" | "vevorPrefix" | "siffror" | "tomt" | "annat";

export interface Leverantorsrakning {
  totalt: number;
  /** Per klassning, alltså `mappingSupplier()`. */
  perLeverantor: Record<Leverantor, number>;
  /** Det sparade `supplier`-fältet: per känt värde, saknas, eller ett värde utanför listan. */
  sparatFalt: Record<MappingSupplier, number> & { saknas: number; okantVarde: number };
  /** Rader UTAN sparat fält, per form på `supplierProductId`. */
  utanFalt: Record<IdForm, number>;
  /**
   * Rader där det sparade fältet och id:ts form pekar på olika leverantörer,
   * t.ex. fältet "aosom" på ett id med bara siffror. Fältet vinner i
   * klassningen; talet säger hur många rader som bär en motsägelse.
   */
  faltOchIdOense: number;
  /** Raderna AE-synken arbetar med (`arIAeSynkensUrval`). */
  aeSynkensUrval: number;
  /** Raderna Aosom-synken arbetar med (`arIAosomSynkensUrval`). */
  aosomSynkensUrval: number;
}

export function idForm(id: string | undefined | null): IdForm {
  // ☠️ Prefixet testas på id:t som det står, utan trim, precis som i
  // `mappingSupplier()`. Annars hade `utanFalt.vevorPrefix` kunnat räkna en
  // rad som klassningen fortfarande ser som AliExpress.
  const s = id ?? "";
  if (!s.trim()) return "tomt";
  if (s.startsWith(AOSOM_ID_PREFIX)) return "aosomPrefix";
  if (s.startsWith(VEVOR_ID_PREFIX)) return "vevorPrefix";
  if (/^\d+$/.test(s)) return "siffror";
  return "annat";
}

/** Vilken leverantör id:ts form pekar på, eller null när formen inte säger något. */
function idFormensLeverantor(form: IdForm): MappingSupplier | null {
  switch (form) {
    case "aosomPrefix":
      return "aosom";
    case "vevorPrefix":
      return "vevor";
    case "siffror":
      return "aliexpress";
    case "tomt":
    case "annat":
      return null;
  }
}

const nollor = <K extends string>(nycklar: readonly K[]): Record<K, number> =>
  Object.fromEntries(nycklar.map((k) => [k, 0])) as Record<K, number>;

export function raknaLeverantorer(mappningar: readonly ProductMappingRecord[]): Leverantorsrakning {
  const ut: Leverantorsrakning = {
    totalt: 0,
    perLeverantor: nollor<Leverantor>([...LEVERANTORER, "okand"]),
    sparatFalt: { ...nollor<MappingSupplier>(LEVERANTORER), saknas: 0, okantVarde: 0 },
    utanFalt: nollor<IdForm>(["aosomPrefix", "vevorPrefix", "siffror", "tomt", "annat"]),
    faltOchIdOense: 0,
    aeSynkensUrval: 0,
    aosomSynkensUrval: 0,
  };

  for (const m of mappningar) {
    ut.totalt++;
    ut.perLeverantor[mappingSupplier(m)]++;
    const form = idForm(m.supplierProductId);
    const falt: unknown = m.supplier;

    if (!falt) {
      ut.sparatFalt.saknas++;
      ut.utanFalt[form]++;
    } else if (arKandLeverantor(falt)) {
      ut.sparatFalt[falt]++;
      const formens = idFormensLeverantor(form);
      if (formens !== null && formens !== falt) ut.faltOchIdOense++;
    } else {
      ut.sparatFalt.okantVarde++;
    }

    if (arIAeSynkensUrval(m)) ut.aeSynkensUrval++;
    if (arIAosomSynkensUrval(m)) ut.aosomSynkensUrval++;
  }
  return ut;
}
