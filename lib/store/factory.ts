import { getMemoryStore } from "./memory";
import { WixDataStore } from "./wix-data";
import type { Store } from "./index";

let singleton: Store | null = null;

/**
 * Väljer lagring baserat på STORE_BACKEND-env:
 * - "wix-data" (rekommenderat för produktion): persistent i Wix Data-collections.
 * - "memory" (default): in-memory, försvinner vid omstart. Bra för dev/test.
 */
export function getStore(): Store {
  if (!singleton) {
    singleton = process.env.STORE_BACKEND === "wix-data" ? new WixDataStore() : getMemoryStore();
  }
  return singleton;
}
