// ☠️ Formen på kopian måste vara den Wix-lagren själva skriver. Ett fält som
// heter något annat här än i lagret hade varit ett fält koden aldrig hittar
// efter växlingen — och verifieringen hade jämfört kopian med sig själv.
//
// Varje test matar källan med en Neon-rad och jämför med vad motsvarande
// Wix-lager skriver för samma post.

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ rader: [] as Record<string, unknown>[], fragor: [] as string[] }));
vi.mock("../db/client", () => ({
  sql: () => ({
    query: async (text: string) => {
      db.fragor.push(text);
      return db.rader;
    },
  }),
}));

const skrivet = vi.hoisted(() => ({ rader: [] as { kollektion: string; id: string; data: Record<string, unknown> }[] }));
vi.mock("../db/wix-data-klient", async () => {
  const faktisk = await vi.importActual<typeof import("../db/wix-data-klient")>("../db/wix-data-klient");
  return {
    ...faktisk,
    spara: async (kollektion: string, id: string, data: Record<string, unknown>) => {
      skrivet.rader.push({ kollektion, id, data });
    },
    infoga: async (kollektion: string, id: string, data: Record<string, unknown>) => {
      skrivet.rader.push({ kollektion, id, data });
      return "skapad";
    },
    patcha: async () => "applied",
  };
});

import { neonKallor, utanWixFalt } from "./neon-till-wix-kallor";
import { WixDataStore } from "../store/wix-data";
import { WixSyncMarkorLager } from "../aosom/sync-markor";

beforeEach(() => {
  db.rader = [];
  db.fragor = [];
  skrivet.rader = [];
});

const kalla = (namn: string) => {
  const k = neonKallor().find((x) => x.namn === namn);
  if (!k) throw new Error(`ingen källa ${namn}`);
  return k;
};

