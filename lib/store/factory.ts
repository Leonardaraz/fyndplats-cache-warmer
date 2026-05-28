import { getMemoryStore } from "./memory";
import { WixDataStore } from "./wix-data";
import type { Store } from "./index";

let singleton: Store | null = null;

/**
 * Väljer lagring baserat på STORE_BACKEND-env:
 * - "wix-data" (rekommenderat för produktion): persistent i Wix Data-collections.
 * - "memory" (default): in-memory, försvinner vid omstart. Bra för dev/test.
 *
 * Tyst fallback till memory vid okänt värde är ett typo-fält — kasta tydligt
 * fel istället så operatorn märker direkt om hen skriver "wixdata" osv.
 */
export function getStore(): Store {
  if (!singleton) {
    const backend = process.env.STORE_BACKEND ?? "memory";
    switch (backend) {
      case "memory":
        singleton = getMemoryStore();
        break;
      case "wix-data":
        singleton = new WixDataStore();
        break;
      default:
        throw new Error(
          `Okänt STORE_BACKEND="${backend}". Tillåtna värden: "memory", "wix-data".`,
        );
    }
  }
  return singleton;
}
