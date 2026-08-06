"use client";

// "Koppla manuell AliExpress-order" — när Leonard beställt i konsumentkassan
// (kampanj/kupong billigare än DS-API:t) klistrar han in ordernumret här, och
// ordern blir därefter exakt lika automatisk som en API-order: spårning → Wix →
// kundmejl → 17TRACK. Validering + probe + audit ligger i server-actionen.

import { useState, useTransition } from "react";
import { linkAliExpressOrderAction } from "./actions";

export function LinkAeOrderClient({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ marginTop: 6, background: "none", border: "none", padding: 0, color: "#2563eb", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
      >
        Beställt manuellt på AliExpress? Koppla ordernumret →
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: "8px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, maxWidth: 520 }}>
      <div style={{ fontSize: 13, color: "#1e40af", marginBottom: 6 }}>
        Klistra in ordernumret från din AliExpress-orderlista (”Ref. Number”, bara siffror) —
        sen sköts spårning och kundmejl automatiskt, som för en vanlig API-order.
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="t.ex. 3075422919233058"
          inputMode="numeric"
          style={{ flex: "1 1 220px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }}
        />
        <button
          type="button"
          disabled={pending || !orderId.trim()}
          onClick={() =>
            startTransition(async () => {
              setMsg(null);
              try {
                const r = await linkAliExpressOrderAction(taskId, orderId);
                setMsg({ ok: r.ok, text: r.message });
              } catch (e) {
                setMsg({ ok: false, text: `Oväntat fel: ${e instanceof Error ? e.message : String(e)}` });
              }
            })
          }
          style={{ background: pending ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: pending ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}
        >
          {pending ? "Kopplar…" : "Koppla order"}
        </button>
      </div>
      {msg ? (
        <div role="status" style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: msg.ok ? "#16804a" : "#b42318" }}>
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
