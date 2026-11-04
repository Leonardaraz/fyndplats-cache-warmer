// POST /api/konto/foretag  JSON
//
// Företagskontot från Mina sidor (E3):
//   { steg: "ansok", namn, orgnr, gata, postnr, ort, annanLeverans?, lgata?,
//     lpostnr?, lort?, naring: "1", villkor: "<version>" }
//   { steg: "villkor", villkor: "<version>" }   (ny version av villkoren)
//
// Kräver inloggning och att prisväxeln släpper fram kontot (läget `pa`, eller
// `test` för en testare). Ansökan prövas på servern med samma regler som i
// formuläret (lib/medlem/foretag.ts) och sparas med status "granskas". Butiken
// får ett mejl; kön ligger i motorns /admin/medlemmar.
//
// Svaret är JSON: { ok: true } eller { ok: false, fel: { fält: text } } eller
// { ok: false, skal }. ☠️ Numret loggas aldrig: för en enskild firma är det ett
// personnummer.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { godkannForetagsvillkor, hamtaMedlem, prisLage, prisOppet, sparaForetagsansokan } from "@/lib/medlem/lager";
import { VILLKOR_FORETAG_VERSION, provaForetagsansokan } from "@/lib/medlem/foretag";
import { orgnrFeltext, provaOrgnr } from "@/lib/medlem/orgnr";
import { skickaForetagAttGranska } from "@/lib/medlem/mejl";

export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });

export async function POST(req: Request) {
  const session = await inloggad();
  if (!session) return svar({ ok: false, skal: "utloggad" }, 401);

  let kropp: Record<string, unknown>;
  try {
    const v = await req.json();
    if (!v || typeof v !== "object" || Array.isArray(v)) return svar({ ok: false, skal: "fel-form" }, 400);
    kropp = v as Record<string, unknown>;
  } catch {
    return svar({ ok: false, skal: "fel-form" }, 400);
  }

  try {
    const medlem = await hamtaMedlem(session.sub);
    if (!medlem || medlem.status !== "aktiv") return svar({ ok: false, skal: "sparrad" }, 403);
    if (!prisOppet(await prisLage(), medlem)) return svar({ ok: false, skal: "stangt" }, 403);

    if (kropp.steg === "villkor") {
      if (kropp.villkor !== VILLKOR_FORETAG_VERSION) {
        return svar({ ok: false, fel: { villkor: "Godkänn villkoren för företagskonto för att fortsätta." } }, 400);
      }
      return (await godkannForetagsvillkor(medlem.id)) ? svar({ ok: true }) : svar({ ok: false, skal: "inte-godkant" }, 409);
    }

    const prov = provaForetagsansokan(kropp, { prova: provaOrgnr, feltext: orgnrFeltext });
    if (!prov.ok) return svar({ ok: false, fel: prov.fel }, 400);
    if ((await sparaForetagsansokan(medlem.id, prov.ansokan)) === "finns") return svar({ ok: false, skal: "finns" }, 409);
    // Mejlet till butiken är en påminnelse; kön i admin är det som räknas.
    await skickaForetagAttGranska({ namn: prov.ansokan.namn, orgnrVisas: prov.ansokan.orgnrVisas, form: prov.ansokan.form });
    return svar({ ok: true });
  } catch (e) {
    console.error("[konto/foretag] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
