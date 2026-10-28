// Säsongsteman: butikens utseende byts efter datum, i webbläsaren.
//
// Leonard 2026-10-28: "ge hemsidan halloween look nu under halloween som ändå
// ser proffsigt ut o premium".
//
// VARFÖR I WEBBLÄSAREN OCH INTE PÅ SERVERN. Sidorna cachas (startsidan en
// timme, produktsidorna sex), och statiska sidor ligger kvar till nästa
// deploy. Ett tema som renderades på servern hade alltså legat kvar på
// cachade sidor efter sista dagen, eller krävt en deploy till för att tas
// bort, och en deploy gör ~1 580 produktsidor kalla. Här sätter TEMA_SKRIPT
// `data-tema` på <html> innan sidan ritas, och all stil står under
// :root[data-tema="…"] i app/sasongstema.css. Efter sista dagen sätts
// ingenting, och butiken ser ut som vanligt utan en ny deploy.
//
// Klockan är besökarens. Går den fel ser besökaren fel utseende, och det är
// allt som händer: temat ändrar inga texter, priser eller länkar.

export interface Sasongstema {
  /** Värdet på data-tema. Bara a–z, eftersom det skrivs in i ett skript och i CSS-väljare. */
  namn: string;
  /** Första ögonblicket temat gäller, ISO 8601 i UTC ("…Z"). */
  fran: string;
  /** Första ögonblicket temat inte längre gäller, ISO 8601 i UTC ("…Z"). */
  till: string;
}

export const SASONGSTEMAN: readonly Sasongstema[] = [
  // 28 oktober 00:00 till 1 november 00:00 svensk tid. Vintertid (UTC+1) sedan
  // 25 oktober, och halloween är lördagen den 31:a.
  { namn: "halloween", fran: "2026-10-27T23:00:00Z", till: "2026-10-31T23:00:00Z" },
];

const NAMN = /^[a-z]+$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** Temat som gäller vid `nuMs`, eller null. */
export function aktivtTema(nuMs: number, teman: readonly Sasongstema[] = SASONGSTEMAN): string | null {
  for (const t of teman) {
    if (nuMs >= Date.parse(t.fran) && nuMs < Date.parse(t.till)) return t.namn;
  }
  return null;
}

/**
 * Skriptet som sätter `data-tema` på <html>. Det står först i <body>, så att
 * attributet finns innan sidhuvudet och hjälten ritas: ingen blinkning och
 * ingen layoutförskjutning.
 *
 * Datumen kontrolleras här, vid bygget. Ett namn eller datum som inte går att
 * lita på fäller bygget i stället för att ge ett tema som aldrig, eller
 * alltid, slås på.
 */
export function temaSkript(teman: readonly Sasongstema[] = SASONGSTEMAN): string {
  const rader = teman.map((t) => {
    if (!NAMN.test(t.namn)) throw new Error(`Säsongstema: ogiltigt namn "${t.namn}"`);
    if (!UTC.test(t.fran) || !UTC.test(t.till)) throw new Error(`Säsongstema ${t.namn}: datumen ska vara UTC med Z`);
    const fran = Date.parse(t.fran);
    const till = Date.parse(t.till);
    if (!Number.isFinite(fran) || !Number.isFinite(till) || fran >= till) {
      throw new Error(`Säsongstema ${t.namn}: från måste ligga före till`);
    }
    return [t.namn, fran, till];
  });
  return (
    "(function(){try{var n=Date.now(),t=" + JSON.stringify(rader) + ";" +
    "for(var i=0;i<t.length;i++)if(n>=t[i][1]&&n<t[i][2]){document.documentElement.setAttribute('data-tema',t[i][0]);return}" +
    "}catch(e){}})()"
  );
}

export const TEMA_SKRIPT = temaSkript();
