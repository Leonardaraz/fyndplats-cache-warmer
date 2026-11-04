// lib/medlem/offertpriser.ts
//
// Admins styckpriser för en offert (E3-10), prövade innan de sparas. Priset
// skrivs i kronor inkl. moms ("2 290", "2290,50"). Regler:
//   - aldrig över listpriset när förfrågan skickades;
//   - aldrig under golvet G (P6: C × 1,10 × 1,25), när varan har ett;
//   - en vara utan golv (okänd kostnad, auktion, flaggad, AliExpress) får
//     bara sitt listpris: ingen rabatt som inte går att förklara.
//
// Ren modul utan imports.

export interface Offertradspris {
  namn: string;
  antal: number;
  /** Listpriset per styck inkl. moms, i öre. */
  aOre: number;
  /** Golvet per styck inkl. moms, i öre; null utan känd kostnad. */
  golvOre: number | null;
}

/** "2 290", "2290,50" eller "2290.5" kronor till öre; null om det inte är ett belopp. */
export function oreAvKronor(v: unknown): number | null {
  const s = String(v ?? "")
    .replace(/[\s ]/g, "")
    .replace(/kr$/i, "")
    .replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null;
  const [kr, ore = ""] = s.split(".");
  return Number(kr) * 100 + Number(ore.padEnd(2, "0"));
}

export type Offertprisprov = { ok: true; priser: number[] } | { ok: false; fel: string };

/** Prövar `pris_0`, `pris_1` … mot raderna, i samma ordning. */
export function provaOffertpriser(falt: Record<string, unknown>, rader: readonly Offertradspris[]): Offertprisprov {
  const priser: number[] = [];
  for (let i = 0; i < rader.length; i++) {
    const r = rader[i];
    const p = oreAvKronor(falt[`pris_${i}`]);
    if (p === null || p <= 0) return { ok: false, fel: `Skriv ett pris i kronor för ${r.namn}.` };
    if (p > r.aOre) return { ok: false, fel: `${r.namn}: offertpriset är högre än listpriset.` };
    if (r.golvOre === null && p !== r.aOre) return { ok: false, fel: `${r.namn} saknar känd kostnad och kan bara få listpriset.` };
    if (r.golvOre !== null && p < r.golvOre) return { ok: false, fel: `${r.namn}: offertpriset är under golvet.` };
    priser.push(p);
  }
  return { ok: true, priser };
}

/** Offerten gäller i 14 dygn från prissättningen (samma som butikens lib/medlem/offert.ts). */
export const OFFERT_GILTIG_DAGAR = 14;

export function offertGiltigTill(nuMs: number): string {
  return new Date(nuMs + OFFERT_GILTIG_DAGAR * 86_400_000).toISOString();
}
