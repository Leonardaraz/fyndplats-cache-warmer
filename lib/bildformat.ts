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
