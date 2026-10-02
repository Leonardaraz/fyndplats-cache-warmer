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
import { gpsrTagg } from "./produkt-cache";
import { kortLivslangd } from "./kort-livslangd";

const API =
  process.env.CACHE_WARMER_GPSR_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/gpsr";

export async function getGpsr(productId: string): Promise<GpsrData | null> {
  if (!productId) return null;
  try {
    const res = await fetch(`${API}?id=${encodeURIComponent(productId)}`, {
      // Uppgifterna ändras bara när Aosom skriver om en produkttext. Posten töms
      // per produkt (gpsr-<id>) när produkten ändras, se lib/produkt-cache.ts.
      next: { revalidate: 86_400, tags: ["gpsr", gpsrTagg(productId)] },
      signal: AbortSignal.timeout(4000),
    });
    // 404 = produkten har inga uppgifter (ingen Aosom-vara). Det är ett svar,
    // inte ett fel: ingen flik, och sidan får sin vanliga livslängd.
    if (res.status === 404) return null;
    if (!res.ok) {
      await kortLivslangd();
      return null;
    }
    return tolkaGpsr(await res.json());
  } catch {
    // Motorn svarade inte (tidsgräns, nätfel). Sidan visas utan flik, men byggs
    // om efter fem minuter i stället för att sakna fliken i sex timmar.
    await kortLivslangd();
    return null;
  }
}
