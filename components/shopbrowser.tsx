"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ProductCard } from "./productcard";
import { PrefetchLink } from "./prefetch-link";
import { currentDayMs, orderRecommended, orderPopular } from "../lib/sort-products";
import { colorLabel, colorOf, fargNycklar } from "../lib/variant-color-image";
import { universalCollectionIds } from "../lib/related-pick";
import {
  formatPrice,
  parsePriceSlug,
  priceBounds,
  priceRangeLabel,
  prisHistogram,
  priceSlug,
  upperLimit,
  type PriceBounds,
} from "../lib/price-range";
import type { ListProduct } from "../lib/products";
import {
  FACETTER, formatTal, inomIntervall, lasSpecSlug, passarVal, specEtikett, specOvre, specSlug, specUndre,
  type IntervallNyckel, type SpecFacett,
} from "../lib/spec-facets";
import type { ListaInfo } from "../lib/list-pages";
import { productCountLabel, tusental } from "../lib/rating";
import { spelaUppTidigaKlick } from "../lib/tidiga-klick";
import { rullaDirekt } from "./use-landa-vid-bilder";
import { komMedHistoriken, lasListlage, sparaListlage, type Fonster, type Listlage } from "../lib/sidminne";

// Hur många kort vi renderar initialt + per "Visa fler"-klick. Re-audit
// (2026-05-31): /alla-produkter renderade alla 207 produkter (≈411 <img>) på en
// gång → layout-arbete för hundratals kort frös scrollen. Vi paginerar till en
// hanterbar batch och håller DOM:en liten tills användaren ber om mer.
const PAGE_SIZE = 24;
// Underkategori-chips som syns på dator innan "Visa alla" — två rader på
// 1200 px. Mobilen visar alla i en rad man sveper i sidled.
const SUB_SYNLIGA = 10;

// Hela listan och bildkartan, sparade för resten av besöket. Bakåt från en
// produkt monterar om vyn i samma dokument, och med listan redan här står
// korten från "Visa fler" på plats i första renderingen. Se lib/sidminne.ts.
const LISTOR = new Map<string, ListProduct[]>();
let BILDKARTA: Record<string, [string, string | null]> | null = null;

/**
 * Handtagens startläge, ur URL:ens ?pris. Skalan (lib/price-range) räknas ur de
 * produkter som visas, så en delad länk kan peka på ett spann som inte längre
 * finns på banan — t.ex. det gamla ?pris=under-100 när billigaste produkten
 * kostar 199 kr. Överlappar intervallet inte skalan alls behandlas det som
 * inget filter: produkterna det syftade på finns inte, och ett reglage som
 * står och klämmer ihop sig i ena änden förklarar ingenting för kunden.
 */
function handlesFromSlug(bounds: PriceBounds | null, slug: string | null): [number, number] {
  if (!bounds) return [0, 0];
  const r = parsePriceSlug(slug);
  if (!r || r.max <= bounds.min || r.min >= bounds.max) return [bounds.min, bounds.max];
  // Inget steg: en inskriven gräns ("högst 1 499 kr") ska stå kvar som den skrevs.
  const snap = (v: number) => Math.min(Math.max(Math.round(v), bounds.min), bounds.max);
  const lo = snap(r.min);
  const hi = Number.isFinite(r.max) ? snap(r.max) : bounds.max;
  return lo < hi ? [lo, hi] : [bounds.min, bounds.max];
}

const SORTS = [
  // "img" heter "Rekommenderat" utåt och är butikens egen mix (bästsäljare +
  // färskhets-skjuts + REA-knuff — se lib/sort-products). URL-värdet "img" är
  // kvar av bakåtkompatibilitet med delade länkar; bildpoängen den en gång
  // sorterade på var 60 för samtliga produkter → tre val gav samma ordning
  // (Leonard 2026-08-08).
  { v: "img", label: "Rekommenderat" },
  // "new" = nyast importerade först (createdAt desc). Var standard på
  // /alla-produkter 2026-06-14 → 2026-08-21; numera valbart, inte förvalt.
  // Hela katalogen är importerad juni–augusti 2026, så ordningen särskilde
  // knappt något — Rekommenderat är standard överallt nu.
  { v: "new", label: "Nyast" },
  { v: "pop", label: "Populärast" },
  { v: "price-asc", label: "Pris: lågt → högt" },
  { v: "price-desc", label: "Pris: högt → lågt" },
  { v: "name", label: "Namn: A–Ö" },
];
// "Bäst match" = listans egen ordning, dvs. den relevansordning söksidan redan
// räknat fram. Finns bara där den är förvald (defaultSort "rel", /sok) — på en
// kategorisida vore den en slumpmässig katalogordning.
const REL_SORT = { v: "rel", label: "Bäst match" };
const SORT_VALUES = new Set([...SORTS, REL_SORT].map((s) => s.v));

/** Underkategori till den kategori sidan visar — chips i filterpanelen. */
export type SubCategory = { name: string; slug: string; count: number; bild?: string };

/**
 * `products` är HELA listan — utom när `lista` är satt. Då är `products` bara
 * de första korten i visningsordning, `lista.oversikt` beskriver hela listan
 * för filterpanelen, och resten hämtas från `lista.url` när kunden behöver den
 * (se lib/list-pages.ts). Listsidorna använder det senare; /sok det förra.
 */
export function ShopBrowser({ products, defaultSort = "img", subs = [], dayMs, lista, facetter }: { products: ListProduct[]; defaultSort?: string; subs?: SubCategory[]; dayMs?: number; lista?: ListaInfo; facetter?: SpecFacett[] }) {
  // Vyn ritas med en TOM adress både på servern och i webbläsarens första
  // rendering, så att sidan hydreras som den är. Adressen läses först efter
  // monteringen, och bara om den har parametrar ritas vyn om med dem.
  //
  // Tidigare låg vyn bakom useSearchParams i en Suspense-gräns. På de statiska
  // kategorisidorna fick gränsen då BAILOUT_TO_CLIENT_SIDE_RENDERING: React
  // kastade serverns 24 kort vid hydreringen och ritade nya <img>. Lighthouse
  // på /kategori/mobler (mobil, 2026-10-01): bilden var nedladdad efter 1,6 s
  // men syntes först efter 6,9 s (LCP "render delay" 5,3 s).
  //
  // Det vanliga fallet är en adress utan filterparametrar, och då händer
  // ingenting mer. Med dem (en delad filterlänk, bakåt till ett filtrerat läge)
  // monteras vyn om före första målningen; dess URL-effekt hinner då tömma
  // adressen, men den är redan läst och skrivs tillbaka av den nya vyn.
  const props = { products, defaultSort, dayMs, lista, facetter };
  const [adress, setAdress] = useState<{ sp: Adress; n: number }>({ sp: TOM_ADRESS, n: 0 });
  useLayoutEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // Bara parametrar som vyn läser. Annonsernas gclid/utm och sökordet på
    // /sok (q) ändrar inget i vyn och ska inte rita om korten.
    const lases = ["sortera", "pris", "farg", "lager", "rea", ...Object.values(FACETTER).map((f) => f.param)];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adressen finns först i webbläsaren; servern och första renderingen måste vara lika
    if (lases.some((namn) => q.has(namn))) setAdress({ sp: q, n: 1 });
  }, []);
  return (
    <>
      <SubNav subs={subs} />
      <ShopBrowserVy key={`${lista?.url ?? ""}#${adress.n}`} {...props} sp={adress.sp} />
    </>
  );
}

type Adress = { get(namn: string): string | null };
const TOM_ADRESS: Adress = { get: () => null };

