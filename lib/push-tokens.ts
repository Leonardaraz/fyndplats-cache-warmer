// lib/push-tokens.ts
//
// Persistens + urvalslogik för push-tokens (Fyndplats native-app). Speglar
// mönstret i lib/image-scores.ts: rena fetch-anrop mot Wix Data v2 (ingen SDK),
// degraderar tyst när WIX_API_KEY/WIX_SITE_ID saknas.
//
// Wix Data-collection: `FyndplatsPushTokens`. deviceId används som radens `_id`
// (unik per enhet) så upsert blir ett enda save-anrop. Skapa collectionen i Wix
// (eller kör scripts/create-push-collection.mjs) med fälten:
//   expoToken (text), userEmail (text), deviceId (text), platform (text),
//   appVersion (text), registeredAt (date), lastSeenAt (date),
//   preferences (object: { orderUpdates, restock, promotions, cartReminders })
//
// VIKTIGT: håll denna fil fri från lokala imports — den körs under
// `node --test --experimental-strip-types` via push-tokens.test.ts.

const WIX_BASE = "https://www.wixapis.com";
const COL = "FyndplatsPushTokens";

export type PushPlatform = "ios" | "android" | "web";

// Kanaler som /api/push/send tar emot, mappade mot preferens-flaggorna nedan.
export type PushChannel = "order" | "restock" | "promo" | "cart";

export interface PushPreferences {
  orderUpdates: boolean;
  restock: boolean;
  promotions: boolean;
  cartReminders: boolean;
}

export interface PushTokenRecord {
  expoToken: string;
  userEmail?: string;
  deviceId: string;
  platform: PushPlatform;
  appVersion: string;
  registeredAt: string;
  lastSeenAt: string;
  preferences: PushPreferences;
}

// Nya enheter får allt påslaget tills användaren ändrar i appen.
export const DEFAULT_PREFERENCES: PushPreferences = {
  orderUpdates: true,
  restock: true,
  promotions: true,
  cartReminders: true,
};

// Kanal → vilken preferens-flagga som styr om mottagaren får eventet.
const CHANNEL_TO_PREF: Record<PushChannel, keyof PushPreferences> = {
  order: "orderUpdates",
  restock: "restock",
  promo: "promotions",
  cart: "cartReminders",
};

/**
 * REN funktion (enhetstestad): behåll bara mottagare vars preferens för den
 * givna kanalen är på. Saknad/ofullständig `preferences` tolkas som
 * standard = allt på, så vi aldrig av misstag tystar en transaktionskanal pga
 * en gammal token utan sparade preferenser.
 */
export function filterByPreferences<T extends { preferences?: Partial<PushPreferences> | null }>(
  records: T[],
  channel: PushChannel,
): T[] {
  const key = CHANNEL_TO_PREF[channel];
  return records.filter((r) => {
    const prefs = r.preferences;
    if (!prefs || prefs[key] === undefined || prefs[key] === null) return true; // default på
    return prefs[key] === true;
  });
}

/** Normalisera godtycklig input till en komplett PushPreferences (default på). */
export function coercePreferences(input: unknown): PushPreferences {
  const p = (input ?? {}) as Partial<PushPreferences>;
  return {
    orderUpdates: p.orderUpdates !== false,
    restock: p.restock !== false,
    promotions: p.promotions !== false,
    cartReminders: p.cartReminders !== false,
  };
}

// ---------------------------------------------------------------------------
// Wix Data (server-side). Allt degraderar tyst om creds/collection saknas.
// ---------------------------------------------------------------------------

function wixDataHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

export function pushTokensConfigured(): boolean {
  return Boolean(process.env.WIX_API_KEY && process.env.WIX_SITE_ID);
}

type WixData = Record<string, unknown>;

function rowToRecord(d: WixData): PushTokenRecord | null {
  const deviceId = String(d.deviceId || d._id || "");
  const expoToken = String(d.expoToken || "");
  if (!deviceId || !expoToken) return null;
  return {
    deviceId,
    expoToken,
    userEmail: d.userEmail ? String(d.userEmail) : undefined,
    platform: (d.platform as PushPlatform) || "web",
    appVersion: d.appVersion ? String(d.appVersion) : "",
    registeredAt: d.registeredAt ? String(d.registeredAt) : "",
    lastSeenAt: d.lastSeenAt ? String(d.lastSeenAt) : "",
    preferences: coercePreferences(d.preferences),
  };
}

async function queryRows(filter: WixData): Promise<PushTokenRecord[]> {
  const h = wixDataHeaders();
  if (!h) return [];
  try {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ dataCollectionId: COL, query: { filter, paging: { limit: 1000 } } }),
      cache: "no-store",
    });
    if (!res.ok) return []; // 404 (collection saknas) m.m. → tom lista, ingen krasch
    const body = (await res.json()) as { dataItems?: { data?: WixData }[] };
    return (body.dataItems || [])
      .map((it) => rowToRecord(it.data || {}))
      .filter((x): x is PushTokenRecord => Boolean(x));
  } catch {
    return [];
  }
}

