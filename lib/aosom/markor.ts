// Svepens markör lämnar aldrig servern i klartext.
//
// Import-, synk- och bildfixrutterna bläddrar genom feeden i artikelnummer-
// ordning, och markören de svarar med (`cursor` → `?after=`) ÄR ett Aosom-
// artikelnummer. Den gick rakt ut i tre publika kanaler: Actions-loggen
// ("varv 7: +40 …, markör <nummer>"), jobbsummeringen, och — för import- och
// bildfixsvepet — en fil plus ett commitmeddelande i grenen, eftersom markören
// sparas där efter varje varv så att en avbruten körning kan fortsätta.
// Uppmätt 2026-09-27: alla 29 importkörningar och 28 av 35 synkkörningar bar
// artikelnummer i sin publika logg.
//
// Numret är exakt den sträng som kopplar vår sida till Aosoms (och till
// dealproffsens, som publicerar den som `sku`/`mpn`). Se "Feedens adress är en
// hemlighet" i CLAUDE.md för varför den kopplingen inte får bli publik.
//
// Rutterna FÖRSEGLAR därför markören (AES-256-GCM, nyckeln härledd ur
// CRON_SECRET) och öppnar den igen när den kommer tillbaka som `?after=`.
// Loggen, summeringen och grenen ser bara en ogenomskinlig sträng.
//
// ☠️ En markör i KLARTEXT tas fortfarande emot. Det är vad en människa skriver
//    för hand vid en riktad omkörning, och det är vad en gammal sparad
//    markörfil innehåller. Den skrivs aldrig tillbaka i klartext.
// ☠️ En förseglad markör som inte går att öppna KASTAR. Att tolka den som
//    "från början" hade gett ett svep som tyst börjar om — och att tolka den
//    som ett artikelnummer hade jämfört mot en sträng som aldrig kan träffa.
//    Byts CRON_SECRET blir gamla markörer oläsbara; kör då om utan `after`
//    (dubblettspärren gör omkörningen till en no-op).
// ☠️ Saknas hemligheten kastar förseglingen. En markör som tyst gick ut i
//    klartext hade varit exakt läckan modulen finns för att stänga.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Prefixet som skiljer en förseglad markör från ett handskrivet artikelnummer. */
export const MARKOR_PREFIX = "m1.";

const IV_BYTE = 12;
const TAGG_BYTE = 16;

export class MarkorFel extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = "MarkorFel";
  }
}

function nyckel(hemlighet: string): Buffer {
  if (!hemlighet) {
    throw new MarkorFel("CRON_SECRET saknas — markören kan inte förseglas och skrivs inte ut i klartext");
  }
  return createHash("sha256").update("fyndplats-aosom-markor\0").update(hemlighet).digest();
}

/** Förseglar en markör. `null` in ger `null` ut: svepet är klart. */
export function forseglaMarkor(markor: string | null | undefined, hemlighet: string): string | null {
  if (!markor) return null;
  const iv = randomBytes(IV_BYTE);
  const chiffer = createCipheriv("aes-256-gcm", nyckel(hemlighet), iv);
  const data = Buffer.concat([chiffer.update(markor, "utf8"), chiffer.final()]);
  return MARKOR_PREFIX + Buffer.concat([iv, chiffer.getAuthTag(), data]).toString("base64url");
}

/**
 * Öppnar `?after=`. En förseglad markör dekrypteras; allt annat antas vara ett
 * artikelnummer skrivet för hand och lämnas orört. Tomt blir `undefined`.
 */
export function oppnaMarkor(after: string | null | undefined, hemlighet: string): string | undefined {
  const v = (after ?? "").trim();
  if (!v) return undefined;
  if (!v.startsWith(MARKOR_PREFIX)) return v;

  const raa = Buffer.from(v.slice(MARKOR_PREFIX.length), "base64url");
  if (raa.length <= IV_BYTE + TAGG_BYTE) {
    throw new MarkorFel("markören är trasig — kör om utan after");
  }
  try {
    const dechiffer = createDecipheriv("aes-256-gcm", nyckel(hemlighet), raa.subarray(0, IV_BYTE));
    dechiffer.setAuthTag(raa.subarray(IV_BYTE, IV_BYTE + TAGG_BYTE));
    const klartext = Buffer.concat([
      dechiffer.update(raa.subarray(IV_BYTE + TAGG_BYTE)),
      dechiffer.final(),
    ]).toString("utf8");
    if (!klartext) throw new Error("tom");
    return klartext;
  } catch (err) {
    if (err instanceof MarkorFel) throw err;
    throw new MarkorFel("markören går inte att öppna (fel nyckel eller ändrad sträng) — kör om utan after");
  }
}
