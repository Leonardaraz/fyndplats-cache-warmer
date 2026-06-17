// Hämtar det kundvända ordernumret (t.ex. "10003") för en Wix-order via dess
// interna _id (GUID). Wix headless redirectar till /tack med ?orderId=<GUID>,
// inte det läsbara numret — det ligger på orderns `number`-fält och kräver ett
// API-anrop. Samma auth/endpoint som webhookens fetchWixOrder + lib/order-sync.
// Returnerar null vid valfritt fel (anroparen faller då tillbaka på GUID:t).
export async function fetchWixOrderNumber(orderId: string): Promise<string | null> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site || !orderId) return null;
  try {
    const res = await fetch(
      `https://www.wixapis.com/ecom/v1/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          Authorization: key,
          "wix-site-id": site,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { order?: { number?: unknown } };
    const num = json.order?.number;
    return num != null && String(num).trim() !== "" ? String(num) : null;
  } catch {
    return null;
  }
}
