"use client";

// Låter Leonard lösa en fastlåst task (osäkert orderutfall / annullering-race) i
// appen i stället för databas-kirurgi: släpper claim-låset + rensar
// granskningsflaggorna så den kan läggas om eller hanteras. Server-actionen vägrar
// när ett AE-order-id finns (då kan en order redan vara lagd → dubbel-order-risk).

import { useState, useTransition } from "react";
import { releaseTaskAction } from "./actions";

export function TaskRecoveryClient({ taskId, hasAeOrder }: { taskId: string; hasAeOrder: boolean }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        disabled={pending}
        title={hasAeOrder ? "Verifiera/avbeställ på AliExpress först — låset släpps inte när ett AE-order-id finns" : undefined}
        onClick={() => {
          // Ett osäkert utfall kan innebära att en AE-order FAKTISKT lades men att
          // vi inte fick något id. Släpper man låset och lägger om → dubbelbeställning.
          // Kräv därför att Leonard bekräftar att han kontrollerat på AliExpress.
          if (!window.confirm(
            "Bekräfta att du kontrollerat på AliExpress att INGEN order lades för denna task.\n\n" +
            "Att släppa låset felaktigt kan leda till en dubbelbeställning. Fortsätta?",
          )) return;
          startTransition(async () => {
            setMsg(null);
            try {
              const r = await releaseTaskAction(taskId);
              setMsg(r.ok ? { ok: true, text: "✓ Lås släppt — tasken kan hanteras/läggas om" } : { ok: false, text: `✗ ${r.error}` });
            } catch (e) {
              setMsg({ ok: false, text: `✗ Oväntat fel: ${e instanceof Error ? e.message : String(e)}` });
            }
          });
        }}
        style={{ background: "none", border: "1px solid #b91c1c", color: "#b91c1c",
          padding: "4px 10px", borderRadius: 6, cursor: pending ? "default" : "pointer", fontSize: 12, fontWeight: 600 }}
      >
        {pending ? "Släpper…" : "Släpp lås / rensa flagga"}
      </button>
      {msg ? (
        <div role="status" style={{ marginTop: 5, fontSize: 12.5, fontWeight: 500, color: msg.ok ? "#16804a" : "#b42318" }}>
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