// Chipsen behöver ingen URL-state, och en länk som ska räknas ska finnas i
// HTML:en från början (CLAUDE.md, "Länkar som bara renderas vid hovring…").
function SubNav({ subs }: { subs: SubCategory[] }) {
  const [allaSubs, setAllaSubs] = useState(false);
  if (!subs.length) return null;
  // Underkategorier som LÄNKAR, inte klientfilter. Kategorisidorna
  // länkade tidigare bara till syskonavdelningar, aldrig till sina egna
  // barn — de sidorna låg i sitemapen utan en enda intern länk. Som chips
  // här får kunden en genväg och crawlern en väg in, med samma antal som
  // målsidan faktiskt visar.
  //
  // EGEN RAD, INTE I FILTERPANELEN (Leonard 2026-09-25: "mycket död
  // yta"). I panelen blev de en smal kolumn på dator — tretton rader chips
  // bredvid pris och färg — och på mobil en lång lista man fick scrolla
  // förbi innan filtren. Nu: på mobil en rad man sveper i sidled, alltid
  // synlig ovanför filterknappen; på dator hela bredden, de första
  // SUB_SYNLIGA och resten bakom "Visa alla" (dolda med CSS, inte villkorligt
  // renderade).
  return (
    <nav className={`subnav ${allaSubs ? "alla" : ""}`} aria-label="Underkategorier">
      <span className="filter-label subnav-label">Förfina</span>
      <div className="subchips">
        {subs.map((sub, i) => (
          // PrefetchLink: sidan byts inom dokumentet, så sidhuvudet står still
          // och inget blankt mellanläge syns (en vanlig <a> laddade om allt).
          <PrefetchLink key={sub.slug} className={`subchip ${sub.bild ? "subchip-med-bild" : ""} ${i >= SUB_SYNLIGA ? "subchip-mer" : ""}`} href={`/kategori/${sub.slug}`}>
            {sub.bild && <Image src={sub.bild} alt="" width={32} height={32} className="subchip-bild" />}
            {sub.name} <span className="subchip-n">{tusental(sub.count)}</span>
          </PrefetchLink>
        ))}
        {subs.length > SUB_SYNLIGA && (
          <button type="button" className="subchip subchip-fler" aria-expanded={allaSubs}
            onClick={() => setAllaSubs((v) => !v)}>
            {allaSubs ? "Visa färre" : `Visa alla ${subs.length}`}
          </button>
        )}
      </div>
    </nav>
  );
}

