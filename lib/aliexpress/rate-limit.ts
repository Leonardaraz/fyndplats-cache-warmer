// AliExpress frekvensspärr — den enda felkod vi retryar på.
//
// Bakgrund (Leonards morgonmejl 2026-08-18): spårningspollningen loggade
//
//   {"type":"ISV","code":"ApiCallLimit",
//    "msg":"Api access frequency exceeds the limit. this ban will last 1 seconds"}
//
// Fyra gånger på två dygn (order 10018 och 10019). Ingen order gick förlorad —
// tasken står kvar som `ordered` och nästa körning tar om den — men cykeln
// slösas bort och felet hamnar i vaktmejlet som om något vore trasigt.
//
// Spärren är en GATEWAY-avvisning: anropet räknas mot frekvenskvoten och
// vänder direkt, innan AE ens tittar på vad vi bad om. Den kommer tillbaka som
// `error_response` på toppnivå, till skillnad från affärsfel som svarar 200 med
// en felkod i nyttolasten. Skillnaden är avgörande för att retry ska vara
// säkert: en avvisad order.create har aldrig skapat någon order.
//
// Vi retryar därför BARA på den här formen, och BARA på ApiCallLimit. Allt
// annat (MissingParameter, ogiltig token, affärsfel) är permanent för det
// anropet och ska fälla direkt — en retry där hade bara fördröjt ett fel som
// ändå kommer.

/** Hur många gånger ett strypt anrop får göras om. Spärren varar sekunder. */
export const RATE_LIMIT_MAX_RETRIES = 2;
/** Väntetid när AE inte säger hur länge spärren gäller. */
const DEFAULT_BAN_MS = 1200;
/** Tak — en spärr som påstås vara längre än så är inte värd att vänta ut i en
 *  cron-körning med maxDuration; låt anropet fälla och tas nästa körning. */
const MAX_WAIT_MS = 5000;
/** Marginal ovanpå AE:s egen siffra: banns utgång är inte på millisekunden. */
const MARGIN_MS = 250;

/**
 * True om felet är AE:s frekvensspärr — alltså värt att göra om.
 *
 * Tar emot `error_response`-objektet som det ser ut i svaret. Tål att fältet
 * saknas eller har fel form: då är det inte en spärr, och vi retryar inte.
 */
export function isRateLimitError(errorResponse: unknown): boolean {
  if (!errorResponse || typeof errorResponse !== "object") return false;
  const code = (errorResponse as { code?: unknown }).code;
  return String(code ?? "").trim() === "ApiCallLimit";
}

/**
 * Hur länge vi ska vänta innan omförsöket.
 *
 * AE skriver ut spärrens längd i klartext ("this ban will last 1 seconds") —
 * vi läser den när den finns hellre än att gissa, och lägger på marginal.
 * Saknas eller är den orimlig används standardvärdet respektive taket.
 */
export function rateLimitWaitMs(msg: unknown): number {
  const m = /ban will last\s+(\d+(?:\.\d+)?)\s*second/i.exec(String(msg ?? ""));
  const sek = m ? Number(m[1]) : NaN;
  if (!Number.isFinite(sek) || sek <= 0) return DEFAULT_BAN_MS;
  return Math.min(MAX_WAIT_MS, Math.round(sek * 1000) + MARGIN_MS);
}

/**
 * Räknare för AE:s frekvensspärr.
 *
 * Vi VISSTE redan när vi blev strypta — `isRateLimitError` avgör det på varje
 * anrop — men siffran kastades bort, så frågan "hur nära taket ligger vi?"
 * gick bara att gissa på (audit 2026-08-24). Med räknaren i synk-summeringen
 * och morgonmejlet blir marginalen till taket något man kan läsa av, och
 * budgethöjningar något man kan grunda i mätning i stället för magkänsla.
 *
 * Processlokal och best-effort: en serverless-instans lever kort, och siffran
 * är ett trendmått per körning — inte bokföring.
 */
let strypningar = 0;

/** Anropas när ett anrop faktiskt blev strypt (ApiCallLimit). */
export function noteRateLimited(): void {
  strypningar++;
}

/** Nollställer räknaren (anropas i början av en körning). */
export function resetRateLimitCount(): void {
  strypningar = 0;
}

/** Antal strypta anrop sedan senaste nollställning. */
export function rateLimitCount(): number {
  return strypningar;
}
