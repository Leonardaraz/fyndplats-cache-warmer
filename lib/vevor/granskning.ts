// Det poleringen måste veta om en VEVOR-vara innan den publiceras. Ren modul.
//
// Tre saker, och alla tre sparas på mappningsraden (`vevorGranskning`), där
// poleringen läser raden (workflowen "Polering — läs och stämpla
// mappningsraden") och där kön visar den (/admin/queue):
//
//   gpsr           Manualen är inte läst (Leonard 2026-10-29: "vi behöver inte
//                  ladda ner o läsa alla, det kan vi göra vid behov"). Statusen
//                  säger om sidan länkar en manual. Tillverkare och EU-ansvarig
//                  saknas tills VEVOR svarat eller manualen lästs, och då
//                  publiceras inget (steg 7 bygger spärren).
//   medicinteknik  Varan ligger i en kategori som kan vara medicinteknik,
//                  till exempel patientlyftar och rullstolar. CE-märkning och
//                  dokument kontrolleras före publicering. Varan importeras som
//                  allt annat.
//   bilder         Bildmönstret (lib/vevor/bilder.ts), och om bilderna ska
//                  granskas.
//
// ☠️ FÄLTET BÄR INGA IDENTIFIERARE. Det skrivs ut i en publik Actions-logg
// när poleringen läser raden, så det får inte bära manualens adress eller
// artikelnumret: bara statusar och sant/falskt.

import type { ProductMappingRecord } from "@/lib/store";
import type { Avlasning } from "./lager";
import type { Bildmonster } from "./bilder";

/** Typen bor på mappningsraden, så att lagret inte behöver importera VEVOR-koden. */
export type VevorGranskning = NonNullable<ProductMappingRecord["vevorGranskning"]>;

/**
 * Det importen sätter. GPSR-statusen är bara de två som går att veta utan
 * uppgifterna: om produktsidan länkar en manual. De andra tre sätts när
 * uppgifterna förs in (lib/vevor/gpsr-satt.ts).
 */
export type ImportensGranskning = VevorGranskning & { gpsr: "manual_ej_last" | "ingen_manual" };

/**
 * VEVOR:s kategorier som kan vara medicinteknik, ur menyn på eur.vevor.com
 * 2026-10-29: medical supplies, mobility aids, medical auxiliary supplies,
 * medical exam table, patient lift, furniture patient transport, wheelchairs,
 * mobility equipment accessories, walkers, folding stretcher, bed handle,
 * overbed tables, commodes och heat therapy products.
 */
export const MEDICINTEKNISKA_KATEGORIER: ReadonlySet<string> = new Set([
  "40162",
  "40163",
  "40970",
  "40847",
  "40976",
  "40980",
  "40981",
  "40982",
  "40983",
  "40974",
  "40973",
  "40972",
  "40594",
  "40950",
]);

/**
 * Ordstammar i kategorinamnen och produktnamnet, för en kategori som inte står
 * i listan ovan. Bara stammar som pekar på vård. "Medicinskåp" (ett badrumsskåp)
 * och "medicinboll" (ett träningsredskap) undantas.
 */
const STAMMAR = [
  "medicin",
  "sjukhus",
  "sjukvård",
  "patient",
  "rullstol",
  "rollator",
  "gåstol",
  "kryck",
  "vårdsäng",
  "sjuksäng",
  "undersökningsbrits",
  "hjälpmedel",
  "rehabilitering",
  "ortoped",
  "blodtryck",
  "stetoskop",
  "tandläkar",
  "tandvård",
  "kirurg",
];
const UNDANTAG = ["medicinskåp", "medicinboll"];

function namnetPekarPaVard(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, " ");
  const utan = UNDANTAG.reduce((s, u) => s.split(u).join(" "), t);
  return STAMMAR.some((stam) => utan.includes(stam));
}

/** Kan varan vara medicinteknik? Avgörs på kategorierna och namnet. */
export function kanVaraMedicinteknik(a: Pick<Avlasning, "kategorier" | "namn">): boolean {
  if (a.kategorier.some((k) => MEDICINTEKNISKA_KATEGORIER.has(k.id))) return true;
  return a.kategorier.some((k) => namnetPekarPaVard(k.namn)) || namnetPekarPaVard(a.namn);
}

export function vevorGranskning(
  a: Pick<Avlasning, "kategorier" | "namn" | "manualSokvag">,
  bilder: { monster: Bildmonster; granskas: boolean },
): ImportensGranskning {
  return {
    gpsr: a.manualSokvag ? "manual_ej_last" : "ingen_manual",
    medicinteknik: kanVaraMedicinteknik(a),
    bildmonster: bilder.monster,
    bildgranskning: bilder.granskas,
  };
}
