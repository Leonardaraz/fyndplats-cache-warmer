// lib/auction-day.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Verifierar dagsdramaturgins klocklogik: hettan 07→18, sista timmen 18–19,
// timindexet och dagens slut.

import test from "node:test";
import assert from "node:assert/strict";
import { dayHeat, isFinalHour, isDayOver, hourIndex, msToDayEnd, AUCTION_DAY_HOURS, AUCTION_DAY_MS, PRESTART_WINDOW_MS, FINAL_HOUR, auctionPhase, phaseOf, isActivelyDropping, tickerStepMs, dayEndMs, fmtLeft, REFRESH_BACKOFF_MS } from "./auction-day.ts";

const H = 3_600_000;
const START = Date.parse("2026-07-12T05:00:00.000Z"); // 07:00 svensk sommartid

test("dayHeat: 0 vid start, 0.5 halvvägs till 18, 1 vid golvet och därefter", () => {
  assert.equal(dayHeat(START, START), 0);
  assert.equal(dayHeat(START, START + (FINAL_HOUR / 2) * H), 0.5);
  assert.equal(dayHeat(START, START + FINAL_HOUR * H), 1);
  assert.equal(dayHeat(START, START + 11.5 * H), 1);
  assert.equal(dayHeat(START, START - 3 * H), 0); // schemalagd, ej startad
  assert.equal(dayHeat(null, START), 0);
});

test("isFinalHour: exakt 18:00–18:59, inte före eller efter", () => {
  assert.equal(isFinalHour(START, START + FINAL_HOUR * H - 1), false);
  assert.equal(isFinalHour(START, START + FINAL_HOUR * H), true);
  assert.equal(isFinalHour(START, START + AUCTION_DAY_HOURS * H - 1), true);
  assert.equal(isFinalHour(START, START + AUCTION_DAY_HOURS * H), false);
  assert.equal(isFinalHour(null, START), false);
});

test("isDayOver: från 19:00", () => {
  assert.equal(isDayOver(START, START + AUCTION_DAY_HOURS * H - 1), false);
  assert.equal(isDayOver(START, START + AUCTION_DAY_HOURS * H), true);
});

test("hourIndex: 0 första timmen, 11 sista, klampat i båda ändar", () => {
  assert.equal(hourIndex(START, START + 30 * 60_000), 0);
  assert.equal(hourIndex(START, START + 5 * H + 1), 5);
  assert.equal(hourIndex(START, START + 11 * H), 11);
  assert.equal(hourIndex(START, START + 20 * H), 11);
  assert.equal(hourIndex(START, START - 2 * H), 0);
});

test("msToDayEnd: räknar ner till 19:00, null efter", () => {
  assert.equal(msToDayEnd(START, START + 11 * H), H);
  assert.equal(msToDayEnd(START, START + AUCTION_DAY_HOURS * H), null);
  assert.equal(msToDayEnd(null, START), null);
});

test("auctionPhase: hela dygnsresan i rätt ordning", () => {
  const start = START;                       // 07:00
  const t = (nextDropAtMs: number | null, startsAtMs: number | null = null) =>
    ({ startsAtMs, dayStartMs: start, nextDropAtMs });

  // Natt: startsAt i framtiden vinner över allt annat.
  assert.deepEqual(auctionPhase(start - 2 * H, t(start + H, start)), { phase: "pre", targetMs: start });
  // Dag med känd framtida sänkning.
  assert.equal(auctionPhase(start + H, t(start + 2 * H)).phase, "countdown");
  // Målet passerat men dagen pågår → stale (refresh-kedjan jobbar).
  assert.equal(auctionPhase(start + 2 * H + 60_000, t(start + 2 * H)).phase, "stale");
  // Golv utan nextDrop, dagen pågår → floor med dagens slut som mål.
  assert.deepEqual(auctionPhase(start + 11.5 * H, t(null)), {
    phase: "floor", targetMs: start + AUCTION_DAY_HOURS * H,
  });
  // ≥19:00 → ended, oavsett kvarvarande stale-mål från dagen.
  assert.equal(auctionPhase(start + 12 * H, t(start + 9 * H)).phase, "ended");
  assert.equal(auctionPhase(start + 15 * H, t(null)).phase, "ended");
});

