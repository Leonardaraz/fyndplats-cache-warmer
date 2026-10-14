// GET /api/admin/bilder-bort — ta bort bilder ur en publicerad sida, också bilder
// som ett färgval pekar på (2026-10-14). Logiken och skälen: lib/aosom/bilder-bort.ts.
//
//   ?lage=plan                        (default) räkna fram planen, skriv ingenting
//   &sida=<wix-id>                    sidan
//   &bilder=<fil-id>,<fil-id>         Wix fil-id på bilderna som ska bort (högst 10)
//   ?lage=skriv&bekrafta=<sha>        skriv — sha är planens, med samma parametrar
//
// ☠️ TORRT SOM DEFAULT. `skriv` kräver `bekrafta` = planens sha256. Planen räknas
// om ur en färsk läsning i samma anrop, och skiljer sig sha:n har något ändrats
// sedan en människa läste planen — då skrivs ingenting.
//
// ☠️ VERKTYGET VÄLJER ALDRIG BILDER. Fil-id kommer från anroparen. Huvudbilden
// kan inte tas bort, och sidan får inte hamna under fyra bilder eller ha ett
// val utan bild.
//
// ☠️ SVARET BÄR BARA WIX-ID, PLATSER, ANTAL OCH HINDER. Loggen är publik; namn,
// sluggar och alt-texter läser verktyget aldrig ut.
//
// Auth: CRON_SECRET eller EXTENSION_API_TOKEN, som husets andra admin-rutter.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { MAX_BORT, bortRaknare, bortSha, planeraBort, skrivBort } from "@/lib/aosom/bilder-bort";
import { lasProdukt } from "@/lib/aosom/fargbilder-kor";
import { MEDIA_ID, UUID } from "@/lib/polish/skrivplan";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

const fel = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) return fel(401, "Otillåten");

  const sp = req.nextUrl.searchParams;
  const lage = sp.get("lage") ?? "plan";
  if (lage !== "plan" && lage !== "skriv") return fel(400, "lage ska vara plan eller skriv");
  const sida = (sp.get("sida") ?? "").trim().toLowerCase();
  if (!UUID.test(sida)) return fel(400, "sida ska vara ett wix-id (uuid)");
  const bilder = [...new Set((sp.get("bilder") ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
  if (bilder.length === 0 || bilder.length > MAX_BORT) return fel(400, `bilder ska vara 1–${MAX_BORT} fil-id, kommaseparerade`);
  if (bilder.some((b) => !MEDIA_ID.test(b))) return fel(400, "bilder ska vara Wix fil-id (…~mv2.jpg), kommaseparerade");
  const bekrafta = (sp.get("bekrafta") ?? "").trim().toLowerCase();
  if (lage === "skriv" && !/^[0-9a-f]{64}$/.test(bekrafta)) {
    return fel(400, "skriv kräver bekrafta = planens sha (64 hextecken)");
  }

  const wix = skapaWixAnrop();
  let produkt;
  try {
    produkt = await lasProdukt(wix, sida);
  } catch (e) {
    console.error(`[bilder-bort] läsningen: ${e instanceof Error ? e.message : String(e)}`);
    return fel(500, "sidan gick inte att läsa");
  }
  if (!produkt) return fel(404, "sidan finns inte");

  const plan = planeraBort(produkt, bilder);
  const sha = bortSha(plan);
  const bas = { ok: true, lage, sha, ...bortRaknare(plan) };
  console.log(
    `[bilder-bort] ${lage.toUpperCase()} ${sida}: ${plan.bort.length} bilder, galleri ${plan.galleriFore.length} → ${plan.galleriEfter.length}, hinder ${plan.hinder.length}`,
  );
  if (lage === "plan") return NextResponse.json(bas);

  if (bekrafta !== sha) {
    return fel(409, "planen skiljer sig från den som godkändes — sidan har ändrats, läs planen igen", { sha });
  }
  if (plan.hinder.length > 0) return fel(409, "planen har hinder", bortRaknare(plan));

  const u = await skrivBort(plan, { wix });
  await audit(
    "bilder-bort",
    u.ok ? "skriv" : "fel",
    `${sida}: ${plan.bort.length} bilder, ${u.ok ? "klart" : u.fel ?? "okänt fel"}`,
  );
  return NextResponse.json({ ...bas, ok: u.ok, steg: u.steg, fel: u.fel }, { status: u.ok ? 200 : 500 });
}
