// lib/kundvagn-underlag.ts
//
// Underlaget för varukorgens förslag, i Next datacache.
//
// Förslagen beror på varukorgen och räknas därför vid varje förfrågan
// (app/api/kundvagn-forslag). Katalogen de räknas ur ska däremot inte läsas
// från Wix då. getProducts() läser hela katalogen en gång per instans, och på
// en kall instans tog det 62–68 s (förhandsbygget 2026-10-08). Så länge hade
// kunden fått vänta på förslagen. Förut byggdes förslagen i förväg som en
// statisk rutt, och då väntade ingen.
//
// Här ligger bara det förslagen behöver (forslagsUnderlag i
// lib/related-pick.ts): varorna som en regel gäller för och varorna som kan
// föreslås. Det var 3 000 av 3 985 varor och 1,1 MB efter reglerna från
// 2026-10-09 (1 952 och 0,7 MB förut), och Vercels datacache tar högst 2 MB
// per post. Ett utgånget underlag skickas direkt och byggs om i
// bakgrunden. Bara när det saknas helt, till exempel efter en deploy, väntar
// förfrågan på katalogen. Därför hämtar värmningscronen
// (app/api/cron/varm-katalogen) underlaget var 15:e minut, på en instans som
// redan har katalogen i minnet. Saknas det byggs det där.
//
// En degraderad katalog (reservlistan eller en kapad hämtning) kastar inne i
// cachen och sparas aldrig. Anroparen får felet.

import { unstable_cache } from "next/cache";
import { getProducts, katalogenArDegraderad, tillRecoProdukt, type Product, type RecoProduct } from "./products";
import { forslagsUnderlag } from "./related-pick";

/** En vara i underlaget: det varukorgen visar och det urvalet läser. */
export type UnderlagsVara = RecoProduct & Pick<Product, "priceNum" | "inStock" | "popularity" | "imageScore">;

async function byggKundvagnsUnderlag(): Promise<UnderlagsVara[]> {
  const alla = await getProducts();
  if (katalogenArDegraderad(alla)) throw new Error("degraderad katalog, underlaget sparas inte");
  return forslagsUnderlag(alla).map((p) => ({
    ...tillRecoProdukt(p),
    priceNum: p.priceNum,
    inStock: p.inStock,
    popularity: p.popularity,
    imageScore: p.imageScore,
  }));
}

/** Underlaget, högst en timme gammalt. Kastar när katalogen inte gick att läsa. */
// Nyckeln byts när reglerna ändrar vilka varor underlaget ska ha, så att ett
// underlag byggt med de gamla reglerna aldrig läses.
export const hamtaKundvagnsUnderlag = unstable_cache(byggKundvagnsUnderlag, ["kundvagn-underlag-v2"], {
  revalidate: 3600,
});
