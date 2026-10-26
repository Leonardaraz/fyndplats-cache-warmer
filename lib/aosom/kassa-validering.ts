// Kassans kontroll: stoppar köpet när kundvagnen har en Aosom-vara och
// leveransadressen har ett postnummer dit Aosom inte levererar.
//
// Wix fraktinställningar kan bara välja land och län, inte postnummer (Delivery
// Profiles, mätt 2026-10-26), och adressen skrivs in i Wix egen kassa. Den enda
// vägen till en spärr i kassan är Wix tillägg Ecom Validations: Wix anropar
// /api/wix-validering/v1/get-violations med kundvagnen och adressen, och ett
// svar med `severity: "ERROR"` hindrar kunden från att lägga ordern.
//
// Tre egenskaper som inte ska tas bort:
//
// 1. ☠️ Svaret bär EN överträdelse med målet `other`. Det är den form Wix
//    dokumentation visar i alla exempel. En form som Wix inte känner igen hade
//    gjort att spärren tyst uteblev.
// 2. ☠️ Ett fel eller en timeout släpper igenom köpet. En databas som hackar
//    får inte stänga kassan för alla kunder. Det som slinker igenom fångas av
//    larmet på ordern och av bulkordern, som hoppar över den.
// 3. Bara Aosom. Varor från andra leverantörer levereras dit som förut.

import { aosomSparrForAdress } from "./postnummer-sparr";

/** En rad i kundvagnen, så som Wix skickar den (`validationInfo.lineItems[]`). */
export interface KassaRad {
  id?: string;
  catalogReference?: { catalogItemId?: string; appId?: string };
  productName?: { original?: string; translated?: string };
}

/** Det ur `validationInfo` som kontrollen läser. */
export interface KassaInfo {
  lineItems?: KassaRad[];
  shippingAddress?: { address?: { country?: string; postalCode?: string } };
}

export interface Overtradelse {
  severity: "ERROR";
  target: { other: { name: "OTHER_DEFAULT" } };
  description: string;
}

export interface KassaDeps {
  /** Sant när Wix-produkten säljs som en Aosom-vara. */
  arAosomProdukt: (wixProductId: string) => Promise<boolean>;
}

/** "a", "a och b", "a, b och c" — och "a, b, c och 2 andra varor" för fler. */
function namnlista(namn: string[]): string {
  const visade = namn.slice(0, 3);
  const resten = namn.length - visade.length;
  if (resten > 0) return `${visade.join(", ")} och ${resten} ${resten === 1 ? "annan vara" : "andra varor"}`;
  if (visade.length === 1) return visade[0];
  return `${visade.slice(0, -1).join(", ")} och ${visade[visade.length - 1]}`;
}

/** Överträdelserna för en kundvagn: tom lista när köpet får gå igenom. */
export async function kassansOvertradelser(
  info: KassaInfo | null | undefined,
  deps: KassaDeps,
): Promise<Overtradelse[]> {
  const postnummer = aosomSparrForAdress(info?.shippingAddress?.address);
  if (!postnummer) return [];

  // En produkt kan stå på flera rader (två färger) och slås upp en gång. En rad
  // som inte är en butiksvara (ett presentkort) har ingen mappning och spärras
  // aldrig.
  const rader = (info?.lineItems ?? []).filter((r) => r.catalogReference?.catalogItemId);
  const produktIds = [...new Set(rader.map((r) => r.catalogReference!.catalogItemId!))];
  const svar = await Promise.all(produktIds.map((id) => deps.arAosomProdukt(id)));
  const aosomIds = new Set(produktIds.filter((_, i) => svar[i]));
  if (aosomIds.size === 0) return [];

  const namn = [
    ...new Set(
      rader
        .filter((r) => aosomIds.has(r.catalogReference!.catalogItemId!))
        .map((r) => r.productName?.translated || r.productName?.original || "en vara"),
    ),
  ];
  const varan = namn.length === 1 ? "varan" : "varorna";
  return [
    {
      severity: "ERROR",
      target: { other: { name: "OTHER_DEFAULT" } },
      description:
        `Vi kan tyvärr inte leverera ${namnlista(namn)} till postnummer ${postnummer}. ` +
        `Ta bort ${varan} ur kundvagnen eller välj en annan leveransadress.`,
    },
  ];
}

/**
 * Läser Wix anrop: ett JWT vars `data` bär `request` och `metadata`. `data`
 * kan komma som objekt eller som JSON-sträng (så levererar Wix sina webhooks),
 * och båda formerna tas emot.
 *
 * Returnerar `validationInfo`, eller ett skäl när anropet inte ska litas på.
 */
export function lasKassaAnrop(
  payload: Record<string, unknown>,
  opts: { nuSek: number; appId?: string },
): { info: KassaInfo | null } | { fel: string } {
  if (payload.iss !== "wix.com") return { fel: "fel utfärdare" };
  const exp = typeof payload.exp === "number" ? payload.exp : NaN;
  const iat = typeof payload.iat === "number" ? payload.iat : NaN;
  // Tidsstämplarna tillåter en minut av klockfel mellan Wix och Vercel.
  if (!(exp > opts.nuSek - 60)) return { fel: "utgånget" };
  if (!(iat < opts.nuSek + 60)) return { fel: "utfärdat i framtiden" };
  if (opts.appId && payload.aud !== opts.appId) return { fel: "fel mottagare" };

  let data: unknown = payload.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return { fel: "data går inte att läsa" };
    }
  }
  const request = (data as { request?: { validationInfo?: KassaInfo } } | null)?.request;
  return { info: request?.validationInfo ?? null };
}
