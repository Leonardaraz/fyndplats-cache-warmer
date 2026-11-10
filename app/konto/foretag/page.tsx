// /konto/foretag — skapa ett företagskonto direkt (Leonard 2026-11-10).
//
// Förut fanns företagskontot bara som en ruta på Mina sidor: kunden fick bli
// medlem först och sedan hitta "Lägg till ett företag". Här är vägen dit en
// egen sida med tre steg (app/konto/foretag-start.tsx). Kontot är samma
// medlemskonto med en företagsprofil; inget i datamodellen är nytt.
//
// Alltid dynamisk och privat, som /konto: sidan läser sessionen och får aldrig
// hamna i ISR-cachen. Vem som ser vad avgörs av foretagsvag() i
// lib/medlem/foretagsstart.ts; den som inte hör hemma här skickas till /konto.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { inloggad } from "@/lib/medlem/inloggad";
import { hamtaForetagsprofil, hamtaMedlem, medlemsHemlighet, medlemsLage, prisLage, prisOppet } from "@/lib/medlem/lager";
import { FORETAGSVAG, foretagsvag, utvag, type Vaglage } from "@/lib/medlem/foretagsstart";
import { Foretagssida } from "../foretagssida";
import { FornyaSession } from "../fornya";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skapa företagskonto",
  description:
    "Skapa ett företagskonto hos Fyndplats: priser exklusive moms, rabatt som växer med ordern och offert på större köp. Aktiva bolag godkänns direkt.",
  robots: { index: false, follow: false },
  alternates: { canonical: `https://www.fyndplats.se${FORETAGSVAG}` },
};

type Sok = Record<string, string | string[] | undefined>;
const ett = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Läget för besökaren. Går något inte att läsa gäller det försiktiga: vägen är stängd. */
async function vaglage(): Promise<Vaglage> {
  const stangt: Vaglage = { oppen: false, prisPa: false, inloggad: false };
  try {
    if (!medlemsHemlighet() || (await medlemsLage()) === "av") return stangt;
    const [session, lage] = await Promise.all([inloggad(), prisLage()]);
    if (!session) return { oppen: true, prisPa: lage === "pa", inloggad: false };
    const [medlem, profil] = await Promise.all([hamtaMedlem(session.sub), hamtaForetagsprofil(session.sub)]);
    // En spärrad eller borttagen medlem: /konto säger vad som gäller.
    if (!medlem || medlem.status !== "aktiv") return stangt;
    return { oppen: true, prisPa: lage === "pa", inloggad: true, oppetForMedlem: prisOppet(lage, medlem), foretag: profil?.status ?? null };
  } catch (e) {
    console.error("[konto/foretag] läget gick inte att läsa:", e instanceof Error ? e.message.slice(0, 120) : e);
    return stangt;
  }
}

export default async function SkapaForetagskonto({ searchParams }: { searchParams: Promise<Sok> }) {
  const sp = await searchParams;
  const vag = foretagsvag(await vaglage());
  if (vag === "privat" || vag === "mina-sidor") redirect(utvag(vag));

  const inne = vag === "uppgifter";
  return (
    <>
      <Foretagssida inne={inne} fel={ett(sp.fel) ?? null} />
      {inne ? <FornyaSession /> : null}
    </>
  );
}
