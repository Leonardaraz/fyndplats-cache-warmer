// GoWish: önskelistknappen på produktsidan (Leonard 2026-11-25).
//
// Fyndplats har ett samarbetsavtal med GoWish, en tjänst för önskelistor. Deras
// knapp ("Wishbutton") låter kunden lägga varan i sin önskelista hos dem. Guiden
// är https://gowish.com/sv/button-installation: ett skript, en stilmall och en
// knapp med ett av deras id:n.
//
// SKRIPTET ÄR LÄST 2026-11-25 (gowish-iframe.js, 19 811 tecken, ändrat hos dem
// 2026-11-12, sha256 42d3ab66…e7f9). Det här gör det, och inget annat:
//
// - När det laddas: lägger lyssnare på dokumentet (klick, meddelanden,
//   synlighet, bakåt, Escape) och sätter window.GoWish. Det läser ingenting ur
//   sidan, gör inga anrop och sätter inga kakor.
// - Vid klick på en <button> med ett av deras fem id:n: läser data-region ur
//   skript-taggen (som det hittar på id:t gowish-iframescript) och
//   data-producturl ur knappen. Saknas data-producturl tar det hela
//   window.location.href, alltså också utm- och annonsparametrar.
// - Det skickar BARA adressen. Namn, bild och pris hämtar GoWish egna servrar
//   från sidan på den adressen, efter att kunden loggat in hos dem.
// - På dator: en <dialog> med en iframe till gowish.com/quick-add, och en egen
//   post i historiken så att bakåt stänger rutan.
// - På telefon: först ett försök att öppna appen (gowish://quick-add…), sedan
//   samma ruta om appen inte tog över.
//
// ☠️ Skriptet hämtas bara med samtycke till alla cookies, som Trustpilots och
// Klarnas moduler (lib/use-marketing-consent.ts). Utan samtycke är knappen en
// vanlig länk till GoWish egen sida, och ingenting hämtas därifrån förrän
// kunden trycker (components/gowish-knapp.tsx). Sekretesspolicyn säger samma sak.
//
// ☠️ Stilmallen i guiden laddas INTE. Den hämtar typsnittet Geist från en
// fjärde part (fonts.cdnfonts.com) och ikonerna från GoWish lagring, på varje
// sidvisning. Knappens stil och rutans regler står i stället i
// app/produkt/[slug]/gowish.css, med ikonen i komponenten.

/** GoWish skript, från deras egen lagring som guiden säger. Det ändras hos dem utan förvarning. */
export const GOWISH_SKRIPT = "https://storage.googleapis.com/gowish-button-prod/js/gowish-iframe.js";

/** Skriptet letar upp sin egen tagg på det här id:t för att läsa regionen. */
export const GOWISH_SKRIPT_ID = "gowish-iframescript";

/**
 * "global" ger gowish.com och appens schema gowish://. Utan region väljer
 * skriptet Danmark: onskeskyen.dk och onskeskyen://.
 */
export const GOWISH_REGION = "global";

/**
 * Den runda varianten i guiden, utan text, "bredvid din produkt" (Leonard
 * 2026-11-26: "den varianten som är bara en ruta ... bredvid vår egen med
 * gowish symbolen"). Skriptet lyssnar på fem id:n (också med en siffra efter):
 * ov-onskeskyen-generated-wish-button, gowishRoundedButton, gowishBlueButton,
 * gowishWhiteButton och gowishDynamicButton, och behandlar dem lika: id:t
 * väljer bara utseendet i deras stilmall, som inte laddas här. Ett tryck på
 * ikonen inne i knappen räknas som ett tryck på knappen (closest("button")).
 */
export const GOWISH_KNAPP_ID = "gowishRoundedButton";

/** Knappens namn för skärmläsare och i rutan som visas när pekaren vilar på den. */
export const GOWISH_KNAPP_TEXT = "Lägg till i GoWish";

// Samma adress som sidans canonical och og:url (app/produkt/[slug]/page.tsx).
// lib/site-urls.ts har den också, men den filen läser katalogen och får inte
// följa med till webbläsaren.
const SAJT = "https://www.fyndplats.se";

/**
 * Adressen GoWish får: varans kanoniska adress, utan val, utm, gclid eller
 * något annat ur adressfältet. Sidan är densamma för GoWish robot vilken
 * variant kunden än har valt (valet görs i webbläsaren, sidan är ISR-cachad).
 */
export function gowishProduktadress(slug: string): string {
  return `${SAJT}/produkt/${slug}`;
}

// ☠️ GOWISH RUTA VISAR ENGELSKA OM ADRESSEN INTE BÖRJAR MED /sv/ (mätt
// 2026-11-25, Leonard: "Allt med go wish … ska stå på svenska"). Skriptet
// öppnar gowish.com/quick-add utan språk i adressen. En svensk webbläsare
// skickas då vidare till /sv/login, men texten på sidan står kvar på
// engelska ("Sign in to add the wish"). Med /sv/quick-add från början står
// den på svenska ("Logga in för att lägga till önskningen"), också i en
// engelsk webbläsare. Skriptet har inget språkval (bara region: global,
// denmark, norway), så butiken byter adressen själv:
//
// - länken utan samtycke, och reservvägen, går direkt till /sv/quick-add,
// - och när skriptet har skapat sin ruta byter knappen ramens adress till
//   /sv/quick-add (components/gowish-knapp.tsx).
//
// Byter GoWish namn på ramen eller adressen händer ingenting: rutan öppnas
// då som deras skript vill, på engelska.

/** Början på adressen som GoWish skript ger sin ruta med regionen global. */
export const GOWISH_RUTA = "https://gowish.com/quick-add?";

/** Samma sida på svenska. */
export const GOWISH_RUTA_SV = "https://gowish.com/sv/quick-add?";

/** Id på ramen och rutan som GoWish skript skapar (GOWISH_IFRAME_ID och GOWISH_DIALOG_ID hos dem). */
export const GOWISH_RAM_ID = "gowish-iframe";
export const GOWISH_DIALOG_ID = "gowish-iframe-dialog";

/**
 * Så länge väntar knappen på att skriptet ska ge ramen en adress. På telefon
 * får appen först upp till tio sekunder på sig att ta över (APP_OPEN_MAX_WAIT_MS
 * i skriptet), sedan laddas rutan.
 */
export const GOWISH_VANTA_MS = 20_000;

/**
 * Rutans adress på svenska, eller null när adressen inte är den engelska
 * rutans (redan svensk, en annan region, tom eller något skriptet börjat
 * skriva på ett nytt sätt). Allt efter frågetecknet behålls tecken för tecken.
 */
export function gowishSvenskRuta(src: string | null | undefined): string | null {
  return typeof src === "string" && src.startsWith(GOWISH_RUTA) ? GOWISH_RUTA_SV + src.slice(GOWISH_RUTA.length) : null;
}

/**
 * GoWish egen sida med samma vara, på svenska, för en ny flik. Det är länkens
 * mål utan samtycke, och reservvägen med samtycke när skriptet inte finns vid
 * klicket (blockerat av ett tillägg, eller kunden hann före laddningen), så
 * att knappen aldrig är död. Samma adress som rutan får.
 */
export function gowishReservadress(produktadress: string): string {
  return `${GOWISH_RUTA_SV}source=button&crawlerTarget=${encodeURIComponent(produktadress)}`;
}
