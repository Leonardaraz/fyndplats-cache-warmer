// Run: node --test --experimental-strip-types lib/wix-lager.test.ts
//
// Butikens tabeller i Wix, mot ett Wix Data i minnet som lyder samma regler som
// det riktiga (uppmätt 2026-10-29): insert vägrar ett id som finns (WDE0074),
// en villkorad patch eller borttagning förlorar med 428 WDE0193, en saknad rad
// är 404 WDE0073, och `$exists: false` matchar INTE ett fält som är null.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  K,
  __sattDatalagerForTester,
  __sattVantaForTester,
  andringar,
  datalager,
  fraktmejlKo,
  kundvagnMejl,
  kundvagnar,
  leveransnotiser,
  nyhetsbrev,
  ordrar,
  prishistorik,
  sparning,
  taLas,
  utanTomma,
  wixNyckel,
  TABELLER,
} from "./wix-lager.ts";

type Rad = Record<string, unknown>;

// ── Wix Data i minnet ───────────────────────────────────────────────────────

const data = new Map<string, Map<string, Rad>>();
const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
let fel: { sokvag: RegExp; status: number; text: string; ganger: number } | null = null;
let anrop = 0;

function varde(rad: Rad, falt: string): unknown {
  return rad[falt];
}

function matchar(rad: Rad, filter: Rad): boolean {
  for (const [f, v] of Object.entries(filter)) {
    if (f === "$and") {
      if (!(v as Rad[]).every((x) => matchar(rad, x))) return false;
      continue;
    }
    if (f === "$or") {
      if (!(v as Rad[]).some((x) => matchar(rad, x))) return false;
      continue;
    }
    const finns = Object.prototype.hasOwnProperty.call(rad, f);
    const r = varde(rad, f);
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      for (const [op, x] of Object.entries(v as Rad)) {
        if (op === "$exists") {
          // ☠️ Som riktiga Wix: ett fält som är null FINNS.
          if (finns !== x) return false;
        } else if (op === "$ne") {
          if (finns && r === x) return false;
        } else if (op === "$eq") {
          if (r !== x) return false;
        } else if (op === "$in") {
          if (!(x as unknown[]).includes(r)) return false;
        } else {
          if (!finns || r == null) return false;
          const a = r as string | number;
          const b = x as string | number;
          if (op === "$lt" && !(a < b)) return false;
          if (op === "$lte" && !(a <= b)) return false;
          if (op === "$gt" && !(a > b)) return false;
          if (op === "$gte" && !(a >= b)) return false;
        }
      }
    } else if (r !== v) return false;
  }
  return true;
}

function svar(status: number, body: unknown): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { ok: status < 400, status, text: async () => text, headers: new Headers() } as Response;
}

