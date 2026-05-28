import { isDryRun } from "../audit";

// Importerar externa bilder (t.ex. AliExpress alicdn) till Wix Media Manager
// och returnerar wixstatic-URL:erna som V3-katalogen vill ha i `media`-fältet.
// https://dev.wix.com/docs/api-reference/assets/media/media-manager/files/import-file

const WIX_BASE = "https://www.wixapis.com";

function mediaHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token,
  };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) headers["wix-site-id"] = siteId;
  return headers;
}

function guessMime(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

export interface ImportedMedia {
  url: string;
  id: string;
}

/** Importerar en enskild bild via URL. Dry-run returnerar källans URL oförändrad. */
export async function importMediaByUrl(url: string, displayName: string): Promise<ImportedMedia> {
  if (isDryRun()) return { url, id: `dry-${displayName}` };

  const res = await fetch(`${WIX_BASE}/site-media/v1/files/import`, {
    method: "POST",
    headers: mediaHeaders(),
    body: JSON.stringify({ url, mimeType: guessMime(url), displayName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix media-import misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { file?: { id?: string; url?: string } };
  if (!data.file?.url) throw new Error("Wix media-import: ingen URL i svaret.");
  return { url: data.file.url, id: data.file.id ?? "" };
}

/**
 * Importerar flera bilder parallellt. Misslyckade bilder hoppas över (med
 * varning i konsolen) hellre än att fälla hela importen — vi vill hellre ha
 * några bilder än ingen produkt.
 */
export async function importMediaUrls(
  items: { url: string; displayName: string }[],
): Promise<ImportedMedia[]> {
  const results = await Promise.allSettled(items.map((i) => importMediaByUrl(i.url, i.displayName)));
  return results
    .filter((r): r is PromiseFulfilledResult<ImportedMedia> => r.status === "fulfilled")
    .map((r) => r.value);
}
