"use client";

// Ersätter den tidigare tysta <form action>-knappen. Den gamla varianten
// anropade en void-server-action → om placeOrderForTask returnerade
// { ok:false, error } (t.ex. ofullständig adress, F50-spärren) syntes INGET,
// och det såg ut som att knappen var död. Här anropar vi result-varianten och
// visar utfallet (fel i rött, framgång i grönt) direkt under knappen.

import { useState, useTransition } from "react";
import { placeAliExpressOrderResultAction } from "./actions";

type PriceStop = { dsPriceUsd: number; importCostUsd: number; diffPct: number; productUrl: string };

export function PlaceOrderButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Prisvaktens stopp: inte ett fel utan ett beslut — visas med siffror,
  // produktlänk och en uttrycklig "Lägg ändå"-väg (acceptPrice: true).
  const [priceStop, setPriceStop] = useState<PriceStop | null>(null);

  const place = (acceptPrice: boolean) =>
    startTransition(async () => {
      setMsg(null);
      setPriceStop(null);
      try {
        const r = await placeAliExpressOrderResultAction(taskId, acceptPrice);
        if (r.ok) {
          setMsg({ ok: true, text: `✓ Order lagd hos AliExpress (${r.tradeOrderId})` });
        } else {
          if (r.priceStop) setPriceStop(r.priceStop);
          setMsg({ ok: false, text: `✗ ${r.error}` });
        }
      } catch (e) {
        setMsg({ ok: false, text: `✗ Oväntat fel: ${e instanceof Error ? e.message : String(e)}` });
      }
    });

  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => place(false)}
        style={{
          background: pending ? "#f4a877" : "#F47A35",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: 6,
          cursor: pending ? "default" : "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {pending ? "Lägger order…" : "Lägg AliExpress-order"}
      </button>
      {msg ? (
        <div
          role="status"
          style={{
            marginTop: 6,
            fontSize: 13,
            fontWeight: 500,
            color: msg.ok ? "#16804a" : priceStop ? "#b45309" : "#b42318",
            maxWidth: 520,
          }}
        >
          {msg.text}
        </div>
      ) : null}
      {priceStop ? (
        <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a href={priceStop.productUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
            Öppna produktsidan (kolla kampanjpris) ↗
          </a>
          <button
            type="button"
            disabled={pending}
            onClick={() => place(true)}
            style={{
              background: "#fff",
              color: "#b45309",
              border: "1px solid #b45309",
              padding: "5px 10px",
              borderRadius: 6,
              cursor: pending ? "default" : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Lägg ändå till API-priset (${priceStop.dsPriceUsd.toFixed(2)})
          </button>
        </div>
      ) : null}
    </div>
  );
}
