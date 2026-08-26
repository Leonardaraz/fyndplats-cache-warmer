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
// ingenting flyttar sig när det sker (se höjdresonemanget i globals.css).
//
// Tidsgränsen stänger inte längre dörren: taggen sitter kvar och kommer
// widgeten fram efter 6 s byts den ändå in.

import { useEffect, useRef, useState } from "react";
import { useMarketingConsent } from "../lib/use-marketing-consent";
import { toMinorUnits } from "../lib/klarna-price";
import { KlarnaMessage } from "./klarna-message";

// data-key styr MALLEN. Vilket budskap som visas styr Klarna själva per kund
// och belopp — det kan vi inte påverka, och ska inte heller.
//
// VALET AV NYCKEL, MÄTT MOT KLARNAS API 2026-08-26. Jag frågade
// js.klarna.com/eu/cma/v4/messaging med butikens client-id, en nyckel i taget:
//
//   product                     204  ← INTE aktiverad för kontot
//   cart                        204  ← INTE aktiverad
//   header                      204  ← INTE aktiverad
//   credit-promotion-badge      200
//   credit-promotion-small      200
//   credit-promotion-standard   200
//   credit-promotion-auto-size  200
//   credit-promotion-inline     200
//
// Det avgjorde saken. Vi ville ha Klarnas rosa bricka i stället för ordmärket
// invävt i texten, och första försöket gick via data-logo-type="badge" — det
// attributet läses bara för product/cart/header. Men alla tre svarar 204 för
// det här kontot, så widgeten renderade aldrig något alls.
//
// credit-promotion-badge ger samma sak utan det attributet: brickan kommer som
// en egen bildnod (KLARNA_BADGE) i API-svaret, och mallen lägger den till
// vänster om texten. data-logo-type behövs inte och ignoreras för nyckeln.
//
// SÅ HÄR SER SVARET UT (samma anrop för 99, 789, 2 579, 9 999 och 25 000 kr):
// en enda rad, "Shoppa nu. Betala inom 30/60 dagar med Klarna." + "Läs mer",
// och ALDRIG någon legalnod. Brickan kommer separat som en IMAGE-nod.
//
// Notera: Klarna erbjuder 60 dagar i vissa beloppsband, 30 i andra. Vår
// statiska rad säger alltid 30. Den underskattar alltså erbjudandet ibland —
// medvetet lämnat, eftersom raden är vårt eget kreditpåstående utan Klarnas
// juridiska ram runt sig och 30 dagar är sant i alla band.
const PLACEMENT_KEY = "credit-promotion-badge";
const LOCALE = "sv-SE";

// Hur ofta vi tittar efter riktigt innehåll, och när vi ger upp.
//
// Väntan kostar ingenting numera — statiska raden syns hela tiden och är exakt
// lika hög som widgeten — så taket är satt generöst. Det finns bara för att
// intervallet inte ska snurra resten av besöket på en sida där SDK:t aldrig kom
// fram (adblock, nedsläckt CDN).
const POLL_MS = 120;
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
  | "vantar" // Widgeten är på väg (eller kom aldrig): statiska raden syns.
  | "klar"; // Widgeten har innehåll och har tagit över rutan.

export function KlarnaOSM({ priceNum }: { priceNum: number }) {
  const consent = useMarketingConsent();
  // En flagga i state, inte ett läge: samtycket är redan känt vid render, så
  // att spegla in det hade bara gett en extra rendering (och en
  // react-hooks/set-state-in-effect-varning på köpet). Läget HÄRLEDS av de två.
  const [harWidget, setHarWidget] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const lage: Lage = !consent ? "reserv" : harWidget ? "klar" : "vantar";

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
      } else if (Date.now() - start > SLUTA_POLLA_MS) {
        window.clearInterval(int);
        // Enda spåret när widgeten uteblir. Tyst fallback ser likadan ut som
        // "ingen har accepterat cookies", och det gjorde felsökningen till
        // gissningar. Samma prefix-konvention som [tack], [gcr], [meta].
        console.warn(
          `[klarna] OSM gav inget innehåll på ${SLUTA_POLLA_MS / 1000} s — ` +
            `statiska raden ligger kvar. Kolla att data-key="${PLACEMENT_KEY}" ` +
            `är aktiverad för kontot och att SDK:t laddades.`,
        );
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
