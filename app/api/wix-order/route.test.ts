import { generateKeyPairSync, createSign } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "@/lib/orders/types";

// Delad store mellan route och test. getStore() mockas att returnera den.
let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn() }));
vi.mock("@/lib/sync/bestsellers", () => ({ enqueuePriorityCheck: vi.fn().mockResolvedValue(0) }));
vi.mock("@/lib/import/supplier-tracking", () => ({ recordOrder: vi.fn().mockResolvedValue(null) }));

import { POST } from "./route";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1", orderId: "o1", orderNumber: "100", lineItemId: "l1", productName: "X",
    wixCatalogItemId: "wix-1", variantChoices: {}, quantity: 1, status: "pending",
    createdAt: new Date().toISOString(),
    shippingAddress: { fullName: "A B", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", country: "SE" },
    ...patch,
  };
}
function req(body: unknown) {
  return new Request("http://localhost/api/wix-order", {
    method: "POST",
    headers: { "x-forwarded-from": "fyndplats-webhook", "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}
const get = async (id: string) => (await store.listTasks()).find((t) => t.taskId === id);

const cancelEvent = {
  id: "evt-c1", entityFqdn: "wix.ecom.v1.order", slug: "canceled", entityId: "o1",
  actionEvent: { body: { order: { id: "o1" } } },
};
const refundEvent = {
  id: "evt-r1", entityFqdn: "wix.ecom.v1.order_transactions", slug: "refund_completed", entityId: "txn1",
  updatedEvent: { currentEntity: { orderId: "o1", refund: { id: "r1" } } },
};
const createdEvent = {
  id: "evt-n1", entityFqdn: "wix.ecom.v1.order", slug: "created", entityId: "o9",
  createdEvent: {
    entity: {
      id: "o9", number: "900",
      lineItems: [{ id: "l1", productName: { original: "W" }, quantity: 1, catalogReference: { catalogItemId: "wp9" } }],
      recipientInfo: { address: { addressLine1: "V 2", city: "GBG", postalCode: "41100", country: "SE" }, contact: { firstName: "E", lastName: "E" } },
    },
  },
};

beforeEach(() => {
  store = new MemoryStore();
  delete process.env.WIX_WEBHOOK_PUBLIC_KEY;
  delete process.env.WEBHOOK_FORWARD_SECRET;
});

describe("/api/wix-order — F19 cancel/refund-gate", () => {
  it("cancel-event → avbryter orderns pending-tasks, INGA nya tasks, 200", async () => {
    await store.upsertTask(task());
    const res = await POST(req(cancelEvent));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, kind: "cancel", cancelled: 1 });
    expect((await get("o1:l1"))?.status).toBe("cancelled");
  });

  it("refund-event → flaggar (avbryter EJ) orderns tasks, 200", async () => {
    await store.upsertTask(task());
    const res = await POST(req(refundEvent));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, kind: "refund", flagged: 1 });
    const t = await get("o1:l1");
    expect(t?.refundFlagged).toBe(true);
    expect(t?.status).toBe("pending"); // EJ avbruten
  });

  it("dubbel cancel-event (samma eventId) → andra dedupas, inga kast", async () => {
    await store.upsertTask(task());
    await POST(req(cancelEvent));
    const res2 = await POST(req(cancelEvent));
    expect(res2.status).toBe(200);
    expect(await res2.json()).toMatchObject({ deduped: true });
  });

  it("created-event går fortfarande create-vägen (regression: skapar tasks)", async () => {
    const res = await POST(req(createdEvent));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, tasksCreated: 1 });
    expect(await get("o9:l1")).toBeTruthy();
  });

  it("en Aosom-vara till ett spärrat postnummer larmar en gång, en vanlig adress inte", async () => {
    const { audit } = await import("@/lib/audit");
    vi.mocked(audit).mockClear();
    await store.saveMapping({ wixProductId: "wp9", supplier: "aosom", supplierProductId: "aosom:TEST-1", variants: [] });
    const tillVisby = structuredClone(createdEvent);
    tillVisby.createdEvent.entity.recipientInfo.address.postalCode = "621 52";

    expect((await POST(req(tillVisby))).status).toBe(200);
    expect(vi.mocked(audit)).toHaveBeenCalledWith(
      "order",
      "o9",
      "Aosom levererar inte till postnummer 621 52 — raderna hålls",
    );

    // Samma order en gång till (ett nytt event-id) skapar inga nya rader och larmar inte igen.
    vi.mocked(audit).mockClear();
    await POST(req({ ...tillVisby, id: "evt-n2" }));
    expect(vi.mocked(audit).mock.calls.some((c) => String(c[2]).includes("Aosom levererar inte"))).toBe(false);
  });

  it("en Aosom-vara till ett vanligt postnummer larmar inte", async () => {
    const { audit } = await import("@/lib/audit");
    vi.mocked(audit).mockClear();
    await store.saveMapping({ wixProductId: "wp9", supplier: "aosom", supplierProductId: "aosom:TEST-1", variants: [] });
    await POST(req(createdEvent));
    expect(vi.mocked(audit).mock.calls.some((c) => String(c[2]).includes("Aosom levererar inte"))).toBe(false);
  });

  it("cancel utan härledbart order-id → 200 ignored (ingen retry-loop)", async () => {
    const res = await POST(req({ id: "evt-x", entityFqdn: "wix.ecom.v1.order", slug: "canceled" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: true });
  });
});

