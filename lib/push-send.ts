// lib/push-send.ts
//
// Orkestrering: lös upp målgrupp → filtrera på preferenser → skicka via Expo →
// städa bort döda tokens. Delas av /api/push/send (kund-/intern-API) och de
// fire-and-forget-hooks som triggas från wix-webhook + abandoned-cart-flödet.
//
// Designprincip (samma som CAPI-fixen i FIX-07): push får ALDRIG blockera eller
// fälla det som triggar den (mejlet). Använd `firePush()` för att avfyra utan
// att invänta resultatet; den sväljer alla fel.

import {
  DEFAULT_PREFERENCES,
  deleteByExpoTokens,
  filterByPreferences,
  tokensByEmail,
  tokensByExpoTokens,
  type PushChannel,
  type PushPreferences,
} from "./push-tokens";
import { isValidExpoToken, sendExpoPush, type ExpoPushMessage } from "./expo-push";

export type SendPushInput = {
  // Minst en av `tokens` / `userEmail` krävs.
  tokens?: string[];
  userEmail?: string;
  channel: PushChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type SendPushResult = {
  ok: boolean;
  recipients: number; // antal tokens vi faktiskt skickade till (efter filtrering)
  filtered: number; // antal som föll bort pga preferenser
  deadRemoved: number; // antal döda tokens städade ur Wix Data
  skipped?: "no_audience";
};

// Intern shape vi filtrerar på: token + dess preferenser (för pref-gaten).
type Target = { expoToken: string; preferences?: Partial<PushPreferences> | null };

/**
 * Bygg målgruppen. Explicit angivna `tokens` skickas även om de saknas i Wix
 * Data (då med default-preferenser = allt på), så en intern anropare kan
 * adressera en specifik enhet direkt. `userEmail` slår upp alla enhetens tokens
 * och respekterar deras sparade preferenser.
 */
async function resolveTargets(input: SendPushInput): Promise<Target[]> {
  const byToken = new Map<string, Target>();

  if (input.userEmail) {
    const recs = await tokensByEmail(input.userEmail);
    for (const r of recs) byToken.set(r.expoToken, { expoToken: r.expoToken, preferences: r.preferences });
  }

  if (input.tokens && input.tokens.length > 0) {
    const explicit = input.tokens.filter(isValidExpoToken);
    // Hämta ev. sparade preferenser för de explicita tokens vi känner till.
    const known = await tokensByExpoTokens(explicit);
    const prefByToken = new Map(known.map((r) => [r.expoToken, r.preferences] as const));
    for (const t of explicit) {
      if (!byToken.has(t)) {
        byToken.set(t, { expoToken: t, preferences: prefByToken.get(t) ?? DEFAULT_PREFERENCES });
      }
    }
  }

  return [...byToken.values()];
}

export async function sendPushToAudience(input: SendPushInput): Promise<SendPushResult> {
  const targets = await resolveTargets(input);
  if (targets.length === 0) {
    return { ok: true, recipients: 0, filtered: 0, deadRemoved: 0, skipped: "no_audience" };
  }

  const kept = filterByPreferences(targets, input.channel);
  const filtered = targets.length - kept.length;

  if (kept.length === 0) {
    return { ok: true, recipients: 0, filtered, deadRemoved: 0 };
  }

  const messages: ExpoPushMessage[] = kept.map((t) => ({
    to: t.expoToken,
    title: input.title,
    body: input.body,
    sound: "default",
    data: { channel: input.channel, ...input.data },
  }));

  const { deadTokens } = await sendExpoPush(messages);

  let deadRemoved = 0;
  if (deadTokens.length > 0) {
    deadRemoved = await deleteByExpoTokens(deadTokens);
  }

  return { ok: true, recipients: kept.length, filtered, deadRemoved };
}

/**
 * Fire-and-forget: avfyra en push utan att invänta den och utan att låta något
 * fel bubbla upp. Används från transaktionsflöden (webhook, abandoned-cart) så
 * push aldrig kan fördröja eller fälla mejlet — exakt samma princip som
 * Meta-CAPI-anropet efter orderbekräftelsen (FIX-07).
 */
export function firePush(input: SendPushInput): void {
  void sendPushToAudience(input).catch((err) => {
    console.error("[push-send] fire-and-forget misslyckades:", (err as Error)?.message);
  });
}