async function fejkFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  anrop++;
  const u = new URL(String(url));
  const sokvag = u.pathname.replace("/data/v2", "");
  if (fel && fel.sokvag.test(sokvag) && fel.ganger > 0) {
    fel.ganger--;
    return svar(fel.status, fel.text);
  }
  const metod = init?.method ?? "GET";
  const kropp = init?.body ? (JSON.parse(String(init.body)) as Rad) : {};
  const k = String(u.searchParams.get("dataCollectionId") ?? kropp.dataCollectionId ?? "");
  const idIStig = sokvag.startsWith("/items/") ? decodeURIComponent(sokvag.slice("/items/".length)) : null;

  if (metod === "GET" && idIStig) {
    const r = kol(k).get(idIStig);
    return r ? svar(200, { dataItem: { data: { ...r } } }) : svar(404, { message: "WDE0073: Item does not exist" });
  }
  if (metod === "POST" && sokvag === "/items") {
    const item = kropp.dataItem as { id: string; data: Rad };
    if (kol(k).has(item.id)) return svar(409, { message: "WDE0074: WD_ITEM_ALREADY_EXISTS" });
    kol(k).set(item.id, { ...item.data, _id: item.id });
    return svar(200, { dataItem: { data: kol(k).get(item.id) } });
  }
  if (metod === "POST" && sokvag === "/items/save") {
    const item = kropp.dataItem as { id: string; data: Rad };
    kol(k).set(item.id, { ...item.data, _id: item.id });
    return svar(200, {});
  }
  if (metod === "POST" && sokvag === "/items/query") {
    const q = kropp.query as { filter?: Rad; sort?: { fieldName: string; order: string }[]; cursorPaging?: { limit: number; cursor?: string } };
    const fran = q.cursorPaging?.cursor ? JSON.parse(q.cursorPaging.cursor) : { start: 0, filter: q.filter ?? {}, sort: q.sort ?? [] };
    let rader = [...kol(k).values()].filter((r) => matchar(r, fran.filter));
    for (const s of [...fran.sort].reverse() as { fieldName: string; order: string }[]) {
      rader = rader.sort((a, b) => {
        const x = a[s.fieldName] as string;
        const y = b[s.fieldName] as string;
        const c = x < y ? -1 : x > y ? 1 : 0;
        return s.order === "DESC" ? -c : c;
      });
    }
    const limit = q.cursorPaging?.limit ?? 50;
    const sida = rader.slice(fran.start, fran.start + limit);
    const nasta = fran.start + limit < rader.length ? JSON.stringify({ ...fran, start: fran.start + limit }) : null;
    return svar(200, { dataItems: sida.map((d) => ({ data: { ...d } })), pagingMetadata: { cursors: { next: nasta } } });
  }
  if (metod === "POST" && sokvag === "/items/count") {
    return svar(200, { totalCount: [...kol(k).values()].filter((r) => matchar(r, (kropp.filter as Rad) ?? {})).length });
  }
  if (metod === "PATCH" && idIStig) {
    const r = kol(k).get(idIStig);
    if (!r) return svar(404, { message: "WDE0073" });
    const villkor = (kropp.condition as { filter?: Rad } | undefined)?.filter;
    if (villkor && !matchar(r, villkor)) return svar(428, { message: "WDE0193: condition not met" });
    const mods = (kropp.patch as { fieldModifications: { action: string; fieldPath: string; setFieldOptions?: { value: unknown } }[] }).fieldModifications;
    for (const m of mods) {
      if (m.action === "SET_FIELD") r[m.fieldPath] = m.setFieldOptions?.value;
      else delete r[m.fieldPath];
    }
    return svar(200, { dataItem: { data: { ...r } } });
  }
  if (metod === "DELETE" && idIStig) {
    const r = kol(k).get(idIStig);
    if (!r) return svar(404, { message: "WDE0073" });
    const villkor = (kropp.condition as { filter?: Rad } | undefined)?.filter;
    if (villkor && !matchar(r, villkor)) return svar(428, { message: "WDE0193" });
    kol(k).delete(idIStig);
    return svar(200, {});
  }
  if (metod === "POST" && sokvag === "/bulk/items/save") {
    const items = kropp.dataItems as { id: string; data: Rad }[];
    for (const it of items) kol(k).set(it.id, { ...it.data, _id: it.id });
    return svar(200, { results: items.map((it, i) => ({ itemMetadata: { id: it.id, originalIndex: i, success: true } })), bulkActionMetadata: {} });
  }
  if (metod === "POST" && sokvag === "/bulk/items/remove") {
    const idn = kropp.dataItemIds as string[];
    return svar(200, { results: idn.map((id) => ({ itemMetadata: { id, success: kol(k).delete(id) } })) });
  }
  return svar(400, { message: `okänt anrop ${metod} ${sokvag}` });
}

beforeEach(() => {
  data.clear();
  fel = null;
  anrop = 0;
  process.env.WIX_API_KEY = "nyckel";
  process.env.WIX_SITE_ID = "sajt";
  globalThis.fetch = fejkFetch as typeof fetch;
  __sattVantaForTester(async () => {});
  __sattDatalagerForTester(null);
});

