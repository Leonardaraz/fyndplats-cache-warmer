// GET /api/cron/watchlist
//
// Körs dagligen via Vercel Cron (lägg in i vercel.json: "0 6 * * *").
// Loopar genom alla bevakade sökord i FyndplatsDiscoverWatchlist, kör
// AliExpress-sökning med EU-only-filter, jämför mot seenProductIds från
// förra körningen, och mejlar Leonard om det finns nya träffar.
//
// Auth: kräver CRON_SECRET-header (Vercel sätter den automatiskt). Vi
// faller tillbaka på EXTENSION_API_TOKEN för manuell test-trigger.

import { NextResponse, type NextRequest } from "next/server";
import {
  searchAliExpressByText,
  type AliExpressSearchResult,
} from "@/lib/aliexpress/client";
import { classifyWarehouses } from "@/lib/aliexpress/eu-countries";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/resend";
import { getWatchlistStore, type WatchlistEntry } from "@/lib/watchlist/store";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const extToken = process.env.EXTENSION_API_TOKEN;
  if (extToken && req.headers.get("x-fyndplats-token") === extToken) return true;
  return false;
}

interface PerTermDiff {
  term: string;
  newResults: AliExpressSearchResult[];
  totalChecked: number;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const store = getWatchlistStore();
  const entries = await store.listEntries();
  if (entries.length === 0) {
    return NextResponse.json({ ok: true, message: "Tom bevakningslista.", checked: 0 });
  }

  const diffs: PerTermDiff[] = [];
  const errors: { term: string; error: string }[] = [];

  for (const entry of entries) {
    try {
      const all = await searchAliExpressByText(entry.term, {
        sortBy: "orders,desc",
        page: 1,
        pageSize: 20,
      });
      // EU-only filter — UNKNOWN släpps förbi (vi har inte shipFrom på listan)
      const candidates = all.filter((r) => {
        const cls = classifyWarehouses(r.shipsFromCountries ?? []);
        return cls === "EU" || cls === "MIXED" || cls === "UNKNOWN";
      });

      const seenSet = new Set(entry.seenProductIds);
      const fresh = candidates.filter((r) => r.productId && !seenSet.has(r.productId));
      if (fresh.length > 0) {
        diffs.push({ term: entry.term, newResults: fresh, totalChecked: all.length });
      }

      // Uppdatera seenProductIds + lastCheckedAt. Behåll max 500 senaste id:n
      // så vi inte växer obegränsat.
      const nextSeen = [
        ...candidates.map((r) => r.productId).filter(Boolean),
        ...entry.seenProductIds,
      ];
      const uniqueSeen = [...new Set(nextSeen)].slice(0, 500);
      const updated: WatchlistEntry = {
        ...entry,
        seenProductIds: uniqueSeen,
        lastCheckedAt: new Date().toISOString(),
      };
      await store.setEntry(updated);

      // Rate-limit AliExpress (~1 req / 2 s)
      await new Promise((r) => setTimeout(r, 2100));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ term: entry.term, error: message });
    }
  }

  if (diffs.length > 0) {
    const to = process.env.WATCHLIST_NOTIFY_EMAIL ?? process.env.SYNC_NOTIFY_EMAIL;
    if (to) {
      try {
        const { html, text, subject } = buildWatchlistEmail(diffs);
        await sendEmail({ to, subject, bodyHtml: html, bodyText: text });
      } catch (err) {
        errors.push({
          term: "(email)",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  await audit(
    "watchlist-cron",
    "",
    `terms=${entries.length} diffs=${diffs.length} errors=${errors.length}`,
  );

  return NextResponse.json({
    ok: true,
    terms: entries.length,
    diffsByTerm: diffs.map((d) => ({ term: d.term, newCount: d.newResults.length })),
    errors,
  });
}

function buildWatchlistEmail(diffs: PerTermDiff[]): {
  subject: string;
  html: string;
  text: string;
} {
  const totalNew = diffs.reduce((s, d) => s + d.newResults.length, 0);
  const subject = `Fyndplats bevakning: ${totalNew} nya EU-lager-produkter`;
  const base = process.env.PUBLIC_APP_URL ?? "https://fyndplats.se";

  const sections = diffs
    .map((d) => {
      const rows = d.newResults
        .slice(0, 10)
        .map((r) => {
          const price = r.priceUsd !== undefined ? `$${r.priceUsd.toFixed(2)}` : "—";
          const url =
            r.productUrl
            ?? `https://www.aliexpress.com/item/${encodeURIComponent(r.productId)}.html`;
          return `<li><a href="${url}">${escapeHtml(r.title.slice(0, 80))}</a> — <b>${price}</b></li>`;
        })
        .join("");
      return `
        <h3 style="margin:18px 0 6px;font-size:15px;">"${escapeHtml(d.term)}" — ${d.newResults.length} nya</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${rows}</ul>`;
    })
    .join("");

  const html = `
    <h2 style="margin:0 0 4px;font-size:18px;">Nya träffar för dina bevakade sökord</h2>
    <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">${totalNew} nya EU-lager-produkter sedan förra körningen.</p>
    ${sections}
    <p style="margin:18px 0 0;">
      <a href="${base}/admin/discover" style="display:inline-block;background:#F47A35;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;">Öppna upptäck-sidan</a>
    </p>
  `;

  const text = [
    `Nya träffar för dina bevakade sökord (${totalNew} totalt)`,
    "",
    ...diffs.flatMap((d) => [
      `"${d.term}" — ${d.newResults.length} nya`,
      ...d.newResults.slice(0, 10).map((r) => {
        const price = r.priceUsd !== undefined ? `$${r.priceUsd.toFixed(2)}` : "—";
        const url =
          r.productUrl
          ?? `https://www.aliexpress.com/item/${encodeURIComponent(r.productId)}.html`;
        return `  - ${r.title.slice(0, 80)} — ${price} — ${url}`;
      }),
      "",
    ]),
    `Öppna: ${base}/admin/discover`,
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
