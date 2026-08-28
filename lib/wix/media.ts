import { isDryRun } from "../audit";

// Importerar externa bilder (t.ex. AliExpress alicdn, Aosoms CDN) till Wix Media
// Manager och returnerar wixstatic-URL:erna som V3-katalogen vill ha i `media`.
// https://dev.wix.com/docs/api-reference/assets/media/media-manager/files/import-file
//
// ☠️ VARFÖR DEN HÄR FILEN SER UT SOM DEN GÖR (2026-08-27)
//
// Aosom-svepet importerade 675 produkter. 397 av dem — 59 % — fick NOLL bilder,
// och 87 till fick färre än fem. Importen rapporterade `failed: 0` hela tiden:
// produkten skapades ju, det var bara bilderna som föll bort.
//
// Två fel samverkade, och båda var tysta:
//
//   1. importMediaUrls körde Promise.allSettled och FILTRERADE BORT allt som
//      rejectade. Ingen logg, ingen räknare, inget returvärde som skvallrade.
//      Kommentaren påstod "med varning i konsolen" — det fanns ingen sådan.
//   2. importMediaByUrl hade inget återförsök alls. Wix svarar 429 vid för hög
//      takt, och fem bilder per produkt × 129 produkter per fyraminutersvarv är
//      ~2,7 uppladdningar i sekunden. Därför blev det värre över tid: de sist
//      importerade fick noll.
//
// Samma klass av bugg som recensionsbilderna hade (se CLAUDE.md, 2026-08-22):
// en misslyckad uppladdning som ingen kan upptäcka är värre än en som kastar.

const WIX_BASE = "https://www.wixapis.com";

/** Försök per bild. Första är inget återförsök — sedan 1 s, 3 s, 8 s. */
const BACKOFF_MS = [1000, 3000, 8000];

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

