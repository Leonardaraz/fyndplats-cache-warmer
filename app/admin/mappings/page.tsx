// Admin: AliExpress↔Wix mappnings-verktyg.
//
// Listar alla Wix V3-produkter på headless-sajten som inte har en
// AliExpress-mappning i FyndplatsMappings-collectionen. För varje produkt
// kan operatorn (a) söka AliExpress på text och välja en träff, eller
// (b) klistra in AliExpress-URL/ID direkt. Mappning sparas med positionell
// variantparning.

import { listAllV3Products, type WixV3ProductSummary } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import type { MappingSuggestion } from "@/lib/store";
import { MappingsList } from "./mappings-list";
import { AutoMapPanel } from "./auto-map-panel";
import { SuggestionsList } from "./suggestions";

export const dynamic = "force-dynamic";

export default async function MappingsAdminPage() {
  let allProducts: WixV3ProductSummary[];
  let mappedSet: Set<string>;
  let suggestions: MappingSuggestion[] = [];
  let loadError: string | null = null;

  try {
    const [products, mappings, sugg] = await Promise.all([
      listAllV3Products(),
      getStore().listMappings(),
      getStore().listSuggestions(),
    ]);
    allProducts = products;
    mappedSet = new Set(mappings.map((m) => m.wixProductId));
    suggestions = sugg;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Okänt laddningsfel";
    allProducts = [];
    mappedSet = new Set();
  }

  const suggestedSet = new Set(suggestions.map((s) => s.wixProductId));
  // "Att mappa" = varken mappad eller redan i förslags-kön.
  const unmapped = allProducts.filter((p) => !mappedSet.has(p.id) && !suggestedSet.has(p.id));

  return (
    <main style={{ maxWidth: 920, margin: "20px auto", padding: "0 16px" }}>
      <h1>AliExpress-mappning</h1>
      <p style={{ color: "#666" }}>
        Länka dina existerande Wix-produkter till AliExpress-källor så
        auto-pipelinen (orderläggning, lagersync, tracking) kan användas.
        Mappningar sparas i Wix CMS-collectionen <code>FyndplatsMappings</code>.
      </p>

      {loadError ? (
        <div style={{
          padding: 12, background: "#fde7e7", borderRadius: 6,
          color: "#a00", marginBottom: 12, fontSize: 13,
        }}>
          <b>Fel vid laddning:</b> {loadError}<br />
          <span style={{ fontSize: 12 }}>
            Vanliga orsaker: HEADLESS_WIX_SITE_ID inte satt (default används),
            WIX_API_TOKEN saknar permission på headless-sajten, eller V3-katalogen är tom.
          </span>
        </div>
      ) : null}

      <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Stat label="Totalt på V3-headless" value={allProducts.length} />
        <Stat label="Redan mappade" value={mappedSet.size} color="#070" />
        <Stat label="Förslag att bekräfta" value={suggestions.length} color={suggestions.length > 0 ? "#0a58ca" : "#070"} />
        <Stat label="Kvar att mappa" value={unmapped.length} color={unmapped.length > 0 ? "#F47A35" : "#070"} />
      </div>

      <AutoMapPanel unmappedCount={unmapped.length} />

      {suggestions.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>Förslag att bekräfta ({suggestions.length})</h2>
          <p style={{ color: "#666", fontSize: 13 }}>
            AI-matchningen var inte säker nog för att auto-mappa dessa. Välj rätt
            AliExpress-träff och bekräfta, eller avfärda för att mappa manuellt nedan.
          </p>
          <SuggestionsList suggestions={suggestions} />
        </section>
      ) : null}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Mappa manuellt ({unmapped.length})</h2>
        <MappingsList initialProducts={unmapped} />
      </section>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{
      padding: 10, border: "1px solid #ddd", borderRadius: 6,
      flex: "1 1 180px", minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? "#222", lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}
