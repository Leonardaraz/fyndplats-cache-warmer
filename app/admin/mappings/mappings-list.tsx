"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WixV3ProductSummary } from "@/lib/wix/v3-products";
import { MappingCard } from "./mapping-card";
import { repairSyntheticMappingsAction, type RepairBatchResult } from "./actions";

/** En redan mappad produkt + dess AliExpress-källa (för "Mappade"-fliken). */
export type MappedProduct = WixV3ProductSummary & {
  mapping: { supplierProductId: string; variantCount: number; broken?: boolean };
};

interface Props {
  unmapped: WixV3ProductSummary[];
  mapped: MappedProduct[];
  /** wixProductId → orsakstext för produkter som TAPPAT SYNK (listning
   *  borttagen / dold av synken / felsvit). Driver ⚠️-filtret + rad-badgen. */
  syncIssues?: Record<string, string>;
  /** wixProductId → orsakstext för SLUT HOS LEVERANTÖREN (synken fungerar,
   *  saldot är 0). Egen gul chip/badge — skild från röda tappat synk. */
  oosIssues?: Record<string, string>;
  /** Live-produkter vars mappning bär trasiga (syntetiska) variant-id —
   *  driver "Laga trasiga variant-id"-knappen. */
  brokenIds?: string[];
}

type Tab = "unmapped" | "mapped";

/** Ackumulerat resultat över alla batchar i en laga-körning. */
interface RepairRunState {
  running: boolean;
  processed: number;
  total: number;
  repaired: { wixProductId: string; rows: number }[];
  ambiguous: { wixProductId: string; ids: string[] }[];
  failed: { wixProductId: string; reason: string }[];
  error?: string;
}

