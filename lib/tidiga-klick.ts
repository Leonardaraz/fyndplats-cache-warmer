// Tryck på filterknapparna innan sidan blivit interaktiv.
//
// Knapparna syns i server-HTML:en långt innan Reacts JavaScript har körts och
// kopplat på dem. Uppmätt 2026-10-06 på /kategori-sidorna: 0,8 s på dator och
// 2,2–3,1 s på en mobil med 4–6 gånger långsammare processor. Ett tryck under
// den tiden gick förlorat, så kunden tryckte på "Svart", ingenting hände, och
// först nästa tryck fungerade. Det upplevdes som att filtret laddade länge.
//
// Skriptet i sidhuvudet fångar trycken, markerar knappen direkt (samma
// utseende som vald) och lägger dem i en kö. När ShopBrowser har monterats
// ångras markeringen och trycken görs om i samma ordning, nu med React på
// plats. Filtren räknar alltså fortfarande på samma ställe som förut.
//
// Bara element med `data-tidigt` fångas. Värdet är stabilt mellan server och
// klient ("farg:svart"), så ett tryck kan göras om även om React skulle byta
// ut noden. "filter" och "stang" öppnar och stänger panelen (klassen `open`
// på .shopbar), "fler" får bara en lätt markering, resten får `on`.
// Reglagen (pris, mått) och sorteringen fångas inte.

export const TIDIGA_KLICK_SKRIPT =
  "(function(){var k=window.__fpTidiga=[];" +
  "document.addEventListener('click',function(e){if(window.__fpRedo)return;" +
  "var t=e.target,el=t&&t.closest&&t.closest('[data-tidigt]');" +
  "if(!el||el.disabled||el.classList.contains('is-tom'))return;" +
  "var v=el.getAttribute('data-tidigt'),m=el,c='on';" +
  "if(v==='filter'||v==='stang'){m=el.closest('.shopbar');c='open';" +
  "if(!m||v==='stang'&&!m.classList.contains('open'))return}" +
  "else if(v==='fler')c='is-tidigt';" +
  // stopImmediatePropagation: React lyssnar också på document och hade
  // annars kunnat spela upp samma tryck en gång till på egen hand.
  "e.preventDefault();e.stopImmediatePropagation();" +
  "m.classList.toggle(c);k.push({el:el,v:v,m:m,c:c})},true)})()";

type Steg = { el: HTMLElement; v: string; m: HTMLElement; c: string };
type TidigtFonster = Window & { __fpTidiga?: Steg[]; __fpRedo?: boolean };

/** Stänger av fångsten och gör om de köade trycken, ett i taget så att
 *  React hinner rendera mellan dem (en färg kan bli tom av ett annat val). */
export function spelaUppTidigaKlick(w: TidigtFonster = window as TidigtFonster, doc: Document = document): void {
  w.__fpRedo = true;
  const steg = w.__fpTidiga ? w.__fpTidiga.splice(0) : [];
  const nasta = (i: number) => {
    const s = steg[i];
    if (!s) return;
    if (s.m.isConnected) s.m.classList.toggle(s.c);
    const mal = s.el.isConnected
      ? s.el
      : doc.querySelector<HTMLElement>(`[data-tidigt="${s.v.replace(/["\\]/g, "\\$&")}"]`);
    if (mal && !(mal as HTMLButtonElement).disabled && !mal.classList.contains("is-tom")) mal.click();
    setTimeout(() => nasta(i + 1), 0);
  };
  nasta(0);
}
