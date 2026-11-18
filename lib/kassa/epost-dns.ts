// lib/kassa/epost-dns.ts
//
// Kan domänen ta emot e-post? Frågan ställs till DNS när kunden lämnat
// e-postfältet i kassan (/api/kassa/epost-kontroll). En domän som inte finns,
// eller som finns men säger att den inte tar emot e-post, nekas: bekräftelsen,
// kvittot och spårningen hade aldrig kommit fram.
//
// ☠️ Öppet vid osäkerhet. Bara två svar nekar: domänen finns inte (NXDOMAIN),
// eller den har varken e-postservrar eller en adress. Ett långsamt eller
// trasigt DNS-svar, en tidsgräns eller ett okänt fel ger "okant", och kunden
// släpps igenom. En kassa som nekar en riktig kund för att en namnserver är
// seg är värre än en felstavad adress.
//
// Beslutet är en ren funktion av svaren (node --test); uppslagen skickas in.

export type DnsSvar = "ja" | "nej" | "okant";

export interface Uppslag {
  /** E-postservrarna för domänen (MX). Kastar ett fel med `code` som node:dns gör. */
  mx: (doman: string) => Promise<Array<{ exchange: string; priority: number }>>;
  /** Domänens adresser (A eller AAAA): utan MX levereras e-post dit (RFC 5321). */
  adress: (doman: string) => Promise<string[]>;
}

/** Felkoder som betyder "finns inte" respektive "finns, men har inga sådana poster". */
const FINNS_INTE = new Set(["ENOTFOUND", "NXDOMAIN"]);
const INGA_POSTER = new Set(["ENODATA", "NODATA"]);

const kod = (e: unknown): string => (e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "");

/** Med tidsgräns: ett uppslag som inte svarat i tid räknas som okänt. */
function iTid<T>(lofte: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((klar, fel) => {
    const t = setTimeout(() => fel(Object.assign(new Error("tidsgräns"), { code: "ETIMEOUT" })), ms);
    lofte.then(
      (v) => {
        clearTimeout(t);
        klar(v);
      },
      (e) => {
        clearTimeout(t);
        fel(e);
      },
    );
  });
}

/**
 * Kan `doman` ta emot e-post?
 *   - MX-poster finns: ja. En ensam "." är domänens eget nej (RFC 7505).
 *   - Domänen finns inte: nej.
 *   - Inga MX-poster: adressen avgör. Finns en: ja. Finns ingen, eller finns
 *     domänen inte: nej.
 *   - Allt annat: okänt.
 */
export async function domanTarEmotEpost(doman: string, uppslag: Uppslag, tidsgransMs = 1500): Promise<DnsSvar> {
  try {
    const mx = await iTid(uppslag.mx(doman), tidsgransMs);
    const riktiga = mx.filter((m) => m.exchange && m.exchange !== ".");
    if (riktiga.length > 0) return "ja";
    if (mx.length > 0) return "nej";
  } catch (e) {
    const k = kod(e);
    if (FINNS_INTE.has(k)) return "nej";
    if (!INGA_POSTER.has(k)) return "okant";
  }
  try {
    const a = await iTid(uppslag.adress(doman), tidsgransMs);
    return a.length > 0 ? "ja" : "nej";
  } catch (e) {
    const k = kod(e);
    return FINNS_INTE.has(k) || INGA_POSTER.has(k) ? "nej" : "okant";
  }
}
