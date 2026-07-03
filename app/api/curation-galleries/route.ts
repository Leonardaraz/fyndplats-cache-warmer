// GET /api/curation-galleries
//
// Kompakt, läsbar ögonblicksbild av VARJE synlig produkts galleri-ordning +
// revision — underlag för galleri-kurateringen (omordna: foton först,
// infografik sist; rensa leverantörs-reklamblad). Behövs för att V3-produkter
// med fullt media-objekt är för tunga att läsa via begränsade kanaler; den här
// routen kokar ner till just det kurateringen behöver:
//   [{ id, slug, revision, items: [{id, url}, ...], options, variants }]
//
// Utökad för variantbild-auditen: options (val + linkedMedia-id:n) och
// varianter (skrivbara fält, ekas tillbaka vid options-PATCH — Update Product
// kräver hela options+variants-arrayerna tillsammans). Read-only-fält på
// varianten (media, inventoryStatus) skalas bort här så eko-kroppen blir ren.
//
// Medvetet publik: galleriordningen är redan publik på produktsidorna och
// revision är ett harmlöst versionsnummer. Ingen cache (alltid färsk revision
// — skrivningar kräver aktuell revision) + noindex.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) {
    return Response.json({ error: "saknar env" }, { status: 500 });
  }
  const out: any[] = [];
  try {
    let cursor: string | undefined;
    for (let page = 0; page < 12; page++) {
      const res = await fetch("https://www.wixapis.com/stores/v3/products/query", {
        method: "POST",
        headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: ["MEDIA_ITEMS_INFO"],
          query: { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } },
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        return Response.json({ error: `wix ${res.status}`, partial: out.length }, { status: 502 });
      }
      const data: any = await res.json();
      for (const p of data?.products || []) {
        if (p?.visible === false) continue;
        const items: { id: string; url: string }[] = [];
        for (const it of p?.media?.itemsInfo?.items || []) {
          const id = it?.image?.id || it?.id;
          if (typeof id === "string" && id) items.push({ id, url: it?.image?.url || "" });
        }
        // Options: val + länkade bild-id:n (räcker för audit + PATCH-bygge).
        const options = (p?.options || []).map((o: any) => ({
          id: o?.id,
          name: o?.name,
          optionRenderType: o?.optionRenderType,
          key: o?.key,
          choices: (o?.choicesSettings?.choices || []).map((c: any) => ({
            choiceId: c?.choiceId,
            key: c?.key,
            name: c?.name,
            choiceType: c?.choiceType,
            colorCode: c?.colorCode,
            linkedMedia: (c?.linkedMedia || [])
              .map((lm: any) => lm?.image?.id || lm?.id)
              .filter(Boolean),
            linkedMediaUrls: (c?.linkedMedia || [])
              .map((lm: any) => lm?.image?.url || "")
              .filter(Boolean),
          })),
        }));
        // Varianter: exakt det som ska ekas i en options-PATCH — read-only-fält
        // (media, inventoryStatus) bort, resten orört.
        const variants = (p?.variantsInfo?.variants || []).map((v: any) => {
          const { media, inventoryStatus, ...writable } = v || {};
          return writable;
        });
        out.push({
          id: p.id,
          slug: p.slug || "",
          name: p.name || "",
          revision: String(p.revision || ""),
          items,
          options,
          variants,
        });
      }
      cursor = data?.pagingMetadata?.cursors?.next || undefined;
      if (!cursor || !data?.pagingMetadata?.hasNext) break;
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message, partial: out.length }, { status: 502 });
  }
  return Response.json(
    { count: out.length, products: out },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
