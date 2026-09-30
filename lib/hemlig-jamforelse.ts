// Jämför en inskickad hemlighet med den väntade. LÖVMODUL: bara node:crypto, så
// `node --test` kan ladda den.
//
// Båda sidor hashas först, så jämförelsen tar lika lång tid oavsett var eller om
// de skiljer sig — och oavsett längd (timingSafeEqual kräver lika långa buffertar,
// och en längdkoll före hade läckt längden).

import { createHash, timingSafeEqual } from "node:crypto";

const sha = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Sant bara om båda finns och är lika. En osatt väntad hemlighet släpper aldrig igenom något. */
export function sammaHemlighet(fatt: string | null | undefined, vantad: string | null | undefined): boolean {
  if (typeof vantad !== "string" || vantad.length === 0) return false;
  if (typeof fatt !== "string" || fatt.length === 0) return false;
  return timingSafeEqual(sha(fatt), sha(vantad));
}

/** Värdet i "Authorization: Bearer <värde>", annars null. */
export function bearerVarde(header: string | null | undefined): string | null {
  if (typeof header !== "string") return null;
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return m ? m[1] : null;
}
