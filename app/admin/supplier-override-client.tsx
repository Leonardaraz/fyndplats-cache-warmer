"use client";

// Per-order leverantörsbyte (klient-UI). Låter Leonard hämta en alternativ
// AliExpress-källas varianter, välja rätt SKU och lägga ett override på just
// denna orderrad — utan att röra produktens globala mappning. placeAliExpressOrder
// använder sedan override:n. Se actions.ts för server-logiken.

import { useState, useTransition } from "react";
import {
  clearOrderSupplierOverrideAction,
  fetchSupplierVariantsAction,
  setOrderSupplierOverrideAction,
} from "./actions";

interface SupplierVariantOption {
  skuId: string;
  label: string;
  price: number;
  stock: number;
  shipFrom?: string;
}

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  textDecoration: "underline",
};
const btn: React.CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  padding: "4px 10px",
};
const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#2563eb",
  border: "none",
  color: "#fff",
  fontWeight: 600,
};

export function SupplierOverrideClient({
  taskId,
  variantChoices,
  override,
}: {
  taskId: string;
  variantChoices: Record<string, string>;
  override?: { productId: string; skuId?: string; label?: string };
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [variants, setVariants] = useState<SupplierVariantOption[] | null>(null);
  const [productId, setProductId] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Aktivt override → visa badge + möjlighet att rensa (faller tillbaka på mappningen).
  if (override?.productId) {
    return (
      <div style={{ marginTop: 6, fontSize: 13 }}>
        <span
          style={{
            background: "#fde68a",
            color: "#92400e",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          🔁 Byter leverantör: {override.label ?? override.productId}
          {override.skuId ? ` · SKU ${override.skuId}` : ""}
        </span>{" "}
        <button
          type="button"
          disabled={pending}
          style={linkBtn}
          onClick={() => startTransition(async () => { await clearOrderSupplierOverrideAction(taskId); })}
        >
          Rensa
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" style={{ ...linkBtn, marginTop: 6 }} onClick={() => setOpen(true)}>
        Byt leverantör (annan källa)…
      </button>
    );
  }

  const fetchVariants = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetchSupplierVariantsAction(input);
      if (!res.ok) {
        setVariants(null);
        setError(res.error);
        return;
      }
      setVariants(res.variants);
      setProductId(res.productId);
      setSelectedSku(res.variants[0]?.skuId ?? "");
    });
  };

  const save = () => {
    setError(null);
    const chosen = variants?.find((v) => v.skuId === selectedSku);
    startTransition(async () => {
      const res = await setOrderSupplierOverrideAction(taskId, productId, selectedSku, chosen?.label);
      if (!res.ok) {
        setError(res.error ?? "Kunde inte spara bytet");
        return;
      }
      // revalidatePath i action:en uppdaterar server-komponenten → override-badge visas.
      setOpen(false);
    });
  };

  return (
    <div style={{ marginTop: 6, padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>
        Kundens variant:{" "}
        {Object.entries(variantChoices).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"} — välj samma
        hos den nya leverantören.
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AliExpress produkt-id eller URL"
          style={{ flex: 1, minWidth: 220, padding: "4px 6px" }}
        />
        <button type="button" style={btn} disabled={pending || !input.trim()} onClick={fetchVariants}>
          {pending && !variants ? "Hämtar…" : "Hämta varianter"}
        </button>
      </div>
      {variants ? (
        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: "4px 6px" }}
          >
            {variants.map((v) => (
              <option key={v.skuId} value={v.skuId}>
                {v.label} · ${v.price} · lager {v.stock}
                {v.shipFrom ? ` · ${v.shipFrom}` : ""}
              </option>
            ))}
          </select>
          <button type="button" style={btnPrimary} disabled={pending || !selectedSku} onClick={save}>
            Spara byte
          </button>
        </div>
      ) : null}
      {error ? <div style={{ color: "#dc2626", marginTop: 4 }}>{error}</div> : null}
      <div style={{ marginTop: 4 }}>
        <button
          type="button"
          style={linkBtn}
          onClick={() => {
            setOpen(false);
            setVariants(null);
            setError(null);
          }}
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
