// lib/webhook-fanout.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Säkerställer att fan-out:en från /api/wix-webhook till fyndplats-cache-warmer
// triggar för rätt event-typer, INTE triggar för fel typer, forwardar exakt
// samma raw body som Wix skickade, och sätter X-Forwarded-From-headern som
// cache-warmer:s auth-bypass kollar mot.

import test from "node:test";
import assert from "node:assert/strict";
import {
  fanoutToCacheWarmer,
  shouldFanoutToCacheWarmer,
} from "./webhook-fanout.ts";

test("shouldFanoutToCacheWarmer matches full FQDN order event types", () => {
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.order_created"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.order_paid"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.order_fulfilled"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.order_refunded"), true);
});

test("shouldFanoutToCacheWarmer matches v2/v3 FQDN variants", () => {
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v2.order.order_created"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v3.order.order_paid"), true);
});

test("shouldFanoutToCacheWarmer matches real Wix v2 order slugs (approved/paid/...)", () => {
  // Wix skickar i PRAKTIKEN slug "approved" för en ny order (Klarna-godkänd →
  // live i Wix). Bekräftat i prod-logg, order 10010: eventType=
  // "wix.ecom.v1.order.approved". Den MÅSTE forwardas till cache-warmer —
  // annars skapas inga fulfillment-tasks och auto-leveranskedjan startar aldrig.
  // (Tidigare matchade vi bara legacy-namnen order_created/_paid/... → missade
  // approved → noll tasks. Den här raden låser fast fixen.)
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.approved"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.created"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.placed"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.paid"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.fulfilled"), true);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.refunded"), true);
});

test("shouldFanoutToCacheWarmer is case-insensitive", () => {
  assert.equal(shouldFanoutToCacheWarmer("WIX.ECOM.V1.ORDER.ORDER_CREATED"), true);
});

test("shouldFanoutToCacheWarmer does NOT match non-order events", () => {
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.abandoned_checkout.created"), false);
  assert.equal(shouldFanoutToCacheWarmer("wix.stores.v1.product.product_created"), false);
  assert.equal(shouldFanoutToCacheWarmer(""), false);
  assert.equal(shouldFanoutToCacheWarmer("unknown"), false);
});

test("shouldFanoutToCacheWarmer does NOT match order events outside the fan-out list", () => {
  // T.ex. order_updated, order_archived — cache-warmer bryr sig inte om dessa.
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.order_updated"), false);
  assert.equal(shouldFanoutToCacheWarmer("wix.ecom.v1.order.order_archived"), false);
});

test("fanoutToCacheWarmer POSTs to the configured URL with the raw body", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    return new Response("ok", { status: 200 });
  };

  await fanoutToCacheWarmer({
    rawBody: "header.payload.sig",
    eventType: "wix.ecom.v1.order.order_created",
    digest: "sha256=abc",
    url: "https://example.test/api/wix-order",
    secret: "", // explicit tom → deterministiskt oavsett ev. env-WEBHOOK_FORWARD_SECRET
    fetchImpl: mockFetch as unknown as typeof fetch,
  });

  assert.equal(calls.length, 1, "exactly one fetch call");
  assert.equal(calls[0].url, "https://example.test/api/wix-order");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.body, "header.payload.sig", "raw body forwarded verbatim");

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers["X-Forwarded-From"], "fyndplats-webhook");
  assert.equal(headers["X-Original-Digest"], "sha256=abc");
  assert.equal(headers["X-Original-Event-Type"], "wix.ecom.v1.order.order_created");
  assert.equal(headers["Content-Type"], "application/json");
  // Ingen hemlighet konfigurerad → headern utelämnas (opt-in).
  assert.equal(headers["X-Forward-Secret"], undefined);
});

test("fanoutToCacheWarmer skickar X-Forward-Secret när en hemlighet är satt", async () => {
  let captured: Record<string, string> = {};
  const mockFetch = async (_url: string | URL | Request, init?: RequestInit) => {
    captured = init!.headers as Record<string, string>;
    return new Response("ok", { status: 200 });
  };

  await fanoutToCacheWarmer({
    rawBody: "header.payload.sig",
    eventType: "wix.ecom.v1.order.order_created",
    url: "https://example.test/api/wix-order",
    secret: "topphemligt",
    fetchImpl: mockFetch as unknown as typeof fetch,
  });

  assert.equal(captured["X-Forward-Secret"], "topphemligt");
  assert.equal(captured["X-Forwarded-From"], "fyndplats-webhook");
});

test("fanoutToCacheWarmer never throws when fetch rejects (fire-and-forget)", async () => {
  const mockFetch = async () => {
    throw new Error("network down");
  };

  // Får inte throw:a — annars skulle webhook-handlern i route.ts kunna krascha
  // och Wix retry:a → dubbla order-mejl.
  await assert.doesNotReject(
    fanoutToCacheWarmer({
      rawBody: "{}",
      eventType: "wix.ecom.v1.order.order_paid",
      fetchImpl: mockFetch as unknown as typeof fetch,
    }),
  );
});

test("fanoutToCacheWarmer never throws when cache-warmer returns 5xx", async () => {
  const mockFetch = async () => new Response("oops", { status: 502 });

  await assert.doesNotReject(
    fanoutToCacheWarmer({
      rawBody: "{}",
      eventType: "wix.ecom.v1.order.order_refunded",
      fetchImpl: mockFetch as unknown as typeof fetch,
    }),
  );
});

test("fanoutToCacheWarmer uses default URL when none provided", async () => {
  const previousEnv = process.env.CACHE_WARMER_FANOUT_URL;
  delete process.env.CACHE_WARMER_FANOUT_URL;

  let capturedUrl = "";
  const mockFetch = async (url: string | URL | Request) => {
    capturedUrl = String(url);
    return new Response("ok", { status: 200 });
  };

  try {
    await fanoutToCacheWarmer({
      rawBody: "{}",
      eventType: "wix.ecom.v1.order.order_created",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    assert.equal(
      capturedUrl,
      "https://fyndplats-cache-warmer.vercel.app/api/wix-order",
      "default fallback URL",
    );
  } finally {
    if (previousEnv !== undefined) process.env.CACHE_WARMER_FANOUT_URL = previousEnv;
  }
});

test("fanoutToCacheWarmer honors CACHE_WARMER_FANOUT_URL env var", async () => {
  const previousEnv = process.env.CACHE_WARMER_FANOUT_URL;
  process.env.CACHE_WARMER_FANOUT_URL = "https://override.test/api/wix-order";

  let capturedUrl = "";
  const mockFetch = async (url: string | URL | Request) => {
    capturedUrl = String(url);
    return new Response("ok", { status: 200 });
  };

  try {
    await fanoutToCacheWarmer({
      rawBody: "{}",
      eventType: "wix.ecom.v1.order.order_created",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    assert.equal(capturedUrl, "https://override.test/api/wix-order");
  } finally {
    if (previousEnv === undefined) {
      delete process.env.CACHE_WARMER_FANOUT_URL;
    } else {
      process.env.CACHE_WARMER_FANOUT_URL = previousEnv;
    }
  }
});
