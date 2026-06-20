// TEMPORÄR debug-endpoint för att diagnostisera variant-/media-hämtning i prod.
// Kör samma V3-anrop som lib/products.fetchV3ProductRaw (samma WIX_API_KEY) vid
// REQUEST-tid (inte build) och returnerar status + struktur. Inga hemligheter
// exponeras. TA BORT efter felsökning.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") || "1fec3c17-4fff-4261-87c3-a1817c4a2c2e";
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  if (!key) return NextResponse.json({ keyPresent: false });

  const fetchOne = async (qs: string) => {
    try {
      const res = await fetch(`https://www.wixapis.com/stores/v3/products/${pid}${qs}`, {
        headers: { Authorization: key, "wix-site-id": site },
        cache: "no-store",
      });
      const status = res.status;
      let body: unknown = null;
      try { body = await res.json(); } catch {}
      const p = (body as { product?: Record<string, unknown> })?.product;
      const options = (((p as { options?: unknown[] })?.options) || []).map((o: unknown) => {
        const oo = o as { name?: string; choicesSettings?: { choices?: unknown[] } };
        return {
          name: oo?.name,
          choices: (oo?.choicesSettings?.choices || []).map((c: unknown) => {
            const cc = c as { name?: string; linkedMedia?: { image?: { url?: string } }[] };
            return { name: cc?.name, hasLinked: Boolean(cc?.linkedMedia?.[0]?.image?.url) };
          }),
        };
      });
      const media = (p as { media?: { itemsInfo?: { items?: unknown[] }; main?: unknown } })?.media;
      return {
        status,
        hasProduct: Boolean(p),
        mediaItemCount: (media?.itemsInfo?.items || []).length,
        variantCount: (((p as { variantsInfo?: { variants?: unknown[] } })?.variantsInfo?.variants) || []).length,
        options,
        errorBody: status >= 400 ? body : undefined,
      };
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  return NextResponse.json({
    keyPresent: true,
    pid,
    withMediaItemsInfo: await fetchOne("?fields=MEDIA_ITEMS_INFO"),
    defaultFields: await fetchOne(""),
  });
}
