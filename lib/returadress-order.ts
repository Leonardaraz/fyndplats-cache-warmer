// lib/returadress-order.ts
//
// Returadressen för en retur ur en riktig order: varje vald vara kopplas till
// sin produkt i Wix-ordern, och motorn säger vilken leverantör produkten har.
// Regeln och adresserna bor i lib/returadress.ts.
//
// Allt som inte går att avgöra blir null, och kvittot säger då att vi mejlar
// returadressen inom 1 arbetsdag. Uppslaget har en tidsgräns: mottagnings-
// kvittot är ett lagkrav och får aldrig vänta på Wix eller motorn.

import { fetchWixOrder } from "@/app/api/wix-webhook/route";
import { arAosomVara } from "./gpsr";
import { orderRaderUr, produktIdnFor, valjReturadress, type Leverantor, type Returadress } from "./returadress";

const TIDSGRANS_MS = 6000;

/**
 * Leverantören för en vara, eller null. En vara med flera produkter i ordern
 * (samma namn på två rader) räknas bara när alla har samma leverantör.
 *
 * I dag känner butiken bara igen Aosom-varor säkert. Kommer en leverantör till
 * med egen returadress ska den kännas igen här också, med ett besked från
 * motorn om vilken leverantör produkten har.
 */
async function leverantorFor(produktIdn: string[] | null): Promise<Leverantor | null> {
  if (!produktIdn || produktIdn.length === 0) return null;
  const svar = await Promise.all(produktIdn.map((id) => arAosomVara(id)));
  return svar.every((s) => s === true) ? "aosom" : null;
}

/**
 * Returadressen för de valda varorna i en order, eller null. Utan valda varor
 * gäller hela ordern. `ordernummer` ska vara verifierat mot kundens e-post
 * innan det kommer hit (app/api/angra/route.ts gör det).
 */
export async function returadressForOrder(ordernummer: string, varunamn: readonly string[]): Promise<Returadress | null> {
  if (!ordernummer) return null;
  const uppslag = (async () => {
    const order = await fetchWixOrder(ordernummer);
    if (!order) return null;
    const produktIdn = produktIdnFor(varunamn, orderRaderUr(order));
    if (produktIdn.length === 0) return null;
    const leverantorer = await Promise.all(produktIdn.map(leverantorFor));
    return valjReturadress(leverantorer);
  })();
  const grans = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIDSGRANS_MS));
  try {
    return await Promise.race([uppslag, grans]);
  } catch (err) {
    console.error("[angra] returadressen gick inte att avgöra", err instanceof Error ? err.message : err);
    return null;
  }
}
