// /kassa/aterta?k=…[&kod=…] — dit påminnelsemejlets knapp leder när vår kassa
// är på (lib/kassa/aterta.ts). Varorna läggs i besökarens varukorg och kunden
// går till kassan, med rabattkoden från mejl 3 påkommen. Se Aterta.

import type { Metadata } from "next";
import { Aterta } from "./aterta";

export const metadata: Metadata = {
  title: "Din varukorg",
  robots: { index: false, follow: false },
};

export default function KassaAterta() {
  return <Aterta />;
}
