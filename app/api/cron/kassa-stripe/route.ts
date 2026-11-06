// GET /api/cron/kassa-stripe (Vercel cron, var 15:e minut)
//
// Nätet under Stripe-kassan (lib/kassa/flode.ts), som /api/cron/order-backfill
// är det under Wix-ordrarna. Tre delar, var för sig (ett fel i en stoppar inte
// de andra):
//
// 1. Betalningar. Kundens sida och webhooken gör ordern på sekunder; det här
//    tar betalningarna som ändå blev liggande: kunden stängde fliken under
//    Klarna, webhooken saknas eller felade, Wix tog inte emot betalningen på
//    ordern (låset står på "registrera"), eller en reservation utan order gick
//    inte att släppa. Kassans betalningar från de tre senaste dygnen i Stripe,
//    godkända eller dragna men utan order och äldre än fem minuter, äldst
//    först, med samma steg som klar och webhooken (låset gör att bara en kör åt
//    gången). Är en sådan betalning inte klar (arKlart) efter 30 minuter mejlas
//    OPS_ALERT_EMAIL, en gång per betalning.
// 2. Återbetalningar (speglaAterbetalningar). Wix-ordrar med en återbetalning
//    ändrad de senaste två dygnen, och ordrarna bakom Stripes återbetalningar
//    de senaste tre dygnen (det som gjorts i Stripes panel). Det som Wix-
//    webhooken inte hann göra görs här; det som inte stämmer mejlas, en gång
//    per läge (larmnyckel), och Stripe före Wix först efter 30 minuter.
// 3. Tvister. En kund som bestridit en betalning hos banken eller Klarna:
//    mejl en gång per tvist, med sista svarsdag.
//
// Tyst när inget finns att göra.

import { NextResponse } from "next/server";
import {
  arKlart,
  attSlutfora,
  larmNu,
  larmnyckel,
  ordrarMedStripeAterbetalning,
  slutforStripe,
  speglaAterbetalningar,
  type Speglingslarm,
} from "@/lib/kassa/flode";
import { aterbetalningKassa, stripeKassa } from "@/lib/kassa/stripe-kassa";
import { harStripe, listaAterbetalningar, listaAvsikter, listaTvister } from "@/lib/kassa/stripe";
import { aterbetaldaOrdrar } from "@/lib/kassa/wix-kassa";
import { larmaEnGang, skickaOpsMejl } from "@/lib/kassa/ops-larm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Varje slutförande tar några sekunder; resten tas nästa kvart. */
const MAX_PER_KORNING = 8;
/** Återbetalda ordrar per körning (två dygns ändringar ryms med god marginal). */
const MAX_ATER = 25;
/** Inget nytt slutförande eller ny spegling börjar efter så här lång tid (funktionen har 60 s). */
const TIDSGRANS_MS = 35_000;
const DYGN = 24 * 60 * 60;

