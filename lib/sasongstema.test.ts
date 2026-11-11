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