test("auctionPhase: ended vinner inte över en NY dags pre-läge", () => {
  const yesterday = START;
  const tomorrow = START + 24 * H;
  // Efter rotation: dayStart = i morgon (framtid) → isDayOver false → pre.
  const out = auctionPhase(START + 15 * H, { startsAtMs: tomorrow, dayStartMs: tomorrow, nextDropAtMs: tomorrow + H });
  assert.deepEqual(out, { phase: "pre", targetMs: tomorrow });
  // Stale props (gammal dag) + inget startsAt → ended, target = gårdagens slut.
  const stale = auctionPhase(START + 15 * H, { startsAtMs: null, dayStartMs: yesterday, nextDropAtMs: null });
  assert.deepEqual(stale, { phase: "ended", targetMs: yesterday + AUCTION_DAY_HOURS * H });
});

test("dayEndMs + fmtLeft: gränsvärden", () => {
  assert.equal(dayEndMs(null), null);
  assert.equal(dayEndMs(START), START + AUCTION_DAY_HOURS * H);
  assert.equal(fmtLeft(0), "0:00");
  assert.equal(fmtLeft(-5000), "0:00");          // klampas, aldrig negativt
  assert.equal(fmtLeft(65_000), "1:05");
  assert.equal(fmtLeft(3 * H + 62_000), "3:01:02");
});

test("REFRESH_BACKOFF_MS: stigande och täcker väckarklockans drift", () => {
  for (let i = 1; i < REFRESH_BACKOFF_MS.length; i++) {
    assert.ok(REFRESH_BACKOFF_MS[i] > REFRESH_BACKOFF_MS[i - 1], "stegen ska vara stigande");
  }
  const sum = REFRESH_BACKOFF_MS.reduce((a, b) => a + b, 0);
  assert.ok(sum >= 25 * 60_000, `summan ${sum} ska täcka minst 25 min drift`);
});

// Kontraktet: fasmaskinens "ended" måste följa SAMMA dygnsgräns som isDayOver,
// och phaseOf (adaptern som både korten och startsidan går via) måste ge samma
// svar som den råa maskinen. Föregående version av det här testet jämförde
// auctionPhase mot sig själv med identiska argument — en tautologi som aldrig
// kunde falla (granskning 2026-08-14). Nu korsas två OBEROENDE vägar.
test("auctionPhase.ended följer isDayOver — inte en egen gräns", () => {
  for (const at of [START - H, START, START + 6 * H, START + 12 * H - 1, START + 12 * H, START + 30 * H]) {
    const viaMaskin = auctionPhase(at, { startsAtMs: null, dayStartMs: START, nextDropAtMs: null }).phase === "ended";
    const viaDygn = isDayOver(START, at);
    assert.equal(viaMaskin, viaDygn, `divergens vid ${(at - START) / H} h`);
  }
});

test("phaseOf: adaptern ger samma svar som råa maskinen", () => {
  const iso = (ms: number) => new Date(ms).toISOString();
  const cases = [
    { startsAt: iso(START), startAt: iso(START), nextDropAt: null, at: START - H, vantad: "pre" },
    { startsAt: null, startAt: iso(START), nextDropAt: iso(START + 4 * H), at: START + H, vantad: "countdown" },
    { startsAt: null, startAt: iso(START), nextDropAt: iso(START + H), at: START + 2 * H, vantad: "stale" },
    { startsAt: null, startAt: iso(START), nextDropAt: null, at: START + 11 * H, vantad: "floor" },
    { startsAt: null, startAt: iso(START), nextDropAt: null, at: START + 13 * H, vantad: "ended" },
  ] as const;
  for (const c of cases) {
    const via = phaseOf({ startsAt: c.startsAt, startAt: c.startAt, nextDropAt: c.nextDropAt }, c.at);
    assert.equal(via.phase, c.vantad, `phaseOf vid ${(c.at - START) / H} h`);
    const rakt = auctionPhase(c.at, {
      startsAtMs: c.startsAt ? Date.parse(c.startsAt) : null,
      dayStartMs: c.startAt ? Date.parse(c.startAt) : null,
      nextDropAtMs: c.nextDropAt ? Date.parse(c.nextDropAt) : null,
    });
    assert.deepEqual(via, rakt, "adapter och maskin måste vara överens");
  }
});

