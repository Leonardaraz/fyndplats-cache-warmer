// FyndplatsAppConfig — körtidskonfiguration som INTE får ligga i koden.
//
// VARFÖR DEN HÄR FILEN FINNS
//
// Repot är PUBLIKT. Aosoms feed-adress kräver ingen inloggning: en vanlig GET
// returnerar hela B2B-prislistan med kolumnen "Wholesale Price" för 6 057
// artiklar. Hårdkodad i källan är den detsamma som att publicera vad vi betalar
// för varje vara, för de svenska återförsäljare vi konkurrerar med om samma
// artikelnummer.
//
// En Vercel-miljövariabel löser exponeringen men har två egna problem, båda
// uppmätta 2026-08-27:
//
//   1. Värdet bakas in i deploymenten. En ny eller ändrad variabel slår inte
//      igenom förrän projektet byggts om — och en omdeploy som inte blev av
//      ser exakt likadan ut som en som blev det.
//   2. Ett värde märkt "Sensitive" går inte att läsa tillbaka, ens för ägaren.
//      Verifiering blir då omöjlig utan att först rotera hemligheten.
//
// Den här raden läses i stället vid varje anrop, precis som prissättnings-
// reglerna redan gör (lib/store/pricing-config.ts). Ändring slår igenom direkt,
// värdet går att läsa, och ingenting hamnar i repot. Det spelar roll konkret:
// feed-adressen ska roteras hos Aosom eftersom den legat i en publik gren, och
// utan det här hade varje rotation krävt variabel + ombygge igen.
//
// Kollektionen skapas med scripts/ensure-app-config-collection.mjs.

const WIX_BASE = "https://www.wixapis.com";
const COLLECTION_ID = process.env.WIX_DATA_COL_APP_CONFIG ?? "FyndplatsAppConfig";
const CONFIG_ID = "default";

/** Nycklar som får bo här. Håll listan kort — det här är inte en soptunna. */
export interface AppConfig {
  /** Aosoms B2B-feed. Hemlig: bär våra inköpspriser. */
  aosomFeedUrl?: string;
}

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

function clean(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Läser konfigraden.
 *
 * Saknad kollektion eller rad ger ett TOMT objekt — det är ett giltigt läge
 * (inget är konfigurerat ännu), och anroparen avgör vad som saknas.
 *
 * Ett riktigt läsfel KASTAR däremot, till skillnad från getPricingRules som
 * faller tillbaka på defaults. Skillnaden är avsiktlig: prissättningen har
 * vettiga defaults, det här har inga. Skulle en Wix-nedgång tyst se ut som
 * "ingen adress konfigurerad" hade felsökningen börjat på fel ställe.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(CONFIG_ID)}`
    + `?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });

  if (res.status === 404) return {};
  if (!res.ok) {
    const text = await res.text();
    // Kollektionen finns inte ännu — samma sak som en tom rad.
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return {};
    }
    throw new Error(`getAppConfig (${res.status}): ${text.slice(0, 300)}`);
  }

  const body = (await res.json()) as { dataItem?: { data?: Record<string, unknown> } };
  const data = body.dataItem?.data ?? {};
  return { aosomFeedUrl: clean(data.aosomFeedUrl) };
}

/**
 * Skriver EN eller flera nycklar. Läser raden först och skickar tillbaka allt
 * som inte ändras — `save` byter ut `data` i sin helhet, så en partiell
 * skrivning hade raderat resten (samma fälla som CLAUDE.md noterar för
 * wix-data-PATCH).
 */
export async function saveAppConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getAppConfig();
  const merged: AppConfig = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    const s = clean(v);
    if (s) (merged as Record<string, unknown>)[k] = s;
  }

  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION_ID,
      dataItem: {
        id: CONFIG_ID,
        dataCollectionId: COLLECTION_ID,
        data: { _id: CONFIG_ID, ...merged, updatedAt: new Date().toISOString() },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`saveAppConfig (${res.status}): ${text.slice(0, 300)}`);
  }
  return merged;
}
