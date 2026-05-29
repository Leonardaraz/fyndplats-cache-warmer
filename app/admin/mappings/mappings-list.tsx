"use client";

import { useState } from "react";
import type { WixV3ProductSummary } from "@/lib/wix/v3-products";
import { MappingCard } from "./mapping-card";

interface Props {
  initialProducts: WixV3ProductSummary[];
}

export function MappingsList({ initialProducts }: Props) {
  const [mappedIds, setMappedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const visible = initialProducts.filter(
    (p) => !mappedIds.has(p.id) && p.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <div style={{ marginBottom: 12, padding: 10, background: "#f1f1f1", borderRadius: 6 }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrera produkter på namn..."
          style={{
            width: "100%", padding: "8px 10px", border: "1px solid #ccc",
            borderRadius: 4, fontSize: 14,
          }}
        />
        <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
          Visar <b>{visible.length}</b> av <b>{initialProducts.length - mappedIds.size}</b> omappade produkter
          {mappedIds.size > 0 ? ` · ${mappedIds.size} mappade denna session` : ""}
        </div>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {visible.map((p) => (
          <MappingCard
            key={p.id}
            product={p}
            onMapped={(id) => setMappedIds((prev) => new Set(prev).add(id))}
          />
        ))}
      </ul>

      {visible.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: 20 }}>
          {filter ? "Inga matchande produkter." : "🎉 Alla produkter mappade!"}
        </p>
      ) : null}
    </div>
  );
}
