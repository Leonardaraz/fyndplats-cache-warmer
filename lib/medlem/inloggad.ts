// lib/medlem/inloggad.ts
//
// Vem som är inloggad, läst ur kakan i en serverkomponent eller rutt. En
// ogiltig eller utgången kaka ger null; den rensas av /api/konto/forny.

import { cookies } from "next/headers";
import { SESSION_KAKA, lasSession, type Session } from "./session";
import { medlemsHemlighet } from "./lager";

export async function inloggad(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_KAKA)?.value;
  return lasSession(token, medlemsHemlighet(), Date.now());
}

/** Adressen inloggningslänken pekar på: alltid butikens egen i produktion. */
export function webbplats(req: Request): string {
  if (process.env.VERCEL_ENV === "production") return "https://www.fyndplats.se";
  const u = new URL(req.url);
  const host = u.host;
  if (host === "localhost" || host.startsWith("localhost:") || host.endsWith(".vercel.app")) return `${u.protocol}//${host}`;
  return "https://www.fyndplats.se";
}

export const PRIVAT = { "Cache-Control": "private, no-store" } as const;
