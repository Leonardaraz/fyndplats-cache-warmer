"use client";

// PDP:ns "Kundrecensioner"-sektion (Trustpilot Product Reviews) som döljer SIG
// SJÄLV när SKU:n saknar recensioner. Utan detta stod rubrik + en tom 500px-
// iframe kvar som en död vit yta mitt på produktsidan (visuell rond 2026-07-02).
//
// Två lager: (1) data-no-reviews="hide" låter Trustpilot kollapsa själva
// widgeten när recensioner saknas; (2) vi pollar iframens höjd och gömmer HELA
// sektionen (rubrik + padding) när widgeten förblir kollapsad/tom. Kravet på
// två låga mätningar i rad efter minst 2 s undviker att gömma i förtid medan
// widgeten fortfarande bootstrappar; riktiga recensioner (>80px) avbryter direkt.
import { useEffect, useRef, useState } from "react";
import { TrustBox, TRUSTBOX_TEMPLATES } from "./trustpilot";

export function PdpReviewsSection({ businessUnitId, sku }: { businessUnitId: string; sku: string }) {
  const wrapRef = useRef<HTMLElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let ticks = 0;
    let lowStreak = 0;
    const timer = setInterval(() => {
      ticks++;
      const iframe = el.querySelector("iframe");
      const h = iframe ? iframe.offsetHeight : 0;
      if (h > 80) { clearInterval(timer); return; } // riktiga recensioner — behåll
      if (ticks >= 4) lowStreak++; // börja räkna först efter 2 s bootstrap-tid
      if (lowStreak >= 2 || ticks >= 24) { // tom/kollapsad → göm; hård stopp ~12 s
        clearInterval(timer);
        setHidden(true);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  if (hidden) return null;

  return (
    <section className="sec revsec" id="recensioner" ref={wrapRef}>
      <div className="container">
        <div className="sechead">
          <div className="eyebrow">Vad kunderna säger</div>
          <h2>Kundrecensioner</h2>
        </div>
        <TrustBox
          businessUnitId={businessUnitId}
          templateId={TRUSTBOX_TEMPLATES.productReviews}
          height="500px"
          sku={sku}
          noReviews="hide"
          className="pdp-trustbox"
        />
      </div>
    </section>
  );
}
