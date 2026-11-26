"use client";
// Stubinen: dagen 07→19 som en lunta som bränns ner, med flackande glödspets.
// Ren klientklocka — kosmetisk, priserna påverkas aldrig härifrån.

import { AUCTION_DAY_MS } from "../lib/auction-day";
import { useClientNow } from "./use-client-now";

export function AuctionFuse({ startAt, nuMs }: { startAt: string | null; nuMs: number }) {
  // Servern ritar luntan med tiden när sidan byggs (nuMs), och den första
  // renderingen i webbläsaren använder samma tid, så att HTML:en och
  // hydreringen är lika. Förut ritades den först efter mount och sköt ner allt
  // under sig (2026-11-26). Klockan är sidans gemensamma (lib/delad-klocka.ts),
  // i halvminutstakt: luntan är tolv timmar lång och flyttar sig ungefär en
  // pixel i minuten, så sekundtakten lade bara om den varje sekund utan att
  // något syntes.
  const { nowMs: now } = useClientNow(nuMs, 30_000);
  if (!startAt) return null;
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