// ── Nycklar och fält ────────────────────────────────────────────────────────

test("wixNyckel: en vanlig nyckel är sig själv, allt annat blir samma hash varje gång", () => {
  assert.equal(wixNyckel("cancel:9f1c-22"), "cancel:9f1c-22");
  assert.equal(wixNyckel("kund+a@exempel.se"), "kund+a@exempel.se");
  const medMellanslag = wixNyckel("refund:10079:199 kr");
  assert.match(medMellanslag, /^h:[0-9a-f]{64}$/);
  assert.equal(wixNyckel("refund:10079:199 kr"), medMellanslag);
  assert.match(wixNyckel("åsa@exempel.se"), /^h:/);
  assert.match(wixNyckel("x".repeat(129)), /^h:/);
  // En nyckel som ser ut som en hash får inte krocka med en.
  assert.match(wixNyckel("h:abc"), /^h:[0-9a-f]{64}$/);
});

test("☠️ utanTomma och andringar skriver aldrig null — `$exists: false` matchar inte null", () => {
  assert.deepEqual(utanTomma({ a: 1, b: null, c: undefined, d: "" }), { a: 1, d: "" });
  assert.deepEqual(andringar({ status: "x", sentAt: null }), [
    { action: "SET_FIELD", fieldPath: "status", setFieldOptions: { value: "x" } },
    { action: "REMOVE_FIELD", fieldPath: "sentAt" },
  ]);
});

// ── Växeln ──────────────────────────────────────────────────────────────────

test("växeln: utan rad Postgres, med rad Wix, och läses högst en gång i minuten", async () => {
  assert.equal(await datalager(1_000_000), "postgres");
  kol(K.installningar).set("datalager", { _id: "datalager", lager: "wix" });
  assert.equal(await datalager(1_000_000 + 30_000), "postgres", "cachad i en minut");
  assert.equal(await datalager(1_000_000 + 61_000), "wix");
});

test("☠️ växeln: ett läsfel ger senast kända lager, och vid en kallstart Postgres", async () => {
  kol(K.installningar).set("datalager", { _id: "datalager", lager: "wix" });
  assert.equal(await datalager(5_000_000), "wix");
  fel = { sokvag: /items\/datalager/, status: 500, text: "{}", ganger: 99 };
  assert.equal(await datalager(5_000_000 + 61_000), "wix");
  __sattDatalagerForTester(null); // kallstart: ingen cache
  assert.equal(await datalager(6_000_000), "postgres");
});

// ── Kundvagnar ──────────────────────────────────────────────────────────────

const vagn = (id: string, email = "kund@exempel.se", nextStepAt = "2026-10-29T10:00:00.000Z") => ({
  id,
  email,
  phone: null,
  shippingAddrHash: null,
  items: [{ name: "Stol", quantity: 1, priceMinor: 49900 }],
  subtotalMinor: 49900,
  currency: "SEK",
  recoverUrl: null,
  abandonedAt: "2026-10-29T09:00:00.000Z",
  nextStepAt,
});

test("kundvagnar: en vagn skapas en gång, och null-fält skrivs inte", async () => {
  assert.equal(await kundvagnar.skapa(vagn("c1")), true);
  assert.equal(await kundvagnar.skapa(vagn("c1")), false);
  const rad = kol(K.kundvagnar).get("c1")!;
  assert.equal("phone" in rad, false);
  assert.equal(rad.emailLower, "kund@exempel.se");
});

test("kundvagnar: konvertera tar bara en väntande vagn och lämnar rabattens id", async () => {
  await kundvagnar.skapa(vagn("c1"));
  await kundvagnar.uppdatera("c1", { discountCode: "FP5", discountCodeWixId: "w1" });
  assert.deepEqual(await kundvagnar.konvertera("c1"), { konverterad: true, rabattWixId: "w1" });
  assert.deepEqual(await kundvagnar.konvertera("c1"), { konverterad: false, rabattWixId: null });
  assert.deepEqual(await kundvagnar.konvertera("saknas"), { konverterad: false, rabattWixId: null });
});

