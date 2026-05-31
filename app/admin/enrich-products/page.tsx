import { getEnrichRows } from "../../../lib/enrich-status";
import { EnrichProductsClient } from "./EnrichProductsClient";

// Admin: back-fill av de tabbade PDP-flikarna (Tekniska specifikationer /
// Vanliga frågor / Användning och skötsel) på redan importerade produkter.
// Server-komponenten räknar ut flik-status (publik storefront-SDK, ingen token);
// klienten driver Claude-genereringen via /api/admin/enrich-tabs.
// Åtkomst gateas av proxy.ts (ADMIN_SECRET).
export const dynamic = "force-dynamic";

export default async function EnrichProductsPage() {
  const rows = await getEnrichRows();
  return <EnrichProductsClient rows={rows} />;
}
