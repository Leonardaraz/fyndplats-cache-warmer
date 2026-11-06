// Var sidhuvudet hämtar menyn och REA-knappen ifrån. LÖVMODUL, prövad i
// lib/sidhuvud-val.test.ts; kopplingen till katalogen och datacachen ligger i
// lib/sidhuvud-data.ts.
//
// En varm instans har redan katalogen i minnet och bygger som förut. En kall
// instans läser den färdiga menyn ur datacachen, och faller den läsningen
// bygger den ur katalogen som förut. Det långsamma men säkra vägvalet är alltid
// reserven, aldrig ett sidhuvud utan meny.

export type Sidhuvudsdata<T> = { tree: T[]; hasSale: boolean };

export type SidhuvudKallor<T> = {
  /** Har den här instansen redan hela katalogen i minnet? */
  laddad: () => boolean;
  /** Bygg ur katalogen (snabbt på en varm instans, cirka 20 s på en kall). */
  levande: () => Promise<Sidhuvudsdata<T>>;
  /** Den färdiga menyn ur datacachen. Kastar när den inte går att läsa. */
  delad: () => Promise<Sidhuvudsdata<T>>;
};

export async function valjSidhuvud<T>(k: SidhuvudKallor<T>): Promise<Sidhuvudsdata<T>> {
  if (k.laddad()) return k.levande();
  try {
    return await k.delad();
  } catch {
    return k.levande();
  }
}

/** Något nedsatt som går att köpa? Annars leder REA-knappen till en tom lista. */
export function harRea(produkter: readonly { onSale?: boolean; inStock?: boolean }[]): boolean {
  return produkter.some((p) => Boolean(p.onSale && p.inStock));
}
