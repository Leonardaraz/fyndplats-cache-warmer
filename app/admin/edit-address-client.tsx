"use client";

// Låter Leonard rätta leveransadressen direkt i verktyget innan ordern läggs —
// t.ex. när Wix-ordern kom in utan gata/namn, eller kunden hörde av sig med en
// rättelse. Tidigare gick det bara via databasen. Guarden + F50-adressspärren i
// placeOrderForTask ser till att en ofullständig adress aldrig ger en lagd order.

import { useState, useTransition } from "react";
import type { ShippingAddress } from "@/lib/orders/types";
import { updateTaskAddressAction } from "./actions";

const FIELDS: { key: keyof ShippingAddress; label: string; placeholder?: string }[] = [
  { key: "fullName", label: "Namn" },
  { key: "addressLine1", label: "Gatuadress" },
  { key: "addressLine2", label: "Adressrad 2 (valfri)" },
  { key: "postalCode", label: "Postnummer" },
  { key: "city", label: "Ort" },
  { key: "province", label: "Län / region (AliExpress kräver)", placeholder: "t.ex. Stockholm" },
  { key: "country", label: "Land (t.ex. SE)", placeholder: "SE" },
  { key: "phone", label: "Telefon (valfri)" },
];

const input: React.CSSProperties = {
  width: "100%", padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 5,
  fontSize: 13, boxSizing: "border-box",
};

export function EditAddressClient({ taskId, address }: { taskId: string; address?: ShippingAddress }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShippingAddress>(() => ({ ...(address ?? {}) }));
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof ShippingAddress, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); setMsg(null); }}
        style={{ marginTop: 6, background: "none", border: "1px solid #d1d5db", color: "#374151",
          padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
      >
        ✏️ Ändra adress
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa", maxWidth: 420 }}>
      <div style={{ display: "grid", gap: 6 }}>
        {FIELDS.map((f) => (
          <label key={String(f.key)} style={{ fontSize: 12, color: "#4b5563" }}>
            {f.label}
            <input
              style={input}
              value={(form[f.key] as string) ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setMsg(null);
              try {
                const r = await updateTaskAddressAction(taskId, form);
                if (r.ok) { setMsg({ ok: true, text: "✓ Adress sparad" }); setOpen(false); }
                else setMsg({ ok: false, text: `✗ ${r.error}` });
              } catch (e) {
                setMsg({ ok: false, text: `✗ Oväntat fel: ${e instanceof Error ? e.message : String(e)}` });
              }
            })
          }
          style={{ background: "#0E7C86", color: "#fff", border: "none", padding: "6px 12px",
            borderRadius: 6, cursor: pending ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}
        >
          {pending ? "Sparar…" : "Spara adress"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setForm({ ...(address ?? {}) }); setMsg(null); }}
          style={{ background: "none", border: "1px solid #d1d5db", color: "#374151",
            padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          Avbryt
        </button>
      </div>
      {msg ? (
        <div role="status" style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: msg.ok ? "#16804a" : "#b42318" }}>
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
