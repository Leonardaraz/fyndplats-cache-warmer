// CLAUDE.md ÄR EN INNEHÅLLSFÖRTECKNING, INTE ETT ARKIV (Leonard 2026-11-01).
//
// CLAUDE.md laddas i varje chatt. Den hade vuxit till 766 kB, ungefär
// 200 000 tokens innan chatten ens hunnit börja. Allt som stod där flyttades
// ordagrant till docs/claude/, och CLAUDE.md listar filerna och citerar de
// regler som alltid gäller. Poleringens runbook delades på samma sätt: en fil
// per steg i docs/polish/runbook/, som läses när rundan kommer till steget.
//
// Testet håller strukturen, för en regel man måste komma ihåg glöms bort:
//
// 1. CLAUDE.md får inte växa tillbaka. Ny kunskap skrivs i ämnesfilen.
// 2. Varje ämnesfil och varje underrubrik står i listan, annars hittar ingen
//    chatt dit. Varje sökväg i listan finns.
// 3. Citaten under "Regler som alltid gäller" står ordagrant i sin fil
//    (radbrytningar räknas inte). Ändras regeln i filen fäller testet, så att
//    CLAUDE.md aldrig säger något annat än filen.
// 4. Varje stegfil länkas från runbooken, och varje länk i de flyttade
//    filerna pekar på en fil och en rubrik som finns.
//
// Filerna ligger under tools/ och docs/, så ändringar här bygger ingenting i
// Vercel (ignoreCommand utesluter docs/, tools/ och markdown).

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Sökvägarna räknas från testfilen, inte från process.cwd().
const ROT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLAUDE = join(ROT, "CLAUDE.md");
const AMNEN = join(ROT, "docs", "claude");
const RUNBOOK = join(ROT, "docs", "seo-polish-runbook.md");
const STEG = join(ROT, "docs", "polish", "runbook");
const SKILL = join(ROT, ".claude", "skills", "seo-polering", "SKILL.md");

const MAX_CLAUDE_BYTE = 30_000;
const MAX_RUNBOOK_BYTE = 20_000;

const las = (fil: string) => readFileSync(fil, "utf8");

function mdFiler(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(katalog).sort()) {
    const full = join(katalog, namn);
    if (statSync(full).isDirectory()) ut.push(...mdFiler(full));
    else if (namn.endsWith(".md")) ut.push(full);
  }
  return ut;
}

type Rubrik = { niva: number; text: string };