describe("källornas form = lagrens form", () => {
  it("varje källa har en unik kollektion", () => {
    const k = neonKallor();
    expect(new Set(k.map((x) => x.kollektion)).size).toBe(k.length);
  });

  it("audit: { at, kind, ref?, detail? } som appendAudit", async () => {
    const entry = { at: "2026-10-28T10:00:00.000Z", kind: "order-placed", ref: "o1:l1", detail: "ok" };
    await new WixDataStore().appendAudit(entry);
    db.rader = [{ id: "x", at: new Date(entry.at), kind: entry.kind, ref: entry.ref, detail: entry.detail }];
    const [rad] = await kalla("audit").lasNeon(null, 10);
    expect(rad.data).toEqual(skrivet.rader[0].data);

    db.rader = [{ id: "y", at: new Date(entry.at), kind: "k", ref: null, detail: null }];
    const [utan] = await kalla("audit").lasNeon(null, 10);
    expect(utan.data).toEqual({ at: entry.at, kind: "k" });
  });

  it("webhook_events: { seenAt } som markEventSeen", async () => {
    await new WixDataStore().markEventSeen("e1");
    db.rader = [{ id: "e1", seen_at: new Date("2026-10-28T10:00:00.000Z"), data: null }];
    const [rad] = await kalla("webhook_events").lasNeon(null, 10);
    expect(Object.keys(rad.data)).toEqual(Object.keys(skrivet.rader[0].data));
  });

  it("mappningar: hela posten utan Wix gamla systemfält", async () => {
    const post = { wixProductId: "p1", supplierProductId: "x", variants: [{ a: 1 }] };
    await new WixDataStore().saveMapping(post as never);
    db.rader = [{ id: "p1", data: { ...post, _id: "p1", _owner: "o", _createdDate: { $date: "x" } }, andrad: new Date() }];
    const [rad] = await kalla("mappings").lasNeon(null, 10);
    expect(rad.data).toEqual(skrivet.rader[0].data);
  });

  it("sync_markor: { markor, at } som WixSyncMarkorLager", async () => {
    await new WixSyncMarkorLager().spara("lager", "m");
    db.rader = [{ id: "lager", markor: "m", at: new Date("2026-10-28T10:00:00.000Z") }];
    const [rad] = await kalla("sync_markor").lasNeon(null, 10);
    expect(Object.keys(rad.data).sort()).toEqual(Object.keys(skrivet.rader[0].data).sort());
    expect(rad.data.markor).toBe("m");
  });

  it("fakturaloggen: fälten wixUtskickslogg skriver", async () => {
    db.rader = [
      {
        id: "o1__faktura",
        order_id: "o1",
        typ: "faktura",
        ordernummer: "10079",
        tagen_at: new Date("2026-10-09T10:00:00Z"),
        skickad_at: new Date("2026-10-09T10:00:05Z"),
        resend_id: "re_1",
      },
    ];
    const [rad] = await kalla("faktura_utskick").lasNeon(null, 10);
    expect(rad.id).toBe("o1__faktura");
    expect(rad.data).toEqual({
      orderId: "o1",
      typ: "faktura",
      ordernummer: "10079",
      tagenAt: "2026-10-09T10:00:00.000Z",
      skickadAt: "2026-10-09T10:00:05.000Z",
      resendId: "re_1",
    });
  });

  it("färgbilderna blir ett dokument per sida, i (val, ordning, fil)", async () => {
    // Första frågan ger sidorna, andra raderna.
    let anrop = 0;
    db.rader = [];
    const k = kalla("fargbilder");
    const orig = db;
    Object.defineProperty(orig, "rader", {
      configurable: true,
      get() {
        anrop++;
        return anrop === 1
          ? [{ id: "P" }]
          : [
              { wix_product_id: "P", choice_id: "c1", choice_name: "Grå", ordning: 1, fil_id: "f2", plats: "galleri", givare_id: null, skriven_at: "2026-10-01T00:00:00Z", wix_bekraftad_at: null },
              { wix_product_id: "P", choice_id: "c1", choice_name: "Grå", ordning: 0, fil_id: "f1", plats: "galleri", givare_id: "g", skriven_at: "2026-10-01T00:00:00Z", wix_bekraftad_at: "2026-10-02T00:00:00Z" },
            ];
      },
      set() {},
    });
    const [dok] = await k.lasNeon(null, 10);
    expect(dok.id).toBe("P");
    expect((dok.data.rader as { filId: string }[]).map((r) => r.filId)).toEqual(["f1", "f2"]);
    expect((dok.data.rader as { wixBekraftadAt: string | null }[])[0].wixBekraftadAt).toBe("2026-10-02T00:00:00.000Z");
    delete (orig as { rader?: unknown }).rader;
    orig.rader = [];
  });

  it("utanWixFalt tar bort precis Wix fyra systemfält", () => {
    expect(utanWixFalt({ _id: 1, _owner: 2, _createdDate: 3, _updatedDate: 4, x: 5 })).toEqual({ x: 5 });
  });

  it("☠️ utanWixFalt stryker null på översta nivån bara med utanNull — `$exists: false` matchar inte null i Wix", () => {
    const task = { taskId: "o1:l1", status: "pending", claimToken: null, aliexpressOrderId: null, rader: [{ a: null }] };
    const ut = utanWixFalt(task, { utanNull: true });
    expect("claimToken" in ut).toBe(false);
    expect("aliexpressOrderId" in ut).toBe(false);
    // Bara översta nivån: inuti listor och objekt rörs ingenting.
    expect(ut.rader).toEqual([{ a: null }]);
    expect(ut.status).toBe("pending");
    // Utan flaggan står null kvar, som i Neon.
    expect(utanWixFalt(task).claimToken).toBeNull();
  });

  it("mappningar kommer över med sina null-fält, exakt som i Neon", async () => {
    db.rader = [{ id: "p1", data: { wixProductId: "p1", aosomSyncedQty: null }, andrad: new Date() }];
    const [rad] = await kalla("mappings").lasNeon(null, 10);
    expect(rad.data).toEqual({ wixProductId: "p1", aosomSyncedQty: null });
  });

  it("☠️ en task från Neon med null i låsfälten blir claimbar i kopian", async () => {
    db.rader = [{ id: "o1:l1", data: { taskId: "o1:l1", status: "pending", claimToken: null, aliexpressOrderId: null }, andrad: new Date() }];
    const [rad] = await kalla("tasks").lasNeon(null, 10);
    expect(rad.data).toEqual({ taskId: "o1:l1", status: "pending" });
  });

  it("☠️ läser med markör (keyset), aldrig offset", async () => {
    db.rader = [];
    await kalla("reviews").lasNeon("p1__r9", 500);
    expect(db.fragor[0]).toMatch(/> \$1/);
    expect(db.fragor[0]).not.toMatch(/offset/i);
  });
});
