// lib/medlem/korgstadning.ts
//
// Låsta medlemskorgar äldre än ett dygn tas bort (E2). Specen: priserna låses
// när varukorgen skapas, och en korg äldre än 24 timmar räknas om. Wix kassa
// går inte att avbryta från vår sida, men varukorgens id ÄR kassans id i Cart
// V2: tas korgen bort slutar kassans länk att fungera, och nästa klick på
// "Till kassan" bygger en ny korg med dagens nivå och priser.
//
// Ett beslut som blev ett köp (en order med samma purchaseFlowId) får utfallet
// "kopt" och lämnas. Utfallet skrivs på prisbeslutet, som sparas i sju år
// [D1]; korgen själv behövs inte efter köpet.
//
// Ett fel lämnar beslutet utan utfall, så att nästa körning försöker igen.
// Ren modul utan imports: Wix anropas genom beroendena.

export const LAST_TIMMAR = 24;
/** Så långt bakåt letar jobbet. En äldre korg utan utfall är ett fel som syns i svaret. */
export const SOK_DAGAR = 7;
/** Högst så många korgar per körning, så att en körning aldrig drar ut. */
export const PER_KORNING = 25;

export type Korgutfall = "kopt" | "borttagen" | "saknades";

export interface Stadberoenden {
  /** Beslut utan utfall, skapade mellan `efter` och `fore` (ISO), äldst först. */
  utanUtfall(efter: string, fore: string, limit: number): Promise<{ cartId: string; purchaseFlowId: string }[]>;
  /** Finns en order med köpflödets id? */
  orderFinns(purchaseFlowId: string): Promise<boolean>;
  /** Tar bort korgen i Wix. "saknades": Wix hade den inte (404). Kastar vid andra fel. */
  taBortKorg(cartId: string): Promise<"borttagen" | "saknades">;
  sattUtfall(cartId: string, utfall: Korgutfall): Promise<void>;
}

export interface Stadutfall {
  provade: number;
  kopta: number;
  borttagna: number;
  saknades: number;
  fel: number;
}

export async function stadaLastaKorgar(nuMs: number, b: Stadberoenden): Promise<Stadutfall> {
  const fore = new Date(nuMs - LAST_TIMMAR * 3_600_000).toISOString();
  const efter = new Date(nuMs - SOK_DAGAR * 86_400_000).toISOString();
  const ut: Stadutfall = { provade: 0, kopta: 0, borttagna: 0, saknades: 0, fel: 0 };
  const beslut = await b.utanUtfall(efter, fore, PER_KORNING);
  for (const { cartId, purchaseFlowId } of beslut.slice(0, PER_KORNING)) {
    if (!cartId) continue;
    ut.provade++;
    try {
      // Köpet först: en korg som blev en order ska inte räknas som borttagen.
      if (purchaseFlowId && (await b.orderFinns(purchaseFlowId))) {
        await b.sattUtfall(cartId, "kopt");
        ut.kopta++;
        continue;
      }
      const s = await b.taBortKorg(cartId);
      await b.sattUtfall(cartId, s);
      if (s === "borttagen") ut.borttagna++;
      else ut.saknades++;
    } catch {
      ut.fel++;
    }
  }
  return ut;
}
