// Lägger en leverantörsbild i Wix Media och ger adressen FÖRST när filen är klar.
//
// VARFÖR INTE Import File. Wix import (`site-media/v1/files/import`) svarar
// direkt med en adress och hämtar källan senare. Slutar hämtningen FAILED står
// adressen kvar på raden och svarar 403 — en död länk som ser frisk ut i
// lagret. Uppmätt två gånger: var sjätte Aosom-bild 2026-09-28 (fel
// Content-Type, `.heif` på en JPEG) och 127 AliExpress-recensioner med döda
// foton 2026-10-06, efter att återställningen 2026-09-28 skrivit
// importadresserna utan att vänta.
//
// Här hämtas bytena av oss, typen bestäms av filens egna byte
// (`bildtypUrSignatur`), filen laddas upp via Generate File Upload URL och
// adressen ges bara när Wix svarat READY. En uppladdad fil saknar
// `sourceUrl`, så mediastädningen (lib/aosom/media-cleanup.ts, `arVarFil`)
// kan aldrig radera den.
//
// Logiken flyttades hit från /api/cron/aosom-review-image-restore 2026-10-06
// så att AliExpress-återställningen använder samma väg. En kopia per rutt hade
// glidit isär.

import { bildtypUrSignatur, medAndelse } from "../reviews/aosom-image-restore";

const WIX_BASE = "https://www.wixapis.com";

/** Wix tar bilder upp till 25 MB; de största källfotona vi mätt är ~9 MB. */
export const MAX_BYTE = 20 * 1024 * 1024;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Aosoms bild-CDN. */
export const arAosomCdn = (vard: string): boolean => vard === "img.aosomcdn.com";

/** AliExpress bild-CDN:er (`ae01.alicdn.com`, `ae-pic-a1.aliexpress-media.com` …). */
export const arAliExpressCdn = (vard: string): boolean =>
  vard === "alicdn.com" || vard.endsWith(".alicdn.com")
  || vard === "aliexpress-media.com" || vard.endsWith(".aliexpress-media.com");

export interface BekraftadDeps {
  fetch?: typeof fetch;
  sov?: (ms: number) => Promise<void>;
  /** Wix-rubriker. Default: WIX_API_TOKEN och WIX_SITE_ID ur miljön. */
  rubriker?: () => Record<string, string>;
  /** Hur länge vi väntar på READY. */
  vantaMs?: number;
}

function wixRubriker(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const vardAv = (u: string): string => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};

/**
 * Källfotots byte, eller null. Bara från en tillåten värd, också efter
 * omdirigering, och högst MAX_BYTE.
 */
export async function hamtaKalla(
  kalla: string,
  tillaten: (vard: string) => boolean,
  deps: BekraftadDeps = {},
): Promise<Uint8Array<ArrayBuffer> | null> {
  const f = deps.fetch ?? fetch;
  if (!tillaten(vardAv(kalla))) return null;
  try {
    const res = await f(kalla, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok || !tillaten(vardAv(res.url || kalla))) {
      await res.body?.cancel();
      return null;
    }
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTE) {
      await res.body?.cancel();
      return null;
    }
    const b = new Uint8Array(await res.arrayBuffer());
    return b.byteLength > 0 && b.byteLength <= MAX_BYTE ? b : null;
  } catch {
    return null;
  }
}

/** Väntar tills Wix bearbetat filen: true = READY, false = FAILED eller för länge. */
async function vantaPaKlar(id: string, deps: BekraftadDeps): Promise<boolean> {
  const f = deps.fetch ?? fetch;
  const sov = deps.sov ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const rubriker = deps.rubriker ?? wixRubriker;
  const varv = Math.max(1, Math.ceil((deps.vantaMs ?? 30_000) / 1500));
  for (let i = 0; i < varv; i++) {
    await sov(1500);
    const res = await f(`${WIX_BASE}/site-media/v1/files/get-file-by-id?fileId=${encodeURIComponent(id)}`, {
      headers: rubriker(),
    });
    if (res.status === 429) {
      await sov(2000);
      continue;
    }
    if (!res.ok) continue;
    const data = (await res.json().catch(() => ({}))) as { file?: { operationStatus?: string } };
    const status = data.file?.operationStatus;
    if (status === "READY") return true;
    if (status === "FAILED") return false;
  }
  return false;
}

/**
 * Laddar upp bytena och returnerar wixstatic-adressen FÖRST när filen är klar.
 *
 * ☠️ Uppladdningen är asynkron som importen: ett lyckat svar betyder inte att
 * filen är klar. Att spara adressen utan att vänta på READY är precis hur en
 * död länk ser frisk ut i lagret.
 */
export async function laddaUppOchBekrafta(
  byte: Uint8Array<ArrayBuffer>,
  namn: string,
  deps: BekraftadDeps = {},
): Promise<string | null> {
  const f = deps.fetch ?? fetch;
  const sov = deps.sov ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const rubriker = deps.rubriker ?? wixRubriker;
  const typ = bildtypUrSignatur(byte);
  if (!typ) return null;

  let uppladdning: string | undefined;
  for (let forsok = 0; forsok < 3 && !uppladdning; forsok++) {
    const res = await f(`${WIX_BASE}/site-media/v1/files/generate-upload-url`, {
      method: "POST",
      headers: rubriker(),
      body: JSON.stringify({ mimeType: typ.mime, fileName: medAndelse(namn, typ.andelse), private: false }),
    });
    if (res.status === 429) {
      await sov(3000 * (forsok + 1));
      continue;
    }
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { uploadUrl?: string };
    uppladdning = data.uploadUrl;
  }
  if (!uppladdning?.startsWith("https://")) return null;

  let fil: { id?: string; url?: string; operationStatus?: string } | undefined;
  try {
    const res = await f(uppladdning, {
      method: "PUT",
      headers: { "Content-Type": typ.mime },
      body: new Blob([byte], { type: typ.mime }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    fil = ((await res.json().catch(() => ({}))) as { file?: typeof fil }).file;
  } catch {
    return null;
  }
  if (!fil?.id || !fil.url || !fil.url.startsWith("https://static.wixstatic.com/")) return null;
  if (fil.operationStatus === "READY") return fil.url;
  if (fil.operationStatus === "FAILED") return null;
  return (await vantaPaKlar(fil.id, deps)) ? fil.url : null;
}

/** Hämtar källfotot och laddar upp det. Null vid minsta fel. */
export async function importeraOchBekrafta(
  kalla: string,
  namn: string,
  tillaten: (vard: string) => boolean,
  deps: BekraftadDeps = {},
): Promise<string | null> {
  const byte = await hamtaKalla(kalla, tillaten, deps);
  return byte ? laddaUppOchBekrafta(byte, namn, deps) : null;
}
