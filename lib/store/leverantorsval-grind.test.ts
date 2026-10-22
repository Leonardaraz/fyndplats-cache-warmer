// ☠️ Ett val mellan leverantörer tar ställning till ALLA leverantörer.
//
// VARFÖR DET HÄR TESTET FINNS. Fram till 2026-10-21 fanns två leverantörer, och
// koden valde väg med två grenar: "är det AliExpress? hoppa över, resten är
// Aosom" eller "är det Aosom? annars AliExpress". Med VEVOR som tredje
// leverantör skickar varje sådant val VEVOR-raden in i fel gren, utan att något
// fel syns. Konkret: konkurrentpris-planen hade kunnat ge en VEVOR-rad
// dealproffsens pris och lotta in den i A/B-testet, och ommappningen hade
// behandlat en VEVOR-sida som en AliExpress-sida.
//
// Huvudspärren är TYPEN: `mappingSupplier()` svarar med fyra värden, och ett
// `switch` med `assertNever` som saknar ett av dem stoppar `next build`. Den
// här grinden fäller det typen inte ser, alltså de booleska formerna:
//
//   R1  `?:` på en leverantörstest — utom en positiv utväljning, där
//       annars-grenen är null, undefined eller false
//   R2  `if/else` på en leverantörstest
//   R3  en uteslutning: `if (isAliExpressMapping(m)) continue;` — resten av
//       loopen antar då att raden är den andra leverantören
//   R4  `if (!isAosomMapping(m)) { … }` utan att lämna — allt utom X gör något
//   R5  ett negativt filter: `.filter((m) => !isAliExpressMapping(m))`
//   R6  ett `switch` på en leverantör utan `assertNever` i `default`
//
// Ett positivt filter, "bara Aosom går vidare", är tillåtet. Det tar inte
// ställning till de andra leverantörerna, det väljer bort dem.
//
// Grinden läser koden med TypeScripts egen parser, inte med regex, så den ser
// både `if/else` och `?:` och snubblar inte på strängar som recensionernas
// `source: "aosom"`. Den ser INTE ett val som döljs bakom en funktion eller
// ett värde som räknats ut långt tidigare. Det är typens och granskningens jobb.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import ts from "typescript";

const ROT = join(__dirname, "..", "..");

/** Predikaten som svarar ja eller nej för EN leverantör. */
const PREDIKAT = new Set(["isAosomMapping", "isAliExpressMapping"]);
/** Värdena en leverantörstest jämför med. */
const LEVERANTORSVARDEN = new Set(["aliexpress", "aosom", "vevor", "okand"]);
/** Fält som bär en leverantör: mappningens `supplier` och källans `leverantor`. */
const LEVERANTORSFALT = new Set(["supplier", "leverantor"]);
/** Anropen som returnerar en leverantör. */
const LEVERANTORSANROP = new Set(["mappingSupplier"]);
/** Metoderna vars återanrop är ett filter: ett negativt villkor betyder "allt utom X". */
const FILTERMETODER = new Set(["filter", "find", "findIndex", "some", "every"]);

type Polaritet = "ar" | "inte";

export interface Fynd {
  rad: number;
  regel: "R1" | "R2" | "R3" | "R4" | "R5" | "R6";
  utdrag: string;
}

const vand = (p: Polaritet): Polaritet => (p === "ar" ? "inte" : "ar");

function utanParenteser(e: ts.Expression): ts.Expression {
  let x = e;
  while (ts.isParenthesizedExpression(x) || ts.isNonNullExpression(x) || ts.isAsExpression(x)) x = x.expression;
  return x;
}

function anropsnamn(e: ts.CallExpression): string | null {
  const c = e.expression;
  if (ts.isIdentifier(c)) return c.text;
  if (ts.isPropertyAccessExpression(c)) return c.name.text;
  return null;
}

/** Variabler i filen som bär en leverantör, och variabler som bär en leverantörstest. */
interface Variabler {
  leverantorer: Set<string>;
  tester: Map<string, Polaritet>;
}

