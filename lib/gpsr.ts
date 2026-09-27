// lib/gpsr.ts
//
// Hämtar produktsäkerhetsuppgifterna (GPSR) för en produkt från motorn.
// Se lib/gpsr-flik.ts för vad de är och varför.
//
// Fail-closed: svarar motorn inte, eller är produkten ingen Aosom-vara, blir
// svaret null och produktsidan visar ingen flik — precis som innan. En
// Aosom-vara får alltid minst tillverkaren; säkerhetsraderna kommer från
// motorns datafil eller från poleringens avsnitt i beskrivningen.

import { tolkaGpsr, type GpsrData } from "./gpsr-flik";

const API =
  process.env.CACHE_WARMER_GPSR_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/gpsr";

export async function getGpsr(productId: string): Promise<GpsrData | null> {
  if (!productId) return null;
  try {
    const res = await fetch(`${API}?id=${encodeURIComponent(productId)}`, {
      // Uppgifterna ändras bara när Aosom skriver om en produkttext.
      next: { revalidate: 86_400, tags: ["gpsr"] },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return tolkaGpsr(await res.json());
  } catch {
    return null;
  }
}
