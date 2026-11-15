"use client";
// Stubinen: dagen 07→19 som en lunta som bränns ner, med flackande glödspets.
// Ren klientklocka — kosmetisk, priserna påverkas aldrig härifrån.

import { AUCTION_DAY_MS } from "../lib/auction-day";
import { useClientNow } from "./use-client-now";

export function AuctionFuse({ startAt }: { startAt: string | null }) {
  // Renderas först efter mount: bredden beror på klockan och skulle annars
  // ge server/klient-hydration-mismatch. Sekundtakten är sidans gemensamma
  // klocka, samma slag som korten (lib/delad-klocka.ts).
  const { nowMs: now, mounted } = useClientNow(0, 1000);
  if (!startAt || !mounted) return null;
  const p = Math.min(1, Math.max(0, (now - Date.parse(startAt)) / AUCTION_DAY_MS));
  return (
    <div className="a-fuse" aria-hidden="true" suppressHydrationWarning>
      <span className="a-fcap">07</span>
      <div className="a-ftrack">
        <div className="a-fburn" style={{ width: `${p * 100}%` }} />
        {/* Glödspetsen visas bara medan luntan faktiskt brinner: släckt när
            den brunnit klart (dagen slut) OCH otänd före start — en flackande
            glöd på en otänd eller färdigbrunnen lunta ser trasig ut. */}
        {p > 0 && p < 1 && <div className="a-ftip" style={{ left: `${p * 100}%` }} />}
      </div>
      <span className="a-fcap">19</span>
    </div>
  );
}