test("kundvagnar: konvertera på e-post tar alla kundens väntande vagnar", async () => {
  await kundvagnar.skapa(vagn("c1", "kund@exempel.se"));
  await kundvagnar.skapa(vagn("c2", "kund@exempel.se"));
  await kundvagnar.skapa(vagn("c3", "annan@exempel.se"));
  await kundvagnar.uppdatera("c2", { discountCodeWixId: "w2" });
  const u = await kundvagnar.konverteraForEpost("kund@exempel.se");
  assert.equal(u.antal, 2);
  assert.deepEqual(u.rabattWixIdn, ["w2"]);
  assert.equal(kol(K.kundvagnar).get("c3")!.status, "pending");
});

test("kundvagnar: förfallna är väntande med passerad tid, äldst först, i CartRow-form", async () => {
  await kundvagnar.skapa(vagn("sen", undefined, "2026-10-29T12:00:00.000Z"));
  await kundvagnar.skapa(vagn("tidig", undefined, "2026-10-29T08:00:00.000Z"));
  await kundvagnar.skapa(vagn("framtid", undefined, "2026-10-30T08:00:00.000Z"));
  await kundvagnar.skapa(vagn("klar", undefined, "2026-10-29T07:00:00.000Z"));
  await kundvagnar.uppdatera("klar", { status: "done" });
  const due = await kundvagnar.forfallna("2026-10-29T13:00:00.000Z", 25);
  assert.deepEqual(due.map((c) => c.id), ["tidig", "sen"]);
  assert.equal(due[0].next_step, 1);
  assert.equal(due[0].subtotal_minor, 49900);
  assert.equal(due[0].phone, null);
});

test("kundvagnsmejl: ett steg loggas en gång, och spärren ser andra vagnar men inte sin egen", async () => {
  await kundvagnMejl.logga({ cartId: "c1", step: 1, resendId: "r1", email: "Kund@Exempel.se" });
  await kundvagnMejl.logga({ cartId: "c1", step: 1, resendId: "r2", email: "kund@exempel.se" });
  assert.equal(kol(K.kundvagnMejl).size, 1);
  const sedan = "2026-01-01T00:00:00.000Z";
  assert.equal(await kundvagnMejl.nyligen("kund@exempel.se", sedan), true);
  assert.equal(await kundvagnMejl.nyligen("kund@exempel.se", sedan, "c1"), false);
  assert.equal(await kundvagnMejl.nyligen("kund@exempel.se", sedan, "c9"), true);
  assert.equal(await kundvagnMejl.nyligen("kund@exempel.se", "2099-01-01T00:00:00.000Z"), false);
});

// ── Spårning ────────────────────────────────────────────────────────────────

const paket = (tn: string, orderId: string | null = "o1") => ({
  trackingNumber: tn,
  orderId,
  customerEmail: "kund@exempel.se",
  customerName: "Kund",
  customerPhone: null,
  status: "in_transit",
});

test("spårning: ett nummer skapas en gång, och markeraLevererad behåller första tiden", async () => {
  assert.equal(await sparning.skapa(paket("LP1")), true);
  assert.equal(await sparning.skapa(paket("LP1")), false);
  await sparning.markeraLevererad("LP1");
  const forsta = kol(K.sparning).get("LP1")!.levereradAt;
  assert.ok(forsta);
  await sparning.markeraLevererad("LP1");
  assert.equal(kol(K.sparning).get("LP1")!.levereradAt, forsta);
  assert.equal((await sparning.hamta("LP1"))!.status, "delivered");
});