export function MappingsList({ unmapped, mapped, syncIssues = {}, oosIssues = {}, brokenIds = [] }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("unmapped");
  const [filter, setFilter] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [onlyOos, setOnlyOos] = useState(false);
  // Produkter som mappats i denna session — döljs direkt ur "Att mappa" för
  // snabb feedback; router.refresh() reconcilerar serverlistorna strax efter.
  const [sessionMapped, setSessionMapped] = useState<Set<string>>(new Set());
  const [repairRun, setRepairRun] = useState<RepairRunState | null>(null);
  const nameById = useMemo(() => new Map(mapped.map((p) => [p.id, p.name])), [mapped]);

  async function runRepair() {
    const total = brokenIds.length;
    const acc: RepairRunState = {
      running: true, processed: 0, total, repaired: [], ambiguous: [], failed: [],
    };
    setRepairRun({ ...acc });
    // Loopa batchar tills inget kvar. Del-reparerade/tvetydiga/döda läggs i
    // skip-listan så samma olösbara mappningar inte återkommer varje varv.
    const skip: string[] = [];
    try {
      for (let guard = 0; guard < 30; guard++) {
        // brokenIds som allowlist → servern bearbetar samma LIVE-mängd som
        // totalen räknar (orphans för raderade produkter hoppas över).
        const r: RepairBatchResult = await repairSyntheticMappingsAction(skip, brokenIds);
        acc.processed += r.processed;
        acc.repaired.push(...r.repaired);
        acc.ambiguous.push(...r.ambiguous);
        acc.failed.push(...r.failed);
        for (const x of [...r.ambiguous, ...r.failed]) skip.push(x.wixProductId);
        // Även helt reparerade behöver inte besökas igen (de är inte längre
        // trasiga i databasen, men skip skadar inte om revalidering släpar).
        for (const x of r.repaired) skip.push(x.wixProductId);
        setRepairRun({ ...acc });
        if (r.remaining <= 0 || r.processed === 0) break;
      }
    } catch (err) {
      acc.error = err instanceof Error ? err.message : "Okänt fel";
    }
    acc.running = false;
    setRepairRun({ ...acc });
    router.refresh();
  }

  const q = filter.trim().toLowerCase();
  const issueCount = useMemo(
    () => mapped.filter((p) => syncIssues[p.id]).length,
    [mapped, syncIssues],
  );
  const oosCount = useMemo(
    () => mapped.filter((p) => oosIssues[p.id]).length,
    [mapped, oosIssues],
  );

  const unmappedVisible = useMemo(
    () => unmapped.filter((p) => !sessionMapped.has(p.id) && p.name.toLowerCase().includes(q)),
    [unmapped, sessionMapped, q],
  );
  const mappedVisible = useMemo(() => {
    // Chip-filter: båda av → allt; annars UNION av de påslagna kategorierna.
    const chipMatch = (id: string) =>
      (!onlyIssues && !onlyOos) ||
      (onlyIssues && syncIssues[id]) ||
      (onlyOos && oosIssues[id]);
    const list = mapped.filter((p) => p.name.toLowerCase().includes(q) && chipMatch(p.id));
    // Problem överst (tappat synk före slut-i-lager) så de aldrig gömmer sig.
    const rank = (id: string) => (syncIssues[id] ? 2 : oosIssues[id] ? 1 : 0);
    return [...list].sort((a, b) => rank(b.id) - rank(a.id));
  }, [mapped, q, onlyIssues, onlyOos, syncIssues, oosIssues]);

  // Bara sessionMapped-id:n som faktiskt låg i Att mappa-listan får dras av —
  // en OMMAPPNING av en redan mappad produkt hamnar också i sessionMapped och
  // gav annars negativa fliksiffror ("Att mappa -1", Leonards skärmdump 2026-08-09).
  const unmappedCount = unmapped.filter((p) => !sessionMapped.has(p.id)).length;

  function handleMapped(id: string) {
    setSessionMapped((prev) => new Set(prev).add(id));
    // Hämta om serverdatan så produkten flyttas till "Mappade" automatiskt
    // (behåller flik + sökterm eftersom klientkomponenten inte unmountas).
    router.refresh();
  }

  const activeList = tab === "unmapped" ? unmappedVisible : mappedVisible;
  const activeTotal = tab === "unmapped" ? unmappedCount : mapped.length;

  return (
    <div>
      {/* Flikar */}
      <div role="tablist" style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "2px solid #eee" }}>
        <TabButton
          active={tab === "unmapped"}
          onClick={() => setTab("unmapped")}
          label="Att mappa"
          count={unmappedCount}
          activeColor="#F47A35"
        />
        <TabButton
          active={tab === "mapped"}
          onClick={() => setTab("mapped")}
          label="Mappade"
          count={mapped.length}
          activeColor="#070"
        />
      </div>

      {/* Laga trasiga variant-id — kör synkens självläkning på begäran. */}
      {brokenIds.length > 0 || repairRun ? (
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={runRepair}
            disabled={repairRun?.running}
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: repairRun?.running ? "wait" : "pointer",
              border: "1px solid #7c3aed", background: repairRun?.running ? "#f3efff" : "#7c3aed",
              color: repairRun?.running ? "#7c3aed" : "#fff",
            }}
          >
            {repairRun?.running
              ? `🔧 Lagar… ${repairRun.processed}/${repairRun.total}`
              : `🔧 Laga trasiga variant-id (${brokenIds.length})`}
          </button>
          {!repairRun ? (
            <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
              Stämmer av mot AliExpress och ersätter dom-/default-id med riktiga SKU-id
              (samma säkra regler som synken — tvetydiga lämnas orörda).
            </span>
          ) : null}
          {repairRun && !repairRun.running ? (
            <div style={{
              marginTop: 8, padding: 10, borderRadius: 6, fontSize: 13,
              background: "#f6f3ff", border: "1px solid #ddd0ff", color: "#333",
            }}>
              <b>Klart:</b> {repairRun.repaired.length} mappningar lagade
              ({repairRun.repaired.reduce((s, r) => s + r.rows, 0)} variant-id),{" "}
              {repairRun.ambiguous.length} tvetydiga, {repairRun.failed.length} med hämtningsfel.
              {repairRun.error ? <div style={{ color: "#a00" }}>Avbrott: {repairRun.error}</div> : null}
              {repairRun.ambiguous.length > 0 ? (
                <div style={{ marginTop: 6 }}>
                  <b>Tvetydiga</b> (öppna "Ändra mappning" → Spara om med samma länk, så värdematchas de):
                  <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                    {repairRun.ambiguous.map((a) => (
                      <li key={a.wixProductId}>
                        {nameById.get(a.wixProductId) ?? a.wixProductId.slice(0, 8)}{" "}
                        <span style={{ color: "#888" }}>({a.ids.join(", ")})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {repairRun.failed.length > 0 ? (
                <div style={{ marginTop: 6 }}>
                  <b>Hämtningsfel</b> (troligen död/felande AE-källa — byt källa):
                  <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                    {repairRun.failed.map((f) => (
                      <li key={f.wixProductId}>
                        {nameById.get(f.wixProductId) ?? f.wixProductId.slice(0, 8)}{" "}
                        <span style={{ color: "#888" }}>{f.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Problem-filter (bara relevanta i Mappade-fliken) */}
      {tab === "mapped" && (issueCount > 0 || oosCount > 0) ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {issueCount > 0 ? (
            <button
              onClick={() => setOnlyIssues((v) => !v)}
              aria-pressed={onlyIssues}
              style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 13,
                fontWeight: 600, cursor: "pointer",
                border: `1px solid ${onlyIssues ? "#c00" : "#e0b4b4"}`,
                background: onlyIssues ? "#c00" : "#fff5f5",
                color: onlyIssues ? "#fff" : "#c00",
              }}
            >
              ⚠️ Tappat synk ({issueCount}){onlyIssues ? " ✕" : ""}
            </button>
          ) : null}
          {oosCount > 0 ? (
            <button
              onClick={() => setOnlyOos((v) => !v)}
              aria-pressed={onlyOos}
              style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 13,
                fontWeight: 600, cursor: "pointer",
                border: `1px solid ${onlyOos ? "#d97706" : "#ecd3ac"}`,
                background: onlyOos ? "#d97706" : "#fffaf0",
                color: onlyOos ? "#fff" : "#b45309",
              }}
            >
              🟡 Slut hos leverantör ({oosCount}){onlyOos ? " ✕" : ""}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Sök */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={
            tab === "mapped"
              ? "Sök bland MAPPADE produkter på namn (som de heter i Wix)…"
              : "Sök bland produkter ATT MAPPA på namn (som de heter i Wix)…"
          }
          style={{
            width: "100%", padding: "10px 12px", border: "1px solid #ccc",
            borderRadius: 6, fontSize: 14, boxSizing: "border-box",
          }}
        />
        <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
          Visar <b>{activeList.length}</b> av <b>{activeTotal}</b>{" "}
          {tab === "mapped" ? "mappade" : "omappade"} produkter
          {tab === "unmapped" && sessionMapped.size > 0 ? ` · ${sessionMapped.size} mappade denna session` : ""}
        </div>
      </div>

      {/* Lista */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {tab === "unmapped"
          ? unmappedVisible.map((p) => (
              <MappingCard key={p.id} product={p} onMapped={handleMapped} />
            ))
          : mappedVisible.map((p) => (
              <MappingCard
                key={p.id}
                product={p}
                mapping={p.mapping}
                syncIssue={syncIssues[p.id]}
                oosIssue={oosIssues[p.id]}
                onMapped={handleMapped}
              />
            ))}
      </ul>

      {activeList.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: 20 }}>
          {filter
            ? "Inga matchande produkter."
            : tab === "mapped"
              ? "Inga mappade produkter ännu."
              : "🎉 Alla produkter mappade!"}
        </p>
      ) : null}
    </div>
  );
}

function TabButton({
  active, onClick, label, count, activeColor,
}: {
  active: boolean; onClick: () => void; label: string; count: number; activeColor: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        appearance: "none",
        border: "none",
        background: "none",
        padding: "8px 16px",
        marginBottom: -2,
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        color: active ? activeColor : "#888",
        borderBottom: active ? `2px solid ${activeColor}` : "2px solid transparent",
        cursor: "pointer",
      }}
    >
      {label}{" "}
      <span style={{
        display: "inline-block", minWidth: 20, padding: "1px 7px", borderRadius: 999,
        background: active ? activeColor : "#e5e5e5", color: active ? "#fff" : "#666",
        fontSize: 12, fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  );
}
