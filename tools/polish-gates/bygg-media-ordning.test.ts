// ☠️ EN STÄDRUNDA FLYTTAR INGA BILDER (2026-11-14). bygg-media.py lägger måttbilden sist, och det är rätt när en
// runda bygger ett galleri. Hundgrinden dab49bb1 har måttbilden som tredje av de grå bilderna, före de vita, och en
// städrunda som bara rättade texten hade flyttat den sist, bland de vita: mediasteget skickar alltid hela listan.
// `behall-bildordning.tsv` håller en produkts bilder i positionsordning. Provet bor under tools/, så att det inte
// startar ett bygge (vercel.json hoppar över docs/, tools/ och markdown).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SKRIPT = resolve(__dirname, "bygg-media.py");
let katalog = "";

function kor(filer: Record<string, string>): { ut: string; kod: number } {
  katalog = mkdtempSync(join(tmpdir(), "bygg-media-"));
  for (const [namn, innehall] of Object.entries(filer)) writeFileSync(join(katalog, namn), innehall);
  try {
    return { ut: execFileSync("python3", [SKRIPT], { cwd: katalog, encoding: "utf-8" }), kod: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { ut: `${e.stdout ?? ""}${e.stderr ?? ""}`, kod: e.status ?? 1 };
  }
}

afterEach(() => {
  if (katalog) rmSync(katalog, { recursive: true, force: true });
  katalog = "";
});

const BILDER = [1, 2, 3, 4, 5].map((p) => `prod\t${p}\tb379ce_${"a".repeat(31)}${p}~mv2.jpg`).join("\n") + "\n";
const MATT_PA_TRE = ["Huvudbild", "Närbild", "Måttbild: 82,5 cm hög", "Miljöbild", "Vit huvudbild"];
const filer = (extra: Record<string, string> = {}) => ({
  "bilder.tsv": BILDER,
  "alt.tsv": MATT_PA_TRE.map((a, i) => `prod\t${i + 1}\t${a}`).join("\n") + "\n",
  ...extra,
});
const ordning = () =>
  (JSON.parse(readFileSync(join(katalog, "nyttolast-media.json"), "utf-8")) as { prod: { id: string }[] }).prod.map(
    (x) => x.id.replace(/^.*a(\d)~mv2\.jpg$/, "$1"),
  );

describe("behall-bildordning.tsv", () => {
  it("lägger måttbilden sist som förut utan filen", () => {
    expect(kor(filer()).kod).toBe(0);
    expect(ordning()).toEqual(["1", "2", "4", "5", "3"]);
  });

  it("behåller positionsordningen för en produkt i filen", () => {
    const { ut, kod } = kor(filer({ "behall-bildordning.tsv": "prod\tstädrunda: måttbilden hör till den grå färgen\n" }));
    expect(kod).toBe(0);
    expect(ordning()).toEqual(["1", "2", "3", "4", "5"]);
    expect(ut).toMatch(/behållen/);
  });

  it("fäller ett kort i filen som saknar bilder i rundan", () => {
    const { ut, kod } = kor(filer({ "behall-bildordning.tsv": "annan\tstädrunda: ett kort som inte finns i alt.tsv\n" }));
    expect(kod).toBe(1);
    expect(ut).toMatch(/annan har inga rader i alt\.tsv/);
  });

  it("fäller en rad utan skäl", () => {
    const { ut, kod } = kor(filer({ "behall-bildordning.tsv": "prod\tja\n" }));
    expect(kod).toBe(1);
    expect(ut).toMatch(/minst tio tecken/);
  });
});
