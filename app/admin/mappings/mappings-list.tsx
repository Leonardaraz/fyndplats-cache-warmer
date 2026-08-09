"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WixV3ProductSummary } from "@/lib/wix/v3-products";
import { MappingCard } from "./mapping-card";

/** En redan mappad produkt + dess AliExpress-källa (för "Mappade"-fliken). */
export type MappedProduct = WixV3ProductSummary & {
  mapping: { supplierProductId: string; variantCount: number };
};

interface Props {
  unmapped: WixV3ProductSummary[];
  mapped: MappedProduct[];
  /** wixProductId → orsakstext för produkter som TAPPAT SYNK (listning
   *  borttagen / dold av synken / felsvit). Driver ⚠️-filtret + rad-badgen. */
  syncIssues?: Record<string, string>;
}

type Tab = "unmapped" | "mapped";

export function MappingsList({ unmapped, mapped, syncIssues = {} }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("unmapped");
  const [filter, setFilter] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  // Produkter som mappats i denna session — döljs direkt ur "Att mappa" för
  // snabb feedback; router.refresh() reconcilerar serverlistorna strax efter.
  const [sessionMapped, setSessionMapped] = useState<Set<string>>(new Set());

  const q = filter.trim().toLowerCase();
  const issueCount = useMemo(
    () => mapped.filter((p) => syncIssues[p.id]).length,
    [mapped, syncIssues],
  );

  const unmappedVisible = useMemo(
    () => unmapped.filter((p) => !sessionMapped.has(p.id) && p.name.toLowerCase().includes(q)),
    [unmapped, sessionMapped, q],
  );
  const mappedVisible = useMemo(() => {
    const list = mapped.filter(
      (p) => p.name.toLowerCase().includes(q) && (!onlyIssues || syncIssues[p.id]),
    );
    // Tappat synk överst så problemen aldrig gömmer sig långt ner i listan.
    return [...list].sort(
      (a, b) => (syncIssues[b.id] ? 1 : 0) - (syncIssues[a.id] ? 1 : 0),
    );
  }, [mapped, q, onlyIssues, syncIssues]);

  const unmappedCount = unmapped.length - sessionMapped.size;

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

      {/* Tappat synk-filter (bara relevant i Mappade-fliken) */}
      {tab === "mapped" && issueCount > 0 ? (
        <button
          onClick={() => setOnlyIssues((v) => !v)}
          aria-pressed={onlyIssues}
          style={{
            marginBottom: 10, padding: "5px 12px", borderRadius: 999, fontSize: 13,
            fontWeight: 600, cursor: "pointer",
            border: `1px solid ${onlyIssues ? "#c00" : "#e0b4b4"}`,
            background: onlyIssues ? "#c00" : "#fff5f5",
            color: onlyIssues ? "#fff" : "#c00",
          }}
        >
          ⚠️ Tappat synk ({issueCount}){onlyIssues ? " ✕" : ""}
        </button>
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
