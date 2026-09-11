// lib/clip-text.ts
//
// Kapning av produkttext till en maxlängd UTAN att skära mitt i ett ord.
//
// Bakgrund: blurb och specs kapades tidigare med en rå `.slice(0, 220)`. På de
// programmatiska sidorna syntes resultatet som "…och är billigare än den s." och
// "…lampan tar 26 × 2". Samma sträng går till meta-description, Google-flödet och
// sökindexet, så kapningen syns på fler ytor än den ena.
//
// Regeln: kapa hellre vid en meningsgräns när det finns en rimligt nära slutet —
// då slutar texten som en text i stället för mitt i en tanke. Annars vid ordgräns.

// Andel av maxlängden en meningsgräns minst måste ligga på för att väljas.
// Lågt satt med flit: en hel mening som slutar tidigt läser alltid bättre än en
// halv som slutar sent. Vid 0,6 blev det "…12 V bensin upp till 4,0." på skarpa
// sidor — tekniskt en ordgräns, men mitt i en tanke.
const SENTENCE_FLOOR = 0.35;

// Ord som lämnar meningen hängande om texten kapas direkt efter dem.
const DANGLING = /(?:[,;:–—-]|\s+(?:och|eller|men|som|med|för|att|i|på|av|till|från|när|där))+$/i;

export function clipText(input: string, max: number): string {
  const s = (input || "").trim();
  if (s.length <= max) return s;

  const cut = s.slice(0, max);

  // Meningsgräns: punkt/utrop/fråga följt av mellanslag, eller sist i utsnittet.
  // Decimaltal ("40,5") skrivs med komma på svenska, så punkt är trygg som
  // meningsslut — men vi kräver mellanslag efter för att inte kapa i "3.5 mm".
  let best = -1;
  for (const m of cut.matchAll(/[.!?](?=\s|$)/g)) best = m.index + 1;
  if (best >= max * SENTENCE_FLOOR) return cut.slice(0, best).trim();

  // Ingen användbar meningsgräns: kapa vid ordgräns, städa bort ett hängande
  // bindeord och markera att texten fortsätter. Utan ellipsen satte mallen punkt
  // efter fragmentet och det blev "…effekt i realtid, och."
  // Ligger snittet redan på en ordgräns är sista ordet helt och får vara kvar.
  const atBoundary = /[\s.,;:!?)\]]/.test(s.charAt(max));
  const space = cut.lastIndexOf(" ");
  const word = (atBoundary ? cut : space > 0 ? cut.slice(0, space) : cut).trim();
  return word.replace(DANGLING, "").trim() + "…";
}
