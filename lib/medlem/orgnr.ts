// lib/medlem/orgnr.ts
//
// Organisationsnummer för företagskonton (E3-1, E3-2). Kontrollen sker direkt
// i formuläret och på servern, innan något slås upp hos Bolagsverket.
//
// Leonards beslut 2026-11-04 (F4): enskilda firmor får också bli
// företagskunder. Deras organisationsnummer är ägarens personnummer, så det
// visas bara maskerat (de fyra sista siffrorna) utom när admin granskar, och
// det loggas aldrig.
//
// Svenska nummer har tio siffror och en kontrollsiffra enligt Luhn. Hos en
// juridisk person är siffra tre och fyra minst 20 (inget datum), och den första
// siffran är gruppen: 2 stat, region och kommun, 3 utländska företag med
// filial, 5 aktiebolag, 6 enkla bolag, 7 ekonomiska föreningar, 8 ideella
// föreningar och stiftelser, 9 handels- och kommanditbolag. Grupp 1 är dödsbon,
// som inte är företag och avvisas. Ett personnummer har månad 01–12 och dag
// 01–31, eller 61–91 för ett samordningsnummer.
//
// Ren modul utan lokala imports.

export type Orgform = "juridisk" | "enskild";

export type Orgnrsfel =
  /** Inte tio eller tolv siffror. */
  | "format"
  /** Fel kontrollsiffra. */
  | "kontrollsiffra"
  /** Varken ett organisationsnummer eller ett giltigt personnummer. */
  | "datum"
  /** Dödsbo eller okänd grupp. */
  | "grupp";

export type Orgnrsprov =
  | {
      ok: true;
      /** "NNNNNN-NNNN", det som sparas och slås upp. */
      nummer: string;
      form: Orgform;
      /** Juridisk person: gruppsiffran. */
      grupp?: number;
      /** Det som får visas: hela numret för en juridisk person, annars
       *  "******-NNNN". */
      visas: string;
    }
  | { ok: false; fel: Orgnrsfel };

/** Luhn över tio siffror. */
export function luhnOk(tio: string): boolean {
  if (!/^\d{10}$/.test(tio)) return false;
  let summa = 0;
  for (let i = 0; i < 10; i++) {
    let d = tio.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    summa += d;
  }
  return summa % 10 === 0;
}

const JURIDISKA_GRUPPER = new Set([2, 3, 5, 6, 7, 8, 9]);

/** Prövar ett organisationsnummer som en kund skrivit in. */
export function provaOrgnr(text: string): Orgnrsprov {
  const rent = String(text ?? "").replace(/[\s \-–+]/g, "");
  if (!/^\d{10}$|^\d{12}$/.test(rent)) return { ok: false, fel: "format" };
  const sekel = rent.length === 12 ? rent.slice(0, 2) : null;
  const tio = rent.length === 12 ? rent.slice(2) : rent;

  const mitten = Number(tio.slice(2, 4));
  const juridisk = mitten >= 20;
  if (sekel !== null) {
    // "16" står framför en juridisk persons nummer, 18/19/20 framför ett personnummer.
    if (sekel === "16" && !juridisk) return { ok: false, fel: "datum" };
    if (sekel !== "16" && !["18", "19", "20"].includes(sekel)) return { ok: false, fel: "format" };
    if (sekel !== "16" && juridisk) return { ok: false, fel: "datum" };
  }
  if (!juridisk) {
    const dag = Number(tio.slice(4, 6));
    const dagOk = (dag >= 1 && dag <= 31) || (dag >= 61 && dag <= 91);
    if (mitten < 1 || mitten > 12 || !dagOk) return { ok: false, fel: "datum" };
  }
  if (!luhnOk(tio)) return { ok: false, fel: "kontrollsiffra" };

  const nummer = `${tio.slice(0, 6)}-${tio.slice(6)}`;
  if (juridisk) {
    const grupp = Number(tio[0]);
    if (!JURIDISKA_GRUPPER.has(grupp)) return { ok: false, fel: "grupp" };
    return { ok: true, nummer, form: "juridisk", grupp, visas: nummer };
  }
  return { ok: true, nummer, form: "enskild", visas: `******-${tio.slice(6)}` };
}

/** Texten till kunden för ett fel i formuläret. */
export function orgnrFeltext(fel: Orgnrsfel): string {
  switch (fel) {
    case "format":
      return "Skriv organisationsnumret med tio siffror, till exempel 556012-5790.";
    case "kontrollsiffra":
      return "Numret stämmer inte. Kontrollera siffrorna.";
    case "datum":
      return "Det är inget giltigt organisationsnummer eller personnummer.";
    case "grupp":
      return "Numret hör inte till ett företag. Kontakta oss om du tror att det är fel.";
  }
}
