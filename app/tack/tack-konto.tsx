// "Skapa konto – köpet räknas" på tacksidan (medlemskapet E1). Visas bara i
// läget "pa" och bara för den som inte är inloggad. Orderns id följer med, så
// att köpet läses in i orderliggaren direkt vid inloggningen, även om
// webhooken inte hunnit fram.

import { medlemsHemlighet, medlemsLage } from "@/lib/medlem/lager";
import { inloggad } from "@/lib/medlem/inloggad";
import { orderGuid } from "@/lib/medlem/inloggning";

export async function TackKonto({ orderId }: { orderId: string }) {
  if (!medlemsHemlighet() || (await medlemsLage()) !== "pa" || (await inloggad())) return null;
  const order = orderGuid(orderId);
  const href = `/konto?fran=tack${order ? `&order=${order}` : ""}`;
  return (
    <div className="tack-konto">
      <p className="tack-konto-rubrik">Skapa konto – köpet räknas</p>
      <p className="tack-konto-text">
        Med ett konto ser du dina ordrar och din medlemsnivå. Köpet du just gjorde räknas, och så gör dina köp det senaste
        året med samma e-post.
      </p>
      <a href={href} className="btn btn-primary">
        Skapa konto
      </a>
    </div>
  );
}
