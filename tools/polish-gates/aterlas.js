// ÅTERLÄSNINGENS JS-HALVA — läs den härifrån, skriv den aldrig ur minnet.
//
// ☠️ VARFÖR FILEN FINNS. `hasha.py` har alltid sagt att "samma FNV-1a går att
// räkna i sandlådans JS". Python-halvan har en fil; JS-halvan hade ingen, och
// härleddes därför om vid varje runda. I runda N4 skrev jag om BÅDE
// `gatelib.fnv` och `wixnorm.normalisera` för hand i anropet, och kopian
// saknade `(?!<p>)`-skyddet på `</li>`. Nio KORREKTA skrivningar rapporterades
// som SKILJER.
//
// Fjärde gången i samma familj (`SHIP_AXIS_RE`, `EU_TULL_CODES`, `hasha.py` i
// N2) — och i den dyra riktningen: en korrekt skrivning som ser misslyckad ut
// inbjuder till en omskrivning av något som redan stämmer, ovanpå en revision
// som hunnit bli inaktuell.
//
// ☠️ HÄR NORMALISERAS INGENTING, OCH DET ÄR POÄNGEN. Wix normaliserar vid
// SPARANDET, alltså ÄR den lagrade texten den normaliserade formen.
// `wixnorm.normalisera` hör hemma på FILENS sida, aldrig på butikens. Min
// N4-kopia var därför inte bara buggig utan fel i princip: den normaliserade
// något som redan var normaliserat.
//
// ⚠️ OM ALLA RADER SKILJER: misstänk FACIT. Om NÅGRA gör det: misstänk
// skrivningen. N4:s nio-av-nio såg systematiskt ut och var därför trovärdigt —
// det var precis det som gjorde det farligt.
//
// VERIFIERAD AT BADA HALLEN 2026-09-16, for det ar det enda som skiljer en
// levande grind fran en dod:
//
//   ratt facit, runda N4:s nio produkter        -> 9 av 9 LIKA
//     (samma svar som en OBEROENDE jamforelse gjord lokalt i Python mot
//      wixnorm.normalisera — alltsa stammer JS-sidans FNV over UTF-8-bytes
//      mot gatelib.fnv av den normaliserade filen)
//
//   ETT hexatecken andrat i a1d3d26c:s hash     -> just den raden false
//   teckentalet +1 pa b7b5b37e                  -> just den raden false
//   ovriga tva rader i samma korning            -> true
//
// ANVÄNDNING
//   1.  python3 ../../polish-gates/hasha.py            (facit ur filerna)
//   2.  python3 ../../polish-gates/aterlas.py          (skriver FACIT-blocket)
//   3.  klistra FACIT-blocket + den här filen i ExecuteWixAPI
//
// ⚠️ Vänta en stund efter skrivningen. En återläsning i SAMMA anrop som
// PATCH:en är inget kvitto (#255), och PATCH-svarets egen projektion utelämnar
// `plainDescription` helt (#253).

async function () {
  // FACIT klistras in ovanför anropet av aterlas.py:  { "kort": ["hash", tecken] }

  function fnv(s) {
    // FNV-1a 64-bitars over UTF-8-BYTES. Identisk med gatelib.fnv.
    // BigInt kravs — 0x100000001b3 spranger Number.
    const b = new TextEncoder().encode(s);
    let h = 0xcbf29ce484222325n;
    const M = 0xFFFFFFFFFFFFFFFFn;
    for (const c of b) {
      h ^= BigInt(c);
      h = (h * 0x100000001b3n) & M;
    }
    return h.toString(16).padStart(16, "0");
  }

  const ut = [];
  for (const [kort, pid] of Object.entries(IDS)) {
    // ☠️ PLAIN_DESCRIPTION MASTE BEGARAS. Utan falten svarar V3 med en produkt
    // dar faltet SAKNAS HELT (typeof undefined, inte tom strang) — och den
    // vanliga defensiva raden `p.plainDescription || ""` gor da ett SAKNAT
    // falt till noll tecken, alltsa ett svar som ser ut som ett bevis pa att
    // skrivningen foll. Atta produkter rapporterades en gang som oskrivna av
    // en aterlasning som aldrig bett om faltet.
    const url = "/stores/v3/products/" + pid + "?fields=PLAIN_DESCRIPTION";
    const r = await wix.request({ method: "GET", url: url });
    const p = r.data.product;

    if (typeof p.plainDescription !== "string") {
      // AVBRYT hellre an rapportera noll. En kontroll som inte KAN falla ar
      // varre an ingen, for den raknas som gjord.
      return { AVBRUTET: "plainDescription saknas i projektionen", kort: kort };
    }

    const t = p.plainDescription;
    const v = FACIT[kort];
    ut.push({
      kort: kort,
      tecken: t.length,
      vantatTecken: v ? v[1] : null,
      LIKA: !!v && fnv(t) === v[0] && t.length === v[1]
    });
  }

  const lika = ut.filter(function (r) { return r.LIKA; }).length;
  return {
    rader: ut,
    SAMMANFATTNING: lika + " av " + ut.length + " LIKA",
    // Alla skiljer -> misstank FACIT, inte skrivningen. Se kommentaren ovan.
    allaSkiljer: lika === 0 && ut.length > 1
  };
}