export function tokensByEmail(email: string): Promise<PushTokenRecord[]> {
  return queryRows({ userEmail: email.toLowerCase().trim() });
}

export function tokensByExpoTokens(tokens: string[]): Promise<PushTokenRecord[]> {
  if (tokens.length === 0) return Promise.resolve([]);
  return queryRows({ expoToken: { $in: tokens } });
}

export type UpsertPushTokenInput = {
  expoToken: string;
  deviceId: string;
  platform: PushPlatform;
  appVersion: string;
  email?: string;
};

export type UpsertResult =
  | { ok: true }
  | { ok: false; skipped: "not_configured" | "collection_missing" }
  | { ok: false; error: string; status?: number };

/**
 * Upsert keyad på deviceId (= radens _id). Läs-modifiera-skriv så att
 * `registeredAt` och redan satta `preferences` bevaras mellan registreringar;
 * `lastSeenAt` (och ev. ändrad expoToken/email/appVersion) uppdateras alltid.
 */
export async function upsertPushToken(input: UpsertPushTokenInput): Promise<UpsertResult> {
  const h = wixDataHeaders();
  if (!h) return { ok: false, skipped: "not_configured" };

  const now = new Date().toISOString();
  let registeredAt = now;
  let preferences = DEFAULT_PREFERENCES;

  // Läs ev. befintlig rad för att bevara registeredAt + preferenser.
  try {
    const g = await fetch(
      `${WIX_BASE}/data/v2/items/${encodeURIComponent(input.deviceId)}?dataCollectionId=${COL}`,
      { method: "GET", headers: h, cache: "no-store" },
    );
    if (g.ok) {
      const b = (await g.json()) as { dataItem?: { data?: WixData } };
      const d = b.dataItem?.data;
      if (d) {
        if (d.registeredAt) registeredAt = String(d.registeredAt);
        preferences = coercePreferences(d.preferences);
      }
    }
  } catch {
    /* ny rad */
  }

  const data: WixData = {
    _id: input.deviceId,
    deviceId: input.deviceId,
    expoToken: input.expoToken,
    platform: input.platform,
    appVersion: input.appVersion,
    userEmail: input.email ? input.email.toLowerCase().trim() : undefined,
    registeredAt,
    lastSeenAt: now,
    preferences,
  };

  try {
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ dataCollectionId: COL, dataItem: { id: input.deviceId, dataCollectionId: COL, data } }),
    });
    if (res.ok) return { ok: true };
    // Collectionen finns inte ännu → degradera tyst (sajten/appen funkar; skapa
    // FyndplatsPushTokens i Wix så börjar tokens persisteras).
    if (res.status === 404) {
      console.warn(`[push-tokens] collection ${COL} saknas (404) — token inte sparad. Skapa collectionen i Wix.`);
      return { ok: false, skipped: "collection_missing" };
    }
    const text = (await res.text()).slice(0, 200);
    return { ok: false, error: text, status: res.status };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Sätt preferenser på ALLA tokens för en användare (e-post). Returnerar antal uppdaterade. */
export async function setPreferencesForEmail(email: string, prefs: PushPreferences): Promise<number> {
  const h = wixDataHeaders();
  if (!h) return 0;
  const records = await tokensByEmail(email);
  let updated = 0;
  for (const r of records) {
    const data: WixData = {
      _id: r.deviceId,
      deviceId: r.deviceId,
      expoToken: r.expoToken,
      platform: r.platform,
      appVersion: r.appVersion,
      userEmail: r.userEmail,
      registeredAt: r.registeredAt,
      lastSeenAt: r.lastSeenAt,
      preferences: prefs,
    };
    try {
      const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ dataCollectionId: COL, dataItem: { id: r.deviceId, dataCollectionId: COL, data } }),
      });
      if (res.ok) updated++;
    } catch {
      /* hoppa över denna, fortsätt med övriga */
    }
  }
  return updated;
}

/** Radera tokens (DeviceNotRegistered) ur Wix Data. Matchar på expoToken-värde. */
export async function deleteByExpoTokens(tokens: string[]): Promise<number> {
  const h = wixDataHeaders();
  if (!h || tokens.length === 0) return 0;
  const records = await tokensByExpoTokens(tokens);
  let removed = 0;
  for (const r of records) {
    try {
      const res = await fetch(
        `${WIX_BASE}/data/v2/items/${encodeURIComponent(r.deviceId)}?dataCollectionId=${COL}`,
        { method: "DELETE", headers: h },
      );
      if (res.ok) removed++;
    } catch {
      /* best-effort */
    }
  }
  return removed;
}
