// POST /api/konto/foretag  JSON
//
// Företagskontot från Mina sidor (E3):
//   { steg: "ansok", namn, orgnr, gata, postnr, ort, annanLeverans?, lgata?,
//     lpostnr?, lort?, naring: "1", villkor: "<version>" }
//   { steg: "villkor", villkor: "<version>" }   (ny version av villkoren)
//   { steg: "sla-upp", orgnr }                  (namnet medan kunden skriver)
//   { steg: "lage" }                            (har kontot ett företag, och är vägen öppen?)
//
// "lage" är frågan den direkta vägen (/konto/foretag) ställer direkt efter
// inloggningen i steg 1: svaret { ok, oppet, foretag } avgör om steg 2 visas
// på samma sida eller om kunden hör hemma på Mina sidor. Det besvaras före
// prisväxelns spärr, så att ett stängt konto får ett besked och inte ett fel.
//
// Allt annat kräver inloggning och att prisväxeln släpper fram kontot (läget
// `pa`, eller `test` för en testare). Ansökan prövas på servern med samma regler som i
// formuläret (lib/medlem/foretag.ts) och slås sedan upp hos Bolagsverket
// (lib/medlem/bolagsverket.ts). Ett aktivt företag godkänns direkt med det
// registrerade namnet (Leonard 2026-11-06); allt annat får status "granskas"
// och väntar i motorns /admin/medlemmar med Bolagsverkets orsak. Butiken får
// ett mejl i båda fallen.
//
// "sla-upp" svarar bara för en juridisk person: en enskild firmas nummer är ett
// personnummer, och det slås upp först när ansökan skickas.
//
// Svaret är JSON: { ok: true, status } eller { ok: false, fel: { fält: text } }
// eller { ok: false, skal }. ☠️ Numret loggas aldrig: för en enskild firma är
// det ett personnummer.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { godkannForetagsvillkor, hamtaForetagsprofil, hamtaMedlem, prisLage, prisOppet, sparaForetagsansokan } from "@/lib/medlem/lager";
import { VILLKOR_FORETAG_VERSION, provaForetagsansokan } from "@/lib/medlem/foretag";
import { orgnrFeltext, provaOrgnr } from "@/lib/medlem/orgnr";
import { beslutForAnsokan, slaUppForetag } from "@/lib/medlem/bolagsverket";
import { skickaForetagAttGranska, skickaForetagGodkantDirekt } from "@/lib/medlem/mejl";

export const dynamic = "force-dynamic";

const svar = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: PRIVAT });

/** Uppslag medan kunden skriver: högst så många per konto och tio minuter (per instans). */
const UPPSLAG_PER_FONSTER = 15;
const FONSTER_MS = 10 * 60_000;
const uppslagen = new Map<string, number[]>();

function uppslagTillatet(medlemsId: string, nuMs = Date.now()): boolean {
  const tider = (uppslagen.get(medlemsId) ?? []).filter((t) => nuMs - t < FONSTER_MS);
  if (tider.length >= UPPSLAG_PER_FONSTER) {
    uppslagen.set(medlemsId, tider);
    return false;
  }
  tider.push(nuMs);
  uppslagen.set(medlemsId, tider);
  if (uppslagen.size > 5_000) uppslagen.clear();
  return true;
}

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

    if (kropp.steg === "lage") {
      const [lage, profil] = await Promise.all([prisLage(), hamtaForetagsprofil(medlem.id)]);
      // Bara läget lämnar servern: aldrig namn, nummer eller adress.
      return svar({ ok: true, oppet: prisOppet(lage, medlem), foretag: profil?.status ?? null });
    }

    if (!prisOppet(await prisLage(), medlem)) return svar({ ok: false, skal: "stangt" }, 403);

    if (kropp.steg === "villkor") {
      if (kropp.villkor !== VILLKOR_FORETAG_VERSION) {
        return svar({ ok: false, fel: { villkor: "Godkänn villkoren för företagskonto för att fortsätta." } }, 400);
      }
      return (await godkannForetagsvillkor(medlem.id)) ? svar({ ok: true }) : svar({ ok: false, skal: "inte-godkant" }, 409);
    }

    if (kropp.steg === "sla-upp") {
      const p = provaOrgnr(String(kropp.orgnr ?? ""));
      if (!p.ok || p.form !== "juridisk") return svar({ ok: false, skal: "fel-form" }, 400);
      if (!uppslagTillatet(medlem.id)) return svar({ ok: false, skal: "for-manga" }, 429);
      const u = await slaUppForetag(p.nummer, p.form);
      if (u.utfall === "hittad") return svar({ ok: true, utfall: "hittad", namn: u.namn, aktiv: u.aktiv });
      return svar({ ok: true, utfall: u.utfall });
    }

    const prov = provaForetagsansokan(kropp, { prova: provaOrgnr, feltext: orgnrFeltext });
    if (!prov.ok) return svar({ ok: false, fel: prov.fel }, 400);

    const uppslag = await slaUppForetag(prov.ansokan.orgnr, prov.ansokan.form, { namnHint: prov.ansokan.namn });
    const beslut = beslutForAnsokan(uppslag);
    const registrerat = beslut.status === "aktiv" ? beslut.kontroll.namn : undefined;
    const ansokan = registrerat ? { ...prov.ansokan, namn: registrerat } : prov.ansokan;
    const sparad = await sparaForetagsansokan(medlem.id, ansokan, {
      status: beslut.status,
      bolagsverket: beslut.kontroll,
      namnAngivet: prov.ansokan.namn,
    });
    if (sparad === "finns") return svar({ ok: false, skal: "finns" }, 409);
    // Utfallet, aldrig numret.
    console.info(`[konto/foretag] ansökan ${beslut.status} (bolagsverket: ${uppslag.utfall}${uppslag.utfall === "fel" ? `/${uppslag.orsak}` : ""})`);

    // Mejlet till butiken är en påminnelse; kön i admin och profilen är det som räknas.
    const tillButiken = { namn: ansokan.namn, orgnrVisas: ansokan.orgnrVisas, form: ansokan.form };
    if (beslut.status === "aktiv") await skickaForetagGodkantDirekt(tillButiken);
    else await skickaForetagAttGranska({ ...tillButiken, orsaker: beslut.kontroll.orsaker });
    return svar({ ok: true, status: beslut.status, namn: ansokan.namn });
  } catch (e) {
    console.error("[konto/foretag] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return svar({ ok: false, skal: "tillfalligt" }, 503);
  }
}