// Startsidans banner sa "priset sjunker just nu" även på GOLVET (18–19), där
// inget sjunker mer — och tidigare även efter stängning (granskning 2026-08-14).
test("isActivelyDropping: bara nedräkning och sen sänkning", () => {
  assert.equal(isActivelyDropping("countdown"), true);
  assert.equal(isActivelyDropping("stale"), true, "sen sänkning är fortfarande en pågående dag");
  assert.equal(isActivelyDropping("floor"), false, "på golvet sjunker inget mer");
  assert.equal(isActivelyDropping("ended"), false);
  assert.equal(isActivelyDropping("pre"), false);
});

test("auctionPhase: stängt-beslutet följer dagslängden, inte en separat flagga", () => {
  const t = (nextDropAtMs: number | null) => ({ startsAtMs: null, dayStartMs: START, nextDropAtMs });
  // Sista sekunden av dagen är INTE stängt; exakt 19:00 är det.
  assert.notEqual(auctionPhase(START + AUCTION_DAY_HOURS * H - 1, t(null)).phase, "ended");
  assert.equal(auctionPhase(START + AUCTION_DAY_HOURS * H, t(null)).phase, "ended");
  // Stängt vinner över ett kvarliggande (passerat) sänkningsmål.
  assert.equal(auctionPhase(START + 13 * H, t(START + 9 * H)).phase, "ended");
  // Utan dagsstart kan inget vara stängt (defensivt: rad utan startAt).
  assert.notEqual(
    auctionPhase(START + 20 * H, { startsAtMs: null, dayStartMs: null, nextDropAtMs: null }).phase,
    "ended",
  );
});

test("PRESTART_WINDOW_MS: natten, inte dagen", () => {
  assert.equal(PRESTART_WINDOW_MS, 24 * H - AUCTION_DAY_HOURS * H);
  assert.equal(AUCTION_DAY_MS + PRESTART_WINDOW_MS, 24 * H, "dag + natt = ett dygn");
});

// REGRESSION (granskning 2026-08-14, allvarligaste fyndet i serien): tickern
// gate:ades bort i floor/stale/ended med motiveringen "ingen text beror på
// klockan där". Men klockan är det som DRIVER fasövergångarna — när den frös
// vid 18:00 inträffade 19:00 aldrig för en öppen flik, och kortet satt kvar på
// "Lägsta pris — första köparen tar det!" hela kvällen med en CTA till en
// produkt vars pris Wix redan återställt.
test("tickerStepMs: klockan går i ALLA faser — aldrig 0, aldrig oändlig", () => {
  const faser = ["pre", "countdown", "stale", "floor", "ended"] as const;
  for (const f of faser) {
    const step = tickerStepMs(f);
    assert.ok(Number.isFinite(step), `${f}: takten måste vara ändlig`);
    assert.ok(step > 0, `${f}: takten måste vara > 0 — en stoppad klocka fryser fasen`);
    assert.ok(step <= 60_000, `${f}: max en minut, annars missas gränsen för länge`);
  }
});

test("tickerStepMs: sekundtakt bara där siffror räknas ned", () => {
  assert.equal(tickerStepMs("pre"), 1_000);
  assert.equal(tickerStepMs("countdown"), 1_000);
  // Övriga behöver inte sekundtakt, men MÅSTE ticka (se testet ovan).
  assert.ok(tickerStepMs("floor") > 1_000);
  assert.ok(tickerStepMs("ended") > 1_000);
});

// Simulerar en öppen flik över dygnsgränsen med den faktiska takten: fasen ska
// nå "ended" inom en tickperiod efter 19:00, inte fastna i floor.
test("en öppen flik når ended strax efter 19:00", () => {
  const t = { startsAtMs: null, dayStartMs: START, nextDropAtMs: null };
  let now = START + 11 * H; // 18:00, golvet — här frös klockan i den trasiga versionen
  let phase = auctionPhase(now, t).phase;
  assert.equal(phase, "floor");
  // Kör klockan framåt med fasens egen takt, som hooken gör.
  for (let i = 0; i < 5000 && phase !== "ended"; i++) {
    now += tickerStepMs(phase);
    phase = auctionPhase(now, t).phase;
  }
  assert.equal(phase, "ended", "fliken måste nå stängt läge");
  const slack = now - (START + AUCTION_DAY_HOURS * H);
  assert.ok(slack >= 0 && slack <= 20_000, `nådde ended ${slack} ms efter 19:00 (max 20 s)`);
});
