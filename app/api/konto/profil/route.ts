// POST /api/konto/profil  JSON { profil: "privat" | "foretag" }
//
// Byter profil för inloggningen (E3-11): "Du handlar som" privat eller som
// företaget. Valet bärs i sessionen och i tecknet `fp_medlem_inne` ("f" för
// företag), så att sidans skript visar exkl. moms medan priset hämtas. En
// varukorg prissätts alltid av exakt en profil: förhandsvisningen och kassan
// läser profilen på nytt vid varje anrop, och ett byte räknar om korgen.
//
// Företaget kräver en godkänd profil med gällande villkor (E3-12). Valet ger
// ingen rätt i sig: prissättningen prövar företagsprofilen igen varje gång.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { hamtaForetagsprofil, hamtaMedlem, medlemsHemlighet, prisLage, prisOppet } from "@/lib/medlem/lager";
import { kanHandlaSomForetag } from "@/lib/medlem/foretag";
import { SESSION_KAKA, TECKEN_KAKA, kakaAttribut, nySession, teckenAttribut, teckenVarde, type Profilval } from "@/lib/medlem/session";

export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });

export async function POST(req: Request) {
  const session = await inloggad();
  const hemlighet = medlemsHemlighet();
  if (!session || !hemlighet) return svar({ ok: false, skal: "utloggad" }, 401);

  let till: Profilval = "privat";
  try {
    const v = (await req.json()) as { profil?: unknown } | null;
    if (v?.profil === "foretag") till = "foretag";
    else if (v?.profil !== "privat") return svar({ ok: false, skal: "fel-form" }, 400);
  } catch {
    return svar({ ok: false, skal: "fel-form" }, 400);
  }

  if (till === "foretag") {
    try {
      const [medlem, profil] = await Promise.all([hamtaMedlem(session.sub), hamtaForetagsprofil(session.sub)]);
      if (!medlem || medlem.status !== "aktiv") return svar({ ok: false, skal: "sparrad" }, 403);
      if (!prisOppet(await prisLage(), medlem)) return svar({ ok: false, skal: "stangt" }, 403);
      if (!kanHandlaSomForetag(profil)) return svar({ ok: false, skal: "inte-godkant" }, 409);
    } catch (e) {
      console.error("[konto/profil] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
      return svar({ ok: false, skal: "tillfalligt" }, 503);
    }
  }

  const https = new URL(req.url).protocol === "https:";
  const ny = nySession(session.sub, session.email, Date.now(), hemlighet, till);
  const res = svar({ ok: true, profil: till });
  res.cookies.set(SESSION_KAKA, ny.token, kakaAttribut(ny.maxAgeS, https));
  res.cookies.set(TECKEN_KAKA, teckenVarde(till), teckenAttribut(ny.maxAgeS, https));
  return res;
}
