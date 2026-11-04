// POST /api/konto/kod  { epost, order?, mal? }
//
// Mejlar en inloggningslänk och en sexsiffrig kod (E1-1, Leonards beslut A2).
// Svaret är detsamma oavsett om e-posten redan har ett konto: den första
// lyckade inloggningen skapar kontot. Begränsat till fem koder i timmen per
// e-post, tjugo per adress och en var trettionde sekund.

import { NextResponse } from "next/server";
import {
  farSkicka,
  ipNyckel,
  normaliseraEpost,
  nyInloggning,
  orderGuid,
  sakertMal,
  strypId,
} from "@/lib/medlem/inloggning";
import { forfragningarSedan, medlemsHemlighet, medlemsLage, senastSkapad, sparaInloggning, taStrypning } from "@/lib/medlem/lager";
import { skickaInloggning } from "@/lib/medlem/mejl";
import { PRIVAT, webbplats } from "@/lib/medlem/inloggad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });

export async function POST(req: Request) {
  const hemlighet = medlemsHemlighet();
  if (!hemlighet || (await medlemsLage()) === "av") return svar({ ok: false, fel: "stangd" }, 503);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return svar({ ok: false, fel: "epost" }, 400);
  }
  const epost = normaliseraEpost(body.epost);
  if (!epost) return svar({ ok: false, fel: "epost" }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "okand";
  const ipHash = ipNyckel(ip, hemlighet);
  const nuMs = Date.now();
  const sedan = new Date(nuMs - 3_600_000).toISOString();
  try {
    const [perEpost, perIp, senaste] = await Promise.all([
      forfragningarSedan("epost", epost, sedan),
      forfragningarSedan("ipHash", ipHash, sedan),
      senastSkapad(epost),
    ]);
    const beslut = farSkicka({ senasteTimmenEpost: perEpost, senasteTimmenIp: perIp, senasteSkapad: senaste }, nuMs);
    if (beslut !== "ok") return svar({ ok: false, fel: beslut }, 429);
    // Räknarna ovan läses före skrivningen; strypningen är det som håller när
    // många anrop kommer samtidigt: ett mejl per adress och halvminut.
    if (!(await taStrypning(strypId(epost, nuMs, hemlighet), new Date(nuMs).toISOString()))) {
      return svar({ ok: false, fel: "for-tatt" }, 429);
    }

    const ny = nyInloggning(epost, nuMs, hemlighet);
    const order = orderGuid(body.order);
    const mal = sakertMal(body.mal);
    await sparaInloggning({
      id: ny.tokenHash,
      epost,
      skapad: ny.skapad,
      giltigTill: ny.giltigTill,
      kodHash: ny.kodHash,
      ipHash,
      ...(order ? { order } : {}),
      ...(mal !== "/konto" ? { mal } : {}),
    });
    const lank = `${webbplats(req)}/api/konto/lank?t=${ny.token}`;
    if (!(await skickaInloggning(epost, lank, ny.kod))) return svar({ ok: false, fel: "mejl" }, 502);
    return svar({ ok: true });
  } catch (e) {
    console.error("[konto/kod] fel:", e instanceof Error ? e.message.slice(0, 160) : e);
    return svar({ ok: false, fel: "tillfalligt" }, 503);
  }
}
