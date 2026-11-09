// Produktvideon i galleriet: läser Wix V3-mediaposten och väljer vilken fil som
// spelas. Ren och beroendefri, så node:test laddar den direkt. Servern läser
// posten (lib/products.ts) och galleriet väljer storleken (components/gallery.tsx).
//
// Varför en egen väg bredvid bildlistan, och inte en post i den: galleriets
// bildlista är mer än en lista. Variantvalet pekar på index i den, förladdningen
// räknar grannar i den, helskärmen zoomar i den och alt-texterna nycklas på dess
// fil-id. En video i listan hade flyttat varenda index efter sig. Videon ligger
// därför i en egen ruta och spelas över hjältebilden, och bildlistan är orörd.

/** En spelbar fil. Bara mp4, så att samma fil fungerar i alla webbläsare. */
export interface VideoKalla {
  url: string;
  bredd: number;
  hojd: number;
}

export interface ProduktVideo {
  /** Wix fil-id för videon. Nycklar spelaren, så att en ny video får ett nytt element. */
  id: string;
  /** Stillbild ur videon (static.wixstatic.com). Tom när Wix inte gav någon. */
  poster: string;
  /** Videons format, ur den största filen. */
  bredd: number;
  hojd: number;
  /** Längd i hela sekunder, 0 när den är okänd. */
  langdSek: number;
  /** Stigande bredd, en per storlek. Aldrig tom: utan fil finns ingen video. */
  kallor: VideoKalla[];
}

// Bara Wix egna adresser. En annan värd i en mediapost är ett fel, och den ska
// varken spelas eller hämtas.
const VIDEO_VARD = /^https:\/\/video\.wixstatic\.com\/video\//;
const BILD_VARD = /^https:\/\/static\.wixstatic\.com\/media\//;

/**
 * Minsta upplösning som spelas: 720p. Hjälterutan är 338–390 px bred på en
 * telefon och 544 px på datorn. Med skärmens pixeltäthet behövs 1 000–1 200 px,
 * och 480p (854 px) blir suddigt redan där.
 *
 * Räknat på kortsidan, så att samma regel gäller en stående video (en reel i
 * 9:16): 720p är 1280×720 liggande och 720×1280 stående.
 */
export const MIN_KORTSIDA = 720;

/** Sparläge eller 2g (lib/gallery-preload): högst 480p, också räknat på kortsidan. */
export const SPAR_KORTSIDA = 480;

const kortsida = (k: VideoKalla): number => Math.min(k.bredd, k.hojd);

const tal = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Stillbilden. Wix tar fyra bilder ur videon (f000–f003). Den första är videons
 * allra första bild, och den är ofta svart eller en titelruta. Därför den andra,
 * med den första som reserv.
 */
function valjPoster(posters: unknown): string {
  if (!Array.isArray(posters)) return "";
  const giltiga = posters
    .map((p) => (p && typeof (p as { url?: unknown }).url === "string" ? (p as { url: string }).url : ""))
    .filter((u) => BILD_VARD.test(u));
  return giltiga[1] ?? giltiga[0] ?? "";
}

/**
 * En V3-mediapost (`media.itemsInfo.items[n]`) som video, eller null.
 *
 * Null för allt som inte går att spela: en bild, en post utan mp4, eller filer
 * på en främmande värd eller markerade som privata. Galleriet visar då inget
 * extra, precis som förut.
 */
export function videoUrPost(post: unknown): ProduktVideo | null {
  if (!post || typeof post !== "object") return null;
  const v = (post as { video?: unknown }).video;
  if (!v || typeof v !== "object") return null;
  const video = v as {
    id?: unknown;
    resolutions?: unknown;
    posters?: unknown;
    durationInMilliseconds?: unknown;
  };
  const resolutions = Array.isArray(video.resolutions) ? video.resolutions : [];
  const perBredd = new Map<number, VideoKalla>();
  let langdMs = tal(video.durationInMilliseconds);
  for (const r of resolutions) {
    if (!r || typeof r !== "object") continue;
    const res = r as {
      url?: unknown;
      format?: unknown;
      width?: unknown;
      height?: unknown;
      private?: unknown;
      durationInMilliseconds?: unknown;
    };
    if (res.format !== "mp4" || res.private === true) continue;
    if (typeof res.url !== "string" || !VIDEO_VARD.test(res.url)) continue;
    const bredd = tal(res.width);
    const hojd = tal(res.height);
    if (!bredd || !hojd) continue;
    if (!perBredd.has(bredd)) perBredd.set(bredd, { url: res.url, bredd, hojd });
    if (!langdMs) langdMs = tal(res.durationInMilliseconds);
  }
  const kallor = [...perBredd.values()].sort((a, b) => a.bredd - b.bredd);
  if (!kallor.length) return null;
  const storst = kallor[kallor.length - 1];
  const id = typeof video.id === "string" && video.id
    ? video.id
    : typeof (post as { id?: unknown }).id === "string" ? (post as { id: string }).id : "";
  return {
    id: id || storst.url,
    poster: valjPoster(video.posters),
    bredd: storst.bredd,
    hojd: storst.hojd,
    langdSek: Math.round(langdMs / 1000),
    kallor,
  };
}

/** Den första spelbara videon bland produktens mediaposter, eller null. */
export function forstaVideo(poster: readonly unknown[] | null | undefined): ProduktVideo | null {
  for (const post of poster ?? []) {
    const video = videoUrPost(post);
    if (video) return video;
  }
  return null;
}

/**
 * Filen som ska spelas i en spelare som är `behov` bildpunkter bred.
 *
 * Den minsta fil som räcker i bredd, men aldrig under 720p (MIN_KORTSIDA). Räcker
 * ingen tas den största. Med sparläge tas den största upp till 480p, så att en
 * kund på ett dyrt abonnemang inte drar 1080p för en 27 sekunders film.
 */
export function valjKalla(kallor: readonly VideoKalla[], behov: number, spara = false): VideoKalla | null {
  if (!kallor.length) return null;
  const stigande = [...kallor].sort((a, b) => a.bredd - b.bredd);
  if (spara) {
    const inomTak = stigande.filter((k) => kortsida(k) <= SPAR_KORTSIDA);
    return inomTak[inomTak.length - 1] ?? stigande[0];
  }
  const mal = Number.isFinite(behov) ? behov : 0;
  return stigande.find((k) => k.bredd >= mal && kortsida(k) >= MIN_KORTSIDA) ?? stigande[stigande.length - 1];
}

/** "0:27", "1:05". Tom sträng när längden är okänd. */
export function langdText(sek: number): string {
  if (!Number.isFinite(sek) || sek <= 0) return "";
  const s = Math.round(sek);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Skärmläsarens version: "27 sekunder", "1 minut och 5 sekunder". */
export function langdTal(sek: number): string {
  if (!Number.isFinite(sek) || sek <= 0) return "";
  const s = Math.round(sek);
  const min = Math.floor(s / 60);
  const rest = s % 60;
  const delar: string[] = [];
  if (min) delar.push(`${min} ${min === 1 ? "minut" : "minuter"}`);
  if (rest) delar.push(`${rest} ${rest === 1 ? "sekund" : "sekunder"}`);
  return delar.join(" och ");
}
