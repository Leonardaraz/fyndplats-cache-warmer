// POST /api/konto/avregistrera?m=<medlemmens id>&t=<token>
//
// Avregistrering från mejlen om nivån. Två vägar in:
// - mejlklientens "Avsluta prenumeration" (RFC 8058): kroppen är
//   List-Unsubscribe=One-Click, och svaret är 200 utan omdirigering;
// - knappen på /konto/avregistrera: ett vanligt formulär, och svaret är 303
//   till sidan med resultatet.
// Ett GET gör ingenting: mejlfilter som öppnar länkar ska inte kunna
// avregistrera någon (samma skäl som inloggningslänken, /api/konto/lank).
//
// Token beror på medlemmens id och hemligheten (lib/medlem/inloggning.ts).
// Svaret och loggen bär aldrig adressen.

import { NextResponse } from "next/server";
import { arGiltigAvregistrering } from "@/lib/medlem/inloggning";
import { loggaTyst, medlemsHemlighet, sattNivamejl } from "@/lib/medlem/lager";

export const dynamic = "force-dynamic";

type Utfall = "klar" | "fel" | "tillfalligt";

export async function POST(req: Request) {
  const u = new URL(req.url);
  const m = u.searchParams.get("m");
  const t = u.searchParams.get("t");
  const kropp = await req.formData().catch(() => null);
  const ettKlick = kropp?.get("List-Unsubscribe") === "One-Click";

  const svara = (utfall: Utfall) => {
    if (ettKlick) {
      const status = utfall === "klar" ? 200 : utfall === "fel" ? 400 : 503;
      return NextResponse.json({ ok: utfall === "klar" }, { status, headers: { "Cache-Control": "no-store" } });
    }
    const mal = new URL(`/konto/avregistrera?${utfall === "klar" ? "klar=1" : `fel=${utfall}`}`, req.url);
    return NextResponse.redirect(mal, 303);
  };

  const hemlighet = medlemsHemlighet();
  if (!hemlighet) return svara("tillfalligt");
  if (!arGiltigAvregistrering(m, t, hemlighet) || !m) return svara("fel");
  try {
    if ((await sattNivamejl(m, false)) === "klar") {
      await loggaTyst({ omrade: "mejl", typ: "avregistrerad", medlemsId: m, aktor: "kund", orsakKod: ettKlick ? "ett-klick" : "sidan" });
    }
  } catch (e) {
    console.error("[avregistrera] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svara("tillfalligt");
  }
  return svara("klar");
}
