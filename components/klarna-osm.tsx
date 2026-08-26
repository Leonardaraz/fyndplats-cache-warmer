"use client";
// Klarna On-Site Messaging (OSM) — den officiella widgeten som visar
// "Betala inom 30 dagar" eller "Från X kr/mån med Klarna" under priset på PDP.
//
// KOMPLIANS: Kärnan varför vi migrerar från static KlarnaMessage → riktig OSM.
// Delbetalning är räntebärande (21,9 % effektiv), och när vi själva skriver
// "räntefri" bredvid ett månadsbelopp bryter vi mot Konsumentkreditlagen §§7-8
// (informationsskyldighet: representativt exempel + effektiv ränta MÅSTE visas).
// Klarnas widget renderar den lagkravsdelen automatiskt per betalsätt, så
// compliance-risken flyttar från oss till dem.
//
// SAMTYCKE: Gated på marknadssamtycke ("Godkänn alla"), samma logik som Meta
// Pixel. Klarnas OSM samlar impressions/klick server-side. Nekar användaren
// marknadscookies → static-fallbacken renderas i stället (behåller 30-dagars-
// budskapet så priset aldrig står naket, men utan tracking).
//
// SDK: Klarna-scripten laddas i app/layout.tsx (en instans per sida — Klarnas
// crav). Denna komponent renderar bara <klarna-placement>-taggen; widgeten
// hittar den och hydrerar när SDK:t är laddat.
//
// ── Varför den här filen ser ut som den gör (omskriven 2026-08-26) ──────────
// Första versionen renderade INGET medan den väntade på SDK:t, och föll
// tillbaka på den statiska raden först efter 3 s. Två problem följde av det:
//
//   1. Ett tomt hål under priset så länge väntan pågick. På en långsam
//      uppkoppling stod priset naket i sekunder — precis det vi ville undvika.
//   2. Hydrerings-detektionen frågade `shadowRoot != null`. Klarnas element
//      är byggt på Lit, som kopplar sin shadow root direkt i connectedCallback
//      — alltså LÅNGT innan texten hämtats från Klarnas API. Flaggan slog om
//      till "hydrerad" på ett tomt element.
//
// Nu gäller i stället: statiska raden syns direkt, widgeten byts in i samma
// ruta när den fått RIKTIGT innehåll (ett [part~="osm-message"] med text), och
// höjden är reserverad under väntan så bytet inte flyttar något på sidan.
//
// Tidsgränsen stänger inte längre dörren. Går den ut släpper vi bara
// höjdreservationen (så en widget som aldrig kommer inte lämnar en lucka) —
// taggen sitter kvar och kommer den fram efter 6 s byts den ändå in.

import { useEffect, useRef, useState } from "react";
import { useMarketingConsent } from "../lib/use-marketing-consent";
import { toMinorUnits } from "../lib/klarna-price";
import { KlarnaMessage } from "./klarna-message";

// data-key för "under priset" på PDP. Autosize = matchar containerbredden.
// credit-promotion visar 30-dagars-budskap ELLER delbetalning beroende på
// Klarnas dynamiska val per kund + korgstorlek — vi kan inte styra vilket,
// och ska inte heller (Klarna optimerar konvertering med sin ML-modell).
const PLACEMENT_KEY = "credit-promotion-auto-size";
const LOCALE = "sv-SE";

// Hur ofta vi tittar efter riktigt innehåll, och när vi slutar hålla plats.
// 6 s är rundligt tilltaget med flit: väntan kostar ingenting numera (statiska
// raden syns hela tiden), medan ett för snålt tak skulle offra den
// komplianssäkra Klarna-texten på en långsam uppkoppling.
const POLL_MS = 120;
const RESERVERA_HOJD_MS = 6000;
// Absolut stopp för pollningen. Utan det snurrar intervallet resten av
// besöket på en sida där SDK:t aldrig kom fram (adblock, nedsläckt CDN).
const SLUTA_POLLA_MS = 30000;

