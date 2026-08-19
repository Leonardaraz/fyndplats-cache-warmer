"use client";

// Fraktdiagnos inför orderläggning.
//
// Finns för att order #10021 avvisades med DELIVERY_METHOD_NOT_EXIST medan
// AliExpress egen produktsida samtidigt erbjöd fri frakt från Tjeckien,
// Frankrike och Spanien. Två gissningar om orsaken visade sig fel — först att
// det gällde fraktsättets NAMN, sedan att varan inte gick att skicka alls. En
// tredje gissning vore inte bättre än de förra, så knappen visar rådatat:
// vilket sku_id vi frågar med, vad AliExpress svarar, och vilka SKU:er
// produkten faktiskt har.
//
// Den sista listan är poängen: har produkten flera SKU:er för olika lager, och
// vår pekar på ett som inte når Sverige, syns det direkt här.
//
// Läser bara — lägger ingen order.

import { useState, useTransition } from "react";
import { freightDiagnosticsAction } from "./actions";

type Res = Awaited<ReturnType<typeof freightDiagnosticsAction>>;

export function FreightCheckClient({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [res, setRes] = useState<Res | null>(null);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setRes(await freightDiagnosticsAction(taskId));
            } catch (e) {
              setRes({ ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          })
        }
        style={{
          background: "none",
          border: "1px solid #cbd5e1",
          padding: "5px 10px",
          borderRadius: 6,
          cursor: pending ? "default" : "pointer",
          fontSize: 13,
          color: "#334155",
        }}
      >
        {pending ? "Frågar AliExpress…" : "🚚 Kolla frakt (diagnos)"}
      </button>

      {res ? (
        res.ok ? (
          <div style={{ marginTop: 8, fontSize: 13, color: "#334155", maxWidth: 720 }}>
            <div>
              Frågade med sku_id <b>{res.skuIdUsed ?? "— kunde inte härledas —"}</b> för{" "}
              <b>{res.country}</b>{" "}
              <span style={{ color: "#64748b" }}>(mappningens id: {res.supplierVariantId})</span>
            </div>

            <div style={{ marginTop: 6 }}>
              {res.optionCount === 0 ? (
                <b style={{ color: "#b45309" }}>AliExpress gav 0 fraktalternativ för den SKU:n.</b>
              ) : (
                <>
                  <b style={{ color: "#15803d" }}>{res.optionCount} fraktalternativ:</b>
                  <ul style={{ margin: "4px 0 0 18px" }}>
                    {res.options.map((o) => (
                      <li key={o.serviceName}>
                        {o.serviceName} — {o.costSek ?? "?"} kr, {o.maxDays ?? "?"} dgr
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: "pointer" }}>
                Produktens alla SKU:er ({res.allSkus.length}) — ser du ett annat lager här?
              </summary>
              <ul style={{ margin: "6px 0 0 18px", color: "#475569" }}>
                {res.allSkus.map((s) => (
                  <li key={s.skuId}>
                    <code>{s.skuId}</code>
                    {s.props ? ` — ${s.props}` : ""}
                    {s.skuId === res.skuIdUsed ? <b> ← den vi frågar med</b> : null}
                  </li>
                ))}
              </ul>
            </details>

            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer" }}>Råsvar från frakt-API:t</summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  background: "#f8fafc",
                  padding: 8,
                  borderRadius: 6,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {res.rawSnippet}
              </pre>
            </details>
          </div>
        ) : (
          <div style={{ marginTop: 6, fontSize: 13, color: "#b91c1c" }}>{res.error}</div>
        )
      ) : null}
    </div>
  );
}
