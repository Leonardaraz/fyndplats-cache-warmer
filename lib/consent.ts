// Marknads-/spårningssamtycke. CookieConsent (components/cookieconsent.tsx)
// lagrar användarens val i localStorage["fp_cookie_consent"] = "all" | "necessary".
//
// Meta Pixel + CAPI är marknadsföringsverktyg: de sätter _fbp/_fbc-cookies och
// matchar besökaren mot ett Facebook-konto. De fyrar därför BARA när användaren
// uttryckligen godkänt "alla" cookies. GA4 körs idag ogated, men annons-pixeln
// är känsligare → vi följer kodbasens egen dokumenterade konvention (se
// kommentaren i cookieconsent.tsx: "gated on fp_cookie_consent === 'all'").

export const CONSENT_KEY = "fp_cookie_consent";

// Samma val speglas i en cookie med samma namn. localStorage räcker för allt
// som körs i webbläsaren, men SERVERN kan inte läsa det — och /tack behöver
// veta valet innan den renderar, eftersom Google-modulens konfiguration
// innehåller kundens e-postadress. Utan cookien hamnar adressen i sidans
// HTML även för den som valt "bara nödvändiga" (granskning 2026-08-19).
//
// Cookien är inte hemlig och sätts från klienten: den bär bara samma "all" |
// "necessary" som redan ligger i localStorage. SameSite=Lax, ett år, ingen
// HttpOnly (klienten måste kunna skriva den).
export const CONSENT_COOKIE = CONSENT_KEY;
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