// Rubriker utanför kodblock. En rad som börjar med # i ett kodblock är en
// kommentar, ingen rubrik.
function rubriker(text: string): Rubrik[] {
  const ut: Rubrik[] = [];
  let kod = false;
  for (const rad of text.split("\n")) {
    if (rad.startsWith("```")) {
      kod = !kod;
      continue;
    }
    if (kod) continue;
    const m = /^(#{1,6}) (.*)$/.exec(rad);
    if (m) ut.push({ niva: m[1].length, text: m[2] });
  }
  return ut;
}

// Samma ankare som GitHub räknar fram (github-slugger): gemener, bara
// bokstäver, siffror, mellanslag, - och _, och mellanslag blir -. En rubrik
// som förekommer igen får -1, -2 …
function ankare(text: string): Set<string> {
  const ut = new Set<string>();
  const sedda = new Map<string, number>();
  for (const r of rubriker(text)) {
    const ren = r.text
      .replace(/`([^`]*)`/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .trim()
      .toLowerCase();
    const slug = [...ren]
      .filter((c) => c === " " || c === "-" || c === "_" || /[\p{L}\p{M}\p{N}]/u.test(c))
      .join("")
      .replace(/ /g, "-");
    const n = sedda.get(slug) ?? 0;
    sedda.set(slug, n + 1);
    ut.add(n === 0 ? slug : `${slug}-${n}`);
  }
  return ut;
}

// Länkmål utanför kodblock och kodspann.
function lankar(text: string): string[] {
  const ut: string[] = [];
  let kod = false;
  for (const rad of text.split("\n")) {
    if (rad.startsWith("```")) {
      kod = !kod;
      continue;
    }
    if (kod) continue;
    const utanKod = rad.replace(/`[^`]*`/g, "");
    for (const m of utanKod.matchAll(/\]\(([^)\s]+)\)/g)) ut.push(m[1]);
  }
  return ut;
}

const blanksteg = (s: string) => s.replace(/\s+/g, " ").trim();

describe("CLAUDE.md är en innehållsförteckning", () => {
  const claude = las(CLAUDE);

  it(`är högst ${MAX_CLAUDE_BYTE} byte, eftersom den laddas i varje chatt`, () => {
    const byte = Buffer.byteLength(claude, "utf8");
    expect(
      byte,
      `CLAUDE.md är ${byte} byte. Skriv ny kunskap i ämnesfilen under docs/claude/ och lägg bara till en rad i listan.`,
    ).toBeLessThanOrEqual(MAX_CLAUDE_BYTE);
  });

  it("importerar inga filer (@sökväg hade laddat dem i varje chatt)", () => {
    const utanKod = claude.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
    expect(utanKod).not.toMatch(/(^|\s)@[\w./-]+/m);
  });

  it("ingen ämnesfil heter CLAUDE.md (den hade laddats automatiskt)", () => {
    const fel = mdFiler(AMNEN).filter((f) => f.endsWith("/CLAUDE.md"));
    expect(fel).toEqual([]);
  });

  it("varje ämnesfil står i listan, med sin rubrik", () => {
    const saknas: string[] = [];
    for (const fil of mdFiler(AMNEN)) {
      const rel = relative(AMNEN, fil).split("\\").join("/");
      const forsta = rubriker(las(fil))[0];
      expect(forsta, `${rel} börjar inte med en rubrik`).toBeDefined();
      if (rel.endsWith("/00-inledning.md")) {
        const katalog = rel.slice(0, -"00-inledning.md".length);
        if (!claude.includes(`\`${rel}\``)) saknas.push(rel);
        if (!claude.includes(`\`${katalog}\`: ${forsta.text}`)) saknas.push(`${katalog} (rubriken)`);
      } else if (!claude.includes(`\`${rel}\`: ${forsta.text}`)) {
        saknas.push(rel);
      }
    }
    expect(saknas, "lägg till filen i listan i CLAUDE.md, med rubriken ordagrant").toEqual([]);
  });

  it("varje underrubrik i en ämnesfil står i listan", () => {
    const saknas: string[] = [];
    for (const fil of mdFiler(AMNEN)) {
      const rub = rubriker(las(fil));
      const topp = rub[0].niva;
      for (const r of rub.slice(1)) {
        if (r.niva === topp + 1 && !claude.includes(`- ${r.text}`)) {
          saknas.push(`${relative(AMNEN, fil)}: ${r.text}`);
        }
      }
    }
    expect(saknas, "lägg till underrubriken under sin fil i CLAUDE.md").toEqual([]);
  });

  it("varje sökväg i listan finns", () => {
    const fel: string[] = [];
    for (const m of claude.matchAll(/`([0-9]{2}-[^`\s]+?(?:\.md|\/))`/g)) {
      if (!existsSync(join(AMNEN, m[1]))) fel.push(m[1]);
    }
    for (const m of claude.matchAll(/`((?:docs|tools|\.claude)\/[^`\s]+)`/g)) {
      if (!existsSync(join(ROT, m[1]))) fel.push(m[1]);
    }
    expect(fel).toEqual([]);
  });

  it("citaten under Regler som alltid gäller står ordagrant i sin fil", () => {
    const start = claude.indexOf("\n## Regler som alltid gäller\n");
    expect(start).toBeGreaterThan(0);
    const slut = claude.indexOf("\n## ", start + 1);
    const avsnitt = claude.slice(start, slut);
    const punkter: string[] = [];
    for (const rad of avsnitt.split("\n")) {
      if (rad.startsWith("- ")) punkter.push(rad.slice(2));
      else if (rad.startsWith("  ") && punkter.length > 0) punkter[punkter.length - 1] += ` ${rad.trim()}`;
    }
    expect(punkter.length).toBeGreaterThanOrEqual(10);
    const fel: string[] = [];
    for (const punkt of punkter) {
      const m = /^(.*) \*\(`([^`]+)`\)\*$/.exec(blanksteg(punkt));
      if (!m) {
        fel.push(`ingen källa: ${punkt.slice(0, 60)}`);
        continue;
      }
      const kalla = m[2].startsWith("docs/") ? join(ROT, m[2]) : join(AMNEN, m[2]);
      if (!existsSync(kalla)) {
        fel.push(`filen finns inte: ${m[2]}`);
        continue;
      }
      if (!blanksteg(las(kalla)).includes(m[1])) fel.push(`står inte ordagrant i ${m[2]}: ${m[1].slice(0, 60)}`);
    }
    expect(fel).toEqual([]);
  });
});

describe("runbooken har en fil per steg", () => {
  const runbook = las(RUNBOOK);

  it(`är högst ${MAX_RUNBOOK_BYTE} byte, och stegen ligger i egna filer`, () => {
    expect(Buffer.byteLength(runbook, "utf8")).toBeLessThanOrEqual(MAX_RUNBOOK_BYTE);
    expect(rubriker(runbook).some((r) => /^\d+\. /.test(r.text))).toBe(false);
  });

  it("varje stegfil länkas från runbooken och nämns i skillen", () => {
    const skill = las(SKILL);
    const steg = readdirSync(STEG).filter((n) => n.endsWith(".md")).sort();
    expect(steg.length).toBeGreaterThanOrEqual(11);
    for (const n of steg) {
      expect(runbook, n).toContain(`](polish/runbook/${n})`);
      expect(skill, n).toContain(n);
    }
  });

  it("skillen pekar på runbooken och är kort", () => {
    const skill = las(SKILL);
    expect(skill).toMatch(/^---\nname: seo-polering\ndescription: .+\n---\n/);
    expect(skill).toContain("docs/seo-polish-runbook.md");
    expect(Buffer.byteLength(skill, "utf8")).toBeLessThanOrEqual(8_000);
  });

  it("varje länk i de flyttade filerna pekar på en fil och en rubrik som finns", () => {
    const filer = [CLAUDE, RUNBOOK, SKILL, ...mdFiler(STEG), ...mdFiler(AMNEN)];
    const fel: string[] = [];
    for (const fil of filer) {
      for (const mal of lankar(las(fil))) {
        if (/^[a-z]+:/.test(mal)) continue;
        const [vag, frag] = mal.split("#");
        const malfil = vag === "" ? fil : normalize(join(dirname(fil), vag));
        const rel = relative(ROT, fil);
        if (!existsSync(malfil)) {
          fel.push(`${rel}: ${mal} (filen finns inte)`);
          continue;
        }
        if (frag && !ankare(las(malfil)).has(decodeURIComponent(frag))) {
          fel.push(`${rel}: ${mal} (rubriken finns inte)`);
        }
      }
    }
    expect(fel).toEqual([]);
  });
});
