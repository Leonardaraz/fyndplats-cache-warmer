// POST /api/konto/nivamejl  (formulär: pa=1 eller pa=0)
//
// Mejlen om nivån av eller på, från Mina sidor. Kräver inloggning; svaret är
// 303 tillbaka till Mina sidor.

import { NextResponse } from "next/server";
import { inloggad } from "@/lib/medlem/inloggad";
import { loggaTyst, sattNivamejl } from "@/lib/medlem/lager";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await inloggad();
  if (!session) return NextResponse.redirect(new URL("/konto", req.url), 303);
  const kropp = await req.formData().catch(() => null);
  const pa = kropp?.get("pa") === "1";
  try {
    if ((await sattNivamejl(session.sub, pa)) === "klar") {
      await loggaTyst({ omrade: "mejl", typ: pa ? "nivamejl-pa" : "avregistrerad", medlemsId: session.sub, aktor: "kund", orsakKod: "mina-sidor" });
    }
  } catch (e) {
    console.error("[nivamejl] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return NextResponse.redirect(new URL("/konto?fel=tillfalligt#mejl", req.url), 303);
  }
  return NextResponse.redirect(new URL("/konto#mejl", req.url), 303);
}
