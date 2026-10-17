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
  // Ordningen mellan mejl och 17TRACK-registrering.
  const logg: string[] = [];
  const ko = new Map<string, { s: KoadSandning; skickad: boolean }>();
  const mejl: KoadSandning[][] = [];
  let n = 0;
  const skicka = async (sandningar: KoadSandning[]): Promise<Utskick> => {
    const utfall = opts.utskick?.() ?? { resendId: `mejl-${++n}` };
    if ("resendId" in utfall) {
      mejl.push(sandningar);
      logg.push(`mejl ${sandningar.map((s) => s.trackingNumber).join(",")}`);
    }
    return utfall;
  };
  const deps: TaEmotDeps = {
    // upsertTrackingMapping: ny rad → "new", annars dubblett.
    mappa: async (tn) => {
      if (mappade.has(tn)) return "duplicate";
      mappade.add(tn);
      return "new";
    },
    registrera: async (nummer) => {
      registrerade.push(...nummer);
      logg.push(`17track ${nummer.join(",")}`);
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
  return { deps, ko, mejl, registrerade, logg };
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
  // Egen tracking_mapping-rad och egen 17TRACK-registrering per nummer,
  // registrerade efter mejlet.
  assert.deepEqual(v.registrerade, [A, B]);
  assert.deepEqual(v.logg, [`mejl ${A},${B}`, `17track ${A},${B}`]);

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

// Webhooken svarar ändå 200, så Wix skickar den inte igen av sig själv. Numren
// ligger kvar i kön och går med nästa webhook för ordern, eller med cronen
// /api/cron/fraktmejl efter VANTETID_MIN.
test("ett utskick som föll ligger kvar i kön och går vid nästa försök, fortfarande som ett mejl", async () => {
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

test("en omskickad webhook medan den första registrerar hos 17TRACK: fortfarande ett mejl med båda numren", async () => {
  const v = varld();
  let slapp17track!: () => void;
  const svar17track = new Promise<void>((r) => (slapp17track = r));
  let iRegistreringen!: () => void;
  const registrerar = new Promise<void>((r) => (iRegistreringen = r));
  // Den första leveransen fastnar i 17TRACK-registreringen tills vi släpper den.
  const forsta = taEmotFulfillments(order10095, [fulfillment10095], {
    ...v.deps,
    registrera: async (nummer) => {
      iRegistreringen();
      await svar17track;
      await v.deps.registrera(nummer);
    },
  });
  await registrerar;
  const andra = await taEmotFulfillments(order10095, [fulfillment10095], v.deps);
  slapp17track();
  await forsta;

  assert.equal(andra.dubbletter, 2);
  assert.deepEqual(andra.skickat, []);
  assert.equal(v.mejl.length, 1);
  assert.deepEqual(v.mejl[0].map((s) => s.trackingNumber), [A, B]);
  assert.deepEqual(v.registrerade, [A, B]);
});

test("nya nummer registreras hos 17TRACK även när utskicket kastar", async () => {
  const v = varld({
    utskick: () => {
      throw new Error("nätverksfel");
    },
  });
  await assert.rejects(taEmotFulfillments(order10095, [fulfillment10095], v.deps));
  assert.deepEqual(v.registrerade, [A, B]);
  // Numren lämnades tillbaka till kön.
  assert.deepEqual([...v.ko.values()].map((r) => r.skickad), [false, false]);
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