test("spårning: ett nummer i karantän rörs inte av markeraLevererad och räknas inte i ordern", async () => {
  await sparning.skapa(paket("LP1"));
  await sparning.skapa(paket("LP2"));
  await sparning.sattStatus("LP2", "ambiguous");
  await sparning.markeraLevererad("LP2");
  assert.equal(kol(K.sparning).get("LP2")!.status, "ambiguous");
  assert.deepEqual((await sparning.forOrder("o1")).map((p) => p.tracking_number), ["LP1"]);
});

test("spårning: svepet tar bara paket med order", async () => {
  await sparning.skapa(paket("LP1", "o1"));
  await sparning.skapa(paket("LP2", null));
  const svep = await sparning.forSvep("2000-01-01T00:00:00.000Z");
  assert.deepEqual(svep.map((p) => p.tracking_number), ["LP1"]);
});

test("leveransnotiser: ett anspråk per nummer och status, och medStatus läser nycklar", async () => {
  assert.equal(await leveransnotiser.ansprak("LP1", "delivered", "17track", null), true);
  assert.equal(await leveransnotiser.ansprak("LP1", "delivered", "sms", null), false);
  assert.equal(await leveransnotiser.ansprak("LP1", "out_for_delivery", "17track", null), true);
  await leveransnotiser.ansprak("order:o1", "delivered", "order", null);
  assert.deepEqual([...(await leveransnotiser.medStatus(["LP1", "LP2", "order:o1"], "delivered"))].sort(), ["LP1", "order:o1"]);
  await leveransnotiser.slapp("LP1", "delivered");
  assert.equal(await leveransnotiser.finns("LP1", "delivered"), false);
});

// ── Nyhetsbrev ──────────────────────────────────────────────────────────────

test("nyhetsbrev: en ny adress är ny, en gammal behåller sin källa, och avregistrering skapar raden om den saknas", async () => {
  assert.deepEqual(await nyhetsbrev.prenumerera("kund@exempel.se", "sidfot", true), { already: false });
  assert.deepEqual(await nyhetsbrev.prenumerera("kund@exempel.se", "popup", true), { already: true });
  assert.equal(kol(K.nyhetsbrev).get("kund@exempel.se")!.source, "sidfot");
  await nyhetsbrev.avregistrera("ny@exempel.se");
  assert.equal(await nyhetsbrev.arAvregistrerad("ny@exempel.se"), true);
  assert.equal(kol(K.nyhetsbrev).get("ny@exempel.se")!.consent, false);
  await nyhetsbrev.avregistrera("kund@exempel.se");
  assert.equal(await nyhetsbrev.arAvregistrerad("kund@exempel.se"), true);
  assert.equal(await nyhetsbrev.raknaPrenumeranter(), 0);
});

// ── Fraktmejlskön ───────────────────────────────────────────────────────────

const sandning = (tn: string) => ({ trackingNumber: tn, carrier: "DPD", lineItems: [{ name: "Säng", quantity: 1 }] });

test("fraktmejlskön: allt väntande tas en gång, och ett släppt nummer går att ta igen", async () => {
  await fraktmejlKo.koa("o1", sandning("B2"));
  await fraktmejlKo.koa("o1", sandning("A1"));
  await fraktmejlKo.koa("o1", sandning("A1"));
  await fraktmejlKo.koa("o2", sandning("C3"));
  const forsta = await fraktmejlKo.taVantande("o1");
  assert.deepEqual(forsta.map((s) => s.trackingNumber), ["A1", "B2"]);
  assert.deepEqual(await fraktmejlKo.taVantande("o1"), []);
  // ☠️ Släppet tar bort fältet: ett null hade gjort numret otagbart för alltid.
  await fraktmejlKo.slapp("A1");
  assert.equal("sentAt" in kol(K.fraktmejlKo).get("A1")!, false);
  assert.deepEqual((await fraktmejlKo.taVantande("o1")).map((s) => s.trackingNumber), ["A1"]);
});

