// GET /feed/produktrecensioner.xml
//
// Kundernas egna produktomdömen i Googles format för produktbetyg (Merchant
// Center → Tillväxt → Hantera program → Produktbetyg → Flöden). Varför och
// hur: lib/feed/produktrecensioner.ts.
//
// Omdömena kommer från motorns /api/review-customer (bara förstahands-
// omdömen, bara godkända), produktkopplingen från Google-flödet — samma
// katalog, samma variant-id och samma länkar som Merchant Center redan har.
//
// ☠️ DYNAMISK MED CDN-CACHE, INTE ISR. Med `revalidate` hade flödet byggts
// vid deployen, och föll motorn då hade bygget antingen fallerat eller — värre
// — cachat ett tomt flöde. Ett tomt flöde säger till Google att alla omdömen
// försvunnit. Därför: läser motorn inte, svarar vi 503 och Google behåller det
// den har tills nästa hämtning.

import { GET as googleFeed } from "../google.xml/route";
import { getProducts } from "@/lib/products";
import { SITE } from "@/lib/site-urls";
import {
  byggRecensionsflode,
  produkterUrGoogleflodet,
  type EgetOmdome,
  type FlodesProdukt,
} from "@/lib/feed/produktrecensioner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KALLA =
  process.env.CACHE_WARMER_CUSTOMER_REVIEWS_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/review-customer";

async function hamtaOmdomen(): Promise<EgetOmdome[] | null> {
  try {
    const res = await fetch(KALLA, { cache: "no-store" });
    if (!res.ok) {
      console.error(`[produktrecensioner] motorn svarade ${res.status}`);
      return null;
    }
    const body = (await res.json()) as { ok?: boolean; omdomen?: unknown };
    // Saknat fält = fel rutt eller fel form, inte "inga omdömen".
    if (!body?.ok || !Array.isArray(body.omdomen)) {
      console.error("[produktrecensioner] svar utan omdomen-lista");
      return null;
    }
    return body.omdomen as EgetOmdome[];
  } catch (err) {
    console.error("[produktrecensioner] motorn gick inte att nå:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Google-flödet, helst ur CDN-cachen: att bygga det från början tar runt 45 s
 * på en kall instans (uppmätt lokalt), den cachade kopian en sekund. Faller
 * hämtningen byggs det här.
 */
async function googleflodet(): Promise<string> {
  try {
    const res = await fetch(`${SITE}/feed/google.xml`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const xml = await res.text();
      if (xml.includes("<item>")) return xml;
    }
  } catch { /* faller tillbaka nedan */ }
  return (await googleFeed()).text();
}

export async function GET() {
  const omdomen = await hamtaOmdomen();
  if (!omdomen) {
    return new Response("Omdömena gick inte att läsa just nu.", {
      status: 503,
      headers: { "Retry-After": "3600", "Cache-Control": "no-store" },
    });
  }

  // Googles schema kräver minst ett omdöme. Ett tomt flöde hade dessutom
  // kunnat läsas som "alla omdömen borta" — hellre ett fel Google försöker om.
  if (omdomen.length === 0) {
    return new Response("Inga godkända kundomdömen ännu.", {
      status: 503,
      headers: { "Retry-After": "86400", "Cache-Control": "public, s-maxage=3600" },
    });
  }

  const produkter = produkterUrGoogleflodet(await googleflodet());
  // En vara som fått omdömen men inte står i Google-flödet (t.ex. slutsåld)
  // får ändå sitt omdöme med, kopplat på produktens eget id och sida.
  const saknas = omdomen.some((o) => !produkter.has(o.productId));
  if (saknas) {
    for (const p of await getProducts()) {
      if (!p.id || produkter.has(p.id)) continue;
      const rad: FlodesProdukt = { skus: [p.id], name: p.name, url: `${SITE}/produkt/${p.slug}` };
      produkter.set(p.id, rad);
    }
  }

  const { xml, antal, bortfall } = byggRecensionsflode(omdomen, produkter, {
    butik: "Fyndplats",
    favicon: `${SITE}/favicon.ico`,
    varumarke: "Fyndplats",
  });
  if (bortfall.length) {
    console.warn(`[produktrecensioner] kunde inte skickas: ${JSON.stringify(bortfall)}`);
  }
  console.log(`[produktrecensioner] omdömen i flödet: ${antal}`);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
