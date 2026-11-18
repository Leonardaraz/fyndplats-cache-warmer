// POST /api/kassa/epost-kontroll  { epost }  →  { svar: "ja" | "nej" | "okant", skal? }
//
// Kassan frågar hit när kunden lämnat e-postfältet: kan domänen ta emot
// e-post? (lib/kassa/epost-dns.ts). "nej" visas som ett fel under fältet och
// kunden får rätta adressen innan köpet går vidare. Order 10233 lades med en
// adress som inte fanns (Leonard 2026-11-18).
//
// ☠️ Öppet vid osäkerhet: allt som inte är ett säkert nej släpper igenom
// kunden. Rutten nekar aldrig ett köp själv; formen och toppdomänen prövas
// dessutom på servern när köpet läggs (provaKassa).
// ☠️ Ingen e-postadress i loggen, bara att uppslaget felade.

import { NextResponse } from "next/server";
import { promises as dns } from "node:dns";
import { domainToASCII } from "node:url";
import { epostDoman, epostFel } from "@/lib/kassa/formular";
import { KANDA_DOMANER } from "@/lib/kassa/epost-forslag";
import { domanTarEmotEpost, type DnsSvar } from "@/lib/kassa/epost-dns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });

/** Svaren minns i tio minuter i den här instansen, högst 300 domäner. */
const MINNE = new Map<string, { svar: DnsSvar; tid: number }>();
const MINNS_MS = 10 * 60 * 1000;
const MAX_MINNE = 300;

const UPPSLAG = {
  mx: (d: string) => dns.resolveMx(d),
  adress: async (d: string) => {
    try {
      return await dns.resolve4(d);
    } catch (e) {
      const kod = (e as { code?: unknown } | null)?.code;
      if (kod !== "ENODATA") throw e;
      return dns.resolve6(d);
    }
  },
};

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return svar({ svar: "okant" }, 400);
  }
  const epost = typeof (body as { epost?: unknown } | null)?.epost === "string" ? ((body as { epost: string }).epost).trim() : "";
  if (!epost || epost.length > 254) return svar({ svar: "okant" }, 400);
  const fel = epostFel(epost);
  if (fel) return svar({ svar: "nej", skal: fel });
  const doman = epostDoman(epost);
  if (!doman) return svar({ svar: "okant" });
  if (KANDA_DOMANER.includes(doman)) return svar({ svar: "ja" });
  const ascii = domainToASCII(doman);
  if (!ascii) return svar({ svar: "okant" });

  const nu = Date.now();
  const mints = MINNE.get(ascii);
  if (mints && nu - mints.tid < MINNS_MS) return svar({ svar: mints.svar, ...(mints.svar === "nej" ? { skal: "doman" } : {}) });
  let utfall: DnsSvar = "okant";
  try {
    utfall = await domanTarEmotEpost(ascii, UPPSLAG);
  } catch {
    console.error("[kassa] e-postkontrollens uppslag föll");
  }
  if (utfall !== "okant") {
    if (MINNE.size >= MAX_MINNE) MINNE.delete(MINNE.keys().next().value as string);
    MINNE.set(ascii, { svar: utfall, tid: nu });
  }
  return svar({ svar: utfall, ...(utfall === "nej" ? { skal: "doman" } : {}) });
}
