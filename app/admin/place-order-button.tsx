"use client";

// Ersätter den tidigare tysta <form action>-knappen. Den gamla varianten
// anropade en void-server-action → om placeOrderForTask returnerade
// { ok:false, error } (t.ex. ofullständig adress, F50-spärren) syntes INGET,
// och det såg ut som att knappen var död. Här anropar vi result-varianten och
// visar utfallet (fel i rött, framgång i grönt) direkt under knappen.

import { useState, useTransition } from "react";
import { placeAliExpressOrderResultAction } from "./actions";

export function PlaceOrderButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMsg(null);
            try {
              const r = await placeAliExpressOrderResultAction(taskId);
              setMsg(
                r.ok
                  ? { ok: true, text: `✓ Order lagd hos AliExpress (${r.tradeOrderId})` }
                  : { ok: false, text: `✗ ${r.error}` },
              );
            } catch (e) {
              setMsg({ ok: false, text: `✗ Oväntat fel: ${e instanceof Error ? e.message : String(e)}` });
            }
          })
        }
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
            color: msg.ok ? "#16804a" : "#b42318",
            maxWidth: 520,
          }}
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
