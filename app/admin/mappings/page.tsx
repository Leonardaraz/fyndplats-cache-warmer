// Admin: AliExpress↔Wix mappnings-verktyg.
//
// Listar alla Wix V3-produkter på headless-sajten som inte har en
// AliExpress-mappning i FyndplatsMappings-collectionen. För varje produkt
// kan operatorn (a) söka AliExpress på text och välja en träff, eller
// (b) klistra in AliExpress-URL/ID direkt. Mappning sparas med positionell
// variantparning.

import { listAllV3Products, type WixV3ProductSummary } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { getSyncStore, type SyncStateEntry } from "@/lib/sync/sync-log";
import { MappingsList, type MappedProduct } from "./mappings-list";

export const dynamic = "force-dynamic";

/**
 * Produkter som TAPPAT SYNK (Leonards fråga 2026-08-09): synken kan inte längre
 * uppdatera pris/lager från AliExpress. Klassar ett problemläge till en
 * människoläsbar orsak + åtgärd. OOS ("slut hos leverantör") räknas INTE hit —
 * de synkas ju fortfarande, lagret är bara 0.
 */
function syncIssueLabel(s: SyncStateEntry): string | null {
  if (s.hiddenBySync) {
    return "Dold av synken — AliExpress-listningen är borttagen. Byt källa (Ändra mappning) eller låt den vara dold.";
  }
  if (s.listingStatus === "removed") {
    return "AliExpress-listningen borttagen — pris/lager kan inte synkas. Byt källa (Ändra mappning).";
  }
  if ((s.errorStreak ?? 0) >= 3) {
    return `${s.errorStreak} synkfel i rad — pris/lager uppdateras inte. Kontrollera AliExpress-källan.`;
  }
  return null;
}

/** Slut hos leverantören (synken fungerar — saldot är bara 0). Egen gul kategori
 *  bredvid röda "Tappat synk" så båda lägena syns där mappningarna åtgärdas. */
function oosLabel(s: SyncStateEntry): string | null {
  if (s.listingStatus !== "out_of_stock") return null;
  const since = s.outOfStockSince
    ? ` sedan ${new Date(s.outOfStockSince).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}`
    : "";
  return `Slut hos leverantören${since} — lagret nollat i butiken. Byt källa eller invänta påfyllning.`;
}

export default async function MappingsAdminPage() {
  let allProducts: WixV3ProductSummary[];
  let mappingByProductId: Map<string, { supplierProductId: string; variantCount: number }>;
  let totalMappingRows = 0;
  let loadError: string | null = null;
  // wixProductId → orsakstext för produkter som tappat synk. Best-effort:
  // hämtningen får aldrig fälla sidan (mappningsverktyget funkar utan).
  let problemStates: SyncStateEntry[] = [];

  try {
    const [products, mappings, problems] = await Promise.all([
      listAllV3Products(),
      getStore().listMappings(),
      getSyncStore().listProblemStates().catch(() => [] as SyncStateEntry[]),
    ]);
    allProducts = products;
    totalMappingRows = mappings.length;
    problemStates = problems;
    mappingByProductId = new Map(
      mappings.map((m) => [
        m.wixProductId,
        { supplierProductId: m.supplierProductId, variantCount: m.variants?.length ?? 0 },
      ]),
    );
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Okänt laddningsfel";
    allProducts = [];
    mappingByProductId = new Map();
  }

  // mappingByProductId innehåller ALLA rader i FyndplatsMappings; vissa kan vara
  // "orphans" vars wixProductId pekar på en raderad produkt. "Mappade" räknas som
  // bara de rader som matchar en LIVE-produkt, så matten går ihop: mappade + att
  // mappa = totalt. Skillnaden mot totalMappingRows = orphans.
  const unmapped = allProducts.filter((p) => !mappingByProductId.has(p.id));
  const mapped: MappedProduct[] = allProducts
    .filter((p) => mappingByProductId.has(p.id))
    .map((p) => ({ ...p, mapping: mappingByProductId.get(p.id)! }));
  const mappedLive = mapped.length;
  const orphanCount = totalMappingRows - mappedLive;

  // Tappat synk-orsak per LIVE-produkt (spökrader för raderade produkter
  // filtreras bort automatiskt eftersom nyckeln bara sätts för listade id:n).
  const liveIds = new Set(allProducts.map((p) => p.id));
  const syncIssues: Record<string, string> = {};
  const oosIssues: Record<string, string> = {};
  for (const s of problemStates) {
    if (!liveIds.has(s.wixProductId)) continue;
    const issue = syncIssueLabel(s);
    if (issue) syncIssues[s.wixProductId] = issue;
    const oos = oosLabel(s);
    if (oos && !issue) oosIssues[s.wixProductId] = oos;
  }
  const issueCount = Object.keys(syncIssues).length;
  const oosCount = Object.keys(oosIssues).length;

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
        <Stat
          label="Tappat synk"
          value={issueCount}
          color={issueCount > 0 ? "#c00" : "#070"}
          hint="Mappade produkter vars synk inte fungerar: AliExpress-listningen borttagen (ev. redan dold av synken) eller minst 3 synkfel i rad. Filtrera fram dem under Mappade-fliken."
        />
        <Stat
          label="Slut hos leverantör"
          value={oosCount}
          color={oosCount > 0 ? "#d97706" : "#070"}
          hint="Synken fungerar men leverantörens saldo är 0 — lagret är nollat i butiken. Filtrera fram dem under Mappade-fliken."
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
          ? ` (FyndplatsMappings har ${totalMappingRows} rader totalt, varav ${orphanCount} orphans som pekar på raderade produkter.)`
          : ""}
      </p>

      <MappingsList unmapped={unmapped} mapped={mapped} syncIssues={syncIssues} oosIssues={oosIssues} />
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