// ── Stängt läge: en driftsatt motor ─────────────────────────────────────────
// Proven ovan körs i provläget (NODE_ENV "test"), där en saknad inställning får
// betyda "öppet". Här ställs NODE_ENV till "production", som i en driftsatt
// motor. ☠️ Inget av det här skickas någonstans: rutten anropas som en funktion
// mot ett lager i minnet.
describe("/api/wix-order — saknad säkerhetsinställning nekar i drift", () => {
  const HEMLIS = "prov-hemlighet-som-inte-finns-nagon-annanstans";
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const b64url = (v: string | Buffer) =>
    Buffer.from(v).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const signera = (payload: unknown) => {
    const huvud = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const kropp = b64url(JSON.stringify(payload));
    const s = createSign("RSA-SHA256");
    s.update(`${huvud}.${kropp}`);
    s.end();
    return `${huvud}.${kropp}.${b64url(s.sign(privateKey))}`;
  };
  const anrop = (kropp: string, rubriker: Record<string, string> = {}) =>
    POST(
      new Request("http://localhost/api/wix-order", {
        method: "POST",
        headers: { "content-type": "application/json", ...rubriker },
        body: kropp,
      }) as unknown as Parameters<typeof POST>[0],
    );
  const antalUppgifter = async () => (await store.listTasks()).length;
  const forward = { "x-forwarded-from": "fyndplats-webhook" };

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("☠️ ingen inställning alls → 503 med konfigurationsfel, ingen uppgift skapas", async () => {
    // Förut: rubriken räckte utan hemlighet, och utan nyckel togs kroppen emot
    // osignerad. Den här ordern hade skapats.
    for (const rubriker of [{}, forward, { ...forward, "x-forward-secret": "vadsomhelst" }]) {
      const res = await anrop(JSON.stringify(createdEvent), rubriker);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "Webhooken är inte konfigurerad" });
    }
    expect(await antalUppgifter()).toBe(0);
    // Loggraden nämner variablernas namn, så att felet går att åtgärda.
    const rad = vi.mocked(console.error).mock.calls.map((c) => String(c[0])).join("\n");
    expect(rad).toContain("WEBHOOK_FORWARD_SECRET");
    expect(rad).toContain("WIX_WEBHOOK_PUBLIC_KEY");
  });

  it("☠️ bara hemligheten satt: rubriken utan rätt hemlighet räcker inte → 401", async () => {
    process.env.WEBHOOK_FORWARD_SECRET = HEMLIS;
    const kropp = JSON.stringify(createdEvent);
    expect((await anrop(kropp, forward)).status).toBe(401);
    expect((await anrop(kropp, { ...forward, "x-forward-secret": "fel" })).status).toBe(401);
    expect((await anrop(kropp, { ...forward, "x-forward-secret": "" })).status).toBe(401);
    // Och en osignerad kropp UTAN rubriken tas inte emot bara för att nyckeln saknas.
    expect((await anrop(kropp)).status).toBe(401);
    expect(await antalUppgifter()).toBe(0);
  });

  it("rätt hemlighet → ordern tas emot som förut", async () => {
    process.env.WEBHOOK_FORWARD_SECRET = HEMLIS;
    const res = await anrop(JSON.stringify(createdEvent), { ...forward, "x-forward-secret": HEMLIS });
    expect(res.status).toBe(200);
    expect(await antalUppgifter()).toBe(1);
  });

  it("☠️ bara nyckeln satt: rubriken ensam ger ingen genväg förbi signaturen → 401", async () => {
    process.env.WIX_WEBHOOK_PUBLIC_KEY = publicPem;
    const kropp = JSON.stringify(createdEvent);
    expect((await anrop(kropp, forward)).status).toBe(401);
    expect((await anrop(kropp, { ...forward, "x-forward-secret": "vadsomhelst" })).status).toBe(401);
    expect((await anrop(kropp)).status).toBe(401);
    expect(await antalUppgifter()).toBe(0);
  });

  it("bara nyckeln satt: en riktigt signerad händelse tas emot", async () => {
    process.env.WIX_WEBHOOK_PUBLIC_KEY = publicPem;
    const res = await anrop(signera(createdEvent));
    expect(res.status).toBe(200);
    expect(await antalUppgifter()).toBe(1);
  });

  it("båda satta: fel hemlighet faller tillbaka på signaturen, som då måste stämma", async () => {
    process.env.WIX_WEBHOOK_PUBLIC_KEY = publicPem;
    process.env.WEBHOOK_FORWARD_SECRET = HEMLIS;
    const fel = { ...forward, "x-forward-secret": "fel" };
    expect((await anrop(JSON.stringify(createdEvent), fel)).status).toBe(401);
    expect(await antalUppgifter()).toBe(0);
    expect((await anrop(signera(createdEvent), fel)).status).toBe(200);
    expect(await antalUppgifter()).toBe(1);
  });

  it("i provläget är beteendet oförändrat: utan inställning räcker rubriken", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const res = await anrop(JSON.stringify(createdEvent), forward);
    expect(res.status).toBe(200);
    expect(await antalUppgifter()).toBe(1);
  });
});