function arLeverantorsvarde(e: ts.Expression, v: Variabler): boolean {
  const x = utanParenteser(e);
  if (ts.isCallExpression(x)) return LEVERANTORSANROP.has(anropsnamn(x) ?? "");
  if (ts.isPropertyAccessExpression(x)) return LEVERANTORSFALT.has(x.name.text);
  if (ts.isIdentifier(x)) return v.leverantorer.has(x.text);
  return false;
}

const arLeverantorsstrang = (e: ts.Expression): boolean => {
  const x = utanParenteser(e);
  return (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) && LEVERANTORSVARDEN.has(x.text);
};

/** Polariteten om `e` ENSAMT är en leverantörstest, annars null. */
function leverantorstest(e: ts.Expression, v: Variabler): Polaritet | null {
  const x = utanParenteser(e);
  if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.ExclamationToken) {
    const inre = leverantorstest(x.operand, v);
    return inre ? vand(inre) : null;
  }
  if (ts.isCallExpression(x) && PREDIKAT.has(anropsnamn(x) ?? "")) return "ar";
  if (ts.isIdentifier(x) && v.tester.has(x.text)) return v.tester.get(x.text)!;
  if (ts.isBinaryExpression(x)) {
    const op = x.operatorToken.kind;
    const lika = op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken;
    const olika = op === ts.SyntaxKind.ExclamationEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken;
    if (!lika && !olika) return null;
    const traff =
      (arLeverantorsvarde(x.left, v) && arLeverantorsstrang(x.right))
      || (arLeverantorsvarde(x.right, v) && arLeverantorsstrang(x.left));
    if (!traff) return null;
    return lika ? "ar" : "inte";
  }
  return null;
}

/** Delarna i en kedja av samma logiska operator, t.ex. a && b && c → [a, b, c]. */
function kedja(e: ts.Expression, op: ts.SyntaxKind): ts.Expression[] {
  const x = utanParenteser(e);
  if (ts.isBinaryExpression(x) && x.operatorToken.kind === op) return [...kedja(x.left, op), ...kedja(x.right, op)];
  return [x];
}

/** Alla leverantörstester någonstans i villkorets logiska struktur. */
function allaTester(e: ts.Expression, v: Variabler): Polaritet[] {
  const direkt = leverantorstest(e, v);
  if (direkt) return [direkt];
  const x = utanParenteser(e);
  if (
    ts.isBinaryExpression(x)
    && (x.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
      || x.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  ) {
    return [...allaTester(x.left, v), ...allaTester(x.right, v)];
  }
  return [];
}

/**
 * Är villkoret en ren och-kedja där varje leverantörstest har en viss
 * polaritet? Övriga led får vara vad som helst ("m &&", "rad &&").
 */
function ochKedjaMed(e: ts.Expression, v: Variabler, polaritet: Polaritet): boolean {
  const led = kedja(e, ts.SyntaxKind.AmpersandAmpersandToken);
  const tester = led.map((l) => leverantorstest(l, v)).filter((p): p is Polaritet => p !== null);
  return tester.length > 0 && tester.every((p) => p === polaritet) && led.every((l) => allaTester(l, v).length === 0 || leverantorstest(l, v) !== null);
}

function arTomtVarde(e: ts.Expression): boolean {
  const x = utanParenteser(e);
  return (
    x.kind === ts.SyntaxKind.NullKeyword
    || x.kind === ts.SyntaxKind.FalseKeyword
    || (ts.isIdentifier(x) && x.text === "undefined")
  );
}

function arUtgang(s: ts.Statement): boolean {
  if (ts.isContinueStatement(s) || ts.isReturnStatement(s) || ts.isThrowStatement(s) || ts.isBreakStatement(s)) return true;
  if (ts.isBlock(s)) {
    const sista = s.statements[s.statements.length - 1];
    return sista ? arUtgang(sista) : false;
  }
  return false;
}

/** Ett villkor för en uteslutning: hela villkoret, eller ett eller-led, är "är X". */
function uteslutning(e: ts.Expression, v: Variabler): boolean {
  return kedja(e, ts.SyntaxKind.BarBarToken).some((led) => ochKedjaMed(led, v, "ar"));
}

function samlaVariabler(fil: ts.SourceFile): Variabler {
  const v: Variabler = { leverantorer: new Set(), tester: new Map() };
  // Två varv: en test kan bygga på en variabel som deklarerats längre upp.
  for (let varv = 0; varv < 2; varv++) {
    const besok = (n: ts.Node): void => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
        const init = utanParenteser(n.initializer);
        if (arLeverantorsvarde(init, v)) v.leverantorer.add(n.name.text);
        else {
          const tester = allaTester(init, v);
          if (tester.length === 1) v.tester.set(n.name.text, tester[0]);
        }
      }
      ts.forEachChild(n, besok);
    };
    besok(fil);
  }
  return v;
}

