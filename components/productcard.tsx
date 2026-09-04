import Image from "next/image";
import { PrefetchLink } from "./prefetch-link";
import type { ListProduct } from "../lib/products";
import { WishlistHeart } from "./wishlist";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import { Stars } from "./stars";
import { reviewCountLabel } from "../lib/rating";
import { formatPrice } from "../lib/price-range";

/** `priority` = kortet ligger sannolikt ovanför vikningen. Sätter eager +
 *  fetchPriority=high + preload på huvudbilden. Listsidorna sätter den på de
 *  fyra första korten (se components/shopbrowser). Utan den var VARENDA
 *  produktbild loading="lazy" — mätt på skarp /alla-produkter 2026-09-04: 53
 *  <img>, 48 lazy, 0 eager, 0 fetchpriority=high. Sidans LCP-bild fick alltså
 *  vänta på att layouten skulle räknas ut innan hämtningen ens började. */
export function ProductCard({ p, priority = false }: { p: ListProduct; priority?: boolean }) {
  // Hover-alt-image. Listsidorna skickar den förberäknad (altImg) — att skicka
  // hela gallery[] för 787 produkter kostade 364 kB i klient-payloaden. Övriga
  // ytor skickar fortfarande hela Product, och då plockas den ut här som förut.
  const altImg = p.altImg ?? p.gallery?.find((g) => g !== p.img);
  const lowStock = p.inStock && typeof p.stockQuantity === "number" && p.stockQuantity > 0 && p.stockQuantity <= 5;
  return (
    // next/link, inte <a>: ett vanligt <a> gör en FULL sidladdning — hela appen
    // startas om, all JS parsas och hydreras på nytt. Mätt 2026-08-27 på ett
    // klick i bläddringsraden: navigationstyp "navigate", 1 407 ms till load och
    // 32 förfrågningar utfärdade igen. Med Link byter routern bara ut det
    // segment som ändrats.
    //
    // Ingen förhämtning i vyn — en kategorisida renderar 40+ kort och Links
    // förval hade hämtat RSC-nyttolasten för varenda ett så fort det syns.
    // Men prefetch={false} ensamt gav ingen förhämtning ALLS, inte heller vid
    // hover: varje klick började från noll. PrefetchLink hämtar i stället vid
    // avsikt (pointerenter/touchstart), vilket ger klientruttningen OCH en
    // rutt som redan är på väg när fingret släpper. Se components/prefetch-link.
    <PrefetchLink className="prod" href={`/produkt/${p.slug}`}>
      <div className="pimg">
        {/* Slutsåld-badge: OOS-produkter göms inte från listningarna (default) utan
            visas med badge + dämpad bild så kunden ser dem och kan bevaka. */}
        {!p.inStock && <span className="oos-badge">Slutsåld</span>}
        {p.onSale && p.inStock && <span className="sale-badge">Rea</span>}
        {lowStock && <span className="low-stock-badge">Endast {p.stockQuantity} kvar</span>}
        <WishlistHeart slug={p.slug} />
        {/* Bilderna serveras via den globala loadern (lib/image-loader.ts) direkt
            från Wix CDN med responsiv srcset — ingen /_next/image-optimerare. */}
        {p.img && (
          <Image
            className="pimg-main"
            src={tightFillUrl(p.img, 600, 600)}
            alt={p.name}
            fill
            priority={priority}
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            style={{ objectFit: "cover" }}
          />
        )}
        {altImg && (
          <Image
            className="pimg-alt"
            src={tightFillUrl(altImg, 600, 600)}
            // Dekorativ: samma länk visar redan huvudbilden med alt={p.name} och
            // produktnamnet som text. Med alt här läste skärmläsare namnet två
            // gånger per kort. Tom alt = hoppa över dubbletten.
            alt=""
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="pbody">
        <div className="pname">{p.name}</div>
        {/* Betyget sitter mellan namn och pris: kunden ser vad andra tyckt i
            samma ögonkast som priset, i stället för först efter ett klick in på
            produktsidan.

            Raden renderas BARA när det finns ett betyg. Tidigare renderades den
            alltid, tom, med reserverad höjd — för att priset och knappen annars
            hamnade på olika höjd i grannkorten. Skälet var riktigt men priset
            var ett synligt hål mitt i kortet på ungefär varannan produkt, för
            runt hälften av katalogen saknar omdömen.

            Nu sköts linjeringen i stället av .prow{margin-top:auto} i ett
            flex-kort (se globals.css): pris och knapp sitter i kortets botten
            oavsett vad som finns ovanför. Det linjerar BÄTTRE än reserverad
            höjd gjorde — även när produktnamnen är olika långa — och utan
            tomrum. */}
        {p.rating ? (
          // role="img" + aria-label gör raden till EN uppläsning. Utan den läste
          // skärmläsaren "4,5 av 5 stjärnor · 4,5 · (2)" — värdet två gånger och
          // antalet som ett naket "(2)" utan sammanhang. Barnen döljs därför för
          // hjälpmedel; de är rent visuella.
          <div
            className="prating"
            role="img"
            aria-label={`Betyg ${p.rating.value} av 5, ${reviewCountLabel(p.rating.count)}`}
          >
            <Stars rating={p.rating.exact} className="prating-stars" aria-hidden />
            <span className="prating-val" aria-hidden="true">{p.rating.value}</span>
            <span className="prating-count" aria-hidden="true">({p.rating.count})</span>
          </div>
        ) : null}
        <div className="prow">
          <span className="pprice">
            {/* pprice-now håller "Från X" / priset ihop på en rad (nowrap) så det
                aldrig bryts mitt itu; ett ev. överstruket gammalt pris radbryter
                i stället under, och "Köp"-knappen förblir alltid synlig. */}
            {/* Priset skrivs från talet, inte från Wix färdiga sträng: "1 369 kr"
                i stället för "1369,00kr". Öret är brus när ingen produkt har
                något, och samma formatPrice() driver prisreglagets etiketter —
                så filtret och kortet aldrig kan säga samma pris på två sätt.
                Faller tillbaka på Wix-strängen om talet mot förmodan saknas. */}
            <span className="pprice-now">
              {p.hasRange
                ? `Från ${p.priceFromNum ? formatPrice(p.priceFromNum) : p.priceFrom}`
                : p.priceNum
                  ? formatPrice(p.priceNum)
                  : p.price}
            </span>
            {p.onSale && (p.originalPriceNum || p.originalPrice) && (
              <span className="pprice-old">
                {p.originalPriceNum ? formatPrice(p.originalPriceNum) : p.originalPrice}
              </span>
            )}
          </span>
          {/* Etiketten säger vad knappen GÖR. Hela kortet är en länk till
              produktsidan (se <PrefetchLink className="prod"> ovan) — "Köp" lovade därför
              en handling som inte fanns: trycker man på den händer exakt samma
              sak som överallt annars på kortet. Ett falskt löfte kostar mer än
              det säljer.

              Slutsålt får "Bevaka" i dämpad grå: det är precis vad produktsidan
              erbjuder, och den ska aldrig konkurrera med de köpbara korten.

              Färgen bor i CSS, inte i en inline-stil. Den gamla skrev över
              .pbtn:s bakgrund vid varje rendering, så CSS-regeln var död kod
              som ändå såg ut att gälla. */}
          <span className={`pbtn ${p.inStock ? "" : "pbtn-oos"}`}>
            {p.inStock ? "Visa produkt →" : "Bevaka"}
          </span>
        </div>
      </div>
    </PrefetchLink>
  );
}
