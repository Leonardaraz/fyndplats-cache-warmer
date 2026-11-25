// Unsplash-foton i rutans form från början.
//
// Leonard 2026-11-12: "kolla att sidan med nya temat är optimerad hastighet
// också så den inte blir långsammare".
//
// Bildladdaren (lib/image-loader.ts) tar bort h och skalar Unsplash-foton på
// bredden, så att varje foto behåller sin egen form. Startsidans kategorirutor
// är 4:3 med object-fit:cover. Ett stående foto kom då som 256 × 384 px, fast
// rutan bara visar 256 × 192: webbläsaren hämtade dubbelt så många pixlar och
// klippte bort hälften.
//
// Med ar och fit=crop beskär Unsplash mitt i fotot. Det ger samma utsnitt som
// object-fit:cover visar, eftersom adresserna redan har crop=center. Filen blir
// hälften så stor: 43 kB blev 21 kB i AVIF för det tyngsta fotot (mätt
// 2026-11-12). Laddaren rör inte ar, bara w, q och auto.
export function unsplashIForm(url: string, ar: `${number}:${number}`): string {
  if (!url || !url.includes("images.unsplash.com")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("ar", ar);
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return url;
  }
}

// Wix-bilder i rutans form från början (2026-11-25).
//
// Köpguidernas och blogginläggens omslag är breda, 1200 × 630 (1,9:1) eller
// ännu bredare. Startsidans guidekort visar dem i en ruta som är 4:3 och
// bloggkorten i en kvadrat, båda med object-fit:cover. Bildladdaren skalar på
// bredden och behåller formen, så filen blev för LÅG för rutan och
// förstorades. Mätt mot www och ett lokalt bygge samma dag, på en skärm med
// dubbel täthet: guidekortet 750 × 394 i en ruta som är 542 px hög (1,38
// gånger), bloggkortet 828 × 435 respektive 827 × 362 i en ruta på 534 × 534
// (1,23 och 1,48 gånger). En tredjedel till hälften av filen låg dessutom
// utanför rutan.
//
// Här får bilden rutans form redan hos Wix, som beskär mitt i bilden: samma
// utsnitt som object-fit:cover visar, och filen är lika hög som rutan.
//
// - En adress med fill (…/v1/fill/w_1200,h_630,…): måtten ändras till rutans
//   form. De växer aldrig: den sida som är för lång kortas.
// - En naken adress utan transform: den får en fill i rutans form. Laddaren
//   hade annars gett den `fit`, som behåller bildens egen form.
// - Allt annat (crop, fit, lokala filer, andra värdar) lämnas orört.
//
// ☠️ Använd den bara där rutan har en ANNAN form än bilden och beskär den. Ett
// omslag som visas i sin egen form (blogginläggets sida) ska inte gå hit.
const NAKEN_KANT = 1200;

export function wixIForm(url: string, ar: `${number}:${number}`): string {
  if (!url || !url.includes("static.wixstatic.com")) return url;
  const [a, b] = ar.split(":").map(Number);
  if (!(a > 0) || !(b > 0)) return url;
  // Naken adress: bygg en fill i rutans form, med längsta sidan NAKEN_KANT
  // (laddaren skalar sedan ned den till srcset-bredden).
  const naken = url.match(/^(https?:\/\/static\.wixstatic\.com\/media\/[^/?#]+)\/?$/);
  if (naken) {
    const w = a >= b ? NAKEN_KANT : Math.round((NAKEN_KANT * a) / b);
    const h = a >= b ? Math.round((NAKEN_KANT * b) / a) : NAKEN_KANT;
    return `${naken[1]}/v1/fill/w_${w},h_${h},al_c,q_72/file.webp`;
  }
  // Bara en ren fill: i en crop-adress är första w_/h_ en rektangel i originalet.
  const m = url.match(/^(.*\/v1\/fill\/)w_(\d+),h_(\d+)(.*)$/);
  if (!m) return url;
  const w = Number(m[2]);
  const h = Number(m[3]);
  if (!(w > 0) || !(h > 0)) return url;
  const bredare = w * b > h * a; // bilden är bredare än rutan: korta bredden
  const nyW = bredare ? Math.round((h * a) / b) : w;
  const nyH = bredare ? h : Math.round((w * b) / a);
  return `${m[1]}w_${nyW},h_${nyH}${m[4]}`;
}

/** Fotot i rutans form, vilken av de två bildkällorna det än kommer från. */
export function iRutansForm(url: string, ar: `${number}:${number}`): string {
  return wixIForm(unsplashIForm(url, ar), ar);
}