function harAssertNeverIDefault(s: ts.SwitchStatement): boolean {
  const def = s.caseBlock.clauses.find((c): c is ts.DefaultClause => ts.isDefaultClause(c));
  if (!def) return false;
  let hittad = false;
  const besok = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && anropsnamn(n) === "assertNever") hittad = true;
    ts.forEachChild(n, besok);
  };
  def.statements.forEach(besok);
  return hittad;
}

/** Alla fynd i en källtext. Exporterad för testerna av grinden själv. */
export function granska(text: string, filnamn = "x.ts"): Fynd[] {
  const fil = ts.createSourceFile(filnamn, text, ts.ScriptTarget.Latest, true,
    filnamn.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const v = samlaVariabler(fil);
  const fynd: Fynd[] = [];
  const lagg = (n: ts.Node, regel: Fynd["regel"]): void => {
    const rad = fil.getLineAndCharacterOfPosition(n.getStart(fil)).line + 1;
    fynd.push({ rad, regel, utdrag: n.getText(fil).split("\n")[0].slice(0, 120) });
  };

  const besok = (n: ts.Node): void => {
    if (ts.isConditionalExpression(n) && allaTester(n.condition, v).length > 0) {
      const positivUtvaljning =
        (arTomtVarde(n.whenFalse) && ochKedjaMed(n.condition, v, "ar"))
        || (arTomtVarde(n.whenTrue) && ochKedjaMed(n.condition, v, "inte"));
      if (!positivUtvaljning) lagg(n, "R1");
    }

    if (ts.isIfStatement(n) && allaTester(n.expression, v).length > 0) {
      if (n.elseStatement) lagg(n, "R2");
      else if (arUtgang(n.thenStatement)) {
        if (uteslutning(n.expression, v)) lagg(n, "R3");
      } else if (ochKedjaMed(n.expression, v, "inte")) {
        lagg(n, "R4");
      }
    }

    if (
      ts.isCallExpression(n)
      && ts.isPropertyAccessExpression(n.expression)
      && FILTERMETODER.has(n.expression.name.text)
    ) {
      const cb = n.arguments[0];
      if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb))) {
        let kropp: ts.Expression | undefined;
        if (ts.isBlock(cb.body)) {
          const enda = cb.body.statements.length === 1 ? cb.body.statements[0] : undefined;
          if (enda && ts.isReturnStatement(enda)) kropp = enda.expression;
        } else {
          kropp = cb.body;
        }
        if (kropp && ochKedjaMed(kropp, v, "inte")) lagg(n, "R5");
      }
    }

    if (ts.isSwitchStatement(n) && arLeverantorsvarde(n.expression, v) && !harAssertNeverIDefault(n)) {
      lagg(n, "R6");
    }

    ts.forEachChild(n, besok);
  };
  besok(fil);
  return fynd;
}

