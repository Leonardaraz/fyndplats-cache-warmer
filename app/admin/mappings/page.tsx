// Admin: AliExpress↔Wix mappnings-verktyg.
//
// Listar alla Wix V3-produkter på headless-sajten som inte har en
// AliExpress-mappning i FyndplatsMappings-collectionen. För varje produkt
// kan operatorn (a) söka AliExpress på text och välja en träff, eller
// (b) klistra in AliExpress-URL/ID direkt. Mappning sparas med positionell
// variantparning.

import { listAllV3Products, type WixV3ProductSummary } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { MappingsList } from "./mappings-list";

export const dynamic = "force-dynamic";

export default async function MappingsAdminPage() {
  let allProducts: WixV3ProductSummary[];
  let mappedSet: Set<string>;
  let loadError: string | null = null;

  try {
    const [products, mappings] = await Promise.all([
      listAllV3Products(),
      getStore().listMappings(),
    ]);
    allProducts = products;
    mappedSet = new Set(mappings.map((m) => m.wixProductId));
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Okänt laddningsfel";
    allProducts = [];
    mappedSet = new Set();
  }

  // VIKTIGT: mappedSet byggs av ALLA rader i FyndplatsMappings och kan innehålla
  // "orphans" — mappningar vars wixProductId pekar på en sedan länge raderad
  // produkt. Att visa mappedSet.size som "mappade" är vilseledande (89 orphans
  // gjorde att 229 ≠ 140 faktiskt mappade live-produkter). Räkna därför bara
  // mappningar som matchar en LIVE-produkt, så går matten ihop: mappade + att
  // mappa = totalt.
  const mappedLive = allProducts.filter((p) => mappedSet.has(p.id)).length;
  const unmapped = allProducts.filter((p) => !mappedSet.has(p.id));
  const orphanCount = mappedSet.size - mappedLive;

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

      <div style={{ marginBottom: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Stat label="Produkter på sajten" value={allProducts.length} />
        <Stat
          label="Mappade (auto-pipeline på)"
          value={mappedLive}
          color="#070"
          hint="Produkter som är länkade till en AliExpress-källa — orderläggning, lagersync och tracking är aktiva."
        />
        <Stat
          label="Kvar att mappa"
          value={unmapped.length}
          color={unmapped.length > 0 ? "#F47A35" : "#070"}
          hint="Produkter utan AliExpress-källa. Auto-pipelinen är AV för dessa tills de mappas."
        />
        {orphanCount > 0 ? (
          <Stat
            label="Orphan-mappningar"
            value={orphanCount}
            color="#999"
            hint="Mappnings-rader vars produkt är raderad. Ofarliga, men skräpar ner FyndplatsMappings — kan städas."
          />
        ) : null}
      </div>
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>
        {mappedLive} mappade + {unmapped.length} att mappa = {allProducts.length} produkter.
        {orphanCount > 0
          ? ` (FyndplatsMappings har ${mappedSet.size} rader totalt, varav ${orphanCount} orphans som pekar på raderade produkter.)`
          : ""}
      </p>

      <MappingsList initialProducts={unmapped} />
    </main>
  );
}

function Stat({ label, value, color, hint }: {
  label: string; value: number; color?: string; hint?: string;
}) {
  return (
    <div
      title={hint}
      style={{
        padding: 10, border: "1px solid #ddd", borderRadius: 6,
        flex: "1 1 180px", minWidth: 160, cursor: hint ? "help" : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>
        {label}{hint ? <span style={{ color: "#bbb" }}> ⓘ</span> : null}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? "#222", lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}
