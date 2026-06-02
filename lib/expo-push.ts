// lib/expo-push.ts
//
// Tunn klient mot Expo Push API (https://exp.host/--/api/v2/push/send) för
// Fyndplats native-app. Skickar i batchar om max 100 meddelanden per request
// (Expos gräns) och plockar ut tokens som Expo rapporterar som
// `DeviceNotRegistered` så anroparen kan städa bort dem ur Wix Data.
//
// Env:
//   EXPO_ACCESS_TOKEN  — (valfritt men rekommenderat) höjer rate-limit och
//                        krävs om "Enhanced Security for Push Notifications" är
//                        påslaget i Expo-projektet. Utan den fungerar sändning
//                        ändå för projekt som inte tvingar token.
//
// Avsiktligt beroendelöst (bara global fetch) så lib/push-tokens.ts-testet kan
// köras under `node --test --experimental-strip-types` utan sidoeffekter.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_BATCH = 100; // Expos hårda gräns per request.

export type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
};

// Expo svarar med en "ticket" per meddelande (i samma ordning som inskickat).
type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export type ExpoSendResult = {
  // Tokens som Expo säger inte längre är registrerade (avinstallerad app etc).
  // Anroparen ska radera dessa ur Wix Data.
  deadTokens: string[];
  tickets: ExpoTicket[];
  // true om minst en batch faktiskt POSTades (oavsett per-token-utfall).
  attempted: boolean;
};

/** Validerar Expo push-token-formatet: ExponentPushToken[...] / ExpoPushToken[...]. */
export function isValidExpoToken(token: unknown): token is string {
  return typeof token === "string" && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token.trim());
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
  };
  const token = (process.env.EXPO_ACCESS_TOKEN || "").trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/**
 * Skickar push-meddelanden till Expo i batchar om 100. Aggregerar tickets och
 * samlar tokens som rapporteras `DeviceNotRegistered`. Kastar aldrig — ett
 * nätverksfel i en batch loggas och hoppas över (best-effort, push får aldrig
 * blockera anroparen). En 3s timeout per batch hindrar hängande requests.
 */
export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoSendResult> {
  const valid = messages.filter((m) => isValidExpoToken(m.to));
  const deadTokens: string[] = [];
  const tickets: ExpoTicket[] = [];
  let attempted = false;

  for (const batch of chunk(valid, MAX_BATCH)) {
    attempted = true;
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(batch),
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      const json = (await res.json().catch(() => ({}))) as { data?: ExpoTicket[]; errors?: unknown };
      const batchTickets = Array.isArray(json.data) ? json.data : [];
      tickets.push(...batchTickets);
      batchTickets.forEach((t, i) => {
        if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
          const dead = batch[i]?.to;
          if (dead) deadTokens.push(dead);
        }
      });
      if (!res.ok) {
        console.error("[expo-push] Expo svarade", res.status, JSON.stringify(json).slice(0, 300));
      }
    } catch (err) {
      console.error("[expo-push] batch misslyckades:", (err as Error).message);
    }
  }

  return { deadTokens, tickets, attempted };
}
