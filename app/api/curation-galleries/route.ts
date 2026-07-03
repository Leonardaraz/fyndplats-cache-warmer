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
export async function GET(req: Request) {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  // Varianthämtningen fan-outar ~1 Wix-anrop per flervalsprodukt (~90 st) och
  // är bara till för audit-verktyget — kräv ?full=1 så ett vanligt anrop stannar
  // vid de ~5 katalogsvepen (skydd mot att en publik träff bränner rate limit).
  const sp = new URL(req.url).searchParams;
  const full = sp.get("full") === "1";
  // ?hidden=1 → returnera ENBART dolda produkter (gamla katalogen) — underlag
  // för media-städning. Dolda produkter är ändå inte hemliga (harmlös metadata).
  const wantHidden = sp.get("hidden") === "1";
  if (!key || !site) {
    return Response.json({ error: "saknar env" }, { status: 500 });
  }
  // Metadata-parametrarna (?files/?trash/?hidden) listar mer än det som redan
  // är publikt på produktsidorna. Sätt CURATION_TOOL_TOKEN i Vercel så krävs
  // ?token=<värdet> för dem (fail-open: utan env behålls dagens öppna beteende
  // så verktyget inte bryts innan env:en är satt).
  const toolToken = process.env.CURATION_TOOL_TOKEN;
  if (toolToken && (sp.get("files") === "1" || sp.get("trash") === "1" || wantHidden)) {
    if (sp.get("token") !== toolToken) {
      return Response.json({ error: "token krävs" }, { status: 401 });
    }
  }
  // ?files=1 → kompakt inventering av filer i Media Manager: id, namn, storlek,
  // mapp. Underlag för föräldralösa-bilder-analysen (metadata, inga skrivvägar).
  // media-root visade sig ha >8000 filer → en enda request hinner inte paga allt
  // inom serverless-timeouten (504). Därför CURSOR-CHUNKAD: varje anrop tar max
  // 40 sidor (4000 filer) och returnerar nextCursor; klienten loopar tills null.
  //   ?files=1                     → mapplistan + första chunken av media-root
  //   ?files=1&folder=<id>         → första chunken av given mapp
  //   ?files=1&folder=<id>&cursor= → fortsättning från cursorn
  if (sp.get("files") === "1") {
    const hdrs = { Authorization: key, "wix-site-id": site };
    const folderId = sp.get("folder") || "media-root";
    const startCursor = sp.get("cursor") || undefined;
    // Mappar under media-root (en nivå räcker — uploads skapar inga djupare träd).
    // Hämtas ALLTID (även på cursor-fortsättningar, +1 billigt anrop) så att
    // folderName inte faller tillbaka till rå mapp-GUID mellan chunkar — samma
    // mapp ska ha samma folder-etikett i hela den ihopsatta inventeringen.
    const folders: { id: string; name: string }[] = [{ id: "media-root", name: "media-root" }];
    try {
      const fres = await fetch("https://www.wixapis.com/site-media/v1/folders?paging.limit=100", {
        headers: hdrs,
        cache: "no-store",
      });
      if (fres.ok) {
        const fdata: any = await fres.json();
        for (const f of fdata?.folders || [])
          if (f?.id) folders.push({ id: f.id, name: f?.displayName || f.id });
      }
    } catch {
      /* mapplistning fail-open: media-root täcker default-uploads */
    }
    const folderName = folders.find((f) => f.id === folderId)?.name || folderId;
    const files: { id: string; name: string; size: number; folder: string }[] = [];
    let cursor: string | undefined = startCursor;
    let nextCursor: string | null = null;
    for (let page = 0; page < 40; page++) {
      const qs = cursor
        ? `paging.cursor=${encodeURIComponent(cursor)}`
        : `parentFolderId=${encodeURIComponent(folderId)}&paging.limit=100`;
      const res = await fetch(`https://www.wixapis.com/site-media/v1/files?${qs}`, {
        headers: hdrs,
        cache: "no-store",
      });
      if (!res.ok) {
        return Response.json(
          { error: `wix ${res.status} (${folderName})`, partial: files.length },
          { status: 502 },
        );
      }
      const data: any = await res.json();
      for (const f of data?.files || []) {
        // Privata filer listas aldrig (rutten är publik; privata uppladdningar
        // ska inte kunna enumereras — de lämnas också orörda av städ-analysen).
        if (f?.id && !f?.private)
          files.push({
            id: f.id,
            name: f?.displayName || "",
            size: Number(f?.sizeInBytes || 0),
            folder: folderName,
          });
      }
      cursor = data?.nextCursor?.cursors?.next || undefined;
      if (!cursor || !data?.nextCursor?.hasNext) {
        cursor = undefined;
        break;
      }
    }
    nextCursor = cursor || null;
    return Response.json(
      { count: files.length, files, nextCursor, folders: startCursor ? undefined : folders },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
    );
  }
  // ?trash=1 → kompakt lista över fil-id:n i Media Managers papperskorg —
  // verifieringsunderlag för media-städningen (id:n är harmlös metadata).
  // CURSOR-CHUNKAD som ?files=1 (max 40 sidor/anrop, nextCursor i svaret):
  // papperskorgen kan hålla >6000 filer under en städrunda, och det gamla
  // 60-sidorstaket trunkerade då tyst — exakt den bugg som bet ?files=1.
  //   ?trash=1            → första chunken
  //   ?trash=1&cursor=<c> → fortsättning tills nextCursor är null
  if (sp.get("trash") === "1") {
    const ids: string[] = [];
    let cursor: string | undefined = sp.get("cursor") || undefined;
    for (let page = 0; page < 40; page++) {
      const qs = cursor
        ? `paging.cursor=${encodeURIComponent(cursor)}`
        : "paging.limit=100";
      const res = await fetch(`https://www.wixapis.com/site-media/v1/trash-bin/files?${qs}`, {
        headers: { Authorization: key, "wix-site-id": site },
        cache: "no-store",
      });
      if (!res.ok) {
        return Response.json({ error: `wix ${res.status}`, partial: ids.length }, { status: 502 });
      }
      const data: any = await res.json();
      for (const f of data?.files || []) if (f?.id) ids.push(f.id);
      cursor = data?.nextCursor?.cursors?.next || undefined;
      if (!cursor || !data?.nextCursor?.hasNext) {
        cursor = undefined;
        break;
      }
    }
    return Response.json(
      { count: ids.length, ids, nextCursor: cursor || null },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
    );
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
        if ((p?.visible === false) !== wantHidden) continue;
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
        out.push({
          id: p.id,
          slug: p.slug || "",
          name: p.name || "",
          revision: String(p.revision || ""),
          items,
          options,
          variants: (p?.variantsInfo?.variants || []) as any[],
        });
      }
      cursor = data?.pagingMetadata?.cursors?.next || undefined;
      if (!cursor || !data?.pagingMetadata?.hasNext) break;
    }
    // Query-endpointen utelämnar variantsInfo — hämta den per produkt (enskild
    // GET inkluderar den) för produkter där länkning är aktuell (något val-par
    // med ≥2 alternativ). Read-only-fält (media, inventoryStatus) skalas bort
    // så listan kan ekas rakt av i en options-PATCH. Begränsad parallelism.
    const needsVariants = full
      ? out.filter(
          (p) => p.options.some((o: any) => (o.choices?.length || 0) >= 2) && !p.variants.length,
        )
      : [];
    const CHUNK = 10;
    for (let i = 0; i < needsVariants.length; i += CHUNK) {
      await Promise.all(
        needsVariants.slice(i, i + CHUNK).map(async (p) => {
          try {
            const res = await fetch(`https://www.wixapis.com/stores/v3/products/${p.id}`, {
              headers: { Authorization: key, "wix-site-id": site },
              cache: "no-store",
            });
            if (!res.ok) return;
            const full: any = (await res.json())?.product;
            p.variants = (full?.variantsInfo?.variants || []).map((v: any) => {
              const { media, inventoryStatus, ...writable } = v || {};
              return writable;
            });
            // Färskast möjliga revision för skrivningar.
            if (full?.revision) p.revision = String(full.revision);
          } catch {
            /* fail-open: variants lämnas tom → produkten hoppas över vid skrivning */
          }
        }),
      );
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message, partial: out.length }, { status: 502 });
  }
  return Response.json(
    { count: out.length, products: out },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
