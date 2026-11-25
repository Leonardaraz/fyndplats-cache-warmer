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
 * Den grå varianten i guiden. Skriptet lyssnar på fem id:n (också med en siffra
 * efter): ov-onskeskyen-generated-wish-button, gowishRoundedButton,
 * gowishBlueButton, gowishWhiteButton och gowishDynamicButton.
 */
export const GOWISH_KNAPP_ID = "gowishWhiteButton";

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

/**
 * GoWish egen sida med samma vara, för en ny flik. Det är länkens mål utan
 * samtycke, och reservvägen med samtycke när skriptet inte finns vid klicket
 * (blockerat av ett tillägg, eller kunden hann före laddningen), så att
 * knappen aldrig är död. Samma adress som skriptet själv lägger i sin iframe.
 */
export function gowishReservadress(produktadress: string): string {
  return `https://gowish.com/quick-add?source=button&crawlerTarget=${encodeURIComponent(produktadress)}`;
}
