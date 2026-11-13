// lib/medlem/tidig.ts
//
// Medlemsrutan på produktsidan, så tidigt det går (Leonard 2026-11-13: rutan
// "Pris för företaget" kom efter nästan en sekund och syntes hoppa in; samma
// för privata medlemmar från Silver till VIP).
//
// Förut startade hämtningen först när Reacts skript hade startat på sidan, och
// servern gjorde sina Wix-uppslag ett i taget. Tre saker gör att rutan nu står
// där direkt:
//
//   1. Hämtningen startar medan sidans HTML läses. Produktsidan bär ett litet
//      skript (medlemsprisSkript) som gör anropet när tecknet `fp_medlem_inne`
//      finns, och rutan tar över samma svar (window.__fpMp). Vid en mjuk
//      navigering kör React inte skriptet; då har kortets avsikt
//      (components/prefetch-link.tsx) eller rutan själv startat hämtningen.
//   2. Platsen hålls från första bilden. Skriptet sätter `data-mp` på <html>
//      med höjden från förra rutan (localStorage `fp_mp_vy`), så rutan fyller
//      en plats i nivåns metall i stället för att skjuta ner resten av sidan.
//   3. Servern läser växeln, medlemmen, orderliggaren, produkten, golvet och
//      prishistoriken samtidigt (app/api/medlem/priser/route.ts). Sidan skickar
//      med sina variant-id, så att golvet kan frågas medan produkten läses.
//
// Inget i det här ger något pris: servern räknar och svarar som förut, och
// golvet lämnar aldrig servern. Skriptet och höjden är bara tidpunkter.
//
// Ren modul utan imports: prövas med node --test (tidig.test.ts).

/** Wix id för "ingen variant" på en produkt utan val (samma som lib/kontakt). */
export const TOM_VARIANT = "00000000-0000-0000-0000-000000000000";

/** Fler variant-id än så tar servern inte emot i ett anrop. */
export const VARIANT_MAX = 100;

/** Samma form som rutten prövar produktens id mot. */
export const ID_RE = /^[A-Za-z0-9-]{1,64}$/;

/** Nyckeln i localStorage för förra rutans höjd och metall. */
export const VY_NYCKEL = "fp_mp_vy";

/** Platsen släpps senast efter så lång tid, också om svaret aldrig kommer. */
export const VANTAN_MAX_MS = 6_000;

/** Ett svar som skriptet eller kortet hämtat gäller så länge för rutan. */
export const TIDIG_MAX_MS = 60_000;

/** Variant-id:n ur frågan (`v=a,b,c`): giltiga, unika och högst VARIANT_MAX. */
export function ledtradUrFraga(v: string | null | undefined): string[] {
  if (!v) return [];
  const ut = new Set<string>();
  for (const d of v.split(",")) {
    if (ut.size >= VARIANT_MAX) break;
    if (ID_RE.test(d)) ut.add(d);
  }
  return [...ut];
}

/** Produktens variant-id i sidans data; en produkt utan val har Wix tomma id. */
export function sidansVarianter(ids: readonly (string | null | undefined)[]): string[] {
  const ut = new Set<string>();
  for (const id of ids) {
    if (ut.size >= VARIANT_MAX) break;
    if (typeof id === "string" && ID_RE.test(id)) ut.add(id);
  }
  return ut.size ? [...ut] : [TOM_VARIANT];
}

/** Adressen rutan, skriptet och kortet hämtar från: samma sträng överallt. */
export function medlemsprisAdress(produktId: string, varianter: readonly string[] = []): string {
  const v = varianter.filter((x) => ID_RE.test(x)).slice(0, VARIANT_MAX);
  return `/api/medlem/priser?p=${encodeURIComponent(produktId)}${v.length ? `&v=${v.join(",")}` : ""}`;
}

/** Förra rutans mått: tecknet ("1" privat, "f" företag), höjden på hela
 *  platsen och på själva rutan, och nivåns nyckel för metallen. */
export type Vy = { t: "1" | "f"; h: number; r: number; n?: string };

const NIVA_RE = /^[a-z]{1,12}$/;

/** Bara rimliga tal och en nivånyckel av bokstäver: värdet kommer från
 *  webbläsarens lagring och hamnar i en stil. */
export function giltigVy(v: unknown): v is Vy {
  const o = v as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return false;
  if (o.t !== "1" && o.t !== "f") return false;
  const tal = (x: unknown) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 600;
  if (!tal(o.h) || !tal(o.r)) return false;
  if (o.n !== undefined && (typeof o.n !== "string" || !NIVA_RE.test(o.n))) return false;
  return true;
}

/** Ska platsen hållas för det här tecknet? Bara när förra rutan hade höjd. */
export function hallPlats(v: unknown, t: string): v is Vy {
  return giltigVy(v) && v.t === t && v.h > 0;
}

/**
 * Skriptet i produktsidans HTML. Det körs där det står, innan något av sidans
 * skript har laddats, och gör två saker när tecknet finns:
 *   - startar hämtningen och lägger löftet i window.__fpMp[produkt];
 *   - håller platsen (`data-mp` på <html>, höjden i `--mp-h` och `--mp-r`,
 *     metallen i `data-mp-niva`) om förra rutan hade höjd och sidan inte är en
 *     reavara (där står en kortare rad i stället för rutan).
 * Allt i try/catch: en sida utan cookies eller localStorage ritas som förut.
 * `hallPlats` och `giltigVy` ovan är samma regler som skriptet skriver ut.
 */
export function medlemsprisSkript(produktId: string, varianter: readonly string[], rea: boolean): string {
  if (!ID_RE.test(produktId)) return "";
  // Id:t och variant-id:na prövas mot ID_RE (bokstäver, siffror och
  // bindestreck), så ingen sträng i skriptet kan bära "<" och avsluta det.
  // Koden själv innehåller "<=" med flit.
  const id = JSON.stringify(produktId);
  const adress = JSON.stringify(medlemsprisAdress(produktId, varianter));
  const plats = rea
    ? ""
    : "var s=null;try{s=JSON.parse(localStorage.getItem(" + JSON.stringify(VY_NYCKEL) + ")||'null')}catch(e){}" +
      "var ok=function(x){return typeof x==='number'&&x%1===0&&x>=0&&x<=600};" +
      "if(s&&s.t===t&&ok(s.h)&&ok(s.r)&&s.h>0&&(s.n===undefined||/^[a-z]{1,12}$/.test(s.n))){" +
      "var d=document.documentElement;d.style.setProperty('--mp-h',s.h+'px');d.style.setProperty('--mp-r',(s.r||s.h)+'px');" +
      "if(s.n)d.setAttribute('data-mp-niva',s.n);else d.removeAttribute('data-mp-niva');" +
      "d.setAttribute('data-mp',id);" +
      "setTimeout(function(){if(d.getAttribute('data-mp')===id)d.removeAttribute('data-mp')}," + VANTAN_MAX_MS + ")}";
  return (
    "(function(){try{" +
    "var m=document.cookie.match(/(?:^|; *)fp_medlem_inne=([^;]*)/),t=m&&m[1];" +
    "if(t!=='1'&&t!=='f')return;" +
    "var id=" + id + ",w=window.__fpMp||(window.__fpMp={});" +
    "w[id]={t:t,at:Date.now(),p:fetch(" + adress + ",{credentials:'same-origin'})" +
    ".then(function(r){return r.ok?r.json():null}).catch(function(){return null})};" +
    plats +
    "}catch(e){}})()"
  );
}
