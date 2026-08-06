"use client";

// Prisjämförelsen inför orderläggning: hämtar dagens DS-API-pris och visar det
// bredvid importbaslinjen + länk till produktsidan. Konsumentkassans kampanjer
// och kuponger är session-bundna (bara synliga i Leonards inloggade webbläsare)
// — därför är sista ledet mänskligt: öppna sidan, jämför, välj billigaste vägen.

import { useState, useTransition } from "react";
import { checkDsPriceAction } from "./actions";

type Res = Awaited<ReturnType<typeof checkDsPriceAction>>;

export function PriceCheckClient({ taskId }: { taskId: string }) {
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
              setRes(await checkDsPriceAction(taskId));
            } catch (e) {
              setRes({ ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          })
        }
        style={{ background: "none", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: 6, cursor: pending ? "default" : "pointer", fontSize: 13, color: "#334155" }}
      >
        {pending ? "Hämtar pris…" : "💰 Jämför pris (API vs produktsida)"}
      </button>
      {res ? (
        res.ok ? (
          <div style={{ marginTop: 6, fontSize: 13, color: "#334155", maxWidth: 520 }}>
            <div>
              API-pris nu: <b>${res.dsPriceUsd.toFixed(2)}</b> (≈{res.dsPriceSekApprox} kr)
              {res.importCostUsd != null ? (
                <>
                  {" "}· importpris ${res.importCostUsd.toFixed(2)}
                  {res.diffPct != null && res.diffPct !== 0 ? (
                    <b style={{ color: res.diffPct > 0 ? "#b45309" : "#16804a" }}>
                      {" "}({res.diffPct > 0 ? "+" : ""}{res.diffPct} %)
                    </b>
                  ) : null}
                </>
              ) : null}
              {res.variantLabel ? <span style={{ color: "#64748b" }}> · {res.variantLabel}</span> : null}
            </div>
            <div style={{ marginTop: 3 }}>
              <a href={res.productUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                Öppna produktsidan (kolla kampanj/kupong) ↗
              </a>
              <span style={{ color: "#64748b" }}> — billigare där? Beställ manuellt och koppla ordernumret nedan.</span>
            </div>
          </div>
        ) : (
          <div role="status" style={{ marginTop: 6, fontSize: 13, color: "#b42318" }}>{res.error}</div>
        )
      ) : null}
    </div>
  );
}