function ShopBrowserVy({ products, defaultSort, dayMs: dayMsProp, lista, facetter, sp }: { products: ListProduct[]; defaultSort: string; dayMs?: number; lista?: ListaInfo; facetter?: SpecFacett[]; sp: Adress }) {
  const pathname = usePathname();

  // Initialt filter-/sorterings-tillstånd läses EN gång ur URL:en (delbar länk).
  const [sort, setSort] = useState(() => {
    const s = sp.get("sortera");
    return s && SORT_VALUES.has(s) && (s !== "rel" || defaultSort === "rel") ? s : defaultSort;
  });
  // Prisreglagets skala härleds ur produkterna i vyn. null = spridningen är för
  // liten för att ett reglage ska hjälpa någon (t.ex. tre sökträffar) → inget
  // prisfilter renderas alls.
  //
  // Med `lista` räknas skalan på servern ur HELA listan (lib/list-overview) —
  // de kort sidan bär är bara början, och en skala ur dem hade flyttat sig när
  // resten kom.
  const ov = lista?.oversikt;
  const bounds = useMemo(() => (ov ? ov.bounds : priceBounds(products)), [ov, products]);
  // Handtagen är källan; slugen härleds ur dem. URL:en skrivs först när
  // handtaget släpps (commitPrice) — annars hade varje pixel i draget blivit
  // en URL-skrivning.
  const [handles, setHandles] = useState<[number, number]>(() => handlesFromSlug(bounds, sp.get("pris")));
  const [urlPrice, setUrlPrice] = useState(() => {
    const h = handlesFromSlug(bounds, sp.get("pris"));
    return bounds ? priceSlug(h[0], h[1], bounds) : "";
  });
  // Valda färger, ELLER mellan dem ("svart eller grå"). Rutor med namn och
  // antal, som hos IKEA, Mio och Chilli (jämförelsen 2026-09-27) — skenan
  // kunde bara välja en färg åt gången. En äldre länk med ?farg=svart läses
  // som en färg.
  const [colors, setColors] = useState<string[]>(() => [...new Set((sp.get("farg") ?? "").split(",").filter(Boolean))]);
  const colorStr = colors.join(",");
  const vaxlaFarg = (k: string) => setColors((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  const [allaFarger, setAllaFarger] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(() => sp.get("lager") === "1");
  const [onlyOnSale, setOnlyOnSale] = useState(() => sp.get("rea") === "1");

  // ── Mått och egenskaper (lib/spec-facets.ts) ───────────────────────────────
  //
  // Kategorisidan skickar de filter som ska visas, räknade på servern ur hela
  // listan (skala och staplar). Varje reglage fungerar som prisets: handtagen
  // (`specHandtag`) följer fingret och räknaren följer med live, medan
  // rutnätet och URL:en följer det SLÄPPTA läget (`specValt`) — annars skakar
  // sidan under draget (se prisreglaget nedan).
  //
  // En produkt utan värdet försvinner bara när just det filtret används. Det
  // skrivs inte ut hur många det gäller (Leonard 2026-09-27).
  const intervallF = useMemo(
    () => (facetter ?? []).filter((f): f is Extract<SpecFacett, { skala: unknown }> => "skala" in f),
    [facetter],
  );
  // Knappgrupperna: material, klädsel, djur, egenskaper, antal …
  const valF = useMemo(
    () => (facetter ?? []).filter((f): f is Extract<SpecFacett, { val: unknown }> => "val" in f),
    [facetter],
  );
  const [specHandtag, setSpecHandtag] = useState<Record<string, [number, number]>>(() =>
    Object.fromEntries(intervallF.map((f) => [f.nyckel, lasSpecSlug(sp.get(FACETTER[f.nyckel].param), f.skala)])),
  );
  const [specValt, setSpecValt] = useState<Record<string, string>>(() =>
    Object.fromEntries(intervallF.map((f) => [f.nyckel, specSlug(...lasSpecSlug(sp.get(FACETTER[f.nyckel].param), f.skala), f.skala)])),
  );
  // Valda knappar per grupp, som koder. Material, klädsel, djur … är ELLER
  // mellan valen ("trä eller metall"), egenskaperna OCH ("hjul och höj- och
  // sänkbar") — gruppen säger vilket (`och`). I URL:en står slugs.
  const [val, setVal] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(valF.map((f) => {
      const slugs = new Set((sp.get(FACETTER[f.nyckel].param) ?? "").split(","));
      return [f.nyckel, f.val.filter((v) => slugs.has(v.slug)).map((v) => v.kod)];
    })),
  );
  const valStr = valF.map((f) => (val[f.nyckel] ?? []).join(",")).join("|");
  const valAktiva = valF.filter((f) => val[f.nyckel]?.length).length;
  const vaxla = (nyckel: string, kod: string) => setVal((v) => {
    const nu = v[nyckel] ?? [];
    return { ...v, [nyckel]: nu.includes(kod) ? nu.filter((k) => k !== kod) : [...nu, kod] };
  });
  const specHandtagRef = useRef(specHandtag);
  const satSpec = (k: string, h: [number, number]) => {
    specHandtagRef.current = { ...specHandtagRef.current, [k]: h };
    setSpecHandtag(specHandtagRef.current);
  };
  const commitSpec = useCallback((k: string) => {
    const f = intervallF.find((x) => x.nyckel === k);
    const h = specHandtagRef.current[k];
    if (!f || !h) return;
    setSpecValt((v) => ({ ...v, [k]: specSlug(h[0], h[1], f.skala) }));
  }, [intervallF]);
  // Gränserna att filtrera på, ur handtagen (live) eller det släppta läget.
  const specGranser = useCallback((kalla: "live" | "valt") => {
    const ut: { k: IntervallNyckel; lo: number; hi: number }[] = [];
    for (const f of intervallF) {
      const [lo, hi] = kalla === "live"
        ? specHandtag[f.nyckel] ?? [f.skala.min, f.skala.max]
        : lasSpecSlug(specValt[f.nyckel], f.skala);
      if (lo <= f.skala.min && hi >= f.skala.max) continue;
      ut.push({ k: f.nyckel, lo: specUndre(lo, f.skala), hi: specOvre(hi, f.skala) });
    }
    return ut;
  }, [intervallF, specHandtag, specValt]);
  const specLive = useMemo(() => specGranser("live"), [specGranser]);
  const specSlappt = useMemo(() => specGranser("valt"), [specGranser]);
  const passarSpec = (p: ListProduct, granser: { k: IntervallNyckel; lo: number; hi: number }[]) => {
    for (const g of granser) if (!inomIntervall(p.spec, g.k, g.lo, g.hi)) return false;
    for (const f of valF) if (!passarVal(p.spec, f.nyckel, val[f.nyckel] ?? [], f.och)) return false;
    return true;
  };
  const specValtStr = intervallF.map((f) => specValt[f.nyckel] ?? "").join("|");

  const [open, setOpen] = useState(false); // mobile-collapsible filter panel

  // ── Hela listan, när sidan bara bär början av den ─────────────────────────
  //
  // Listsidorna skickar de första korten i HTML:en och resten från /api/lista
  // (lib/list-pages.ts). `alla` är null tills den kommit. Utan `lista` är
  // `products` redan hela listan och inget hämtas.
  const [hamtad, setHamtad] = useState<ListProduct[] | null>(null);
  // true när tre försök i rad misslyckats — då visas "Försök igen" i stället
  // för ett rutnät som väntar på något som inte kommer.
  const [listaFel, setListaFel] = useState(false);
  const alla = lista ? hamtad : products;
  const listaBegard = useRef(false);
  const listaUrl = lista?.url;
  const hamtaLista = useCallback(() => {
    if (!listaUrl || listaBegard.current) return;
    listaBegard.current = true;
    setListaFel(false);
    // Tre försök med växande paus. Knappen "Visa fler" är låst medan kunden
    // väntar på listan, så ett enda misslyckat anrop hade annars lämnat den
    // låst. Går alla tre fel visas "Försök igen" (se listaFel).
    const forsok = (n: number) => {
      fetch(listaUrl)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: ListProduct[]) => { LISTOR.set(listaUrl, d); setHamtad(d); })
        .catch(() => {
          if (n < 3) window.setTimeout(() => forsok(n + 1), 1500 * n);
          else { listaBegard.current = false; setListaFel(true); }
        });
    };
    forsok(1);
  }, [listaUrl]);

  // Sync state → URL. Bygger på window.location.search så befintliga params
  // (t.ex. ?kategori på /alla-produkter) bevaras. Kör vid mount men skriver bara
  // om URL:en faktiskt skiljer sig → ingen onödig history-replace eller loop.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (sort !== defaultSort) params.set("sortera", sort); else params.delete("sortera");
    if (urlPrice) params.set("pris", urlPrice); else params.delete("pris");
    if (colorStr) params.set("farg", colorStr); else params.delete("farg");
    if (onlyInStock) params.set("lager", "1"); else params.delete("lager");
    if (onlyOnSale) params.set("rea", "1"); else params.delete("rea");
    for (const f of intervallF) {
      const v = specValt[f.nyckel];
      if (v) params.set(FACETTER[f.nyckel].param, v); else params.delete(FACETTER[f.nyckel].param);
    }
    for (const f of valF) {
      const valda = val[f.nyckel] ?? [];
      const slugs = f.val.filter((v) => valda.includes(v.kod)).map((v) => v.slug).join(",");
      if (slugs) params.set(FACETTER[f.nyckel].param, slugs); else params.delete(FACETTER[f.nyckel].param);
    }
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    const current = window.location.pathname + window.location.search;
    // history.replaceState, inte router.replace. Den senare hämtade en ny
    // RSC-nyttolast för sidan vid varje filterval — ett funktionsanrop per klick
    // för sökparametrar som ingen serverkomponent läser — och när den kom
    // tillbaka rullade sidan upp till innehållets topp trots scroll:false
    // (uppmätt: 747 → 180 px efter ett klick på "Rea"). Next 16 synkar
    // useSearchParams med den inbyggda historiken, så inget annat behöver ändras.
    if (url !== current) window.history.replaceState(null, "", url);
  }, [sort, urlPrice, colorStr, onlyInStock, onlyOnSale, pathname, intervallF, specValt, valF, val]);

  // Prisfiltrets gränser. Handtagen filtrerar direkt (räknaren följer med under
  // draget); URL:en hinner ikapp när man släpper.
  const priceLo = bounds ? handles[0] : 0;
  const priceHi = bounds ? upperLimit(handles[1], bounds) : Infinity;
  const priceActive = Boolean(bounds && priceSlug(handles[0], handles[1], bounds));

  // Färgfacetten. Nycklarna hängs på server-side (lib/product-colors) och
  // saknas helt när Wix-nyckeln inte är satt — då blir listan tom och gruppen
  // renderas inte alls.
  // Minst två distinkta färger, annars är det inget att välja mellan.
  const colorKeys = useMemo(() => (ov ? ov.farger.map(([k]) => k) : fargNycklar(products)), [ov, products]);
  // Antalet räknas ur listan filtrerad på de ANDRA facetterna.
  // Drar man i prisreglaget ändras färgernas antal; väljer man en färg gör de
  // det inte. Utan siffran hade kunden fått upptäcka efter klicket att bara en
  // bråkdel av sortimentet har en färg angiven alls.
  //
  // Innan hela listan kommit gäller sammanfattningens antal — men bara utan
  // andra filter. Med filter vet vi inte, och då visas inget hellre än fel
  // siffra (null → "…").
  const colorCounts = useMemo(() => {
    if (!alla) return ov && !priceActive && !onlyInStock && !onlyOnSale && !specLive.length && !valAktiva ? new Map(ov.farger) : null;
    const antal = new Map<string, number>();
    for (const p of alla) {
      if (p.priceNum < priceLo || p.priceNum >= priceHi) continue;
      if (onlyInStock && !p.inStock) continue;
      if (onlyOnSale && !p.onSale) continue;
      if (!passarSpec(p, specLive)) continue;
      for (const k of p.colors || []) antal.set(k, (antal.get(k) ?? 0) + 1);
    }
    return antal;
    // passarSpec läser bara specLive och valen (valStr), som står i listan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alla, ov, priceActive, priceLo, priceHi, onlyInStock, onlyOnSale, specLive, valStr]);
  // Rutorna: de vanligaste först, resten bakom "Visa alla".
  const FARGER_SYNS = 10;
  // En vald färg syns alltid, även om den ligger bortom de första.
  const synligaFarger = allaFarger ? colorKeys : colorKeys.filter((k, i) => i < FARGER_SYNS || colors.includes(k));

  // Prisfördelningen som histogram bakom reglaget. Räknas ur HELA listan i vyn
  // och står därför stilla när man filtrerar: räknades den om per filter hade
  // landskapet rört sig under fingret, och då går det inte att sikta.
  // Kvadratroten på höjden ger de glesa facken synlig närvaro utan att pucklen
  // trycker ner dem till en osynlig strimma.
  // Själva uträkningen bor i lib/price-range, så serverns sammanfattning
  // (lib/list-overview) och den här ger samma staplar.
  const hist = useMemo(() => (ov ? ov.hist : prisHistogram(products, bounds)), [ov, products, bounds]);

  // Släpp ALLTID draget, även när musen släpps utanför reglaget: rutnätet
  // uppdateras först vid släppet (se `list` nedan), så ett missat pointerup
  // hade lämnat det i det gamla läget. Refen bär handtagens senaste värde till
  // lyssnaren på window, som annars hade sett renderingens gamla closure.
  const handlesRef = useRef(handles);
  const commitPrice = useCallback(() => {
    const [lo, hi] = handlesRef.current;
    setUrlPrice(bounds ? priceSlug(lo, hi, bounds) : "");
  }, [bounds]);
  const armPrice = () => window.addEventListener("pointerup", commitPrice, { once: true });
  const satHandles = (h: [number, number]) => {
    handlesRef.current = h;
    setHandles(h);
  };
  const dragLo = (v: number) => {
    const [, hi] = handlesRef.current;
    satHandles([Math.min(v, hi - (bounds?.step ?? 1)), hi]);
  };
  const dragHi = (v: number) => {
    const [lo] = handlesRef.current;
    satHandles([lo, Math.max(v, lo + (bounds?.step ?? 1))]);
  };

  // RUTNÄTET FÖLJER DET SLÄPPTA LÄGET, INTE HANDTAGET. Förr filtrerades det
  // för varje steg i draget. Sidan blev då kortare och längre under musen, och
  // när den krympte under scrollpositionen hoppade webbläsaren upp och tog
  // reglaget med sig: "hela sidan skakar" (Leonard 2026-09-25, Utemöbler, drag
  // från högsta priset nedåt). Räknaren och histogrammet följer handtaget
  // live; produkterna byts när man släpper. Samma sak för färgskenan.
  const [valtLo, valtHi] = useMemo(() => handlesFromSlug(bounds, urlPrice), [bounds, urlPrice]);
  const listLo = bounds ? valtLo : 0;
  const listHi = bounds ? upperLimit(valtHi, bounds) : Infinity;
  const utanFilter = !priceActive && !colors.length && !onlyInStock && !onlyOnSale && !specLive.length && !valAktiva;
  // null = okänt just nu (filter valt innan hela listan kommit).
  const liveCount = useMemo(() => {
    if (!alla) return utanFilter && ov ? ov.antal : null;
    let n = 0;
    for (const p of alla) {
      if (p.priceNum < priceLo || p.priceNum >= priceHi) continue;
      if (colors.length && !p.colors?.some((k) => colors.includes(k))) continue;
      if (onlyInStock && !p.inStock) continue;
      if (onlyOnSale && !p.onSale) continue;
      if (!passarSpec(p, specLive)) continue;
      n++;
    }
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alla, ov, utanFilter, priceLo, priceHi, colorStr, onlyInStock, onlyOnSale, specLive, valStr]);

  // Antalet bakom varje knapp, räknat som färgernas: listan filtrerad på allt
  // UTOM gruppens egna val, så siffran säger vad ett klick ger ("Sammet 46").
  // Egenskaperna är OCH, där räknas gruppens val med. En knapp som ger noll
  // tonas ned. Utan hela listan visas inga siffror hellre än fel.
  const valAntal = useMemo(() => {
    if (!alla) return null;
    const ut = new Map<string, Map<string, number>>();
    for (const f of valF) {
      const antal = new Map<string, number>();
      for (const p of alla) {
        if (p.priceNum < priceLo || p.priceNum >= priceHi) continue;
        if (colors.length && !p.colors?.some((k) => colors.includes(k))) continue;
        if (onlyInStock && !p.inStock) continue;
        if (onlyOnSale && !p.onSale) continue;
        if (specLive.some((g) => !inomIntervall(p.spec, g.k, g.lo, g.hi))) continue;
        if (valF.some((g) => (g !== f || g.och) && !passarVal(p.spec, g.nyckel, val[g.nyckel] ?? [], g.och))) continue;
        for (const v of f.val) if (passarVal(p.spec, f.nyckel, [v.kod], false)) antal.set(v.kod, (antal.get(v.kod) ?? 0) + 1);
      }
      ut.set(f.nyckel, antal);
    }
    return ut;
    // colors och val står i colorStr och valStr.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alla, valF, priceLo, priceHi, colorStr, onlyInStock, onlyOnSale, specLive, valStr]);

  // Standardläget: förvald sortering och inga filter — det sidans HTML visar.
  const arStandard = sort === defaultSort && !urlPrice && !colors.length && !onlyInStock && !onlyOnSale && !specSlappt.length && !valAktiva;

  const list = useMemo(() => {
    // Innan hela listan kommit finns bara sidans egna kort att visa.
    if (!alla) return products;
    let out = alla.filter((p) => p.priceNum >= listLo && p.priceNum < listHi);
    if (colors.length) out = out.filter((p) => p.colors?.some((k) => colors.includes(k)));
    if (onlyInStock) out = out.filter((p) => p.inStock);
    if (onlyOnSale) out = out.filter((p) => p.onSale);
    if (specSlappt.length || valAktiva) out = out.filter((p) => passarSpec(p, specSlappt));
    // Dag-upplösning på "nu" så server- och klientrendering ger samma ordning
    // (sekund-precision hade gett hydration-hopp i Rekommenderat-poängen).
    //
    // dayMs KOMMER HELST FRÅN SERVERN. En sida som förberäknar ordningen och
    // sedan ISR-cachas (app/alla-produkter) kan servera HTML byggd med gårdagens
    // dag i upp till `revalidate`. Räknade klienten då ut sin egen dag skulle
    // rutnätet sorteras om vid hydrering — uppmätt över 870 produkter med
    // katalogens verkliga signalprofil: 25,9 % byter plats, största hopp 60
    // platser, och de 24 som syns utan att scrolla ändras. Orsaken är att
    // färskhets-poängen (2·e^(−ålder/14)) krymper med tiden medan rea- och
    // omdömespoängen står stilla — bara åldern varierar ger 0 % omkastning.
    // Sidor som INTE förberäknar (t.ex. /kategori, /sok) skickar inget och får
    // klientens egen dag, precis som förut.
    const dayMs = dayMsProp ?? currentDayMs();
    // Rekommenderat blandar kategorier; Populärast rankar produkter med
    // signal (egna sälj + omdömen) rakt av och blandar bara svansen (Leonard
    // 2026-08-16 resp. 2026-08-18). Omdömessignalen läses ur p.rating, som
    // serverkomponenterna hängt på via attachRatings INNAN listan når hit —
    // saknas den är signalen 0 och ordningen faller tillbaka på kategori-
    // blandning + nyhet. Ordningarna är rena funktioner i lib/sort-products —
    // där ligger också mätningarna, vikterna och testerna.
    const universal = universalCollectionIds(alla);
    if (sort === "img") out = orderRecommended(out, universal, dayMs);
    else if (sort === "pop") out = orderPopular(out, universal);
    else if (sort === "new") out = [...out].sort((a, z) => (z.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(z.id ?? "")));
    else if (sort === "price-asc") out = [...out].sort((a, z) => a.priceNum - z.priceNum);
    else if (sort === "price-desc") out = [...out].sort((a, z) => z.priceNum - a.priceNum);
    else if (sort === "name") out = [...out].sort((a, z) => a.name.localeCompare(z.name, "sv"));
    // KORTEN SOM REDAN STÅR FLYTTAS INTE. Sidan och /api/lista räknar samma
    // lista med samma dag, men de cachas var för sig och kan vara byggda från
    // olika ögonblick av katalogen. I standardläget står därför sidans egna kort
    // kvar först, i sin ordning, och listan fyller på bakom dem.
    if (lista && arStandard) {
      const forst = new Set(products.map((p) => p.slug));
      out = [...products, ...out.filter((p) => !forst.has(p.slug))];
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alla, products, lista, arStandard, sort, listLo, listHi, colorStr, onlyInStock, onlyOnSale, dayMsProp, specSlappt, valStr]);

  // Finns det något slutsålt alls i den här listan? Styr om "I lager"-reglaget
  // är meningsfullt (se markupen nedan). Räknas ur datan, inte ur env-flaggan,
  // så det stämmer per sida: kategori = nej, sökresultat = ofta ja.
  const hasOos = useMemo(() => (ov ? ov.harSlutsalda : products.some((p) => !p.inStock)), [ov, products]);
  // En dold reglage får inte spöka i filterräknaren ("1 aktivt filter" utan att
  // något syns) om en gammal delad länk bär ?lager=1.
  const activeFilters = (priceActive ? 1 : 0) + (colors.length ? 1 : 0) + (onlyInStock && hasOos ? 1 : 0) + (onlyOnSale ? 1 : 0)
    + specLive.length + valAktiva;
  const reset = () => {
    const hela = Object.fromEntries(intervallF.map((f): [string, [number, number]] => [f.nyckel, [f.skala.min, f.skala.max]]));
    specHandtagRef.current = hela;
    setSpecHandtag(hela);
    setSpecValt({});
    setVal({});
    if (bounds) satHandles([bounds.min, bounds.max]);
    setUrlPrice("");
    setColors([]);
    setOnlyInStock(false);
    setOnlyOnSale(false);
  };

  // De valda filtren som chips ovanför rutnätet, med ett kryss var. "Filter
  // (3)" säger inte vilka tre; Baymard räknar raden som grundläggande och IKEA
  // har den. Chipsen visar det SLÄPPTA läget, samma som rutnätet.
  const forstaLiten = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const aktiva: { id: string; text: string; prick?: string }[] = [];
  if (bounds && urlPrice) aktiva.push({ id: "pris", text: priceRangeLabel(valtLo <= bounds.min ? 0 : valtLo, upperLimit(valtHi, bounds)) });
  for (const k of colors) aktiva.push({ id: `farg:${k}`, text: colorLabel(k), prick: colorOf(k) || "#ddd" });
  if (onlyInStock && hasOos) aktiva.push({ id: "lager", text: "I lager" });
  if (onlyOnSale) aktiva.push({ id: "rea", text: "Rea" });
  for (const f of intervallF) {
    const slug = specValt[f.nyckel];
    if (!slug) continue;
    const [lo, hi] = lasSpecSlug(slug, f.skala);
    aktiva.push({ id: `spec:${f.nyckel}`, text: `${f.namn} ${forstaLiten(specEtikett(lo, hi, f.skala, f.enhet))}` });
  }
  for (const f of valF) {
    for (const kod of val[f.nyckel] ?? []) {
      const v = f.val.find((x) => x.kod === kod);
      // Ett antal behöver sin grupp ("Lådor 4"); "Sammet" står för sig själv.
      if (v) aktiva.push({ id: `val:${f.nyckel}:${kod}`, text: /^\d/.test(v.namn) ? `${f.namn} ${v.namn}` : v.namn });
    }
  }
  const taBort = (id: string) => {
    const [typ, a, b] = id.split(":");
    if (typ === "pris" && bounds) { satHandles([bounds.min, bounds.max]); setUrlPrice(""); }
    else if (typ === "farg") vaxlaFarg(a);
    else if (typ === "lager") setOnlyInStock(false);
    else if (typ === "rea") setOnlyOnSale(false);
    else if (typ === "spec") {
      const f = intervallF.find((x) => x.nyckel === a);
      if (f) { satSpec(a, [f.skala.min, f.skala.max]); setSpecValt((v) => ({ ...v, [a]: "" })); }
    } else if (typ === "val") vaxla(a, b);
  };

  // Mobil: panelen är ett lager över sidan. Sidan bakom rullar inte medan det
  // är öppet, och Escape stänger det.
  // Vrids telefonen till en bredd där lagret inte längre gäller stängs det,
  // annars hade sidan stått kvar utan att gå att rulla.
  const stangRef = useRef<HTMLButtonElement>(null);
  // Tryck som kom innan sidan var redo (lib/tidiga-klick.ts) görs om nu.
  useEffect(() => { spelaUppTidigaKlick(); }, []);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    if (!open || !mq.matches) return;
    const forr = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stangRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const bredd = () => { if (!mq.matches) setOpen(false); };
    window.addEventListener("keydown", esc);
    mq.addEventListener("change", bredd);
    return () => {
      document.body.style.overflow = forr;
      window.removeEventListener("keydown", esc);
      mq.removeEventListener("change", bredd);
    };
  }, [open]);

  // Paginering: visa PAGE_SIZE kort, "Visa fler" laddar nästa batch. Återställs
  // till första sidan när filter/sortering/produktlista ändras (annars skulle en
  // ny lista ärva ett stort "shown"-värde och rendera allt på en gång igen).
  const [shown, setShown] = useState(PAGE_SIZE);
  const firstRender = useRef(true);

  // ── Bilderna som inte fick plats i sidans HTML ────────────────────────────
  //
  // Listan — sökträffarna i sidan, eller listsidornas lista från /api/lista —
  // bär bilder bara för de produkter som kan stå i vyn direkt (de första och
  // toppen av varje sortering). Bilderna för produkter långt ner skickas inte
  // med — se lib/list-payload.ts.
  // De hämtas som EN karta från /api/kort-bilder, hårt cachad, och återanvänds
  // sedan för hela besöket och över alla listsidor.
  //
  // Hämtas vid AVSIKT, inte vid mount: den som bara tittar på de första korten
  // och klickar vidare betalar ingenting. Signalerna nedan är alla saker man
  // gör strax INNAN vyn byts ut — samma tanke som PrefetchLink på korten.
  const [bilder, setBilder] = useState<Record<string, [string, string | null]> | null>(null);
  const bilderBegarda = useRef(false);
  const hamtaBilder = useCallback(() => {
    if (bilderBegarda.current) return;
    bilderBegarda.current = true;
    fetch("/api/kort-bilder")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { BILDKARTA = d; setBilder(d); } })
      // Misslyckas den står korten kvar med sin väntande fotoruta — fult, men
      // inte trasigt. Att nolla flaggan låter nästa avsikt försöka igen.
      .catch(() => { bilderBegarda.current = false; });
  }, []);
  // Sista utvägen: syns ett kort utan bild i vyn har någon kommit hit på ett
  // sätt vi inte förutsåg (delad länk med filter i URL:en, t.ex.) — hämta då.
  const saknarBild = (p: ListProduct) => !p.img && !bilder?.[p.slug];
  const medBild = (p: ListProduct): ListProduct => {
    if (p.img) return p;
    const b = bilder?.[p.slug];
    return b ? { ...p, img: b[0], altImg: b[1] ?? undefined } : p;
  };
  // FÄRGEN KUNDEN FILTRERAT PÅ. Väljs "Blå" visar kortet den blå varianten och
  // länkar till produktsidan med färgen vald (?farg=), i stället för
  // huvudbilden i en annan färg (Leonard 2026-09-28). Bilden kommer ur
  // produktens färgval (fargBild); saknas den för färgen visas huvudbilden.
  const iFarg = (p: ListProduct): { p: ListProduct; href?: string } => {
    if (!colors.length || !p.fargBild) return { p };
    const k = colors.find((c) => p.fargBild![c]);
    if (!k) return { p };
    return { p: { ...p, img: p.fargBild[k], altImg: undefined }, href: `/produkt/${p.slug}?farg=${encodeURIComponent(k)}` };
  };
  useEffect(() => {
    // Hoppa över första körningen så en delad länk inte nollställer en ev.
    // bevarad scroll-position direkt vid mount.
    if (firstRender.current) { firstRender.current = false; return; }
    setShown(PAGE_SIZE);
  }, [sort, urlPrice, colorStr, onlyInStock, onlyOnSale, products, specValtStr, valStr]);
  const visible = list.slice(0, shown);

  // Innan hela listan kommit vet bara sammanfattningen hur många som finns —
  // och bara i standardläget, som är det sidans kort visar. Med ett filter
  // valt vet vi inte, och då visas ingen "Visa fler" förrän listan kommit
  // (hellre ingen knapp än en med fel antal).
  const totalt = alla ? list.length : arStandard && ov ? ov.antal : visible.length;
  const remaining = totalt - visible.length;
  // Kunden har bett om något som kräver hela listan och den har inte kommit:
  // ett filter eller en sortering, eller fler kort än sidan bär.
  const behoverLista = !!lista && !alla && (!arStandard || shown > products.length);
  const vantar = behoverLista && !listaFel;

  // ── Bakåt från en produkt: samma kort, på samma plats ─────────────────────
  //
  // Trycket sparar hur många kort som visades och var kortet stod i fönstret.
  // Kommer kunden tillbaka med bakåt visas lika många kort igen, och sidan
  // rullas så att kortet står där det stod. Allt före första målningen när
  // listan redan är hämtad; annars när den kommit.
  const aterstall = useRef<Listlage | null>(null);
  useLayoutEffect(() => {
    let l: Listlage | null = null;
    try {
      const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!komMedHistoriken(window as unknown as Fonster, Date.now(), nav?.type)) return;
      l = lasListlage(window.sessionStorage, location.pathname + location.search, Date.now());
    } catch { return; }
    if (!l) return;
    aterstall.current = l;
    const sparad = listaUrl ? LISTOR.get(listaUrl) : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tillståndet finns bara i webbläsaren; före första målningen
    if (sparad) { listaBegard.current = true; setHamtad(sparad); }
    if (BILDKARTA) { bilderBegarda.current = true; setBilder(BILDKARTA); }
    if (l.shown > PAGE_SIZE) setShown(l.shown);
    // Bara vid montering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    const l = aterstall.current;
    // Vänta tills korten står där: lika många som sist, och hela listan om
    // de inte ryms i sidans egna.
    if (!l || shown < l.shown) return;
    if (behoverLista && !listaFel) return;
    aterstall.current = null;
    const a = document.querySelector<HTMLElement>(`.prodgrid a.prod[href="${CSS.escape(l.href)}"]`);
    if (!a) return;
    rullaDirekt(scrollY + a.getBoundingClientRect().top - l.top);
  });
  const sparaLage = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest?.("a.prod");
    if (!a) return;
    try {
      sparaListlage(window.sessionStorage, location.pathname + location.search, {
        shown, href: a.getAttribute("href") ?? "", top: Math.round(a.getBoundingClientRect().top), t: Date.now(),
      });
    } catch { /* ingen lagring: bakåt beter sig som förut */ }
  };

  // Behövs listan och har den inte begärts, begär den. Täcker allt som inte
  // går via avsikts-signalerna nedan — framför allt prisreglaget, färgskenan
  // och kryssrutorna, som på dator alltid syns utan att filterknappen rörs.
  // (Utan det här fastnade en besökare med datasparläge i väntläget.)
  useEffect(() => {
    if (behoverLista && !listaFel) hamtaLista();
  }, [behoverLista, listaFel, hamtaLista]);

  // Avsikt att se mer än sidans egna kort: listsidorna hämtar hela listan, och
  // alla hämtar bildkartan för korten långt ner (lib/list-payload.ts).
  const hamta = useCallback(() => {
    if (lista) hamtaLista();
    hamtaBilder();
  }, [lista, hamtaLista, hamtaBilder]);

  // FÖRHÄMTNING NÄR WEBBLÄSAREN ÄR LEDIG. Avsikts-signalerna räcker oftast,
  // men en snabb tumme hinner före. Listan låg förr i sidans HTML och laddades
  // av alla, så att hämta den efter sidladdningen kostar ingen besökare mer än
  // förut — utom den som valt att spara data, eller sitter på 2G. Dem låter vi
  // vara tills de faktiskt rör något.
  //
  // Landar man på ett filtrerat läge (delad länk med ?pris=…) behövs listan
  // direkt, så då hämtas den på en gång.
  useEffect(() => {
    if (!lista) return;
    if (!arStandard) { hamtaLista(); return; }
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /2g$/.test(conn?.effectiveType ?? "")) return;
    let avbruten = false;
    let idle: number | undefined;
    const start = () => {
      if (avbruten) return;
      idle = typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => hamtaLista(), { timeout: 4000 })
        : window.setTimeout(hamtaLista, 1500);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      avbruten = true;
      window.removeEventListener("load", start);
      if (idle !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
        else window.clearTimeout(idle);
      }
    };
    // Bara vid mount: senare lägesbyten hämtar via avsikts-signalerna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skyddsnätet. Avsikts-signalerna ovan täcker de vanliga vägarna, men en delad
  // länk kan landa direkt i ett filtrerat läge (?pris=…&farg=…) där korten i vyn
  // ligger långt ner i katalogen. Syns ett kort utan bild hämtar vi kartan —
  // annars hade den besökaren fått väntande fotorutor som aldrig fylldes.
  const nagotKortSaknarBild = visible.some(saknarBild);
  useEffect(() => {
    if (nagotKortSaknarBild) hamtaBilder();
  }, [nagotKortSaknarBild, hamtaBilder]);

  return (
    <>
      {/* Top toolbar — filter vänster, count mitten/subtilt, sort höger */}
      <div className={`shopbar ${open ? "open" : ""}`}>
        {/* Att öppna filterpanelen är avsikt att filtrera, och ett filter kan
            landa på produkter långt ner i katalogen. */}
        <button type="button" className="shopbar-toggle" data-tidigt="filter"
          onPointerEnter={hamta} onTouchStart={hamta}
          onClick={() => { hamta(); setOpen((b) => !b); }} aria-expanded={open}>
          <svg className="shopbar-ikon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
          </svg>
          Filter {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
        </button>

        <div className="shopcount-inline" aria-live="polite">
          {liveCount === null ? "Räknar …" : productCountLabel(liveCount)}
          {activeFilters > 0 && <span className="shopcount-of"> av {ov ? ov.antal : products.length}</span>}
        </div>

        <label className="sortsel shopbar-sort">
          <span>Sortera</span>
          {/* Byte av sortering byter ut hela vyn mot 24 andra produkter.
              Toppen av varje sorteringsval bär redan bild (lib/list-payload),
              men ett filter ovanpå kan nå längre ner — så vi hämtar när man
              rör reglaget, inte när man släpper det. */}
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            onPointerEnter={hamta} onFocus={hamta} aria-label="Sortera produkter">
            {(defaultSort === "rel" ? [REL_SORT, ...SORTS] : SORTS).map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>

        {/* På dator syns panelen alltid, utan att filterknappen rörs — att
            närma sig den är avsikten. */}
        <div className="shopbar-panel" role="region" aria-label="Filter" onPointerEnter={hamta} onFocusCapture={hamta}>
          {/* Mobil: rubrik och stängknapp överst i lagret. Döljs på dator. */}
          <div className="panel-huvud">
            <span className="panel-titel">Filter</span>
            <button type="button" ref={stangRef} className="panel-stang" data-tidigt="stang" onClick={() => setOpen(false)} aria-label="Stäng filter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          {bounds && (
            <div className="filter-group">
              <span className="filter-label">Pris</span>
              {/* Två range-inputs ovanpå varandra i stället för ett bibliotek:
                  piltangenter, skärmläsare och touch fungerar direkt, och det
                  väger noll extra kB. Spåret och den ifyllda delen är rena
                  div:ar; själva inputarna är genomskinliga och släpper igenom
                  klick överallt utom på handtagen (se .pr-input i globals.css). */}
              <div className="pricerange">
                <div className="pr-hist" aria-hidden="true">
                  {hist.map((b, i) => (
                    <div
                      key={i}
                      className={`pr-bar ${b.over ? "over" : ""} ${b.mid >= priceLo && b.mid < priceHi ? "on" : ""}`}
                      style={{ height: `${b.h}px` }}
                    />
                  ))}
                </div>
                <div className="pr-base" aria-hidden="true" />
                <div className="pr-track">
                  <div
                    className="pr-fill"
                    style={{
                      left: `${((handles[0] - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                      right: `${100 - ((handles[1] - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  className="pr-input pr-lo"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={handles[0]}
                  onChange={(e) => dragLo(Number(e.target.value))}
                  onPointerDown={armPrice}
                  onPointerUp={commitPrice}
                  onKeyUp={commitPrice}
                  onBlur={commitPrice}
                  aria-label="Lägsta pris"
                  aria-valuetext={formatPrice(handles[0])}
                />
                <input
                  type="range"
                  className="pr-input pr-hi"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={handles[1]}
                  onChange={(e) => dragHi(Number(e.target.value))}
                  onPointerDown={armPrice}
                  onPointerUp={commitPrice}
                  onKeyUp={commitPrice}
                  onBlur={commitPrice}
                  aria-label="Högsta pris"
                  aria-valuetext={
                    handles[1] >= bounds.max && bounds.openTop
                      ? `${formatPrice(handles[1])} och uppåt`
                      : formatPrice(handles[1])
                  }
                />
              </div>
              <GransRutor
                namn="pris" lo={handles[0]} hi={handles[1]} min={bounds.min} max={bounds.max}
                openTop={bounds.openTop} enhet="kr" glapp={1} heltal
                onSatt={(h) => { satHandles(h); commitPrice(); }}
              />
            </div>
          )}

          {colorKeys.length > 0 && (
            <div className="filter-group farg-grupp">
              <span className="filter-label">Färg</span>
              {/* Rutor med namn och antal, flera kan väljas. Antalet räknas på
                  de andra filtren (colorCounts); en färg som ger noll tonas ned. */}
              <div className="farg-rutor">
                {synligaFarger.map((k) => {
                  const pa = colors.includes(k);
                  const n = colorCounts ? colorCounts.get(k) ?? 0 : undefined;
                  const tom = n === 0 && !pa;
                  return (
                    <button
                      key={k} type="button" className={`farg-ruta${pa ? " on" : ""}${tom ? " is-tom" : ""}`}
                      aria-pressed={pa} disabled={tom} data-tidigt={`farg:${k}`} onClick={() => vaxlaFarg(k)}
                    >
                      <span className="farg-prick" style={{ background: colorOf(k) || "#ddd" }} aria-hidden="true" />
                      <span className="farg-namn">{colorLabel(k)}</span>
                      {n !== undefined && <span className="farg-n">{n}</span>}
                    </button>
                  );
                })}
              </div>
              {colorKeys.length > FARGER_SYNS && (
                <button type="button" className="farg-fler" data-tidigt="fler" onClick={() => setAllaFarger((v) => !v)} aria-expanded={allaFarger}>
                  {allaFarger ? "Visa färre" : `Visa alla ${colorKeys.length} färger`}
                </button>
              )}
            </div>
          )}

          <div className="filter-group filter-group-tight">
            <span className="filter-label">Tillgänglighet</span>
            <div className="filter-toggles">
              {/* "I lager" visas bara när listan FAKTISKT innehåller något
                  slutsålt att filtrera bort. På kategori-/butikssidorna göms
                  slutsålt redan bort, och en reglage som inte kan ändra något
                  är brus som får kunden att tvivla på det den ser. I sök (där
                  slutsålda träffar behålls) dyker den upp av sig själv igen. */}
              {hasOos && (
                <label className={`toggle ${onlyInStock ? "on" : ""}`} data-tidigt="lager">
                  <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                  <span>I lager</span>
                </label>
              )}
              <label className={`toggle ${onlyOnSale ? "on" : ""}`} data-tidigt="rea">
                <input type="checkbox" checked={onlyOnSale} onChange={(e) => setOnlyOnSale(e.target.checked)} />
                <span>Rea</span>
              </label>
            </div>
          </div>



          {/* Mått och egenskaper — en egen rad under pris och färg. Bara de
              filter kategorin erbjuder OCH datan bär (lib/spec-facets.ts). */}
          {(intervallF.length > 0 || valF.length > 0) && (
            <div className="specrad">
              {intervallF.map((f) => (
                <SpecReglage
                  key={f.nyckel}
                  f={f}
                  handtag={specHandtag[f.nyckel] ?? [f.skala.min, f.skala.max]}
                  onDrag={(h) => satSpec(f.nyckel, h)}
                  onCommit={() => commitSpec(f.nyckel)}
                />
              ))}
              {valF.map((f) => (
                // En kort grupp ("Vägghängd / Fristående") tar en kolumn, en lång två.
                <div key={f.nyckel} className={`filter-group spec-grupp spec-val ${f.val.reduce((n, v) => n + v.namn.length + 5, 0) > 40 ? "spec-val-bred" : ""}`}>
                  <span className="filter-label">{f.namn}</span>
                  <div className="filter-toggles spec-val-rad">
                    {f.val.map((v) => {
                      const pa = (val[f.nyckel] ?? []).includes(v.kod);
                      const n = valAntal?.get(f.nyckel)?.get(v.kod) ?? (valAntal ? 0 : undefined);
                      const tom = n === 0 && !pa;
                      return (
                        <label key={v.kod} className={`toggle toggle-sm ${pa ? "on" : ""}${tom ? " is-tom" : ""}`} data-tidigt={`val:${f.nyckel}:${v.kod}`}>
                          <input type="checkbox" checked={pa} disabled={tom} onChange={() => vaxla(f.nyckel, v.kod)} />
                          <span>{v.namn}</span>
                          {n !== undefined && <span className="toggle-n">{n}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobil: fast fot i lagret — rensa, eller se resultatet. Siffran
              följer filtren live. Döljs på dator. */}
          <div className="panel-fot">
            <button type="button" className="panel-rensa" onClick={reset} disabled={activeFilters === 0}>Rensa alla</button>
            <button type="button" className="panel-visa" data-tidigt="stang" onClick={() => setOpen(false)}>
              {liveCount === null ? "Visa produkter" : `Visa ${productCountLabel(liveCount)}`}
            </button>
          </div>
        </div>
      </div>

      {aktiva.length > 0 && (
        <div className="aktiva-filter" role="group" aria-label="Valda filter">
          {aktiva.map((a) => (
            <button key={a.id} type="button" className="aktiv-chip" onClick={() => taBort(a.id)} aria-label={`Ta bort ${a.text}`}>
              {a.prick && <span className="farg-prick" style={{ background: a.prick }} aria-hidden="true" />}
              {a.text}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          ))}
          <button type="button" className="aktiv-rensa" onClick={reset}>Rensa alla</button>
        </div>
      )}

      {list.length ? (
        <>
          {/* De fyra första korten är över vikningen på varje skärmbredd (1–4
              kolumner), så deras bilder hämtas eager med hög prioritet. Resten
              är kvar på lazy — 24 kort × 2 bilder är inget att förladda. */}
          {/* Väntar vi på hela listan står korten kvar, tonade, tills den kommer
              (se .prodgrid.is-vantar i globals.css) — hellre det än ett tomt
              rutnät eller kort som byts ut under fingret. */}
          <div className={`prodgrid listgrid${vantar ? " is-vantar" : ""}`} aria-busy={vantar || undefined} onClickCapture={sparaLage}>{visible.map((p, i) => { const f = iFarg(medBild(p)); return <ProductCard p={f.p} href={f.href} key={p.slug} priority={i < 4} tvaKolumner />; })}</div>
          {listaFel && behoverLista && (
            <div className="loadmore-wrap">
              <button type="button" className="loadmore" onClick={hamtaLista}>
                Kunde inte hämta fler produkter · Försök igen
              </button>
            </div>
          )}
          {remaining > 0 && !(listaFel && behoverLista) && (
            <div className="loadmore-wrap">
              {/* onPointerEnter/onTouchStart: bildkartan är på väg innan klicket
                  hinner registreras, så nästa 24 kort har sina foton direkt. */}
              <button type="button" className="loadmore"
                onPointerEnter={hamta} onTouchStart={hamta}
                disabled={vantar && shown > products.length}
                onClick={() => { hamta(); setShown((n) => n + PAGE_SIZE); }}>
                {vantar && shown > products.length
                  ? "Hämtar fler …"
                  : <>Visa fler <span className="loadmore-rem">({remaining} kvar)</span></>}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="empty" style={{ textAlign: "center", padding: "36px 0", color: "var(--soft)" }}>
          Inga produkter matchade dina filter. <button type="button" onClick={reset} style={{ background: "none", border: "none", color: "#C2410C", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}>Rensa filter</button>
        </p>
      )}
    </>
  );
}

/**
 * Ett kompakt intervallreglage för ett mått: samma delar som prisreglaget
 * (histogram, spår, två native range-inputs) men lägre, så att fyra ryms i
 * bredd på dator. Avläsningen står på samma rad som rubriken.
 */
function SpecReglage({ f, handtag, onDrag, onCommit }: {
  f: Extract<SpecFacett, { skala: unknown }>;
  handtag: [number, number];
  onDrag: (h: [number, number]) => void;
  onCommit: () => void;
}) {
  const { skala } = f;
  const [lo, hi] = handtag;
  const lagst = specUndre(lo, skala);
  const hogst = specOvre(hi, skala);
  const pos = (v: number) => ((v - skala.min) / (skala.max - skala.min)) * 100;
  // Släpp alltid draget, även utanför reglaget (se armPrice).
  const arm = () => window.addEventListener("pointerup", onCommit, { once: true });
  const enhet = f.enhet ? ` ${f.enhet}` : "";
  const text = (v: number) => `${String(Math.round(v * 10) / 10).replace(".", ",")}${enhet}`;
  return (
    <div className="filter-group spec-grupp">
      <span className="filter-label">{f.namn}</span>
      <div className="pricerange is-kompakt">
        <div className="pr-hist" aria-hidden="true">
          {f.hist.map((b, i) => (
            <div key={i} className={`pr-bar ${b.over ? "over" : ""} ${b.mid >= lagst && b.mid <= hogst ? "on" : ""}`} style={{ height: `${b.h}px` }} />
          ))}
        </div>
        <div className="pr-base" aria-hidden="true" />
        <div className="pr-track">
          <div className="pr-fill" style={{ left: `${pos(lo)}%`, right: `${100 - pos(hi)}%` }} />
        </div>
        <input
          type="range" className="pr-input pr-lo"
          min={skala.min} max={skala.max} step={skala.step} value={lo}
          onChange={(e) => onDrag([Math.min(Number(e.target.value), hi - skala.step), hi])}
          onPointerDown={arm} onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit}
          aria-label={`Minsta ${f.namn.toLowerCase()}`} aria-valuetext={text(lo)}
        />
        <input
          type="range" className="pr-input pr-hi"
          min={skala.min} max={skala.max} step={skala.step} value={hi}
          onChange={(e) => onDrag([lo, Math.max(Number(e.target.value), lo + skala.step)])}
          onPointerDown={arm} onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit}
          aria-label={`Största ${f.namn.toLowerCase()}`}
          aria-valuetext={hi >= skala.max && skala.openTop ? `${text(hi)} och uppåt` : text(hi)}
        />
      </div>
      <GransRutor
        namn={f.namn.toLowerCase()} lo={lo} hi={hi} min={skala.min} max={skala.max}
        openTop={skala.openTop} enhet={f.enhet} glapp={Math.min(skala.step, 1)}
        onSatt={(h) => { onDrag(h); onCommit(); }}
      />
    </div>
  );
}

/**
 * Min- och max-rutorna under ett reglage: skriv in gränsen i stället för att
 * dra (Leonard 2026-09-27: "att man knappar in vad man vill ha mest eller
 * minst"). En tom ruta är ingen gräns; ytterlägena visas som ledtext.
 * Gränsen sätts när rutan lämnas eller med Enter, inte för varje siffra.
 */
function GransRutor({ namn, lo, hi, min, max, openTop, enhet, glapp, heltal = false, onSatt }: {
  namn: string;
  lo: number;
  hi: number;
  min: number;
  max: number;
  openTop: boolean;
  enhet: string;
  /** Minsta avstånd mellan gränserna, så att intervallet aldrig blir tomt. */
  glapp: number;
  /** Hela tal (priset: URL:en bär hela kronor, "under-1499.5" läses inte). */
  heltal?: boolean;
  onSatt: (h: [number, number]) => void;
}) {
  const klampa = (v: number) => Math.min(Math.max(heltal ? Math.round(v) : Math.round(v * 10) / 10, min), max);
  return (
    <div className="gr-rad">
      <GransRuta
        etikett="Min" varde={lo <= min ? null : lo} ledtext={formatTal(min)} enhet={enhet}
        aria={`Min ${namn}${enhet ? ` i ${enhet}` : ""}`}
        onSatt={(v) => onSatt([v === null ? min : Math.min(klampa(v), hi - glapp), hi])}
      />
      <span className="gr-streck" aria-hidden="true">–</span>
      <GransRuta
        etikett="Max" varde={hi >= max ? null : hi} ledtext={`${formatTal(max)}${openTop ? "+" : ""}`} enhet={enhet}
        aria={`Max ${namn}${enhet ? ` i ${enhet}` : ""}`}
        onSatt={(v) => onSatt([lo, v === null ? max : Math.max(klampa(v), lo + glapp)])}
      />
    </div>
  );
}

function GransRuta({ etikett, varde, ledtext, enhet, aria, onSatt }: {
  etikett: string;
  varde: number | null;
  ledtext: string;
  enhet: string;
  aria: string;
  onSatt: (v: number | null) => void;
}) {
  // Utkastet lever bara medan rutan har fokus; annars visas gränsen.
  const [utkast, setUtkast] = useState<string | null>(null);
  const text = utkast ?? (varde === null ? "" : formatTal(varde));
  // "2 000:-", "2000 kr" och "47,5" läses som tal. En tom ruta tar bort
  // gränsen; skräp lämnar den som den var.
  const klar = () => {
    if (utkast === null) return;
    setUtkast(null);
    if (!utkast.trim()) { onSatt(null); return; }
    const n = Number(utkast.replace(/[^\d,.]/g, "").replace(",", "."));
    if (/\d/.test(utkast) && Number.isFinite(n)) onSatt(n);
  };
  return (
    <label className="gr-ruta">
      <span className="gr-etikett">{etikett}</span>
      <span className="gr-varde">
        <input
          type="text" inputMode="decimal" autoComplete="off" className="gr-input"
          value={text} placeholder={ledtext} aria-label={aria}
          onFocus={(e) => { setUtkast(text); e.currentTarget.select(); }}
          onChange={(e) => setUtkast(e.target.value)}
          onBlur={klar}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
        {enhet && <span className="gr-enhet">{enhet}</span>}
      </span>
    </label>
  );
}
