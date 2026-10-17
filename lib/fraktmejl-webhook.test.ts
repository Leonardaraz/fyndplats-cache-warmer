// Run: node --test --experimental-strip-types lib/fraktmejl-webhook.test.ts
//
// Webhookens fraktgren (order_fulfillments_updated) mot en låtsasvärld med
// samma regler som databasen: tracking_mapping släpper igenom ett nummer en
// gång, kön tar emot ett nummer en gång, och utskicket tar atomiskt allt som
// väntar för ordern (lib/shipping-email-batch.ts).
import test from "node:test";
import assert from "node:assert/strict";
import {
  fraktmejlAmne,
  skickaVantande,
  slaIhopRader,
  taEmotFulfillments,
  type KoadSandning,
  type TaEmotDeps,
  type Utskick,
} from "./fraktmejl-rader.ts";

const A = "01234567890123";
const B = "01234567890125";

function varld(opts: { koNere?: boolean; utskick?: () => Utskick } = {}) {
  const mappade = new Set<string>();
  const registrerade: string[] = [];
  const ko = new Map<string, { s: KoadSandning; skickad: boolean }>();
  const mejl: KoadSandning[][] = [];
  let n = 0;
  const skicka = async (sandningar: KoadSandning[]): Promise<Utskick> => {
    const utfall = opts.utskick?.() ?? { resendId: `mejl-${++n}` };
    if ("resendId" in utfall) mejl.push(sandningar);
    return utfall;
  };
  const deps: TaEmotDeps = {
    // upsertTrackingMapping: ny rad → 17TRACK-registrering, annars dubblett.
    mappa: async (tn) => {
      if (mappade.has(tn)) return "duplicate";
      mappade.add(tn);
      registrerade.push(tn);
      return "new";
    },
    transportor: () => "DPD, delas ut av PostNord i Sverige",
    koa: async (s) => {
      if (opts.koNere) return false;
      if (!ko.has(s.trackingNumber)) ko.set(s.trackingNumber, { s, skickad: false });
      return true;
    },
    skickaDirekt: skicka,
    skickaSamlat: () =>
      skickaVantande({
        taVantande: async () => {
          const rader = [...ko.values()].filter((r) => !r.skickad);
          for (const r of rader) r.skickad = true;
          return rader.map((r) => r.s).sort((x, y) => x.trackingNumber.localeCompare(y.trackingNumber));
        },
        slapp: async (nummer) => {
          for (const tn of nummer) {
            const r = ko.get(tn);
            if (r) r.skickad = false;
          }
        },
        skicka,
      }),
  };
  return { deps, ko, mejl, registrerade };
}

// Order 10095: ett hantelset (en rad, antal 1) i två DPD-paket. Wix tar bara
// en fulfillment för raden, så båda numren står i dess spårningsfält. Numren
// här är påhittade, i samma form.
const order10095 = { number: "10095", lineItems: [{ id: "rad-1", quantity: 1 }] };
const fulfillment10095 = {
  trackingInfo: { trackingNumber: `${A}, ${B}`, shippingProvider: "DPD" },
  lineItems: [{ id: "rad-1", quantity: 1 }],
};

test("en fulfillment med 'A, B' på en rad med antal 1: två köade nummer och exakt ett mejl med båda", async () => {
  const v = varld();
  const res = await taEmotFulfillments(order10095, [fulfillment10095], v.deps);

  assert.equal(res.koade, 2);
  assert.deepEqual([...v.ko.keys()], [A, B]);
  // Raderna hör till första numret, det andra paketet bär inga.
  assert.deepEqual(v.ko.get(A)?.s.lineItems, [{ id: "rad-1", quantity: 1 }]);
  assert.deepEqual(v.ko.get(B)?.s.lineItems, []);
  // Egen tracking_mapping-rad och egen 17TRACK-registrering per nummer.
  assert.deepEqual(v.registrerade, [A, B]);

  // Ordern är helt skickad i samma webhook, så mejlet går direkt: ETT mejl.
  assert.equal(v.mejl.length, 1);
  assert.deepEqual(v.mejl[0].map((s) => s.trackingNumber), [A, B]);
  assert.deepEqual(res.skickat, ["mejl-1"]);
  assert.equal(fraktmejlAmne("10095", v.mejl[0].length), "Dina 2 paket är på väg – order 10095");
  // Hantelsetet står som 1 st, inte en gång per paket.
  assert.deepEqual(slaIhopRader(v.mejl[0]), [{ id: "rad-1", quantity: 1 }]);
});

