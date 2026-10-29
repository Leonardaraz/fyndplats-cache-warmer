// En VEVOR-avläsning som synkens ingång (lib/sync/leverantorsrad.ts).
//
// Synken (steg 5) tar emot ett besked per artikel. Den här adaptern avgör
// vad beskedet är, och den är det enda stället som gör det:
//
//   i_lager / slut   en giltig avläsning, högst 12 timmar gammal
//   ej_levererbar    sidan skickar inte till Sverige, eller från fel lager
//   borta            sidan bekräftat borta (två signaler, minst ett dygn isär)
//   okand            ingen avläsning, för gammal avläsning, läsaren fryst, eller
//                    senaste försöket misslyckades (tidsgräns, tolkningsfel, fel
//                    språk eller valuta, en första 404, en spärr i robots.txt)
//
// ☠️ OKÄNT RÖR ALDRIG LAGRET OCH BLIR ALDRIG 0. Profilen säger det för en
// saknad rad (`saknadRad: "okand"`), och adaptern säger det för allt annat vi
// inte vet. En fryst läsare betyder att VEVOR spärrat oss: då vet vi ingenting.
//
// Den landade kostnaden lämnas null. Prisregeln finns sedan steg 4
// (lib/vevor/pris.ts, rabatten i konfigurationen), och synken kopplar in den i
// steg 5. Null betyder att synken inte rör priset.

import type { Leverantorsrad } from "@/lib/sync/leverantorsrad";
import type { Avlasning } from "./lager";

/** Äldre avläsning än så är okänd. Leonard 2026-10-28. */
export const MAX_ALDER_MS = 12 * 3_600_000;

/** Lagret VEVOR ska skicka från. Allt som mätts 2026-10-29 bar "EU". */
export const VART_FLODE = "EU";

/** Beskedet för en artikel. Undefined = ingen avläsning: profilens regel för saknad rad gäller. */
export function vevorRad(a: Avlasning | undefined, nu: number, fryst: boolean): Leverantorsrad | undefined {
  if (!a) return undefined;
  const bas = { leverantor: "vevor" as const, artikel: a.sku, landadKostnadSek: null, lastAt: a.lastAt };
  if (fryst) return { ...bas, status: "okand", saldo: 0 };
  // Borta är ett bekräftat besked, inte en avläsning som åldras: sidan har
  // svarat 404 två gånger med minst ett dygn emellan, och avläsningen före dem
  // är per definition gammal. En ny giltig läsning nollställer borta.
  if (a.borta || a.status === "borta") return { ...bas, status: "borta", saldo: 0 };
  // Senaste försöket misslyckades: den giltiga avläsningen före är inte längre beskedet.
  if (a.misslyckadAt && Date.parse(a.misslyckadAt) >= Date.parse(a.lastAt)) {
    return { ...bas, status: "okand", saldo: 0 };
  }
  const alder = nu - Date.parse(a.lastAt);
  if (!Number.isFinite(alder) || alder > MAX_ALDER_MS || alder < -60_000) {
    return { ...bas, status: "okand", saldo: 0 };
  }
  if (!a.levererasTillSe || a.flode !== VART_FLODE) return { ...bas, status: "ej_levererbar", saldo: a.saldo };
  return { ...bas, status: a.saldo > 0 ? "i_lager" : "slut", saldo: a.saldo };
}
