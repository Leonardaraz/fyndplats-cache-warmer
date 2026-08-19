// Hämtningsdelen av social-proof. Ligger separat från lib/social-proof.ts så att
// urvalsregeln (resolveSocialProof) går att testa med `node --test` utan att dra
// in fetch och next-cachen.
//
// Anropas från server-komponenter: sidfoten (varje sida), startsidan och
// /omdomen. Kostar inget extra nätanrop — getGoogleReviews är ISR-cachad i 6 h
// på taggen "google-reviews", så alla ytor delar samma svar.

import { getGoogleReviews } from "./google-reviews";
import { resolveSocialProof, FALLBACK_SOCIAL_PROOF, type SocialProof } from "./social-proof";

/**
 * Google-betyget som ska visas: profilens riktiga siffror när API:t svarar,
 * annars de handavlästa i lib/social-proof.ts.
 *
 * Fail-open hela vägen. Sidfoten renderas på varenda sida — ett trasigt
 * Google-anrop får aldrig fälla den.
 */
export async function getSocialProof(): Promise<SocialProof> {
  try {
    return resolveSocialProof(await getGoogleReviews());
  } catch {
    return FALLBACK_SOCIAL_PROOF;
  }
}