function behorig(req: Request): boolean {
  const vantad = process.env.CRON_SECRET;
  if (!vantad) return process.env.VERCEL_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${vantad}`;
}

const kronor = (ore: number) => `${(ore / 100).toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`;

async function natetBetalningar(start: number, nuSek: number) {
  const { ids, larm } = attSlutfora(await listaAvsikter(nuSek - 3 * DYGN), nuSek);
  const klarIds = new Set<string>();
  let klara = 0;
  let utanOrder = 0;
  let kvarstar = 0;
  let fel = 0;
  for (const id of ids.slice(0, MAX_PER_KORNING)) {
    if (Date.now() - start > TIDSGRANS_MS) break;
    try {
      const u = await slutforStripe(stripeKassa, id, new Date());
      if (!arKlart(u)) kvarstar++;
      else {
        klarIds.add(id);
        if (u.ok) klara++;
        else utanOrder++;
      }
    } catch (e) {
      fel++;
      console.error("[kassa-stripe] slutförandet föll:", e instanceof Error ? e.message.slice(0, 200) : e);
    }
  }
  // Larm bara för det som fortfarande inte är klart efter försöket (också de
  // som inte hanns med i den här körningen).
  const kvar = larm.filter((id) => !klarIds.has(id));
  if (kvar.length) {
    const en = kvar.length === 1;
    await skickaOpsMejl(
      `☠️ Kassan: ${kvar.length} betalning${en ? "" : "ar"} inte klar${en ? "" : "a"}`,
      [
        `${kvar.length} betalning${en ? "" : "ar"} i Stripe-kassan har varit godkänd${en ? "" : "a"} i över 30 minuter utan att bli klar${en ? "" : "a"}: ingen order med betalningen på, eller en reservation som inte gick att släppa.`,
        "",
        kvar.map((id) => `• ${id}`).join("\n"),
        "",
        "Nätet försöker igen var 15:e minut. Sök på id:t i Stripe (Betalningar) och kontrollera i Wix att ordern finns och är betald.",
        "Står ordern som obetald fast pengarna är dragna: registrera betalningen på ordern i Wix. Finns ingen order: släpp reservationen eller betala tillbaka i Stripe.",
      ].join("\n"),
    );
  }
  // Bara antal, aldrig kund eller belopp.
  if (ids.length) console.info(`[kassa-stripe] ${ids.length} att slutföra: klara ${klara}, utan order ${utanOrder}, kvarstår ${kvarstar}, fel ${fel}, larm ${kvar.length}`);
  return { attSlutfora: ids.length, klara, utanOrder, kvarstar, fel, larm: kvar.length };
}

const ATER_TEXT: Record<Speglingslarm["skal"], string> = {
  stripe_fore_wix: "Mer återbetalt i Stripe än i Wix. Bokför återbetalningen i Wix (ordern → Återbetala, markera som återbetald). Gör aldrig återbetalningar i Stripe: butiken gör dem när de bokförs i Wix.",
  fel: "Stripe nekade återbetalningen. Nätet försöker igen var 15:e minut; står det kvar, gör den i Stripe och kontrollera att Wix och Stripe visar samma belopp.",
  tvist: "Kunden har bestridit betalningen, så Stripe tar ingen återbetalning. Svara på tvisten i Stripe (Betalningar → Tvister).",
  over_beloppet: "Wix har återbetalt mer än betalningen. Ingen återbetalning gjordes i Stripe; kontrollera ordern i Wix.",
  olika_belopp: "Betalningen i Wix och i Stripe har olika belopp. Ingen återbetalning gjordes; kontrollera båda.",
  okant_belopp: "Wix visar ett belopp som inte går att läsa. Ingen återbetalning gjordes; kontrollera ordern i Wix.",
  annan_order: "Stripe-betalningen hör till en annan order. Ingen återbetalning gjordes; kontrollera båda ordrarna i Wix.",
  inte_kassans: "Stripe-betalningen kommer inte från kassan. Ingen återbetalning gjordes; gör den för hand om den ska göras.",
};

async function natetAterbetalningar(start: number, nuSek: number) {
  const [wix, stripe] = await Promise.all([
    aterbetaldaOrdrar(new Date((nuSek - 2 * DYGN) * 1000).toISOString(), MAX_ATER),
    listaAterbetalningar(nuSek - 3 * DYGN),
  ]);
  if (wix.fler) console.warn(`[kassa-ater] fler än ${MAX_ATER} återbetalda ordrar på två dygn: de senast ändrade tas först`);
  const ordrar = [...new Set([...wix.ids, ...ordrarMedStripeAterbetalning(stripe)])];
  const larm: { orderId: string; l: Speglingslarm }[] = [];
  let aterbetalda = 0;
  let fel = 0;
  for (const orderId of ordrar) {
    if (Date.now() - start > TIDSGRANS_MS) break;
    try {
      const u = await speglaAterbetalningar(aterbetalningKassa, orderId);
      aterbetalda += u.aterbetalda;
      for (const l of u.larm) if (larmNu(l, nuSek)) larm.push({ orderId, l });
    } catch (e) {
      fel++;
      console.error("[kassa-ater] speglingen föll:", e instanceof Error ? e.message.slice(0, 200) : e);
    }
  }
  const mejlade = await larmaEnGang(
    larm.map(({ orderId, l }) => ({
      nyckel: larmnyckel(orderId, l),
      text: `Order ${orderId}, Stripe ${l.laddning}: återbetalt i Wix ${kronor(l.wixOre)}, i Stripe ${kronor(l.stripeOre)}${l.kod ? ` (${l.kod})` : ""}. ${ATER_TEXT[l.skal]}`,
    })),
    (nya) => ({
      amne: `☠️ Kassan: ${nya.length} återbetalning${nya.length === 1 ? "" : "ar"} att se över`,
      text: ["Återbetalningar i Stripe-kassan som butiken inte kunde göra själv:", "", ...nya.map((r) => `• ${r.text}`), "", "Sök på order-id:t i Wix (Ordrar) och på Stripe-id:t i Stripe."].join("\n"),
    }),
  );
  if (aterbetalda || larm.length || fel) console.info(`[kassa-ater] ${ordrar.length} ordrar: ${aterbetalda} återbetalda i Stripe, larm ${larm.length} (${mejlade} nya mejlade), fel ${fel}`);
  return { ordrar: ordrar.length, aterbetalda, larm: larm.length, fel };
}

/** Tvisterna som väntar på svar från oss. */
const TVIST_SVARA = new Set(["needs_response", "warning_needs_response"]);

async function natetTvister(nuSek: number) {
  const tvister = (await listaTvister(nuSek - 3 * DYGN)).filter((t) => TVIST_SVARA.has(t.status));
  const datum = (sek: number | null) => (sek ? new Date(sek * 1000).toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" }) : "okänt datum");
  const mejlade = await larmaEnGang(
    tvister.map((t) => ({ nyckel: `kassa-tvist:${t.id}`, text: `${t.id}: ${kronor(t.amount)} (${t.currency.toUpperCase()}), skäl ${t.reason}, svara senast ${datum(t.svaraSenastSek)}.` })),
    (nya) => ({
      amne: `☠️ Kassan: ${nya.length} bestridd${nya.length === 1 ? "" : "a"} betalning${nya.length === 1 ? "" : "ar"}`,
      text: [
        "En kund har bestridit en betalning hos sin bank eller hos Klarna. Pengarna är tillfälligt dragna från Stripe-kontot.",
        "",
        ...nya.map((r) => `• ${r.text}`),
        "",
        "Svara i Stripe (Betalningar → Tvister) före sista dagen, med ordern, spårningen och kundens kontakt. Utan svar förloras tvisten.",
      ].join("\n"),
    }),
  );
  if (tvister.length) console.info(`[kassa-tvist] ${tvister.length} väntar på svar (${mejlade} nya mejlade)`);
  return { tvister: tvister.length };
}

export async function GET(req: Request) {
  if (!behorig(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  if (!harStripe()) return NextResponse.json({ ok: true, hoppad: "stripe saknas" });
  const start = Date.now();
  const nuSek = Math.floor(start / 1000);
  // En del som faller blir null (och 500, så att Vercel visar körningen som
  // fel); en del som inte hinns börja tas nästa kvart (saknas i svaret).
  let fallna = 0;
  const del = async <T,>(namn: string, f: () => Promise<T>): Promise<T | null | undefined> => {
    if (Date.now() - start > TIDSGRANS_MS) return undefined;
    try {
      return await f();
    } catch (e) {
      fallna++;
      console.error(`[kassa-stripe] ${namn} föll:`, e instanceof Error ? e.message.slice(0, 300) : String(e));
      return null;
    }
  };
  const betalningar = await del("betalningarna", () => natetBetalningar(start, nuSek));
  const aterbetalningar = await del("återbetalningarna", () => natetAterbetalningar(start, nuSek));
  const tvister = await del("tvisterna", () => natetTvister(nuSek));
  const ok = fallna === 0 && betalningar?.kvarstar === 0 && betalningar.fel === 0 && (aterbetalningar === undefined || aterbetalningar?.fel === 0);
  return NextResponse.json({ ok, betalningar, aterbetalningar, tvister }, { status: fallna ? 500 : 200 });
}
