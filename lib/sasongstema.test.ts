import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { aktivtTema, SASONGSTEMAN, TEMA_SKRIPT, temaSkript, type Sasongstema } from "./sasongstema.ts";

const ROT = process.cwd();
const halloween = SASONGSTEMAN.find((t) => t.namn === "halloween")!;
const ms = (iso: string) => Date.parse(iso);

const svenskTid = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));

/** Kör skriptet som webbläsaren gör, med en låtsasklocka och ett låtsas-<html>. */
function korSkript(skript: string, nuMs: number, utanDokument = false): Record<string, string> {
  const attribut: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (k: string, v: string) => (attribut[k] = v) } };
  runInNewContext(skript, { Date: { now: () => nuMs }, ...(utanDokument ? {} : { document }) });
  return attribut;
}

describe("Halloween-temats datum", () => {
  it("har börjat före mergen och slutar måndag 2 november 03:00 svensk tid", () => {
    assert.equal(svenskTid(halloween.fran), "2026-10-28 00:00");
    assert.equal(svenskTid(halloween.till), "2026-11-02 03:00");
  });

  it("står kvar över halloweenhelgen och slås av måndag 03:00", () => {
    assert.equal(aktivtTema(ms(halloween.fran) - 1), null);
    assert.equal(aktivtTema(ms(halloween.fran)), "halloween");
    assert.equal(aktivtTema(ms("2026-10-31T23:00:00Z")), "halloween"); // 1 november 00:00
    assert.equal(aktivtTema(ms("2026-11-02T01:59:59Z")), "halloween"); // måndag 02:59:59
    assert.equal(aktivtTema(ms(halloween.till)), null);
    assert.equal(aktivtTema(ms("2027-10-30T12:00:00Z")), null);
  });
});

describe("Singles Day och Singles Week", () => {
  const dag = SASONGSTEMAN.find((t) => t.namn === "singlesday")!;
  const vecka = SASONGSTEMAN.find((t) => t.namn === "singlesweek")!;

  it("Singles Day är onsdag 11 november, hela dygnet i svensk tid", () => {
    assert.equal(svenskTid(dag.fran), "2026-11-11 00:00");
    assert.equal(svenskTid(dag.till), "2026-11-12 00:00");
  });

  it("Singles Week tar vid i samma ögonblick och slutar måndag 16 november 00:00", () => {
    assert.equal(vecka.fran, dag.till);
    assert.equal(svenskTid(vecka.till), "2026-11-16 00:00");
    assert.equal(new Date(vecka.till).getUTCDay(), 0, "23:00 UTC en söndag är måndag 00:00 i Sverige");
  });

  it("rätt tema varje dag i veckan, och butiken som vanligt före och efter", () => {
    assert.equal(aktivtTema(ms(dag.fran) - 1), null);
    assert.equal(aktivtTema(ms(dag.fran)), "singlesday");
    assert.equal(aktivtTema(ms("2026-11-11T11:00:00Z")), "singlesday"); // onsdag 12:00
    assert.equal(aktivtTema(ms(dag.till) - 1), "singlesday"); // onsdag 23:59:59
    assert.equal(aktivtTema(ms(dag.till)), "singlesweek"); // torsdag 00:00
    for (const d of ["12", "13", "14", "15"]) assert.equal(aktivtTema(ms(`2026-11-${d}T11:00:00Z`)), "singlesweek", d);
    assert.equal(aktivtTema(ms(vecka.till) - 1), "singlesweek"); // söndag 23:59:59
    assert.equal(aktivtTema(ms(vecka.till)), null); // måndag 00:00
    assert.equal(aktivtTema(ms("2027-11-11T11:00:00Z")), null);
  });

  it("skriptet sätter samma tema som aktivtTema, minut för minut över båda skiftena", () => {
    for (const mitt of [dag.fran, dag.till, vecka.till]) {
      for (let m = -3; m <= 3; m++) {
        const nu = ms(mitt) + m * 60_000;
        const vantat = aktivtTema(nu);
        assert.deepEqual(korSkript(TEMA_SKRIPT, nu), vantat ? { "data-tema": vantat } : {}, `${mitt} ${m} min`);
      }
    }
  });
});

