// Mina sidor och företagsdelen, snabbare (Leonard 2026-11-15: "klicka på mina
// sidor och hoppa till mina sidor för företag, det känns trögt"). Proven håller
// ihop det som gör sidan snabb och det som skyddar den:
//   - sidans ram och en skiss går iväg direkt, innehållet strömmar in efter;
//   - kontots frågor till Wix startar samtidigt, inte en i taget;
//   - ordrarnas bilder frågas på sina id i stället för att vänta in katalogen;
//   - orderliggaren som lästs i förväg används bara när e-posten är kontots;
//   - länkarna in i kontot och profilbytet laddar inte om hela sidan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const rot = new URL("../", import.meta.url);
const las = (fil: string) => readFileSync(new URL(fil, rot), "utf8");

test("Mina sidor: skissen först, innehållet strömmar in", () => {
  const s = las("app/konto/page.tsx");
  assert.match(s, /<Suspense fallback=\{<MinaSidorSkelett \/>\}>\s*<MinaSidorInnehall session=\{session\} sp=\{sp\} \/>\s*<\/Suspense>/);
  assert.match(las("app/konto/mina-sidor.tsx"), /export function MinaSidorSkelett\(\)/);
  // Ett ankare (/konto#foretag) finns först när innehållet kommit.
  assert.match(s, /<TillAnkaret \/>/);
});

