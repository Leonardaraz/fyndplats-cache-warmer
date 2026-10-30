// Säger till butiken att recensionerna för ett antal produkter ändrats, så att
// produktsidorna hämtar nya i stället för att visa den gamla kopian i upp till
// sex timmar.
//
// ☠️ VARFÖR VERKTYGEN MÅSTE GÖRA DET SJÄLVA. Butiken cachar varje produkts
// recensioner i sex timmar (tagg `recensioner-<id>`). Dess egen bevakning
// (/api/cron/uppdatera-andrade, var femte minut) frågar motorns
// /api/review-andringar, men den rutten svarar 501 så länge recensionerna ligger i
// Wix Data (DRIFTEN_I_WIX), och då väntar butiken in sexttimmarscachen. Ett
// verktyg som ändrar recensioner utan att säga till syns alltså inte för kunden på
// ~6 timmar, medan verktygets egen kontroll mot /api/reviews/<id> (CDN 60 s) ser
// den nya raden direkt. Så gick det 2026-10-29: initialerna var bytta i lagret men
// fåtöljens sida visade W.X. och Z.A. i timmar, och jag rapporterade "klart".
//
// Best-effort, kastar aldrig: att butiken inte svarar ändrar inte att recensionerna
// är ändrade, och sexttimmarscachen tar det ändå. Men MISSLYCKANDET SYNS i svaret
// (`misslyckade`, `utanNyckel`) så att en körning aldrig ser ut att ha uppdaterat
// butiken när den inte gjort det.
import { uppdateraProduktsidor } from "../headless/produktsidor";

/** Butikens tak per anrop (app/api/admin/uppdatera-produkter). */
const PER_ANROP = 500;
const PAUS_FORE_OMFORSOK_MS = 1_000;

export interface ButikSammanfattning {
  /** Produkter vi bad butiken uppdatera. */
  produkter: number;
  /** Anrop till butiken. */
  anrop: number;
  /** Anrop som butiken svarade ok på. */
  uppdaterade: number;
  /** Anrop som föll, också efter ett omförsök. */
  misslyckade: number;
  /** ADMIN_SECRET saknas i motorn: butiken har inte sagts till alls. */
  utanNyckel: boolean;
  /** Produkter vi inte hann be om innan tidsbudgeten tog slut. */
  hoppade: number;
}

export interface MeddelaValfritt {
  /** Byts ut i tester. */
  uppdatera?: typeof uppdateraProduktsidor;
  /** Epoch-millisekunder; efter den bad vi inte om fler. */
  slutTid?: number;
  nu?: () => number;
  vanta?: (ms: number) => Promise<void>;
}

export async function meddelaButikenOmRecensioner(
  produktIds: readonly string[],
  orsak: string,
  valfritt: MeddelaValfritt = {},
): Promise<ButikSammanfattning> {
  const uppdatera = valfritt.uppdatera ?? uppdateraProduktsidor;
  const nu = valfritt.nu ?? Date.now;
  const vanta = valfritt.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const ids = [...new Set(produktIds.map((id) => id.trim()).filter(Boolean))];
  const ut: ButikSammanfattning = {
    produkter: 0,
    anrop: 0,
    uppdaterade: 0,
    misslyckade: 0,
    utanNyckel: false,
    hoppade: 0,
  };

  for (let i = 0; i < ids.length; i += PER_ANROP) {
    const tuggan = ids.slice(i, i + PER_ANROP);
    if (ut.utanNyckel || (valfritt.slutTid !== undefined && nu() > valfritt.slutTid)) {
      ut.hoppade += tuggan.length;
      continue;
    }
    const poster = tuggan.map((id) => ({ id, vad: "recensioner" as const }));
    let utfall = "misslyckades";
    for (let forsok = 0; forsok < 2; forsok++) {
      if (forsok > 0) await vanta(PAUS_FORE_OMFORSOK_MS);
      utfall = (await uppdatera(poster, orsak).catch(() => ({ utfall: "misslyckades" as const }))).utfall;
      // Utan nyckel hjälper inget omförsök, och en tom lista är inget fel.
      if (utfall !== "misslyckades") break;
    }
    if (utfall === "ingen_nyckel") {
      // Butiken har inte sagts till alls, så de här produkterna räknas som hoppade.
      ut.utanNyckel = true;
      ut.hoppade += tuggan.length;
      continue;
    }
    ut.produkter += tuggan.length;
    ut.anrop++;
    if (utfall === "uppdaterad" || utfall === "tom") ut.uppdaterade++;
    else ut.misslyckade++;
  }
  return ut;
}
