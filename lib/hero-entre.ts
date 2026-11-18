// När hjältens entré får starta (components/hero-entre.tsx och "studion
// vaknar" i app/globals.css).
//
// Entrén hackade på en riktig telefon när den började vid första bildrutan:
// just då byts typsnittet in, bilderna landar och sidan väcks. Här väntar den
// tills bildrutorna kommer jämnt, alltså tills webbläsaren faktiskt hinner
// rita. Det mäts i stället för att gissas: en fast fördröjning är för lång på
// en snabb telefon och för kort på en långsam.
//
// Ren modul (node --test).

export interface Lugn {
  /** Så många bildrutor i rad ska komma i tid. */
  jamna: number;
  /** En bildruta är i tid när den kommer inom så här många ms efter den förra (34 ms är 30 bilder i sekunden). */
  maxLucka: number;
  /** Vänta aldrig längre än så här, i ms. */
  tak: number;
}

export const LUGN: Lugn = { jamna: 4, maxLucka: 34, tak: 500 };

/**
 * Anropar `klart` en gång: när `jamna` bildrutor i rad har kommit i tid, eller
 * när `tak` ms har gått. `nastaBildruta` är webbläsarens requestAnimationFrame.
 * Returnerar en funktion som avbryter väntan.
 */
export function vantaPaLugn(
  nastaBildruta: (f: (tid: number) => void) => unknown,
  klart: () => void,
  regler: Lugn = LUGN,
): () => void {
  let avbruten = false;
  let fardig = false;
  let forra: number | null = null;
  let borjan: number | null = null;
  let iRad = 0;
  const steg = (tid: number) => {
    if (avbruten || fardig) return;
    if (forra === null || borjan === null) {
      forra = tid;
      borjan = tid;
    } else {
      iRad = tid - forra <= regler.maxLucka ? iRad + 1 : 0;
      forra = tid;
      if (iRad >= regler.jamna || tid - borjan >= regler.tak) {
        fardig = true;
        klart();
        return;
      }
    }
    nastaBildruta(steg);
  };
  nastaBildruta(steg);
  return () => {
    avbruten = true;
  };
}