test("samma webhook en gång till ger inget nytt mejl", async () => {
  const v = varld();
  await taEmotFulfillments(order10095, [fulfillment10095], v.deps);
  const igen = await taEmotFulfillments(order10095, [fulfillment10095], v.deps);

  assert.equal(igen.dubbletter, 2);
  assert.equal(igen.koade, 0);
  assert.deepEqual(igen.skickat, []);
  assert.equal(v.mejl.length, 1);
  assert.deepEqual(v.registrerade, [A, B]);
});

test("ett utskick som föll skickas när Wix skickar webhooken igen, fortfarande som ett mejl", async () => {
  let forsok = 0;
  const v = varld({ utskick: () => (++forsok === 1 ? { fel: "send failed" } : { resendId: "mejl-2" }) });
  const forst = await taEmotFulfillments(order10095, [fulfillment10095], v.deps);
  assert.deepEqual(forst.skickat, []);
  assert.equal(v.mejl.length, 0);

  const igen = await taEmotFulfillments(order10095, [fulfillment10095], v.deps);
  assert.deepEqual(igen.skickat, ["mejl-2"]);
  assert.equal(v.mejl.length, 1);
  assert.deepEqual(v.mejl[0].map((s) => s.trackingNumber), [A, B]);
});

test("kön nere: ett direktmejl med båda numren, inte ett per nummer", async () => {
  const v = varld({ koNere: true });
  const res = await taEmotFulfillments(order10095, [fulfillment10095], v.deps);
  assert.equal(res.direkt, 2);
  assert.equal(v.mejl.length, 1);
  assert.deepEqual(v.mejl[0].map((s) => s.trackingNumber), [A, B]);
});

test("order 10051, två fulfillments med var sitt nummer: ett mejl som förut", async () => {
  const v = varld();
  const order = { lineItems: [{ id: "rad-1", quantity: 2 }] };
  const f1 = { trackingInfo: { trackingNumber: "01497067378460" }, lineItems: [{ id: "rad-1", quantity: 1 }] };
  const f2 = { trackingInfo: { trackingNumber: "01497067378461" }, lineItems: [{ id: "rad-1", quantity: 1 }] };
  await taEmotFulfillments(order, [f1, f2], v.deps);
  assert.equal(v.mejl.length, 1);
  assert.deepEqual(slaIhopRader(v.mejl[0]), [{ id: "rad-1", quantity: 2 }]);
});

test("ett paket av två: numret köas och mejlet väntar på resten", async () => {
  const v = varld();
  const order = { lineItems: [{ id: "rad-1", quantity: 2 }] };
  const f1 = { trackingInfo: { trackingNumber: "01497067378460" }, lineItems: [{ id: "rad-1", quantity: 1 }] };
  const res = await taEmotFulfillments(order, [f1], v.deps);
  assert.equal(res.koade, 1);
  assert.equal(res.vantar, true);
  assert.equal(v.mejl.length, 0);
});

test("en fulfillment utan spårningsnummer gör ingenting", async () => {
  const v = varld();
  const res = await taEmotFulfillments(order10095, [{ lineItems: [{ id: "rad-1", quantity: 1 }] }], v.deps);
  assert.deepEqual(res, { koade: 0, dubbletter: 0, direkt: 0, skickat: [], vantar: false });
  assert.equal(v.registrerade.length, 0);
});

test("utskicket släpper anspråket om det kastar, så nästa försök tar det", async () => {
  let slappta: string[] = [];
  await assert.rejects(
    skickaVantande({
      taVantande: async () => [{ trackingNumber: A, carrier: null, lineItems: [] }],
      slapp: async (nummer) => {
        slappta = nummer;
      },
      skicka: async () => {
        throw new Error("nätverksfel");
      },
    }),
  );
  assert.deepEqual(slappta, [A]);
});
