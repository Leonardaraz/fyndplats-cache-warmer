"use client";

// Stänger en task som redan är hanterad utanför systemet, så den lämnar kön och
// order-guarden slutar påminna. Granskningsrutan lovade "Annars kan tasken
// avbrytas" utan att någon knapp kunde göra det — enda åtgärden var "Släpp lås",
// som gör motsatsen (öppnar tasken för orderläggning igen).
//
// Två utfall med OLIKA konsekvens för kunden, därför två knappar och inte en:
// "avbruten" betyder att ingen vara skickas, "hanterad manuellt" att varan är
// på väg. Båda bekräftas, eftersom båda är terminala.

import { useState, useTransition } from "react";
import { closeTaskAction } from "./actions";

export function TaskCloseClient({ taskId, hasAeOrder }: { taskId: string; hasAeOrder?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (outcome: "cancelled" | "fulfilled", fraga: string) => {
    if (!window.confirm(fraga)) return;
    startTransition(async () => {
      setMsg(null);
      try {
        const r = await closeTaskAction(taskId, outcome);
        setMsg(
          r.ok
            ? { ok: true, text: outcome === "cancelled" ? "✓ Avbruten — lämnar kön" : "✓ Stängd som hanterad — lämnar kön" }
            : { ok: false, text: `✗ ${r.error}` },
        );
      } catch (e) {
        setMsg({ ok: false, text: `✗ Oväntat fel: ${e instanceof Error ? e.message : String(e)}` });
      }
    });
  };

  const knapp = {
    background: "none",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: pending ? "default" : "pointer",
  } as const;

  return (
    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            "cancelled",
            "Markera som AVBRUTEN?\n\nAnvänd när kunden är återbetalad eller ordern annullerad — ingen vara ska skickas." +
              (hasAeOrder ? "\n\nOBS: tasken har ett AliExpress-order-id. Avbeställ den på AliExpress först." : ""),
          )
        }
        style={{ ...knapp, border: "1px solid #b91c1c", color: "#b91c1c" }}
      >
        {pending ? "Arbetar…" : "Markera avbruten"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            "fulfilled",
            "Markera som HANTERAD MANUELLT?\n\nAnvänd när varan redan är beställd/skickad för hand och inget mer ska göras i systemet.\n\nTasken blir terminal och slutar dyka upp i påminnelserna.",
          )
        }
        style={{ ...knapp, border: "1px solid #15803d", color: "#15803d" }}
      >
        {pending ? "Arbetar…" : "Hanterad manuellt — stäng"}
      </button>
      {msg ? (
        <div role="status" style={{ width: "100%", marginTop: 2, fontSize: 12.5, fontWeight: 500, color: msg.ok ? "#16804a" : "#b42318" }}>
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
