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
  it("gäller 28 oktober 00:00 till 1 november 00:00 svensk tid", () => {
    assert.equal(svenskTid(halloween.fran), "2026-10-28 00:00");
    assert.equal(svenskTid(halloween.till), "2026-11-01 00:00");
  });

  it("slås på vid första sekunden och av vid midnatt efter halloween", () => {
    assert.equal(aktivtTema(ms(halloween.fran) - 1), null);
    assert.equal(aktivtTema(ms(halloween.fran)), "halloween");
    assert.equal(aktivtTema(ms("2026-10-31T22:59:59Z")), "halloween");
    assert.equal(aktivtTema(ms(halloween.till)), null);
    assert.equal(aktivtTema(ms("2027-10-30T12:00:00Z")), null);
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
