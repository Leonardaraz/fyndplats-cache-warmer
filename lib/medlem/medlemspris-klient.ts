// lib/medlem/medlemspris-klient.ts
//
// Medlemspriset i webbläsaren: EN hämtning per produkt och tecken, vem som än
// startar den (produktsidans skript, kortets avsikt eller rutan själv), och
// platsen som hålls medan svaret är på väg. Reglerna och skriptet står i
// lib/medlem/tidig.ts; den här modulen är samma sak för sidans egna skript.
//
// Ingen React här, så att produktkortet (components/prefetch-link.tsx) kan
// starta hämtningen utan att dra in rutans komponent i listsidornas skript.
//
// Svaret sparas i modulen i fem minuter, för den här fliken. Det försvinner
// vid utloggning: /api/konto/ut är ett formulär, och sidan laddas om. Rutan
// hämtar ändå om varje gång den monteras och byter om svaret har ändrats.

import { TIDIG_MAX_MS, VY_NYCKEL, giltigVy, hallPlats as skaHallas, medlemsprisAdress, type Vy } from "./tidig";

/** Tecknets värde: "1" privat, "f" företag (lib/medlem/session.ts). */
export function tecken(): string | null {
  if (typeof document === "undefined") return null;
  for (const c of document.cookie.split(";")) {
    const [k, v] = c.trim().split("=");
    if (k === "fp_medlem_inne") return v ?? "";
  }
  return null;
}

const MINNE_MS = 5 * 60_000;
const minne = new Map<string, { at: number; svar: unknown }>();
const pagaende = new Map<string, Promise<unknown>>();

type Tidig = { t?: unknown; at?: unknown; p?: unknown };

/** Löftet som produktsidans skript startade, en gång och bara för samma tecken. */
function tidigHamtning(produktId: string, t: string): Promise<unknown> | null {
  const w = (window as unknown as { __fpMp?: Record<string, Tidig> }).__fpMp;
  const e = w?.[produktId];
  if (!w || !e) return null;
  delete w[produktId];
  if (e.t !== t || typeof e.at !== "number" || Date.now() - e.at > TIDIG_MAX_MS) return null;
  return e.p instanceof Promise ? e.p : null;
}

/** Ett svar yngre än så hämtas inte om när rutan monteras: kortet hämtade
 *  det nyss, när kunden pekade på det. */
export const FARSKT_MS = 30_000;

/** Ett sparat svar för produkten och tecknet, med sin ålder, eller undefined. */
export function sparatSvar(produktId: string): { svar: unknown; alderMs: number } | undefined {
  const t = tecken();
  if (t !== "1" && t !== "f") return undefined;
  const c = minne.get(`${t}|${produktId}`);
  const alderMs = c ? Date.now() - c.at : Infinity;
  return c && alderMs < MINNE_MS ? { svar: c.svar, alderMs } : undefined;
}

/**
 * Hämtar medlemspriset, eller tar över en hämtning som redan pågår. Null utan
 * tecken: då görs inget anrop, som förut. Svaret är serverns JSON eller null.
 */
export function hamtaMedlemspris(produktId: string, varianter: readonly string[] = []): Promise<unknown> | null {
  const t = tecken();
  if (!produktId || (t !== "1" && t !== "f")) return null;
  const k = `${t}|${produktId}`;
  const igang = pagaende.get(k);
  if (igang) return igang;
  const kalla =
    tidigHamtning(produktId, t) ??
    fetch(medlemsprisAdress(produktId, varianter), { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  const p = kalla
    .then((s: unknown) => {
      if (s && typeof s === "object") {
        if (minne.size >= 200) minne.clear();
        minne.set(k, { at: Date.now(), svar: s });
      }
      return s ?? null;
    })
    .finally(() => pagaende.delete(k));
  pagaende.set(k, p);
  return p;
}

// ─────────────────────────────────────────────────────────────────────────────
// Platsen medan svaret är på väg
// ─────────────────────────────────────────────────────────────────────────────

export function lasVy(): Vy | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(VY_NYCKEL) || "null");
    return giltigVy(v) ? v : null;
  } catch {
    return null;
  }
}

export function sparaVy(v: Vy): void {
  try {
    if (giltigVy(v)) localStorage.setItem(VY_NYCKEL, JSON.stringify(v));
  } catch {
    // Privat läge eller full lagring: platsen hålls inte nästa gång, inget annat.
  }
}

/** Samma som produktsidans skript, för en mjuk navigering där det inte körs. */
export function hallPlats(produktId: string): void {
  const t = tecken();
  const v = lasVy();
  if (!t || !skaHallas(v, t)) return;
  const d = document.documentElement;
  d.style.setProperty("--mp-h", `${v.h}px`);
  d.style.setProperty("--mp-r", `${v.r || v.h}px`);
  if (v.n) d.setAttribute("data-mp-niva", v.n);
  else d.removeAttribute("data-mp-niva");
  d.setAttribute("data-mp", produktId);
}

/** Släpper platsen, men bara den här produktens: en gammal timer från förra
 *  sidan får inte släppa nästa sidas plats. */
export function slappPlats(produktId: string): void {
  const d = document.documentElement;
  if (d.getAttribute("data-mp") === produktId) d.removeAttribute("data-mp");
}
