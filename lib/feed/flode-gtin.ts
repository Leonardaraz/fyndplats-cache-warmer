// lib/feed/flode-gtin.ts
//
// Kartan som Prisjakt- och PriceRunner-flödena använder: CDON-listans koder per
// variant, och dealproffsens där listan saknar varianten. Regeln står i gtin.ts.
// Importeras aldrig av Google-flödet (gtin.test.ts).

import { byggFlodeGtin } from "./gtin";
import { GTIN_CDON } from "./gtin-cdon";
import { PRISJAKT_GTIN } from "./prisjakt-gtin";

export const FLODE_GTIN = byggFlodeGtin(GTIN_CDON, PRISJAKT_GTIN);
