// GET/POST /api/admin/redirects
//
// Lägger in 301-redirects för borttagna produkter i FyndplatsRedirects, som
// storefronten läser på 404-vägen. Finns för att motorn har Wix-admin-nyckeln
// (skrivningar fungerar) medan manuella verktyg kan sakna skrivrätt.
//
//   GET                      → listar befintliga redirects (verifiering)
//   POST {redirects:[...]}   → skriver/uppdaterar rader (idempotent på fromSlug)
//
// Varje rad valideras (lib/wix/redirects.ts): endast interna sökvägar, ingen
// self-redirect, inga radbrytningar. Triggas normalt via GitHub-workflown
// redirect-add.yml så inga hemligheter behöver lämna Vercel.
//
// Auth: CRON_SECRET (Bearer) eller x-fyndplats-token — samma som övriga admin-/
// cron-rutter.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import {
  findRedirectConflicts,
  listRedirects,
  upsertRedirect,
  validateRedirect,
  type RedirectRow,
} from "@/lib/wix/redirects";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  try {
    const rows = await listRedirects();
    return NextResponse.json({ ok: true, count: rows.length, redirects: rows });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message.slice(0, 300) : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let payload: { redirects?: RedirectRow[] };
  try {
    payload = (await req.json()) as { redirects?: RedirectRow[] };
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON i bodyn." }, { status: 400 });
  }

  const rows = Array.isArray(payload.redirects) ? payload.redirects : [];
  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Skicka {"redirects":[{"fromSlug":"…","toPath":"/…"}]}' },
      { status: 400 },
    );
  }

  // Validera ALLA rader först — hellre avvisa hela anropet än skriva halva.
  const invalid = rows
    .map((r) => ({ row: r, problem: validateRedirect(r) }))
    .filter((x) => x.problem);
  if (invalid.length) {
    return NextResponse.json(
      { ok: false, error: "Ogiltiga rader", details: invalid.map((x) => `${x.row?.fromSlug}: ${x.problem}`) },
      { status: 400 },
    );
  }

  // Katalogkontroll INNAN något skrivs: en 301 bort från en levande produkt är
  // permanent och kostar en säljande sida i Google. Samma allt-eller-inget som
  // formatvalideringen ovan. `force=1` finns för det sällsynta fallet att man
  // medvetet vill omdirigera en synlig produkt (t.ex. en dubblett-listning).
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (!force) {
    const conflicts = await findRedirectConflicts(rows);
    if (conflicts.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Redirects avvisade — källa eller mål lever fortfarande",
          details: conflicts.map((c) => `${c.fromSlug}: ${c.problem}`),
          hint: "Verifiera i Wix först. Lägg till ?force=1 bara om du är säker.",
        },
        { status: 409 },
      );
    }
  }

  const written: string[] = [];
  const failed: { fromSlug: string; error: string }[] = [];
  for (const row of rows) {
    try {
      await upsertRedirect(row);
      written.push(row.fromSlug);
    } catch (err) {
      failed.push({
        fromSlug: row.fromSlug,
        error: err instanceof Error ? err.message.slice(0, 200) : String(err),
      });
    }
  }

  await audit(
    "redirects-upsert",
    "admin",
    JSON.stringify({ written: written.length, failed: failed.length, force, slugs: written.slice(0, 20) }),
  );

  return NextResponse.json(
    { ok: failed.length === 0, written, failed },
    { status: failed.length === 0 ? 200 : 207 },
  );
}
