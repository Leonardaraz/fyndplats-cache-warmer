// GET /api/konto/kvitto/<ordernummer> — kvittot som PDF på Mina sidor
// (medlemskapet E3: "underlag"; specen: "fakturaarkiv och köp igen är
// kärnan"). Motorn ritar kvittot med samma mall som mejlen
// (/api/medlem/kvitto i cache-warmer); butiken frågar åt den inloggade
// medlemmen.
//
// ☠️ Bara medlemmens egna ordrar: ordern ska finnas i orderliggaren på
// kontots e-post, och motorn prövar e-posten på ordern en gång till. Svaret är
// privat och cachas aldrig. Utan PDF svarar rutten med en kort sida och en
// länk tillbaka, eftersom kunden kommer hit från en länk, inte från ett skript.

import { NextResponse } from "next/server";
import { PRIVAT, inloggad } from "@/lib/medlem/inloggad";
import { hamtaMedlem, liggarraderForEpost } from "@/lib/medlem/lager";
import { kvittoFelText } from "@/lib/medlem/visning";

export const dynamic = "force-dynamic";

const KVITTO_API = process.env.CACHE_WARMER_KVITTO_URL ?? "https://fyndplats-cache-warmer.vercel.app/api/medlem/kvitto";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function sida(text: string, status: number) {
  const html = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Kvitto – Fyndplats</title></head><body style="margin:0;padding:48px 16px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#faf8f6;color:#1a1a1a"><main style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e7e2da;border-radius:16px;padding:24px"><h1 style="margin:0 0 10px;font-size:20px">Kvittot</h1><p style="margin:0 0 18px;line-height:1.55">${escape(text)}</p><a href="/konto" style="color:#1a1a1a;font-weight:700">Tillbaka till Mina sidor</a></main></body></html>`;
  return new NextResponse(html, { status, headers: { ...PRIVAT, "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ ordernummer: string }> }) {
  const ordernummer = (await params).ordernummer;
  if (!/^\d{1,12}$/.test(ordernummer)) return sida(kvittoFelText("saknas"), 404);

  const session = await inloggad();
  if (!session) return sida(kvittoFelText("utloggad"), 401);
  const hemlighet = process.env.REVIEW_INGEST_SECRET;
  if (!hemlighet) return sida(kvittoFelText(undefined), 503);

  try {
    const medlem = await hamtaMedlem(session.sub);
    if (!medlem || medlem.status !== "aktiv") return sida(kvittoFelText("utloggad"), 401);
    const egen = (await liggarraderForEpost(medlem.epost)).some((r) => r.ordernummer === ordernummer);
    if (!egen) return sida(kvittoFelText("saknas"), 404);

    const r = await fetch(KVITTO_API, {
      method: "POST",
      headers: { authorization: `Bearer ${hemlighet}`, "content-type": "application/json" },
      body: JSON.stringify({ ordernummer, epost: medlem.epost }),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    if (r.ok && (r.headers.get("content-type") ?? "").includes("application/pdf")) {
      return new NextResponse(r.body, {
        status: 200,
        headers: {
          ...PRIVAT,
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Kvitto-${ordernummer}.pdf"`,
          "X-Robots-Tag": "noindex",
        },
      });
    }
    const skal = ((await r.json().catch(() => null)) as { skal?: string } | null)?.skal;
    return sida(kvittoFelText(skal), r.status === 409 || r.status === 404 ? 404 : 503);
  } catch (e) {
    console.error("[konto/kvitto] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return sida(kvittoFelText(undefined), 503);
  }
}