/** Skriver samtyckescookien. No-op utanför webbläsaren. */
export function writeConsentCookie(value: "all" | "necessary"): void {
  if (typeof document === "undefined") return;
  try {
    // Secure på https. Utan den kan en angripare på ett öppet nät både läsa och
    // SKRIVA värdet över klartext-http, och en påtvingad "all" får servern att
    // bädda in kundens e-post i /tack. Utelämnas på localhost, där http är
    // normalfallet och en secure-cookie tyst inte skulle sättas alls.
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax${secure}`;
  } catch {
    /* cookies avstängda → localStorage-vägen får räcka */
  }
}

/**
 * Serverns läsning av samma val. Tar cookiens råvärde.
 *
 * Default är NEKANDE: saknas cookien (förstagångsbesökare, cookies avstängda)
 * behandlas det som "inte samtyckt". Ett utebliven enkätruta är ett mycket
 * mindre fel än en e-postadress i HTML hos någon som sagt nej.
 */
export function marketingConsentFromCookie(raw: string | null | undefined): boolean {
  return String(raw ?? "").trim() === "all";
}

// Custom DOM-event som cookieconsent.tsx dispatchar när användaren väljer, så
// att MetaPixel + tracking-hjälparna kan reagera direkt (utan sidladdning).
export const CONSENT_EVENT = "fp-consent-change";

export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "all";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Consent Mode v2
// ---------------------------------------------------------------------------
// Mätning 2026-09-08 (uppdrag 7): Google Ads-taggen AW-11073697020 fyrade
// page_view mot google.com/ccm/collect OCH ga-audiences MED en beständig
// annons-identifierare (auid=…) för en besökare som aktivt valt "Endast
// nödvändiga". Orsaken: gtag.js laddades ogated och ingen samtyckessignal
// skickades någonsin — parametern gcd var teckenidentisk i båda körningarna,
// alltså nådde vårt val aldrig Google.
//
// npa=1 låg visserligen på, men den begränsar hur Google FÅR ANVÄNDA datan,
// inte att den samlas in. Den är alltså inget försvar.
//
// Consent Mode v2 stänger det: alla fyra signalerna nekas som standard och
// beviljas först när besökaren väljer "Godkänn alla".

/** Signalerna vi styr. Ordningen är enbart kosmetisk. */
export const CONSENT_SIGNALS = [
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "analytics_storage",
] as const;

export type ConsentSignal = (typeof CONSENT_SIGNALS)[number];
export type ConsentState = Record<ConsentSignal, "granted" | "denied">;

/**
 * Samtyckestillståndet för ett val.
 *
 * Beslut 2026-09-08 (Leonard): ALLA FYRA nekas för "necessary", inklusive
 * analytics_storage. Bannern lovar besökaren "Endast nödvändiga" — att ändå
 * köra analyscookies motsäger det vi säger. Priset är att GA4 mäter cookielöst
 * för dem som tackar nej, så användar- och sessionssiffrorna sjunker jämfört
 * med i dag. Det är väntat, inte ett fel.
 */
export function consentState(choice: "all" | "necessary" | null | undefined): ConsentState {
  const v = choice === "all" ? "granted" : "denied";
  return {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
  };
}

function inlineState(value: "granted" | "denied"): string {
  return CONSENT_SIGNALS.map((s) => `${s}:'${value}'`).join(",");
}

/**
 * Taggen mäter bara på butikens egen adress. Varje produktionsbygge har också en
 * egen vercel.app-adress med VERCEL_ENV production, så taggen skrevs ut där, och
 * Vercel öppnar den när bygget är klart. Googles tagg såg då fem sådana adresser
 * och föreslog dem för mätning över flera domäner (Leonards skärmbilder
 * 2026-11-08). På alla andra värdar blir gtag en tom funktion och ingenting köas.
 */
export const MATVARD = "www.fyndplats.se";

/**
 * Den synkrona bootstrap-raden i <head>/<body>. Måste köras FÖRE gtag.js, för
 * en default som anländer efter biblioteket är verkningslös — därför en rå
 * <script> och inte next/script.
 *
 * Den läser dessutom localStorage direkt och beviljar på plats för en
 * återvändande besökare som redan sagt ja. Utan den raden skulle varje
 * sidladdning för en samtyckande kund börja i "denied" och uppgraderas först
 * efter hydrering — och sidvisningen hinner då gå iväg utan samtycke.
 *
 * wait_for_update ger förstagångsbesökaren en kort stund att hinna klicka
 * innan den cookielösa pingen skickas.
 *
 * Den första sidvisningen köas här, med adressen, hänvisaren och titeln som
 * de är när sidan öppnas (send_page_view:false stänger av configens egen).
 * Taggen hämtas först när besökaren rör sidan (taggLaddare nedan), och då kan
 * ett tryck på en länk redan ha bytt adress: configens egen sidvisning hade
 * fått den nya adressen och tappat källan, alltså utm-parametrarna från
 * ChatGPT och Googles srsltid. Sidbyten efter att taggen kommit räknar Googles
 * egen historiklyssnare som förut: send_page_view:false stänger inte av den
 * (developers.google.com/analytics/devguides/collection/ga4/views, läst
 * 2026-11-12).
 *
 * KASTAR på ett mät-ID som inte är rent alfanumeriskt. Strängen renderas via
 * dangerouslySetInnerHTML, så ett citattecken i ID:t skulle bryta ut ur
 * JS-literalen och köra godtycklig kod på VARJE sida. I dag matas alltid
 * modulkonstanten G-W6NZ87CX2Q in och kontrollen kan aldrig falla — men
 * signaturen tar en string, och flyttas ID:t någon gång till en env-variabel
 * (NEXT_PUBLIC_GA_ID el. dyl.) är det precis så hålet uppstår.
 *
 * Att kasta är avsiktligt hellre än att tyst rendera ingenting: ett trasigt
 * bygge lagas på minuter, en tyst bortfallen mätning upptäcks efter veckor.
 */
function kontrolleraMatId(funktion: string, measurementId: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(measurementId)) {
    throw new Error(
      `${funktion}: otillåtet mät-ID ${JSON.stringify(measurementId)} — ` +
        "bara bokstäver, siffror, bindestreck och understreck får bäddas in i sidans script-tagg.",
    );
  }
}

export function consentBootstrapScript(measurementId: string): string {
  kontrolleraMatId("consentBootstrapScript", measurementId);
  return (
    `window.dataLayer=window.dataLayer||[];` +
    `if(location.hostname!=='${MATVARD}'){window.gtag=function(){};}else{` +
    `window.gtag=function(){dataLayer.push(arguments);};` +
    `gtag('consent','default',{${inlineState("denied")},wait_for_update:500});` +
    `try{if(localStorage.getItem('${CONSENT_KEY}')==='all')` +
    `gtag('consent','update',{${inlineState("granted")}});}catch(e){}` +
    `gtag('js',new Date());` +
    `gtag('config','${measurementId}',{send_page_view:false});` +
    `gtag('event','page_view',{page_location:location.href.split('#')[0],` +
    `page_referrer:document.referrer,page_title:document.title});}`
  );
}

// ---------------------------------------------------------------------------
// Googles tagg laddas när besökaren rör sidan (Leonard 2026-11-12)
// ---------------------------------------------------------------------------
// gtag.js är 202 kB packad och 629 kB uppackad (mätt 2026-11-12) och höll
// telefonens processor upptagen ungefär 0,2 s på varje produktsida, mitt i
// sidans första sekunder. Butiken kör inga annonser, och Leonard valde att
// taggen hämtas först när besökaren rör sidan. Händelserna köas under tiden i
// dataLayer och skickas när biblioteket kommer, så inget tappas på vägen.
//
// Tre undantag, för att mätningen ska stå sig:
//   1. Tacksidan hämtar taggen direkt. Köpet skickas när sidan öppnas
//      (components/thankyou.tsx), och kunden kommer dit med en ny sidladdning
//      (window.location.replace i kassan) och läser ofta bara "Tack".
//   2. Den som inte rör sidan alls får taggen 10 s efter load, så den som
//      bara läser räknas också. Lighthouse hinner sluta mäta före dess.
//   3. Byttes adressen innan taggen kom (ett tryck på en länk), skickas en
//      sidvisning för den nya sidan när taggen har kört, med landningssidan
//      som hänvisare. Googles historiklyssnare fanns inte då och såg bytet
//      inte.
//
// ☠️ Taggen hämtas när trycket är SLUT och sidan har ritat sitt svar, aldrig
// på pointerdown eller touchstart. Biblioteket ligger ofta redan i webbläsarens
// cache (Google sparar det i 15 minuter, och den som öppnar flera produkter
// från ChatGPT laddar om sidan för varje). Då körs det några millisekunder
// efter att det begärts, och hade det begärts när fingret landade hade
// webbläsaren fått köra 0,2 s Google-kod innan den hann svara på samma tryck.

/** Det som räknas som att röra sidan: slutet av ett tryck eller ett klick,
 *  en tangent, rullning och musrörelse. Rullning i en inre ruta (galleriet,
 *  raderna i sidled) fångas också, eftersom lyssnarna sitter i fångstfasen.
 *  pointerdown och touchstart är med flit borta (se ☠️ ovan). */
export const TAGG_INTERAKTIONER = ["pointerup", "keydown", "touchend", "wheel", "scroll", "mousemove"] as const;

/** Sidor där taggen hämtas direkt: köpet skickas när sidan öppnas. */
export const TAGG_DIREKT = ["/tack"] as const;

/** Taggen hämtas senast så här länge efter load, också utan interaktion. */
export const TAGG_RESERV_MS = 10_000;

/**
 * Laddaren som hämtar gtag.js. Körs efter consentBootstrapScript i samma
 * <script>, så kön (samtycket, config och den första sidvisningen) ligger
 * redan i dataLayer när biblioteket kommer. Bara på butikens egen adress
 * (MATVARD): på andra värdar är gtag en tom funktion och biblioteket onödigt.
 */
export function taggLaddare(measurementId: string): string {
  kontrolleraMatId("taggLaddare", measurementId);
  const direkt = TAGG_DIREKT.map((p) => p.replace(/\//g, "\\/")).join("|");
  return (
    `(function(){` +
    `if(location.hostname!=='${MATVARD}')return;` +
    `var w=window,d=document,klar=false,landning=location.href.split('#')[0],` +
    `ev=${JSON.stringify(TAGG_INTERAKTIONER).replace(/"/g, "'")},o={capture:true,passive:true};` +
    `function av(){for(var i=0;i<ev.length;i++)w.removeEventListener(ev[i],rord,o);}` +
    `function ladda(){` +
    `if(klar)return;klar=true;av();` +
    `var s=d.createElement('script');s.async=true;` +
    `s.src='https://www.googletagmanager.com/gtag/js?id=${measurementId}';` +
    `s.onload=function(){var h=location.href.split('#')[0];` +
    `if(h!==landning)gtag('event','page_view',{page_location:h,page_referrer:landning,page_title:d.title});};` +
    `d.head.appendChild(s);}` +
    // Efter nästa målning: requestAnimationFrame körs före bildrutan och
    // setTimeout i den efter, så trycket hinner ritas innan taggen begärs.
    `function rord(){av();requestAnimationFrame(function(){setTimeout(ladda,0);});}` +
    `if(/^(${direkt})(\\/|$)/.test(location.pathname)){ladda();return;}` +
    `for(var i=0;i<ev.length;i++)w.addEventListener(ev[i],rord,o);` +
    `function reserv(){setTimeout(ladda,${TAGG_RESERV_MS});}` +
    `if(d.readyState==='complete')reserv();else w.addEventListener('load',reserv);` +
    `})();`
  );
}

/**
 * Skickar samtyckesuppdateringen när besökaren klickar. No-op om gtag saknas —
 * vilket är normalfallet utanför produktion, där taggen inte skrivs ut alls.
 */
export function pushConsentUpdate(choice: "all" | "necessary"): void {
  if (typeof window === "undefined") return;
  const g = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof g !== "function") return;
  try {
    g("consent", "update", consentState(choice));
  } catch {
    /* GA4 ska aldrig krascha sidan */
  }
}

// ---------------------------------------------------------------------------
// Öppna bannern igen
// ---------------------------------------------------------------------------
// Sekretesspolicyn lovar: "Du kan när som helst ändra eller återkalla ditt
// samtycke." Bannern visar sig bara när localStorage saknar värde, så innan
// den här vägen fanns gick löftet inte att hålla — den som valt en gång satt
// fast i sitt val. Med Consent Mode blir valet dessutom bindande på riktigt.

export const CONSENT_REOPEN_EVENT = "fp-consent-reopen";
const REOPEN_KEY = "fp_consent_reopen";

/** Begär att samtyckesbannern visas igen. Anropas från sidfotens knapp. */
export function reopenConsentBanner(): void {
  if (typeof window === "undefined") return;
  // Flaggan sätts FÖRE eventet, och det är hela poängen: CookieConsent laddas
  // med next/dynamic + ssr:false och monteras först när webbläsaren är idle.
  // Hinner besökaren scrolla ner och trycka innan dess finns ingen lyssnare
  // och eventet försvinner spårlöst — knappen ser trasig ut. Flaggan gör att
  // bannern öppnas ändå, så fort komponenten monterar.
  try {
    window.sessionStorage.setItem(REOPEN_KEY, "1");
  } catch {
    /* sessionStorage avstängt → eventet nedan får räcka */
  }
  try {
    window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
  } catch {
    /* ignorera */
  }
}

/**
 * Läser en väntande begäran och nollställer den. Sessionsbunden med flit:
 * en obesvarad begäran ska inte ligga kvar och öppna bannern vid nästa besök.
 */
export function takeReopenRequest(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(REOPEN_KEY) !== "1") return false;
    window.sessionStorage.removeItem(REOPEN_KEY);
    return true;
  } catch {
    return false;
  }
}
