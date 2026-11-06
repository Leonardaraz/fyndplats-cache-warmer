// lib/kassa/aterta-korg.ts
//
// Webbläsarens del av påminnelselänken (lib/kassa/aterta.ts har skälen):
// vilka av korgens varor som ska läggas i besökarens varukorg, och vilka
// kontaktuppgifter kassan skickar till korgen (/api/kassa/kontakt).
//
// Ren modul utan lokala imports utom typer, så att `node --test` kan läsa den.

/** En vara ur den övergivna korgen, prövad mot katalogen (lib/medlem/kop-igen.ts). */
export interface Atertarad {
  produktId: string;
  variantId?: string;
  antal: number;
}

/** En rad som redan ligger i besökarens varukorg. */
export interface Korgrad {
  produktId: string;
  variantId?: string | null;
  antal: number;
}

const nyckel = (produktId: string, variantId?: string | null) => `${produktId}|${variantId ?? ""}`;

/**
 * Det som ska läggas i varukorgen: korgens varor minus det som redan ligger
 * där. Öppnar kunden länken två gånger, eller på samma telefon där varorna
 * redan ligger, blir det alltså inga dubbletter.
 */
export function attLaggaI(onskat: readonly Atertarad[], finns: readonly Korgrad[]): Atertarad[] {
  const har = new Map<string, number>();
  for (const r of finns) har.set(nyckel(r.produktId, r.variantId), (har.get(nyckel(r.produktId, r.variantId)) ?? 0) + Math.max(0, r.antal));
  const ut: Atertarad[] = [];
  for (const r of onskat) {
    const k = nyckel(r.produktId, r.variantId);
    const saknas = r.antal - (har.get(k) ?? 0);
    if (saknas > 0) ut.push({ produktId: r.produktId, ...(r.variantId ? { variantId: r.variantId } : {}), antal: saknas });
    har.set(k, Math.max(har.get(k) ?? 0, r.antal));
  }
  return ut;
}

type WixRad = {
  quantity?: number;
  catalogReference?: { catalogItemId?: string; options?: { variantId?: string } | null } | null;
};

/** Besökarens varukorg (Wix-korgen i components/cart.tsx) som rader. */
export function korgensRader(cart: { lineItems?: unknown } | null | undefined): Korgrad[] {
  const items = Array.isArray(cart?.lineItems) ? (cart.lineItems as WixRad[]) : [];
  const ut: Korgrad[] = [];
  for (const li of items) {
    const id = li?.catalogReference?.catalogItemId;
    if (typeof id !== "string" || !id) continue;
    const variantId = li.catalogReference?.options?.variantId;
    ut.push({ produktId: id, variantId: typeof variantId === "string" && variantId ? variantId : null, antal: typeof li.quantity === "number" ? li.quantity : 1 });
  }
  return ut;
}

/** Vart sidan skickar kunden när varorna ligger i varukorgen: kassan, med rabattkoden om mejlet hade en. */
export function tillKassan(kod: string | null | undefined): string {
  const k = (kod ?? "").replace(/\s/g, "").slice(0, 40);
  return k ? `/kassa?kod=${encodeURIComponent(k)}` : "/kassa";
}