test("Mina sidor: företaget, korgarna och prisväxeln frågas innan medlemsraden är läst", () => {
  const s = las("app/konto/page.tsx");
  const inne = s.slice(s.indexOf("async function MinaSidorInnehall"));
  const forst = inne.indexOf("await minaSidor(");
  assert.ok(forst > 0, "minaSidor läses i MinaSidorInnehall");
  for (const start of ["hamtaForetagsprofil(session.sub)", "sparadeKorgarFor(session.sub)", "prisLage()"]) {
    const var_ = inne.indexOf(start);
    assert.ok(var_ > 0 && var_ < forst, `${start} startar före minaSidor`);
  }
  // Delarna tar emot löften som redan går, och frågar inte själva igen.
  assert.match(inne, /foretagsdel\(data\.medlem, session\.profil, profilP, lageP\)/);
  assert.match(inne, /sparade\(data\.medlem, korgarP, lageP\)/);
  const delar = s.slice(0, s.indexOf("export default async function Konto"));
  assert.doesNotMatch(delar, /await Promise\.all\(\[(sparadeKorgarFor|hamtaForetagsprofil)\(/);
  // Sessionens e-post följer med, så att orderliggaren kan läsas samtidigt.
  assert.match(inne, /minaSidor\(session\.sub, session\.email\)/);
});

test("Mina sidor: ordrarnas bilder på sina id, aldrig väntan på hela katalogen", () => {
  const s = las("app/konto/page.tsx");
  assert.match(s, /katalogenLaddad\(\) \? getProducts\(\) : getProdukterForId\(\[\.\.\.idn\]\)/);
  const p = las("lib/products.ts");
  assert.match(p, /export async function getProdukterForId\(idn: readonly string\[\]\): Promise<Product\[\]>/);
  assert.match(p, /\.in\("_id", idn\.slice\(0, MAX_SLUGGAR_PER_UPPSLAG\)\)/);
});

test("orderliggaren som lästs i förväg används bara när e-posten är kontots", () => {
  const s = las("lib/medlem/konto.ts");
  const f = s.slice(s.indexOf("export async function minaSidor"));
  // Läsningen startar före medlemsraden …
  const forhand = f.indexOf("liggarraderForEpost(epost)");
  assert.ok(forhand > 0 && forhand < f.indexOf("hamtaMedlem(medlemsId)"), "orderliggaren läses i förväg");
  // … men ett annat konto, eller en spärrad medlem, får aldrig dess rader.
  assert.match(f, /if \(!medlem \|\| medlem\.status !== "aktiv"\) return null;/);
  assert.match(f, /const rader = forhand && medlem\.epost === epost \? await forhand : await liggarraderForEpost\(medlem\.epost\);/);
  assert.ok(f.indexOf('medlem.status !== "aktiv"') < f.indexOf("await forhand"), "spärren kommer före raderna");
});

test("vägen till företaget: kakan först, sedan växeln, medlemmen och företaget på en gång", () => {
  const s = las("app/konto/foretag/page.tsx");
  assert.match(s, /const session = await inloggad\(\);\s*const \[lage, medlem, profil\] = await Promise\.all\(\[/);
  assert.match(s, /session \? hamtaMedlem\(session\.sub\) : null,\s*session \? hamtaForetagsprofil\(session\.sub\) : null,/);
});

test("länkarna in i kontot är mjuka och förhämtas inte", () => {
  for (const fil of ["components/konto-lank.tsx", "app/konto/kontotyp.tsx", "components/profil-remsa.tsx", "app/konto/foretag-start.tsx"]) {
    const s = las(fil);
    assert.match(s, /import Link from "next\/link";/, fil);
    assert.doesNotMatch(s, /<a\b[^>]*href=\{?["'`](\/konto|\{FORETAGSVAG\})/, `${fil}: ingen vanlig <a> in i kontot`);
    // Knappen och raderna syns på varje sida: ingen förhämtning av en privat, dynamisk sida.
    const lankar = s.match(/<Link\b[^>]*>/g) ?? [];
    assert.ok(lankar.length > 0, fil);
    for (const l of lankar) assert.match(l, /prefetch=\{false\}/, `${fil}: ${l}`);
  }
});

test("företagsvägen efter inloggningen byter sida mjukt", () => {
  const s = las("app/konto/foretag-start.tsx");
  assert.match(s, /router\.push\(utvag\(nasta\)\)/);
  assert.doesNotMatch(s, /window\.location\.assign\(/);
});

test("profilbytet hämtar inte om sidan: valet och raden syns direkt, knapparna släpps när rutten svarat", () => {
  const s = las("app/konto/foretag.tsx");
  const p = s.slice(s.indexOf("function Profilval"), s.indexOf("function Profilval") + 1500);
  assert.match(p, /setVald\(till\);/);
  // Knapparna släpps när rutten svarat, inte när en omhämtning av sidan kommit tillbaka.
  assert.match(p, /const svar = await skicka\("\/api\/konto\/profil", \{ profil: till \}\);\s*setUpptagen\(false\);/);
  assert.match(p, /if \(svar\.ok\) \{\s*window\.dispatchEvent\(new Event\("fp-konto-andrat"\)\);\s*return;/);
  assert.doesNotMatch(p, /router\./);
  assert.doesNotMatch(p, /window\.location\.reload\(\)/);
  // Misslyckas bytet står det förra valet kvar (inte serverns, som kan vara äldre än förra bytet).
  assert.match(p, /const forra = vald;/);
  assert.match(p, /setVald\(forra\);/);
  assert.match(p, /aria-checked=\{vald === "privat"\}/);
  // Ritas sidan om (en navigering) börjar valet om från serverns besked.
  assert.match(s, /<Profilval key=\{aktivProfil\} /);
  // Remsan överst läser om tecknet på samma händelse.
  assert.match(las("components/profil-remsa.tsx"), /window\.addEventListener\("fp-konto-andrat", andrat\)/);
});

test("raden \"Du handlar som\" följer tecknet, och servern ger namnet bara när kontot får handla som företaget", () => {
  const h = las("app/konto/handlar-som.tsx");
  assert.match(h, /^"use client";/);
  assert.match(h, /window\.addEventListener\("fp-konto-andrat", andrat\)/);
  assert.match(h, /useSyncExternalStore\(prenumerera, foretagstecken, \(\) => foretagNu\)/);
  assert.match(h, /if \(!namn \|\| !foretag\) return null;/);
  const m = las("app/konto/mina-sidor.tsx");
  assert.match(m, /<HandlarSom namn=\{foretagNamn\} foretagNu=\{handlarSomForetag\} \/>/);
  assert.doesNotMatch(m, /Du handlar som <a/, "raden ritas av klientkomponenten, inte av servern");
  const sida = las("app/konto/page.tsx");
  assert.match(sida, /foretagNamn: fp && kanHandlaSomForetag\(fp\) \? fp\.namn : null,/);
  assert.match(sida, /handlarSomForetag: aktiv === "foretag",/);
});

test("ingen router.refresh() i kontots kod: på Mina sidor fastnar den ibland i Next 16.2 (vercel/next.js#86055)", () => {
  // En omhämtning av en sida med en Suspense-gräns fastnade på förhandsbygget
  // i 2–5 av 12 byten (2026-11-15): svaret kom fram men sidan byttes aldrig ut.
  const filer = readdirSync(new URL("app/konto/", rot), { recursive: true })
    .map(String)
    .filter((f) => /\.(tsx|ts)$/.test(f));
  assert.ok(filer.length > 10, "kontots filer hittades");
  for (const f of filer) {
    const kod = las(`app/konto/${f}`)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(kod, /\.refresh\(\)/, `app/konto/${f}`);
  }
});

test("de sparade korgarna uppdateras i webbläsaren: den nya först, borttagna bort, inga dubbletter", async () => {
  const { synligaKorgar } = await import("./medlem/sparade.ts");
  const k = (id: string) => ({ id, namn: id, antalVaror: 1, forsta: [], skapad: "2026-11-15T10:00:00.000Z" });
  const server = [k("b"), k("a")];
  assert.deepEqual(synligaKorgar(server, [], new Set()).map((x) => x.id), ["b", "a"]);
  assert.deepEqual(synligaKorgar(server, [k("c")], new Set()).map((x) => x.id), ["c", "b", "a"]);
  assert.deepEqual(synligaKorgar(server, [k("c")], new Set(["b"])).map((x) => x.id), ["c", "a"]);
  // Efter en ny ritning finns den nya korgen också i serverns lista: en gång.
  assert.deepEqual(synligaKorgar([k("c"), ...server], [k("c")], new Set()).map((x) => x.id), ["c", "b", "a"]);
  const c = las("app/konto/sparade-korgar.tsx");
  assert.match(c, /if \(ny\) setTillagda\(\(t\) => \[ny, \.\.\.t\]\);/);
  assert.match(c, /setBorttagna\(\(b\) => new Set\(b\)\.add\(id\)\);/);
  assert.match(c, /const korgar = synligaKorgar\(franServern, tillagda, borttagna\);/);
  // Rutten svarar med den sparade korgen.
  assert.match(las("app/api/konto/sparade/route.ts"), /return svar\(\{ ok: true, korg: sparadKorgVy\(k\) \}\);/);
});
