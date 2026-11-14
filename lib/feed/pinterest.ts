// lib/feed/pinterest.ts
//
// Pinterest-flödet (/feed/pinterest.xml) byggs OVANPÅ Google-flödet, som
// PriceRunner- och Prisjakt-flödena, så att alla visar samma katalog, samma
// länkar och samma bilder. Pinterest läser Googles format (RSS 2.0 + g:), men
// Pinterests egen kontroll ("Testa din datakälla", körd 2026-11-15 på ett
// utdrag ur Google-flödet) gav tre varningar. Två rättas här:
//
//  1. Lagerstatus. Pinterest tar bara "in stock", "out of stock" och "preorder",
//     med mellanslag. Google-flödet skriver in_stock och out_of_stock, och då
//     gav kontrollen varning 163 på varje vara (provat: "in stock" tog bort den).
//  2. Extrabilderna. Pinterest delar g:additional_image_link på kommatecken, och
//     Wix bildadresser med storlek (".../v1/fit/w_2000,h_2000,q_90/file.jpg")
//     har kommatecken. Bilden föll bort (varning 137). Här blir adressen
//     originalbilden, ".../media/<fil>", som saknar kommatecken. Högst tio.
//
// Den tredje varningen (126: google_product_category med bara en eller två
// nivåer) rör kategorikartan och ändras inte här.
//
// Dessutom:
//  - g:gtin från lib/feed/pinterest-gtin.ts, bara när koden har rätt
//    kontrollsiffra. Kartan nycklas på variantens id (flödets g:id).
//  - g:identifier_exists tas bort. Fältet finns inte i Pinterests spec.
//  - Kanalens beskrivning säger Pinterest i stället för Google Merchant Center.
//
// Ren funktion utan importer, så att node:test kan köra den direkt; routen
// skickar in kartan.

const ITEM_RE = /<item>[\s\S]*?<\/item>/g;
const ID_RAD_RE = /(\n([ \t]*)<g:id>([^<]*)<\/g:id>)/;
const TILLGANG_RE = /<g:availability>([^<]*)<\/g:availability>/;
const EXTRA_RE = /\n?[ \t]*<g:additional_image_link>([^<]*)<\/g:additional_image_link>/g;
const IDENT_RE = /\n?[ \t]*<g:identifier_exists>[^<]*<\/g:identifier_exists>/g;
const BILD_RE = /<g:image_link>([^<]*)<\/g:image_link>/;
const WIX_STORLEK_RE = /^(https:\/\/static\.wixstatic\.com\/media\/[^/?#]+)\/v1\/.*$/;

/** Högst så här många extrabilder per vara (Pinterests gräns). */
export const PINTEREST_MAX_EXTRABILDER = 10;

/** Googles värden till Pinterests. Ett okänt värde får mellanslag i stället för understreck. */
export function pinterestTillganglighet(varde: string): string {
  const v = varde.trim().toLowerCase();
  if (v === "in_stock" || v === "in stock") return "in stock";
  if (v === "out_of_stock" || v === "out of stock") return "out of stock";
  if (v === "preorder" || v === "backorder") return "preorder";
  return v.replace(/_/g, " ");
}

/**
 * Wix bildadress med storlek → originalbilden. Andra adresser lämnas som de är.
 * null när adressen ändå har ett kommatecken (Pinterest delar på det).
 */
export function pinterestBild(url: string): string | null {
  const ren = url.trim().replace(WIX_STORLEK_RE, "$1");
  if (!ren || ren.includes(",") || !/^https?:\/\//.test(ren)) return null;
  return ren;
}

/** GTIN-8, -12, -13 eller -14 med rätt kontrollsiffra. */
export function giltigtPinterestGtin(kod: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(kod)) return false;
  const siffror = [...kod].map(Number);
  const kontroll = siffror.pop()!;
  let summa = 0;
  siffror.reverse().forEach((s, i) => {
    summa += s * (i % 2 === 0 ? 3 : 1);
  });
  return (10 - (summa % 10)) % 10 === kontroll;
}

function tillPinterestVara(item: string, gtin: Readonly<Record<string, string>>): string {
  let ut = item.replace(TILLGANG_RE, (_m, v: string) => `<g:availability>${pinterestTillganglighet(v)}</g:availability>`);

  // Extrabilderna: rena, utan dubbletter och utan huvudbilden, högst tio, på
  // samma plats som den första stod.
  const huvudbild = pinterestBild(BILD_RE.exec(ut)?.[1] ?? "") ?? "";
  const sedda = new Set<string>([huvudbild]);
  const bilder: string[] = [];
  let indrag = "";
  let forsta = -1;
  ut = ut.replace(EXTRA_RE, (m, url: string, offset: number) => {
    if (forsta < 0) {
      forsta = offset;
      indrag = /\n?([ \t]*)</.exec(m)?.[1] ?? "";
    }
    const ren = pinterestBild(url);
    if (ren && !sedda.has(ren) && bilder.length < PINTEREST_MAX_EXTRABILDER) {
      sedda.add(ren);
      bilder.push(ren);
    }
    return "";
  });
  if (forsta >= 0 && bilder.length > 0) {
    const rader = bilder.map((b) => `\n${indrag}<g:additional_image_link>${b}</g:additional_image_link>`).join("");
    ut = ut.slice(0, forsta) + rader + ut.slice(forsta);
  }

  ut = ut.replace(IDENT_RE, "");

  const idRad = ID_RAD_RE.exec(ut);
  if (idRad) {
    const kod = gtin[idRad[3].trim()];
    if (kod && giltigtPinterestGtin(kod)) {
      ut = ut.replace(idRad[1], `${idRad[1]}\n${idRad[2]}<g:gtin>${kod}</g:gtin>`);
    }
  }
  return ut;
}

/** Google-flödet → Pinterest-flödet. Samma varor i samma ordning. */
export function tillPinterest(googleXml: string, gtin: Readonly<Record<string, string>> = {}): string {
  const forstaVara = googleXml.indexOf("<item>");
  const huvud = forstaVara < 0 ? googleXml : googleXml.slice(0, forstaVara);
  const resten = forstaVara < 0 ? "" : googleXml.slice(forstaVara);
  const nyttHuvud = huvud.replace(
    /(<description>[^<]*?)för Google Merchant Center/,
    "$1för Pinterest",
  );
  return nyttHuvud + resten.replace(ITEM_RE, (item) => tillPinterestVara(item, gtin));
}

/** Siffror till loggen: varor, varor med g:gtin och extrabilder. */
export function pinterestRakning(xml: string): { varor: number; gtin: number; extrabilder: number; iLager: number } {
  return {
    varor: (xml.match(/<item>/g) ?? []).length,
    gtin: (xml.match(/<g:gtin>/g) ?? []).length,
    extrabilder: (xml.match(/<g:additional_image_link>/g) ?? []).length,
    iLager: (xml.match(/<g:availability>in stock<\/g:availability>/g) ?? []).length,
  };
}