/** Produktionskoden som granskas: alla .ts och .tsx under app/, lib/ och scripts/, utom tester. */
function filerAttGranska(): string[] {
  const ut = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", "app", "lib", "scripts"],
    { cwd: ROT, encoding: "utf8" },
  );
  return ut
    .split("\n")
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith(".d.ts"));
}

describe("grinden själv — varje regel fäller, och bara den", () => {
  const regler = (text: string) => granska(text).map((f) => f.regel);

  it("R1: ?: med två riktiga grenar fälls, en positiv utväljning gör det inte", () => {
    expect(regler(`const s = kalla.leverantor === "aosom" ? aosomStatus(m) : aeStatus(s);`)).toEqual(["R1"]);
    expect(regler(`const s = isAliExpressMapping(m) ? AE : ANNAN;`)).toEqual(["R1"]);
    expect(regler(`const h = rad && kalla.leverantor === "aosom" ? kalla.artikelnummer : undefined;`)).toEqual([]);
    expect(regler(`const u = !isAosomMapping(m) ? null : lank(m);`)).toEqual([]);
  });

  it("R2: if/else på en leverantörstest fälls", () => {
    expect(regler(`if (mappingSupplier(m) === "aosom") { a(); } else { b(); }`)).toEqual(["R2"]);
    expect(regler(`if (isAosomMapping(m)) a(); else if (x) b();`)).toEqual(["R2"]);
  });

  it("R3: en uteslutning fälls, ett positivt filter gör det inte", () => {
    expect(regler(`for (const m of l) { if (isAliExpressMapping(m)) continue; aosom(m); }`)).toEqual(["R3"]);
    expect(regler(`for (const m of l) { if (isAliExpressMapping(m)) { n++; continue; } }`)).toEqual(["R3"]);
    expect(regler(`l.filter((m) => { if (isAliExpressMapping(m)) return false; return true; });`)).toEqual(["R3"]);
    expect(regler(`for (const m of l) { if (isAliExpressMapping(m) || x) continue; }`)).toEqual(["R3"]);
    expect(regler(`for (const m of l) { if (!isAosomMapping(m)) continue; aosom(m); }`)).toEqual([]);
    expect(regler(`for (const m of l) { if (!isAosomMapping(m) || m.x) continue; }`)).toEqual([]);
    expect(regler(`for (const m of l) { if (mappingSupplier(m) !== "aosom") continue; }`)).toEqual([]);
  });

  it("R4: allt utom X som gör något fälls, bara X som gör något gör det inte", () => {
    expect(regler(`if (!isAosomMapping(m)) { aliexpress(m); }`)).toEqual(["R4"]);
    expect(regler(`if (m.supplier !== "aosom") synkaAe(m);`)).toEqual(["R4"]);
    expect(regler(`if (m && isAliExpressMapping(m)) { synk.set(id, x); }`)).toEqual([]);
  });

  it("R5: ett negativt filter fälls, ett positivt gör det inte", () => {
    expect(regler(`const a = l.filter((m) => !isAliExpressMapping(m));`)).toEqual(["R5"]);
    expect(regler(`const a = l.filter((m) => mappingSupplier(m) !== "aliexpress");`)).toEqual(["R5"]);
    expect(regler(`const a = l.filter((m) => isAosomMapping(m));`)).toEqual([]);
    expect(regler(`const a = l.filter((m) => m.supplier === "aosom" && m.x);`)).toEqual([]);
    expect(regler(`const n = l.filter((x) => x.leverantor === "aosom").length;`)).toEqual([]);
  });

  it("R6: ett switch på en leverantör kräver assertNever i default", () => {
    expect(regler(`switch (mappingSupplier(m)) { case "aosom": a(); break; }`)).toEqual(["R6"]);
    expect(regler(`const l = mappingSupplier(m); switch (l) { case "aosom": break; default: break; }`)).toEqual(["R6"]);
    expect(regler(`const l = mappingSupplier(m); switch (l) { case "aosom": break; default: assertNever(l); }`)).toEqual([]);
  });

  it("följer en boolesk variabel som bär en leverantörstest", () => {
    expect(regler(`const aosomByte = !!m && mappingSupplier(m) === "aosom"; const x = aosomByte ? a : b;`)).toEqual(["R1"]);
    expect(regler(`const aosomByte = !!m && mappingSupplier(m) === "aosom"; if (aosomByte) { a(); }`)).toEqual([]);
  });

  it("snubblar inte på strängar som inte är en leverantör", () => {
    expect(regler(`const k = s === "aliexpress" ? 1 : 2;`)).toEqual([]); // s är ingen leverantör
    expect(regler(`if (r.source === "aosom") a(); else b();`)).toEqual([]); // recensionens källa
    expect(regler(`if (omfang === "aosom") { a(); } else { b(); }`)).toEqual([]);
  });
});