/** 429 och 5xx är övergående. 4xx i övrigt är det inte — då är URL:en trasig. */
function arOvergaende(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

/** Wix skickar ibland Retry-After. Följ den hellre än vår egen trappa. */
function pausMs(res: Response, standard: number): number {
  const h = res.headers?.get?.("retry-after");
  const sek = h ? Number(h) : NaN;
  return Number.isFinite(sek) && sek > 0 ? Math.min(sek * 1000, 30_000) : standard;
}

const sov = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ImportedMedia {
  url: string;
  id: string;
  /**
   * Adressen bilden hämtades FRÅN.
   *
   * ☠️ UTAN DEN GÅR KOPPLINGEN FÖRLORAD, och det är dyrare än det låter.
   * `importMediaUrls` hoppar över missar, så en batch på fem som tappar den
   * andra returnerar fyra poster — och index säger då inte längre vilken
   * källbild varje post kom från. En wixstatic-adress avslöjar det inte heller.
   *
   * Följden var att bildreparationen inte kunde veta VILKA av fem bilder en
   * produkt saknade, och därför laddade om alla fem varje gång. De gamla
   * filerna blev föräldralösa, och Wix-lagringen tog slut (2026-08-28).
   */
  kalla: string;
}

export interface MediaImportOptions {
  /** Paus mellan bilder i en batch. Håller takten under Wix tålamodsgräns. */
  delayMs?: number;
  /**
   * Anropas för varje bild som INTE kom fram, efter alla återförsök. Finns för
   * att en miss aldrig mer ska kunna passera obemärkt — se filhuvudet.
   */
  onMiss?: (url: string, fel: string) => void;
  fetchImpl?: typeof fetch;
}

/**
 * Importerar en enskild bild via URL. Dry-run returnerar källans URL oförändrad.
 *
 * Kastar när bilden inte gick att importera — inklusive efter uttömda
 * återförsök. Anroparen avgör vad det betyder; det den INTE får göra är att
 * tappa bort felet.
 */
export async function importMediaByUrl(
  url: string,
  displayName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ImportedMedia> {
  if (isDryRun()) return { url, id: `dry-${displayName}`, kalla: url };

  let sistaFel = "okänt fel";

  for (let forsok = 0; forsok <= BACKOFF_MS.length; forsok++) {
    if (forsok > 0) await sov(BACKOFF_MS[forsok - 1]);

    let res: Response;
    try {
      res = await fetchImpl(`${WIX_BASE}/site-media/v1/files/import`, {
        method: "POST",
        headers: mediaHeaders(),
        body: JSON.stringify({ url, mimeType: guessMime(url), displayName }),
      });
    } catch (err) {
      // Nätverksfel är övergående per definition — försök igen.
      sistaFel = err instanceof Error ? err.message : String(err);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      sistaFel = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      if (!arOvergaende(res.status)) break;
      if (forsok < BACKOFF_MS.length) {
        const extra = pausMs(res, 0);
        if (extra > 0) await sov(extra);
      }
      continue;
    }

    const data = (await res.json().catch(() => ({}))) as { file?: { id?: string; url?: string } };
    if (!data.file?.url) {
      sistaFel = "ingen URL i svaret";
      continue;
    }
    return { url: data.file.url, id: data.file.id ?? "", kalla: url };
  }

  throw new Error(`Wix media-import misslyckades för ${url} — ${sistaFel}`);
}

/**
 * Importerar flera bilder, EN I TAGET.
 *
 * Serieordningen är inte en förenkling utan själva fixen: parallella
 * uppladdningar var det som drev Wix till 429 och tömde produkterna på bilder.
 * Kostnaden är någon sekund per produkt, vilket är billigt mot en katalog utan
 * foton.
 *
 * Missar hoppas fortfarande över hellre än att fälla hela importen — men de
 * rapporteras nu via `onMiss` i stället för att försvinna.
 */
export async function importMediaUrls(
  items: { url: string; displayName: string }[],
  opts: MediaImportOptions = {},
): Promise<ImportedMedia[]> {
  const ut: ImportedMedia[] = [];
  for (const [i, item] of items.entries()) {
    if (i > 0 && opts.delayMs) await sov(opts.delayMs);
    try {
      ut.push(await importMediaByUrl(item.url, item.displayName, opts.fetchImpl));
    } catch (err) {
      const fel = err instanceof Error ? err.message : String(err);
      console.warn(`[media] hoppade över ${item.url}: ${fel}`);
      opts.onMiss?.(item.url, fel);
    }
  }
  return ut;
}

/**
 * Slår upp filbeskrivningar i klump och returnerar var varje fil HÄMTADES FRÅN.
 *
 * ☠️ DEN HÄR FINNS FÖR ATT KUNNA LAGA GAMLA PRODUKTER.
 *
 * Bildreparationen vet vilka källbilder en produkt SKA ha och vilka fil-id:n
 * den HAR, men inte hur de hänger ihop — och utan den kopplingen går det inte
 * att veta vilken av fem bilder som saknas. Nya uppladdningar bär `kalla` och
 * kopplingen sparas på mappningen, men de tusentals produkter som importerades
 * innan dess har ingen sparad koppling.
 *
 * Wix bär den däremot själv: varje importerad fil har en `sourceUrl` med
 * adressen den hämtades från. Ett anrop per produkt räcker.
 *
 * Uppmätt mot skarpa API:t 2026-08-28 — `POST /files/get-files` med `fileIds`
 * svarar med hela beskrivningen, `sourceUrl` inkluderad.
 *
 * ⚠️ En fil som Wix själv omimporterat bär en wixstatic-adress i `sourceUrl`,
 * inte leverantörens. Den pekar på VÅR fil, som i sin tur bär rätt adress —
 * men den filen kan vara bortstädad. Anroparen måste tåla att en fil inte går
 * att härleda; att gissa vore att riskera en dubblett på en kundsida.
 */
export async function getMediaSourceUrls(
  fileIds: string[],
  fetchImpl: typeof fetch = fetch,
  /** Hur många kopie-hopp som återstår. Se hoppet längre ned. */
  hoppKvar = 1,
): Promise<Map<string, string>> {
  const ut = new Map<string, string>();
  const ids = fileIds.filter(Boolean);
  if (ids.length === 0) return ut;

  const res = await fetchImpl(`${WIX_BASE}/site-media/v1/files/get-files`, {
    method: "POST",
    headers: mediaHeaders(),
    body: JSON.stringify({ fileIds: ids }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Wix get-files misslyckades (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    files?: { id?: string; sourceUrl?: string }[];
  };
  for (const f of data.files ?? []) {
    if (f.id && f.sourceUrl) ut.set(f.id, f.sourceUrl);
  }

  // ── ETT HOPP TILL, FÖR WIX EGNA KOPIOR ────────────────────────────────────
  //
  // En fil som Wix omimporterade bär inte leverantörens adress i `sourceUrl`
  // utan VÅR fils wixstatic-adress. Den filen bär i sin tur rätt adress, så
  // kedjan går att följa ett steg. Det är inte en detalj: produkterna som ska
  // lagas importerades medan omimport-buggen levde, så många av dem pekar på
  // just kopior — och utan hoppet vore de omöjliga att härleda, vilket hade
  // tvingat fram en full omladdning per produkt.
  //
  // ⚠️ DJUPET ÄR BEGRÄNSAT, OCH DET ÄR INTE EN FÖRSIKTIGHETSÅTGÄRD.
  //
  // En kopia av en kopia är inget vi sett, men kedjan är data från Wix och inte
  // något vi kontrollerar: två filer som pekar på varandra hade snurrat tills
  // rutten dog på sin maxDuration. Ett steg räcker för det verkliga fallet och
  // kan inte loopa.
  //
  // Originalet kan dessutom vara bortstädat — då lämnas filen ohärledd, vilket
  // anroparen ska tåla.
  if (hoppKvar <= 0) return ut;

  const viaKopia = new Map<string, string>();
  for (const [id, src] of ut) {
    const nyckel = nyckelIWixstatic(src);
    // En fil vars källa är den själv är en cykel av längd ett. Följ den inte.
    if (nyckel && nyckel !== id) viaKopia.set(id, nyckel);
  }
  if (viaKopia.size === 0) return ut;

  const original = await getMediaSourceUrls(
    [...new Set(viaKopia.values())],
    fetchImpl,
    hoppKvar - 1,
  );
  for (const [id, originalId] of viaKopia) {
    const akta = original.get(originalId);
    // Kedjan måste sluta i en RIKTIG källadress. Slutar den i ännu en
    // wixstatic-adress — för att originalet självt var en kopia och djupet tog
    // slut — är kopian lika ohärledd som om originalet saknats.
    //
    // Att lämna kvar wixstatic-adressen vore värre än att stryka den: den
    // matchar aldrig en källbild, och reparationen hade läst den som "en källa
    // vi inte längre vill ha" i stället för "vet inte" — alltså gissat.
    if (akta && !nyckelIWixstatic(akta)) ut.set(id, akta);
    else ut.delete(id);
  }
  return ut;
}

/** Fil-id:t i en wixstatic-adress, eller null om adressen inte är en. */
function nyckelIWixstatic(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "static.wixstatic.com") return null;
    const sista = u.pathname.split("/").filter(Boolean).pop();
    return sista ?? null;
  } catch {
    return null;
  }
}