describe("Black Week, Black Friday och helgen efter", () => {
  const vecka = SASONGSTEMAN.find((t) => t.namn === "blackweek")!;
  const fredag = SASONGSTEMAN.find((t) => t.namn === "blackfriday")!;
  const helg = SASONGSTEMAN.find((t) => t.namn === "blackweekend")!;

  it("måndag 23 november till söndag 29 november, med fredagen 27 som egen dag", () => {
    assert.equal(svenskTid(vecka.fran), "2026-11-23 00:00");
    assert.equal(svenskTid(fredag.fran), "2026-11-27 00:00");
    assert.equal(svenskTid(helg.fran), "2026-11-28 00:00");
    assert.equal(svenskTid(helg.till), "2026-11-30 00:00");
    assert.equal(new Date(vecka.fran).getUTCDay(), 0, "23:00 UTC en söndag är måndag 00:00 i Sverige");
    assert.equal(new Date(fredag.fran).getUTCDay(), 4, "23:00 UTC en torsdag är fredag 00:00 i Sverige");
  });

  it("de tre tar vid efter varandra utan glapp", () => {
    assert.equal(fredag.fran, vecka.till);
    assert.equal(helg.fran, fredag.till);
  });

  it("rätt tema varje dag, och butiken som vanligt före och efter", () => {
    assert.equal(aktivtTema(ms(vecka.fran) - 1), null); // söndag 22 november 23:59:59
    for (const d of ["23", "24", "25", "26"]) assert.equal(aktivtTema(ms(`2026-11-${d}T11:00:00Z`)), "blackweek", d);
    assert.equal(aktivtTema(ms(fredag.fran) - 1), "blackweek");
    assert.equal(aktivtTema(ms(fredag.fran)), "blackfriday");
    assert.equal(aktivtTema(ms("2026-11-27T11:00:00Z")), "blackfriday");
    assert.equal(aktivtTema(ms(fredag.till) - 1), "blackfriday"); // fredag 23:59:59
    for (const d of ["28", "29"]) assert.equal(aktivtTema(ms(`2026-11-${d}T11:00:00Z`)), "blackweekend", d);
    assert.equal(aktivtTema(ms(helg.till) - 1), "blackweekend"); // söndag 23:59:59
    assert.equal(aktivtTema(ms(helg.till)), null); // måndag 30 november 00:00
    assert.equal(aktivtTema(ms("2027-11-27T11:00:00Z")), null);
  });

  it("skriptet sätter samma tema som aktivtTema, minut för minut över alla fyra skiftena", () => {
    for (const mitt of [vecka.fran, vecka.till, fredag.till, helg.till]) {
      for (let m = -3; m <= 3; m++) {
        const nu = ms(mitt) + m * 60_000;
        const vantat = aktivtTema(nu);
        assert.deepEqual(korSkript(TEMA_SKRIPT, nu), vantat ? { "data-tema": vantat } : {}, `${mitt} ${m} min`);
      }
    }
  });
});

// ── Provläget: ett kommande tema går att se på en förhandsvisning ────────
describe("provläget (?tema=) finns bara på förhandsvisningar", () => {
  /** Kör skriptet med en adress och ett minne som ligger kvar mellan körningarna. */
  function korMedAdress(skript: string, nuMs: number, search: string, minne: Record<string, string> = {}): Record<string, string> {
    const attribut: Record<string, string> = {};
    const document = { documentElement: { setAttribute: (k: string, v: string) => (attribut[k] = v) } };
    const sessionStorage = { getItem: (k: string) => minne[k] ?? null, setItem: (k: string, v: string) => void (minne[k] = v) };
    runInNewContext(skript, { Date: { now: () => nuMs }, document, location: { search }, sessionStorage });
    return attribut;
  }
  const prov = temaSkript(SASONGSTEMAN, true);
  const idag = ms("2026-11-18T10:00:00Z"); // inget tema gäller
  const fredag = ms("2026-11-27T10:00:00Z"); // blackfriday gäller

  it("produktionens skript läser varken adressen eller minnet", () => {
    assert.equal(temaSkript(SASONGSTEMAN), temaSkript(SASONGSTEMAN, false));
    assert.doesNotMatch(temaSkript(SASONGSTEMAN), /location|sessionStorage|tema=/);
    // Proven körs utan VERCEL_ENV, som produktionens bygge inte är "preview".
    assert.doesNotMatch(TEMA_SKRIPT, /location|sessionStorage|tema=/);
    assert.match(readFileSync(join(ROT, "lib/sasongstema.ts"), "utf8"), /TEMA_PROV = \(process\.env\.VERCEL_ENV \|\| ""\)\.trim\(\) === "preview"/);
  });

  it("?tema=namn slår på ett tema ur listan, oavsett datum", () => {
    assert.deepEqual(korMedAdress(prov, idag, "?tema=blackweek"), { "data-tema": "blackweek" });
    assert.deepEqual(korMedAdress(prov, idag, "?a=1&tema=blackfriday"), { "data-tema": "blackfriday" });
    assert.deepEqual(korMedAdress(prov, fredag, "?tema=halloween"), { "data-tema": "halloween" });
  });

  it("ett namn som inte står i listan gör ingenting, och datumet gäller som vanligt", () => {
    assert.deepEqual(korMedAdress(prov, idag, "?tema=hittepa"), {});
    assert.deepEqual(korMedAdress(prov, idag, "?tema=Black%20Week"), {});
    assert.deepEqual(korMedAdress(prov, fredag, "?tema=hittepa"), { "data-tema": "blackfriday" });
    assert.deepEqual(korMedAdress(prov, idag, ""), {});
    assert.deepEqual(korMedAdress(prov, fredag, ""), { "data-tema": "blackfriday" });
  });

  it("?tema=av visar butiken utan tema, också en dag då ett tema gäller", () => {
    assert.deepEqual(korMedAdress(prov, fredag, "?tema=av"), {});
  });

  it("valet följer med till nästa sida i samma flik", () => {
    const minne: Record<string, string> = {};
    assert.deepEqual(korMedAdress(prov, idag, "?tema=blackweekend", minne), { "data-tema": "blackweekend" });
    assert.deepEqual(korMedAdress(prov, idag, "", minne), { "data-tema": "blackweekend" });
    assert.deepEqual(korMedAdress(prov, idag, "?tema=av", minne), {});
    assert.deepEqual(korMedAdress(prov, idag, "", minne), {});
  });

  it("kastar aldrig, inte ens utan adress, minne eller dokument", () => {
    assert.doesNotThrow(() => runInNewContext(prov, { Date: { now: () => idag } }));
  });
});

