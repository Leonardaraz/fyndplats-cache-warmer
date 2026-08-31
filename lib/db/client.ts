// Neon Postgres-klienten. En instans per lambda, HTTP-drivrutin.
//
// HTTP och inte WebSocket/Pool med flit: en Vercel-lambda kan frysas mitt i
// och återupplivas, och en pool med öppna sockets överlever inte det. Varje
// fråga är en fristående HTTPS-förfrågan — inget tillstånd att tappa.
//
// Priset är att multi-sats-transaktioner inte finns. Det är inget vi behöver:
// alla skrivningar i `Store` är enstaka satser, och låsen (`claimTask`,
// `cancelTaskIfFree`) är villkorade UPDATE ... RETURNING, som är atomiska av
// sig själva. Det är faktiskt STARKARE än Wix-varianten de ersätter, som var
// en PATCH med filter.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

/**
 * Den taggade mallen att köra frågor med: sql`select * from x where id = ${id}`.
 *
 * KASTAR när `DATABASE_URL` saknas i stället för att falla tillbaka på något.
 * Samma hållning som `lib/store/app-config.ts`: prissättningen har vettiga
 * defaults, en databasadress har inga, och en saknad variabel får inte se ut
 * som en tom databas.
 */
export function sql(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL saknas — Postgres-backenden kan inte användas. "
        + "Sätt den i Vercel (Storage → Neon → Connect Project) eller kör med STORE_BACKEND=wix-data.",
    );
  }
  cached = neon(url);
  return cached;
}

/** Endast för tester: tvingar fram en ny klient vid nästa sql(). */
export function __resetDbClientForTests(): void {
  cached = null;
}