/**
 * Dokumenterade undantag: ett positivt filter som är skrivet som if/else eller
 * som ett hinder. Varje undantag har ett skäl. Nyckeln är filen och radens
 * början, inte radnumret, så att undantaget följer med när koden flyttas. Ett
 * undantag som inte längre matchar något fäller testet, så listan kan inte
 * bli gammal.
 */
const UNDANTAG: ReadonlyArray<{ fil: string; utdrag: string; skal: string }> = [
  {
    fil: "lib/aosom/livsbild.ts",
    utdrag: "if (!rad || !isAosomMapping(rad)) {",
    skal: "avvisar allt som inte är Aosom och loggar bara; else-grenen är Aosom-arbete",
  },
  {
    fil: "lib/aosom/sammanslagning.ts",
    utdrag: 'if (dm.supplier !== "aosom") hindra("utkast_ej_aosom");',
    skal: "ett hinder för allt utom Aosom, alltså ett positivt filter",
  },
];

function fyndIProduktionen(): Array<{ fil: string; f: Fynd }> {
  const ut: Array<{ fil: string; f: Fynd }> = [];
  for (const fil of filerAttGranska()) {
    const text = readFileSync(join(ROT, fil), "utf8");
    // Billig förgallring: filer som inte nämner något leverantörsord kan inte ge fynd.
    if (!/isAosomMapping|isAliExpressMapping|mappingSupplier|supplier|leverantor/.test(text)) continue;
    for (const f of granska(text, fil)) ut.push({ fil, f });
  }
  return ut;
}

const arUndantag = (fil: string, f: Fynd) => UNDANTAG.some((u) => u.fil === fil && f.utdrag.startsWith(u.utdrag));

describe("☠️ koden väljer aldrig mellan leverantörer med två grenar", () => {
  it("inga fynd i produktionskoden utom de dokumenterade undantagen", () => {
    const fynd = fyndIProduktionen()
      .filter(({ fil, f }) => !arUndantag(fil, f))
      .map(({ fil, f }) => `${fil}:${f.rad} ${f.regel} ${f.utdrag}`);
    expect(fynd).toEqual([]);
  });

  it("varje undantag matchar fortfarande kod — annars ska det bort ur listan", () => {
    const alla = fyndIProduktionen();
    const gamla = UNDANTAG.filter((u) => !alla.some(({ fil, f }) => fil === u.fil && f.utdrag.startsWith(u.utdrag)));
    expect(gamla.map((u) => `${u.fil}: ${u.utdrag}`)).toEqual([]);
  });

  it("granskar faktiskt koden — de kända spärrarna finns i filerna den läser", () => {
    // En grind som inte läser något hittar inget. Kontrollen åt andra hållet.
    const filer = new Set(filerAttGranska());
    for (const f of ["lib/pricing/konkurrentpris-plan.ts", "lib/restock/rader.ts", "lib/orders/place-order.ts", "lib/aosom/remap.ts"]) {
      expect(filer.has(f)).toBe(true);
    }
  });
});