describe("temanas datum", () => {
  it("inga två teman gäller samtidigt, så att det aldrig är oklart vilket som syns", () => {
    const sorterade = [...SASONGSTEMAN].sort((a, b) => ms(a.fran) - ms(b.fran));
    for (let i = 1; i < sorterade.length; i++) {
      assert.ok(ms(sorterade[i].fran) >= ms(sorterade[i - 1].till), `${sorterade[i - 1].namn} och ${sorterade[i].namn} överlappar`);
    }
  });

  it("varje namn finns en gång", () => {
    const namn = SASONGSTEMAN.map((t) => t.namn);
    assert.equal(new Set(namn).size, namn.length);
  });
});

describe("TEMA_SKRIPT", () => {
  it("sätter data-tema på <html> inom temat och ingenting utanför", () => {
    assert.deepEqual(korSkript(TEMA_SKRIPT, ms("2026-10-30T18:00:00Z")), { "data-tema": "halloween" });
    assert.deepEqual(korSkript(TEMA_SKRIPT, ms(halloween.fran) - 1), {});
    assert.deepEqual(korSkript(TEMA_SKRIPT, ms(halloween.till)), {});
  });

  it("kastar aldrig, inte ens utan dokument", () => {
    assert.doesNotThrow(() => korSkript(TEMA_SKRIPT, ms("2026-10-30T18:00:00Z"), true));
  });

  it("vägrar ett namn eller datum som inte går att lita på", () => {
    const fel: Sasongstema[] = [
      { namn: "hallo'ween", fran: "2026-10-27T23:00:00Z", till: "2026-10-31T23:00:00Z" },
      { namn: "Halloween", fran: "2026-10-27T23:00:00Z", till: "2026-10-31T23:00:00Z" },
      { namn: "halloween", fran: "2026-10-28T00:00:00", till: "2026-10-31T23:00:00Z" },
      { namn: "halloween", fran: "2026-10-31T23:00:00Z", till: "2026-10-27T23:00:00Z" },
    ];
    for (const t of fel) assert.throws(() => temaSkript([t]), JSON.stringify(t));
  });
});

// ── CSS:en ───────────────────────────────────────────────────────────────

