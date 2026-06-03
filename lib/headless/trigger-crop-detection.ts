// lib/headless/trigger-crop-detection.ts
//
// Fire-and-forget trigger som ber fyndplats-headless detektera tight-crop för
// nya produktbilder. Anropas från finishImport (bulk-import-worker) efter att
// en produkt skapats i Wix, och från valfri post-fanout-hook.
//
// Varför
// ------
// `data/image-crops.json` i headless-repot lagrar pre-beräknade bounding-boxes
// per Wix media-key. När en ny produkt importeras dyker nya media-keys upp →
// utan dem renderar listing-korten via `fill`-fallback (regression jmf med
// `fit`). Den driftsatta routen `/api/admin/detect-image-crops` kör Sharp-scan
// och returnerar bbox; en GitHub Actions-cron (refresh-image-crops.yml)
// commitar resultatet tillbaka till repot var 6:e timma. Denna trigger kortar
// väntan: så fort en produkt importerats puffar vi routen med `skipCached=1`
// så att nästa cron-tick redan har de nya entries:erna att merga.
//
// Säkerhet
// --------
// - ADMIN_SECRET MÅSTE vara satt — annars är funktionen no-op (loggas en
//   gång, ingen exception kastas).
// - All nätverks-I/O är fire-and-forget — om fyndplats.se är nere ELLER routen
//   tar för lång tid får importerna inte stanna upp. Maxväntan: 5 s, sen ger
//   vi upp (servern fortsätter sin scan i bakgrunden ändå).
//
// Användning
// ----------
//   import { triggerCropDetection } from "@/lib/headless/trigger-crop-detection";
//   // efter Wix-produkt skapats:
//   triggerCropDetection({ source: "bulk-import" }); // void, ingen await behövs
//
//   // valfritt: skicka med URLer för bilder vi vet är nya:
//   triggerCropDetection({ urls: result.mediaItems.map((m) => m.url) });

const DEFAULT_HEADLESS_BASE_URL = "https://www.fyndplats.se";
const TRIGGER_TIMEOUT_MS = 5_000;

let warnedMissingSecret = false;

export interface TriggerCropDetectionOptions {
  /** Konkreta URLer att detektera (annars: skipCached-rescan av hela katalogen). */
  urls?: string[];
  /** Logg-källa för audit/debug. */
  source?: string;
  /** Bas-URL till headless (default: env HEADLESS_BASE_URL eller fyndplats.se). */
  baseUrl?: string;
  /** Override timeout (testing). */
  timeoutMs?: number;
}

/**
 * Fire-and-forget POST till headless detection-routen. Returnerar ALDRIG ett
 * fel — eventuella problem loggas via console.warn så de syns i Vercel-loggen.
 * Caller behöver inte (och bör inte) await:a — funktionen tar 0 ms från
 * caller-tråden.
 */
export function triggerCropDetection(opts: TriggerCropDetectionOptions = {}): void {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn("[crop-detection] ADMIN_SECRET saknas — trigger är inaktiv");
      warnedMissingSecret = true;
    }
    return;
  }
  const base = (opts.baseUrl || process.env.HEADLESS_BASE_URL || DEFAULT_HEADLESS_BASE_URL).replace(/\/$/, "");
  // proxy.ts pa headless kraver ?key=<ADMIN_SECRET> for att slappa igenom
  // /api/admin/*. Routen sjalv kollar ?token=. Skicka bada -- fetch foljer
  // proxy:ns redirect, cookien satts, sen passerar token-checken.
  const url = `${base}/api/admin/detect-image-crops?key=${encodeURIComponent(secret)}&token=${encodeURIComponent(secret)}&skipCached=1`;
  const body = opts.urls?.length ? JSON.stringify({ urls: opts.urls }) : JSON.stringify({});
  const source = opts.source ?? "auto-trigger";
  const timeoutMs = opts.timeoutMs ?? TRIGGER_TIMEOUT_MS;

  // Inte await:at — caller fortsätter direkt. Promise:n hanteras här inne så
  // unhandledRejection inte triggas.
  (async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": `fyndplats-cache-warmer/${source}` },
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) {
        console.warn(`[crop-detection] ${source}: HTTP ${res.status}`);
        return;
      }
      // Vi läser inte body — vi vill bara att routen får signalen att börja
      // scanna. (Den fortsätter på Vercel även om vi tappar anslutningen.)
      console.log(`[crop-detection] ${source}: triggered (status ${res.status})`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // AbortError vid timeout — förväntat, routen kör vidare på servern.
      if (msg.includes("aborted")) {
        console.log(`[crop-detection] ${source}: triggered (timeout efter ${timeoutMs}ms — routen kör vidare på server)`);
      } else {
        console.warn(`[crop-detection] ${source}: trigger failade —`, msg);
      }
    } finally {
      clearTimeout(t);
    }
  })().catch((e) => console.warn("[crop-detection] inner-handler failade:", e));
}
