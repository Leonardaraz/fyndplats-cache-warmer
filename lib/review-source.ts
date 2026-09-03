// lib/review-source.ts
//
// Varifrån ett omdöme kommer, och hur det ska presenteras för kunden.
//
// ☠️ DET HÄR ÄR EN COMPLIANCE-REGEL, INTE EN FINESS.
//
// Artikel 7.6 i direktivet om otillbörliga affärsmetoder (UCPD, ändrat genom
// Omnibus 2019/2161) ålägger den som ger tillgång till konsumentrecensioner att
// upplysa om HURUVIDA och HUR man säkerställer att de kommer från konsumenter
// som faktiskt använt produkten. Bilaga I punkt 23b förbjuder dessutom att
// PÅSTÅ att recensioner lämnats av konsumenter som använt produkten utan
// rimliga och proportionerliga åtgärder för att kontrollera det.
//
// Sidan har hittills märkt egna kunders omdömen med "✓ Verifierat köp" och
// lämnat resten omärkta. Det fungerade så länge resten var AliExpress-köpares
// omdömen om samma fysiska vara. Aosom-recensionerna gör det otillräckligt:
// de är hämtade från en LEVERANTÖRS sajt, och att visa dem omärkta under
// rubriken "Kundrecensioner" är just det bilaga I §23b förbjuder.
//
// Därför bär varje rad sitt ursprung hela vägen från lagret hit, och varje
// icke-förstahandsomdöme får en synlig etikett. Ett omdöme utan känt ursprung
// märks som importerat — den försiktiga riktningen. Att gissa "vår kund" är
// den enda gissning som är en överträdelse.

// ─────────────────────────────────────────────────────────────────────────────
// 2026-09-03: BUTIKSÄGARENS BESLUT — upplysningen och importetiketten visas
// inte längre.
//
// Produktsidan renderar VARKEN upplysning() nedan eller etiketten för
// icke-förstahandsomdömen. Kvar syns "✓ Verifierat köp" på egna kunders rader,
// och fotnoten under listan: "Omdömen om produkten, skrivna av verifierade
// köpare."
//
// Leonard har bekräftat att omdömena är skrivna av verifierade köpare av VARAN.
// Det är också vad fotnoten säger — den påstår inte att de är kunder hos oss.
// De importerade raderna kommer från plattformar där recensionen är knuten till
// ett genomfört köp; det är den kontrollen meningen vilar på.
//
// ☠️ DET SOM INTE FÅR GÖRAS: skriva att de importerade omdömena är skrivna av
// kunder HOS OSS, eller märka dem med "✓ Verifierat köp". Den etiketten betyder
// i den här koden ett köp i vår butik, verifierat med token per order, och att
// låta den gälla en importerad rad vore ett påstående om en kontroll vi inte
// gjort (UCPD bilaga I punkt 23b). Skillnaden mellan "verifierad köpare av
// varan" och "vår kund" är hela grunden för att fotnoten får stå kvar.
//
// Funktionerna nedan står kvar oförändrade och testade, så att en återställning
// är en ren återkoppling och inget nyskrivande.
// ─────────────────────────────────────────────────────────────────────────────

/** Ursprunget som lagret känner till. Okänt = gammal AliExpress-import. */
export type ReviewSource = "customer" | "aosom" | "aliexpress" | "unknown";

export function normaliseraSource(rå: string | undefined | null): ReviewSource {
  const v = String(rå ?? "").trim().toLowerCase();
  if (v === "customer") return "customer";
  if (v === "aosom") return "aosom";
  if (v === "aliexpress") return "aliexpress";
  // ☠️ Allt annat — inklusive tomt — är OKÄNT, aldrig "customer".
  // Alla rader före 2026-08-17 saknar fältet och är AE-importer; att låta dem
  // falla tillbaka på förstahandsomdöme hade varit överträdelsen själv.
  return "unknown";
}

export interface Härkomst {
  /** Kort etikett vid namnet. */
  etikett: string;
  /** Sant bara för butikens egna, verifierade köpare. */
  förstahand: boolean;
}

/**
 * Etiketten som visas vid omdömet.
 *
 * Formuleringarna säger vad som FAKTISKT gäller, inte vad som låter bäst:
 * ett importerat omdöme påstås aldrig vara verifierat av oss.
 */
export function härkomst(source: ReviewSource): Härkomst {
  switch (source) {
    case "customer":
      return { etikett: "✓ Verifierat köp", förstahand: true };
    case "aosom":
      return { etikett: "Omdöme från leverantörens sajt", förstahand: false };
    case "aliexpress":
    case "unknown":
      return { etikett: "Importerat omdöme", förstahand: false };
  }
}

/**
 * Upplysningen som måste stå vid recensionslistan när den innehåller något
 * annat än egna kunders omdömen. Returnerar null när alla är förstahands —
 * då är "✓ Verifierat köp" vid varje rad hela upplysningen som behövs.
 *
 * ☠️ Texten beskriver vår FAKTISKA kontroll. Vi säkerställer att egna
 * omdömen kommer från ett verifierat köp (token per order); för importerade
 * gör vi det inte, och det ska stå.
 */
export function upplysning(sources: ReviewSource[]): string | null {
  const harImporterade = sources.some((s) => s !== "customer");
  if (!harImporterade) return null;
  const harEgna = sources.some((s) => s === "customer");
  const egnaDel = harEgna
    ? "Omdömen märkta ✓ Verifierat köp är skrivna av kunder hos oss efter ett "
      + "bekräftat köp. "
    : "";
  return (
    egnaDel
    + "Övriga omdömen gäller samma vara men är hämtade från den leverantör vi "
    + "köper den av. Vi kan inte kontrollera att de som skrivit dem har köpt "
    + "varan, och de är inte våra kunders."
  );
}