test("☠️ fraktmejlskön: medan en annan instans tar orderns nummer får nästa ingenting", async () => {
  // Postgres tog alla nummer i EN sats. Utan låset hade två samtidiga anrop
  // kunnat ta ett nummer var, och kunden fått två mejl.
  for (const tn of ["A1", "B2", "C3"]) await fraktmejlKo.koa("o1", sandning(tn));
  const annan = await taLas("fraktmejl__o1");
  assert.ok(annan);
  assert.deepEqual(await fraktmejlKo.taVantande("o1"), []);
  assert.equal([...kol(K.fraktmejlKo).values()].filter((r) => "sentAt" in r).length, 0);
});

test("fraktmejlskön: låset är släppt efter ett anrop, också när inget fanns att ta", async () => {
  await fraktmejlKo.taVantande("o1");
  await fraktmejlKo.koa("o1", sandning("A1"));
  assert.equal((await fraktmejlKo.taVantande("o1")).length, 1);
  assert.equal(kol(K.las).size, 0);
});

test("fraktmejlskön: ett lås som en död instans lämnat tas över när det är gammalt", async () => {
  const t0 = Date.parse("2026-10-29T10:00:00.000Z");
  assert.ok(await taLas("x", t0));
  assert.equal(await taLas("x", t0 + 5_000), null);
  assert.ok(await taLas("x", t0 + 61_000));
});

test("fraktmejlskön: ordrar som väntat, äldst först och utan dubbletter", async () => {
  kol(K.fraktmejlKo).set("A", { _id: "A", trackingNumber: "A", orderGuid: "o1", queuedAt: "2026-10-29T08:00:00.000Z" });
  kol(K.fraktmejlKo).set("B", { _id: "B", trackingNumber: "B", orderGuid: "o2", queuedAt: "2026-10-29T07:00:00.000Z" });
  kol(K.fraktmejlKo).set("C", { _id: "C", trackingNumber: "C", orderGuid: "o1", queuedAt: "2026-10-29T07:30:00.000Z" });
  kol(K.fraktmejlKo).set("D", { _id: "D", trackingNumber: "D", orderGuid: "o3", queuedAt: "2026-10-29T07:10:00.000Z", sentAt: "x" });
  kol(K.fraktmejlKo).set("E", { _id: "E", trackingNumber: "E", orderGuid: "o4", queuedAt: "2026-10-29T09:59:00.000Z" });
  assert.deepEqual(await fraktmejlKo.ordrarSomVantat("2026-10-29T09:00:00.000Z", 25), ["o2", "o1"]);
  assert.deepEqual(await fraktmejlKo.ordrarSomVantat("2026-10-29T09:00:00.000Z", 1), ["o2"]);
});

// ── Ordrar och prishistorik ─────────────────────────────────────────────────

test("ordrar: spegeln skriver en gång och hittar raderna på nummer och e-post", async () => {
  const o = { id: "g1", orderNumber: "10079", email: "Kund@Exempel.se", totalMinor: 19900, currency: "SEK", itemCount: 1, items: [{ name: "Lampa", qty: 1, lineMinor: 19900 }], createdAt: "2026-10-28T10:00:00.000Z" };
  assert.deepEqual(await ordrar.spegla(o), { inserted: true });
  assert.deepEqual(await ordrar.spegla(o), { inserted: false });
  assert.deepEqual(await ordrar.raderFor("10079", "kund@exempel.se"), o.items);
  assert.equal(await ordrar.raderFor("10079", "annan@exempel.se"), null);
  assert.equal((await ordrar.sedan("2026-10-01T00:00:00.000Z")).length, 1);
});

