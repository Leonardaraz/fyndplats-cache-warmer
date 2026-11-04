// Låsta medlemskorgar äldre än ett dygn (lib/medlem/korgstadning.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { LAST_TIMMAR, PER_KORNING, SOK_DAGAR, stadaLastaKorgar, type Korgutfall, type Stadberoenden } from "./korgstadning.ts";

const NU = Date.parse("2026-11-10T12:00:00.000Z");

function beroenden(o: {
  beslut: { cartId: string; purchaseFlowId: string }[];
  ordrar?: string[];
  saknas?: string[];
  felVid?: string[];
}) {
  const logg: string[] = [];
  const utfall = new Map<string, Korgutfall>();
  let fraga: { efter: string; fore: string; limit: number } | null = null;
  const b: Stadberoenden = {
    async utanUtfall(efter, fore, limit) {
      fraga = { efter, fore, limit };
      return o.beslut;
    },
    async orderFinns(pf) {
      return (o.ordrar ?? []).includes(pf);
    },
    async taBortKorg(id) {
      if ((o.felVid ?? []).includes(id)) throw new Error("wix 500");
      logg.push(`bort:${id}`);
      return (o.saknas ?? []).includes(id) ? "saknades" : "borttagen";
    },
    async sattUtfall(id, u) {
      utfall.set(id, u);
    },
  };
  return { b, logg, utfall, fraga: () => fraga };
}

test("letar bland beslut mellan sju dygn och ett dygn gamla, högst en omgång", async () => {
  const d = beroenden({ beslut: [] });
  await stadaLastaKorgar(NU, d.b);
  assert.deepEqual(d.fraga(), {
    efter: new Date(NU - SOK_DAGAR * 86_400_000).toISOString(),
    fore: new Date(NU - LAST_TIMMAR * 3_600_000).toISOString(),
    limit: PER_KORNING,
  });
  assert.equal(d.fraga()!.fore, "2026-11-09T12:00:00.000Z");
});

test("en korg som blev ett köp tas inte bort; de andra tas bort eller saknades redan", async () => {
  const d = beroenden({
    beslut: [
      { cartId: "k1", purchaseFlowId: "pf1" },
      { cartId: "k2", purchaseFlowId: "pf2" },
      { cartId: "k3", purchaseFlowId: "" },
    ],
    ordrar: ["pf1"],
    saknas: ["k3"],
  });
  const u = await stadaLastaKorgar(NU, d.b);
  assert.deepEqual(u, { provade: 3, kopta: 1, borttagna: 1, saknades: 1, fel: 0 });
  assert.deepEqual(d.logg, ["bort:k2", "bort:k3"]);
  assert.deepEqual([...d.utfall], [["k1", "kopt"], ["k2", "borttagen"], ["k3", "saknades"]]);
});

test("ett fel lämnar beslutet utan utfall till nästa körning, och resten fortsätter", async () => {
  const d = beroenden({ beslut: [{ cartId: "k1", purchaseFlowId: "" }, { cartId: "k2", purchaseFlowId: "" }], felVid: ["k1"] });
  const u = await stadaLastaKorgar(NU, d.b);
  assert.equal(u.fel, 1);
  assert.equal(u.borttagna, 1);
  assert.equal(d.utfall.has("k1"), false);
  assert.equal(d.utfall.get("k2"), "borttagen");
});

test("aldrig fler än en omgång, och ett beslut utan korg hoppas över", async () => {
  const manga = Array.from({ length: PER_KORNING + 10 }, (_, i) => ({ cartId: `k${i}`, purchaseFlowId: "" }));
  const d = beroenden({ beslut: [{ cartId: "", purchaseFlowId: "pf" }, ...manga] });
  const u = await stadaLastaKorgar(NU, d.b);
  assert.equal(u.provade, PER_KORNING - 1);
  assert.equal(d.logg.length, PER_KORNING - 1);
});
