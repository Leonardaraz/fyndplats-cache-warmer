// lib/medlem/mejltjanst.ts
//
// En genväg till kundens mejltjänst på kodsteget (premium, Leonard 2026-11-04):
// den som loggar in med en Gmail-adress får en knapp som öppnar Gmail och söker
// fram koden, också i skräpposten. Ren funktion, inga beroenden.

/** Avsändaren av koden (lib/medlem/mejl.ts), för sökningen i Gmail. */
export const AVSANDARE = "orders@fyndplats.se";

const OUTLOOK = ["outlook.com", "outlook.se", "hotmail.com", "hotmail.se", "live.com", "live.se", "msn.com"];
const ICLOUD = ["icloud.com", "me.com", "mac.com"];
const YAHOO = ["yahoo.com", "yahoo.se"];

/** Tjänsten och adressen dit, eller null när domänen inte säger vilken det är. */
export function mejltjanst(epost: string): { namn: string; url: string } | null {
  const d = (epost.split("@")[1] ?? "").trim().toLowerCase();
  if (d === "gmail.com" || d === "googlemail.com") {
    return { namn: "Gmail", url: `https://mail.google.com/mail/u/0/#search/from%3A${encodeURIComponent(AVSANDARE)}+in%3Aanywhere` };
  }
  if (OUTLOOK.includes(d)) return { namn: "Outlook", url: "https://outlook.live.com/mail/0/" };
  if (ICLOUD.includes(d)) return { namn: "iCloud Mail", url: "https://www.icloud.com/mail" };
  if (YAHOO.includes(d)) return { namn: "Yahoo Mail", url: "https://mail.yahoo.com/" };
  return null;
}
