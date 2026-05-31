// Delade typer mellan DiscoverClient och actions. Lever utanför
// "use server"-filen eftersom Next.js bara tillåter async-funktioner
// som exports där.

import type { AliExpressSearchResult } from "@/lib/aliexpress/client";

export interface DiscoverResult extends AliExpressSearchResult {
  /** Säkerställd 4-värdes klassificering för UI:t. */
  warehouseClass: "EU" | "CN" | "MIXED" | "UNKNOWN";
  shipsFromCountries: string[];
}