const CSS = readFileSync(join(ROT, "app/sasongstema.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Toppnivåns block i en CSS-text: det som står före { och det som står inuti. */
function block(css: string): Array<{ prelude: string; kropp: string }> {
  const ut: Array<{ prelude: string; kropp: string }> = [];
  let i = 0;
  while (true) {
    const start = css.indexOf("{", i);
    if (start === -1) break;
    let djup = 1;
    let j = start + 1;
    while (j < css.length && djup > 0) {
      if (css[j] === "{") djup++;
      else if (css[j] === "}") djup--;
      j++;
    }
    ut.push({ prelude: css.slice(i, start).trim(), kropp: css.slice(start + 1, j - 1) });
    i = j;
  }
  return ut;
}

/** Varje väljare i varje regel, även inuti @media och @supports. */
function valjare(css: string, ut: string[] = [], okanda: string[] = []): { valjare: string[]; okanda: string[] } {
  for (const { prelude, kropp } of block(css)) {
    if (prelude.startsWith("@media") || prelude.startsWith("@supports")) valjare(kropp, ut, okanda);
    else if (prelude.startsWith("@keyframes")) continue;
    else if (prelude.startsWith("@")) okanda.push(prelude);
    else ut.push(...prelude.split(",").map((s) => s.trim()));
  }
  return { valjare: ut, okanda };
}

describe("app/sasongstema.css", () => {
  const { valjare: alla, okanda } = valjare(CSS);
  const namn = SASONGSTEMAN.map((t) => t.namn);

  it("har regler", () => {
    assert.ok(alla.length > 20, `bara ${alla.length} väljare hittades`);
  });

  it("varje regel gäller bara under ett tema, så att butiken ser ut som vanligt utanför datumen", () => {
    const prefix = new RegExp(`^:root\\[data-tema="(${namn.join("|")})"\\](?=$|[\\s.:>+~\\[])`);
    const utan = alla.filter((s) => !prefix.test(s));
    assert.deepEqual(utan, []);
    assert.deepEqual(okanda, [], "@import, @font-face och liknande gäller hela butiken året runt");
  });

  it("varje tema har sina regler", () => {
    for (const n of namn) assert.ok(alla.some((s) => s.startsWith(`:root[data-tema="${n}"]`)), n);
  });

  it("Singles-temana skriver ut sitt namn och lovar ingen rabatt (temat är bara stil)", () => {
    const text = [...CSS.matchAll(/content:"([^"]*)"/g)].map((m) => m[1]).filter((t) => t !== "");
    assert.ok(text.includes("Singles Day · 11.11") && text.includes("Singles Day 11.11"), text.join(" | "));
    assert.ok(text.includes("Singles Week · till söndag") && text.includes("Singles Week"), text.join(" | "));
    // Inga priser, procent eller ord som lovar ett erbjudande i något temas text.
    for (const t of text) assert.doesNotMatch(t, /%|\bkr\b|rabatt|rea\b|erbjudande|billig|spara|upp till/i, t);
  });

  it("Black Week-temana skriver ut sitt namn och sina dagar", () => {
    const text = [...CSS.matchAll(/content:"([^"]*)"/g)].map((m) => m[1]).filter((t) => t !== "");
    for (const t of ["Black Week · 23–29 november", "Black Friday · i dag", "Black Week · till söndag", "Black Week", "Black Friday", "Black", "Friday"]) {
      assert.ok(text.includes(t), `"${t}" saknas: ${text.join(" | ")}`);
    }
    // Raden över rubriken tar butiksnamnets plats, men namnet står kvar i rubrikens text.
    assert.match(CSS, /:root\[data-tema="blackweekend"\] \.h1-marke\{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\);white-space:nowrap\}/);
    assert.doesNotMatch(CSS, /\.h1-marke\{[^}]*display:none/);
  });

  it("animationerna har egna namn, inte butikens (@keyframes gäller överallt, temat eller ej)", () => {
    const egna = [...CSS.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    const butikens = new Set([...readFileSync(join(ROT, "app/globals.css"), "utf8").matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
    assert.ok(egna.length > 0);
    assert.deepEqual(egna.filter((k) => butikens.has(k)), []);
    assert.equal(new Set(egna).size, egna.length);
  });

  it("bilderna finns i public/", () => {
    const filer = [...CSS.matchAll(/url\((\/[^)\s]+)\)/g)].map((m) => m[1]);
    assert.ok(filer.length > 0);
    for (const f of filer) assert.ok(existsSync(join(ROT, "public", f)), f);
  });

  it("varje klass som temat riktar sig mot finns i butikens kod", () => {
    const kod: string[] = [];
    const las = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) las(p);
        else if (/\.tsx?$/.test(f) && !/\.test\./.test(f)) kod.push(readFileSync(p, "utf8"));
      }
    };
    las(join(ROT, "app"));
    las(join(ROT, "components"));
    const allKod = kod.join("\n");
    const klasser = new Set(alla.flatMap((s) => [...s.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1])));
    const saknas = [...klasser].filter((k) => !new RegExp(`(?<![\\w-])${k}(?![\\w-])`).test(allKod));
    assert.deepEqual(saknas, []);
  });
});

describe("app/layout.tsx", () => {
  const layout = readFileSync(join(ROT, "app/layout.tsx"), "utf8");

  it("läser in temats CSS efter butikens", () => {
    const glob = layout.indexOf('import "./globals.css"');
    const tema = layout.indexOf('import "./sasongstema.css"');
    assert.ok(glob >= 0 && tema > glob);
  });

  it("kör skriptet före sidhuvudet, så att temat finns från första bilden", () => {
    const skript = layout.indexOf("__html: TEMA_SKRIPT");
    const huvud = layout.indexOf("<SiteHeader");
    assert.ok(skript >= 0 && huvud > skript);
  });

  it("<html> tål attributet som skriptet sätter innan React tar över", () => {
    assert.match(layout, /<html[^>]*\bsuppressHydrationWarning\b/);
  });
});
