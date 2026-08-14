"use client";
// Stubinen: dagen 07→19 som en lunta som bränns ner, med flackande glödspets.
// Ren klientklocka — kosmetisk, priserna påverkas aldrig härifrån.

import { useEffect, useState } from "react";
import { AUCTION_DAY_HOURS } from "../lib/auction-day";

export function AuctionFuse({ startAt }: { startAt: string | null }) {
  // Renderas först efter mount: bredden beror på klockan och skulle annars
  // ge server/klient-hydration-mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!startAt || now === null) return null;
  const p = Math.min(1, Math.max(0, (now - Date.parse(startAt)) / (AUCTION_DAY_HOURS * 3_600_000)));
  return (
    <div className="a-fuse" aria-hidden="true" suppressHydrationWarning>
      <span className="a-fcap">07</span>
      <div className="a-ftrack">
        <div className="a-fburn" style={{ width: `${p * 100}%` }} />
        {/* Glödspetsen släcks när luntan brunnit klart (dagen slut) —
            en flackande glöd på en färdigbrunnen lunta ser trasig ut. */}
        {p < 1 && <div className="a-ftip" style={{ left: `${p * 100}%` }} />}
      </div>
      <span className="a-fcap">19</span>
    </div>
  );
}