test("prishistorik: samma produkt och dag skrivs om, läses i datumordning och gallras", async () => {
  await prishistorik.sparaDag("2026-10-28", [{ produktId: "p1", prisMinor: 49900, valuta: "SEK" }]);
  await prishistorik.sparaDag("2026-10-28", [{ produktId: "p1", prisMinor: 44900, valuta: "SEK" }]);
  await prishistorik.sparaDag("2026-10-27", [{ produktId: "p1", prisMinor: 49900, valuta: "SEK" }]);
  await prishistorik.sparaDag("2026-08-01", [{ produktId: "p1", prisMinor: 59900, valuta: "SEK" }]);
  assert.equal(kol(K.prishistorik).size, 3);
  assert.deepEqual(await prishistorik.forProdukt("p1", "2026-10-01"), [
    { datum: "2026-10-27", prisMinor: 49900 },
    { datum: "2026-10-28", prisMinor: 44900 },
  ]);
  assert.equal(await prishistorik.gallra("2026-09-14"), 1);
  assert.equal(kol(K.prishistorik).size, 2);
});

// ── Kopian ──────────────────────────────────────────────────────────────────

test("kopian: varje tabell har en egen kollektion och en ordning", () => {
  assert.equal(new Set(TABELLER.map((t) => t.kollektion)).size, TABELLER.length);
  assert.equal(new Set(TABELLER.map((t) => t.tabell)).size, 15);
});

test("☠️ kopian: null-kolumner skrivs inte, e-post blir gemener, JSON som text tolkas", () => {
  const kv = TABELLER.find((t) => t.tabell === "abandoned_carts")!.franPostgres({
    id: "c1",
    email: "Kund@Exempel.se",
    phone: null,
    shipping_addr_hash: null,
    items_json: '[{"name":"Stol"}]',
    subtotal_minor: 49900,
    currency: "SEK",
    recover_url: null,
    abandoned_at: new Date("2026-10-29T09:00:00Z"),
    next_step: 2,
    next_step_at: new Date("2026-10-30T09:00:00Z"),
    status: "pending",
    discount_code: null,
    discount_code_wix_id: null,
    created_at: new Date("2026-10-29T09:00:00Z"),
    updated_at: new Date("2026-10-29T10:00:00Z"),
  });
  assert.equal(kv.id, "c1");
  assert.equal("phone" in kv.data, false);
  assert.equal(kv.data.emailLower, "kund@exempel.se");
  assert.deepEqual(kv.data.items, [{ name: "Stol" }]);
  assert.equal(kv.data.nextStepAt, "2026-10-30T09:00:00.000Z");

  const ko = TABELLER.find((t) => t.tabell === "shipping_email_queue")!.franPostgres({
    tracking_number: "A1",
    order_guid: "o1",
    carrier: null,
    line_items: [],
    queued_at: new Date("2026-10-29T09:00:00Z"),
    sent_at: null,
  });
  // ☠️ En väntande rad får INGET sentAt — annars hittar `$exists: false` den aldrig.
  assert.equal("sentAt" in ko.data, false);
});

test("kopian: ett kopierat kundvagnsmejl har samma id som lagret skriver", async () => {
  const fran = TABELLER.find((t) => t.tabell === "sent_emails")!.franPostgres({
    id: 7,
    cart_id: "c1",
    step: 1,
    resend_id: "r1",
    sent_at: new Date("2026-10-29T09:00:00Z"),
    email: "kund@exempel.se",
    discount_code: null,
  });
  await kundvagnMejl.logga({ cartId: "c1", step: 1, resendId: "r1", email: "kund@exempel.se" });
  assert.deepEqual([...kol(K.kundvagnMejl).keys()], [fran.id]);
});

test("kopian: prishistorikens id är detsamma som lagrets för samma produkt och dag", async () => {
  const fran = TABELLER.find((t) => t.tabell === "price_history")!.franPostgres({
    product_id: "p1",
    observed_on: "2026-10-28",
    price_minor: 49900,
    currency: "SEK",
    recorded_at: new Date("2026-10-28T03:00:00Z"),
  });
  await prishistorik.sparaDag("2026-10-28", [{ produktId: "p1", prisMinor: 49900, valuta: "SEK" }]);
  assert.deepEqual([...kol(K.prishistorik).keys()], [fran.id]);
});
