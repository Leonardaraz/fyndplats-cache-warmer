// lib/retur-policy.ts
//
// EN KÄLLA för vad som gäller vid ångrat köp och retur. Sidorna Ångra köp,
// Returer, Köpvillkor och Vanliga frågor läser härifrån i stället för att var
// och en formulera sig själv.
//
// Bakgrunden: samma sak stod på fyra sidor i fyra olika versioner, från
// juridiskt fel till korrekt. /angra-kop krävde "oanvänd och i original-
// förpackning" under rubriken "Så fungerar ångerrätten" — alltså som villkor
// för den LAGSTADGADE rätten. /returer sa samma sak. /kopvillkor §7 var rätt
// men hämtade in villkoret bakvägen via "samma villkor som för ångerrätten".
// Bara FAQ:n hade rätt.
//
// LAGEN (lag 2005:59 om distansavtal, 2 kap.):
//
//   15 § 1 st 2 — konsumenten ersätter varans värdeminskning bara "i den mån
//   den beror på att konsumenten hanterat varan i större omfattning än som
//   varit nödvändigt för att fastställa dess egenskaper eller funktion", OCH
//   bara om näringsidkaren informerat om den möjligheten i förväg.
//   → Ångerrätten får alltså INTE villkoras med att varan är oanvänd. Kunden
//     har rätt att undersöka varan som i en fysisk butik. Vår motåtgärd är ett
//     värdeminskningsavdrag — och den rätten förlorar vi om vi inte berättar
//     om den, vilket vi inte gjorde: ordet fanns inte på sajten.
//
//   15 § 1 st 1 — konsumenten står bara för "förhöjda leveranskostnader på
//   grund av konsumentens val av leveransmetod". Billigaste standardleverans
//   återbetalas alltså.
//
//   14 § — återbetalning utan onödigt dröjsmål och senast inom 14 dagar från
//   att vi tog emot meddelandet. Vid varuköp får vi vänta tills varan kommit
//   tillbaka eller kunden visat att den skickats.
//
// Det frivilliga öppna köpet dag 15–30 är vårt eget erbjudande. DÄR får vi
// ställa egna villkor, för det finns ingen lagstadgad rätt att villkora.

/** Totalen, formulerad så att den inte kan läsas som 14 + 30 = 44 dagar. */
export const TOTAL_SUMMARY =
  "Du har totalt 30 dagar på dig att ångra eller returnera ditt köp. De första 14 dagarna omfattas av den lagstadgade ångerrätten. Dag 15–30 erbjuder Fyndplats ett frivilligt öppet köp.";

/** Kort variant för ingresser och meta-beskrivningar. */
export const TOTAL_SHORT =
  "Totalt 30 dagar att ångra eller returnera: 14 dagars lagstadgad ångerrätt, därefter frivilligt öppet köp till och med dag 30.";

export type Period = {
  label: string;
  range: string;
  lead: string;
  points: string[];
};

/** Dag 1–14. Lagstadgad — villkoren nedan är lagens, inte våra. */
export const STATUTORY: Period = {
  label: "Lagstadgad ångerrätt",
  range: "Dag 1–14",
  lead: "Du har enligt lag 14 dagars ångerrätt när du handlar online. Fristen räknas från den dag du, eller någon du utsett, tog emot varan.",
  points: [
    "Under ångerfristen har du rätt att undersöka produktens egenskaper och funktion på motsvarande sätt som du skulle kunna göra i en fysisk butik.",
    "Har produkten hanterats mer än vad som är nödvändigt för att fastställa dess egenskaper och funktion kan ett skäligt värdeminskningsavdrag göras på återbetalningen.",
    "Vi rekommenderar att originalförpackningen sparas och används vid retur när det är möjligt.",
    "Ångerrätten gäller även innan paketet hunnit fram — du kan ångra dig så snart ordern är lagd.",
    "Ångrar du hela köpet återbetalar vi även vad du betalat för vår billigaste standardleverans. Har du valt ett dyrare leveranssätt återbetalas inte merkostnaden.",
    "Vissa varor är undantagna ångerrätt enligt lag, till exempel förseglade hygienartiklar där förseglingen brutits, och specialtillverkade produkter.",
  ],
};

/** Dag 15–30. Vårt eget erbjudande — här får vi ställa villkor. */
export const VOLUNTARY: Period = {
  label: "Fyndplats frivilliga öppna köp",
  range: "Dag 15–30",
  lead: "Utöver den lagstadgade ångerrätten erbjuder Fyndplats frivilligt öppet köp till och med dag 30 från att du tog emot produkten.",
  points: [
    "För öppet köp under dag 15–30 ska produkten vara oanvänd, komplett och i säljbart skick.",
    "Originalförpackningen ska finnas kvar när den utgör en del av produkten eller behövs för säker retur.",
  ],
};

/** Gäller båda perioderna. */
export const COMMON: string[] = [
  "Returfrakten betalas av dig som kund. Välj valfri leveranstjänst — vi rekommenderar spårbar leverans så du har bevis på avsändning.",
  "Är varan trasig eller felaktig är det en reklamation, inte en ångran. Då står Fyndplats för returkostnaden.",
];

/** En rad per period, för den visuella uppdelningen sidorna visar. */
export const TIMELINE: { range: string; label: string }[] = [
  { range: STATUTORY.range, label: STATUTORY.label },
  { range: VOLUNTARY.range, label: VOLUNTARY.label },
];
