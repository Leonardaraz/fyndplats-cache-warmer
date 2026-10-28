// lib/ae-etikett.ts
//
// Rubriken över varje händelse från AliExpress-källan på /sparning. Händelserna
// kom utan rubrik, så historiken saknade den rad som står över varje händelse i
// 17TRACK-vägen (genomgången av alla paket 2026-10-28). Samma ord som
// STAGE_LABEL_SV i app/api/track/route.ts. Bara en typimport, så att node --test
// kan ladda modulen.

import type { AeStatus } from "./ae-track";

export const AE_ETIKETT: Record<AeStatus, string> = {
  Delivered: "Levererad",
  OutForDelivery: "Ute för leverans",
  AvailableForPickup: "Finns för upphämtning",
  InTransit: "På väg",
};
