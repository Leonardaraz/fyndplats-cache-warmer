import { getMemoryStore } from "./memory";
import { WixDataStore } from "./wix-data";
import { PostgresStore } from "./postgres";
import type { Store } from "./index";
import { storeBackend } from "./backend";

let singleton: Store | null = null;

/**
 * Väljer lagring baserat på STORE_BACKEND-env:
 * - "wix-data" (rekommenderat för produktion): persistent i Wix Data-collections.
 * - "postgres": drift-datan i Neon. Målet för migreringen ur Wix Data.
 * - "memory" (default): in-memory, försvinner vid omstart. Bra för dev/test.
 *
 * Okända värden kastar — se lib/store/backend.ts. Tyst fallback gör en
 * felstavad variabel omöjlig att skilja från ett medvetet val.
 */
export function getStore(): Store {
  singleton ??= skapaStore();
  return singleton;
}

// Egen funktion i stället för tilldelningar i en switch: då blir switchen
// UTTÖMMANDE mot `StoreBackend`, och ett nytt backend-värde blir ett
// kompileringsfel här i stället för ett tyst `null` i drift.
function skapaStore(): Store {
  switch (storeBackend()) {
    case "memory":
      return getMemoryStore();
    case "wix-data":
      return new WixDataStore();
    case "postgres":
      return new PostgresStore();
  }
}

/** Endast för tester: tvingar fram ett nytt val vid nästa getStore(). */
export function __resetStoreForTests(): void {
  singleton = null;
}
