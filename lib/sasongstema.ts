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
  // Till måndag 2 november 03:00 svensk tid (Leonard 2026-10-28: "temat börjar
  // direkt efter mergen inatt och ändras tillbaka måndag kl 03:00"). Starten
  // ligger före mergen, så temat syns från första sidan efter deployen.
  // Vintertid (UTC+1) sedan 25 oktober, så 03:00 är 02:00 UTC.
  { namn: "halloween", fran: "2026-10-27T23:00:00Z", till: "2026-11-02T02:00:00Z" },
  // Singles Day och Singles Week (Leonard 2026-11-11: "single day tema då
  // single day är idag och sen single week tema för resten av dagarna denna
  // vecka. Sen 00:00 på måndag så går den tillbaka till vanliga").
  // Onsdag 11 november hela dygnet i svensk tid, sedan torsdag till söndag,
  // och slut måndag 16 november 00:00. Vintertid (UTC+1), så svensk midnatt är
  // 23:00 UTC kvällen före. Det ena temat slutar i samma ögonblick som det
  // andra börjar: aktivtTema och skriptet tar det första som gäller, och
  // provet fäller två teman som överlappar.
  { namn: "singlesday", fran: "2026-11-10T23:00:00Z", till: "2026-11-11T23:00:00Z" },
  { namn: "singlesweek", fran: "2026-11-11T23:00:00Z", till: "2026-11-15T23:00:00Z" },
  // Black Week (Leonard 2026-11-17: "tema för black friday"). Samma vecka som
  // Fyndauktionens Black Week: måndag 23 till söndag 29 november, med fredagen
  // 27 november som Black Friday. Tre teman i rad, eftersom varje namn bara
  // får stå en gång: måndag till torsdag, fredagen, och helgen efter.
  // De delar utseende (svart och guld) och skiljer sig bara i raden över
  // rubriken och ordet bakom den. Slut måndag 30 november 00:00 svensk tid.
  // Vintertid (UTC+1), så svensk midnatt är 23:00 UTC kvällen före.
  { namn: "blackweek", fran: "2026-11-22T23:00:00Z", till: "2026-11-26T23:00:00Z" },
  { namn: "blackfriday", fran: "2026-11-26T23:00:00Z", till: "2026-11-27T23:00:00Z" },
  { namn: "blackweekend", fran: "2026-11-27T23:00:00Z", till: "2026-11-29T23:00:00Z" },
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
 *
 * PROVLÄGET (`prov`, Leonard 2026-11-17: "ge mig länken till förhandsvisningen
 * så jag får prova"). Ett tema som börjar nästa vecka går inte att se i dag,
 * så en förhandsvisning (VERCEL_ENV "preview") lyder också adressen:
 * `?tema=blackweek` slår på ett tema ur listan, och `?tema=av` visar butiken
 * utan tema. Valet ligger kvar i fliken (sessionStorage), så att det följer
 * med när man klickar vidare. I produktionen finns den koden inte i skriptet
 * alls: där styr bara datumet. Ett namn som inte står i listan gör ingenting.
 */
export function temaSkript(teman: readonly Sasongstema[] = SASONGSTEMAN, prov = false): string {
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
  const provval = prov
    ? "var q=/[?&]tema=([a-z]+)/.exec(location.search),v=q?q[1]:null;" +
      "try{if(v)sessionStorage.setItem('fp-tema',v);else v=sessionStorage.getItem('fp-tema')}catch(e){}" +
      "if(v==='av')return;" +
      "if(v)for(var j=0;j<t.length;j++)if(t[j][0]===v){document.documentElement.setAttribute('data-tema',v);return}"
    : "";
  return (
    "(function(){try{var n=Date.now(),t=" + JSON.stringify(rader) + ";" +
    provval +
    "for(var i=0;i<t.length;i++)if(n>=t[i][1]&&n<t[i][2]){document.documentElement.setAttribute('data-tema',t[i][0]);return}" +
    "}catch(e){}})()"
  );
}

/** Sant bara i en förhandsvisning hos Vercel, aldrig i produktionen eller lokalt. */
export const TEMA_PROV = (process.env.VERCEL_ENV || "").trim() === "preview";

export const TEMA_SKRIPT = temaSkript(SASONGSTEMAN, TEMA_PROV);