// Klarnas web component + window.Klarna typas i types/klarna.d.ts — flyttat
// från denna fil 2026-08-26 efter Vercel-buildfail: Next.js 16 + Turbopack
// plockar inte upp `declare global` från en "use client"-modul under
// production build, bara i dev. Global augmentation måste bo i en fristående
// .d.ts som tsconfig include:ar via **/*.ts.

/** Har widgeten fått RIKTIG text, inte bara en tom shadow root? */
function harInnehall(el: HTMLElement | null): boolean {
  const rot = el?.shadowRoot;
  if (!rot) return false;
  // part-attributet är Klarnas eget kontrakt utåt (samma namn vi hakar CSS på
  // i globals.css), så det är stabilare att leta efter än en intern klass.
  const text = rot.querySelector('[part~="osm-message"]');
  return !!text && (text.textContent || "").trim().length > 0;
}

type Lage =
  | "reserv" // Inget samtycke → statiska raden, ingen widget alls.
  | "vantar" // Widgeten är på väg: statiska raden syns, höjden är reserverad.
  | "sen" // Tidsgränsen gick ut: statiska raden syns, ingen reservation.
  | "klar"; // Widgeten har innehåll och har tagit över rutan.

export function KlarnaOSM({ priceNum }: { priceNum: number }) {
  const consent = useMarketingConsent();
  // Två oberoende flaggor i stället för ett läge i state: samtycket är redan
  // känt vid render, så att spegla in det i state hade bara gett en extra
  // rendering (och en react-hooks/set-state-in-effect-varning på köpet).
  // Läget nedan HÄRLEDS av de tre.
  const [harWidget, setHarWidget] = useState(false);
  const [sen, setSen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const lage: Lage = !consent
    ? "reserv"
    : harWidget
      ? "klar"
      : sen
        ? "sen"
        : "vantar";

  useEffect(() => {
    if (!consent) return;

    // Klarna OSM hydrerar automatiskt när SDK:t hittar <klarna-placement>.
    // Vi kickstartar refresh() om SDK:t redan var laddat vid montering (t.ex.
    // klientnavigering mellan PDP:er — SDK:t ligger kvar i minnet).
    if (window.Klarna?.OnsiteMessaging?.refresh) {
      try {
        window.Klarna.OnsiteMessaging.refresh();
      } catch {}
    }

    // harWidget nollställs ALDRIG. Ett variantbyte byter bara
    // data-purchase-amount, och Klarna uppdaterar texten på plats — hade vi
    // gått tillbaka till "vantar" hade statiska raden blinkat förbi vid varje
    // klick i variantväljaren.
    const start = Date.now();
    const int = window.setInterval(() => {
      if (harInnehall(ref.current)) {
        setHarWidget(true);
        window.clearInterval(int);
      } else {
        const gatt = Date.now() - start;
        // Släpp bara höjden. Taggen lever vidare och intervallet med den —
        // kommer widgeten sent byts den ändå in, utan lucka i mellantiden.
        if (gatt > RESERVERA_HOJD_MS) setSen(true);
        if (gatt > SLUTA_POLLA_MS) window.clearInterval(int);
      }
    }, POLL_MS);
    return () => window.clearInterval(int);
  }, [consent, priceNum]);

  if (!priceNum || priceNum <= 0) return null;

  // Utan samtycke: bara den statiska raden. Den är komplianssäker på egen hand
  // (enbart "Betala inom 30 dagar — räntefritt" om månadsfakturan, aldrig ett
  // månadsbelopp eller delbetalning).
  if (!consent) return <KlarnaMessage priceNum={priceNum} />;

  return (
    <div className="klarna-osm-wrap" data-osm={lage}>
      {/* Ligger kvar i DOM:en tills widgeten har innehåll — CSS lägger de två
          i samma rutnätscell, så bytet sker på stället utan hopp. */}
      {lage !== "klar" && <KlarnaMessage priceNum={priceNum} />}
      <klarna-placement
        ref={ref}
        data-key={PLACEMENT_KEY}
        data-locale={LOCALE}
        data-purchase-amount={String(toMinorUnits(priceNum))}
      />
    </div>
  );
}
