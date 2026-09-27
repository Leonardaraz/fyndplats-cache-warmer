// lib/gpsr/sakerhet.ts
//
// Utvinner säkerhetsuppgifterna ur en Aosom-produkts tyska text och översätter
// dem till svenska. Se lib/gpsr/aosom.ts för varför de behövs.
//
// VARFÖR EN MODELL OCH INTE ETT MÖNSTER. Uppmätt i feeden 2026-09-27: cirka
// 5 800 meningar om maxbelastning, 350 om väggförankring, 230 "Achtung", 200
// CE/EN71, 120 om tillsyn av vuxen — men nyckelorden träffar lika ofta
// säljtext ("✔ Gute Belüftung und Beobachtung"). Ett mönster hade antingen
// släppt in reklam på en säkerhetsflik eller tappat riktiga varningar.
//
// DEN FÅR INTE HITTA PÅ. En varning som inte står i källan är värre än ingen:
// den påstår något om varan vi inte vet. Prompten säger det, temperaturen är
// 0, och svaret tvättas (tvattaSakerhet) innan det sparas.

import { completeJsonRouted, TEXT_MODEL } from "../claude/client";
import { tvattaSakerhet } from "./aosom";

const OP = "gpsrSakerhet";

const SYSTEM = `Du får den tyska produkttexten för en vara som säljs i en svensk webbutik. Uppgiften är att ta fram varans SÄKERHETSINFORMATION för produktsidans flik "Produktsäkerhet", enligt EU:s produktsäkerhetsförordning.

Ta med, översatt till korrekt och naturlig svenska:
- uttryckliga varningar (Achtung, Warnung, Vorsicht, Gefahr, Warnhinweis)
- åldersgränser och krav på tillsyn av vuxen
- maxbelastning, maximal användarvikt eller användarlängd
- tipprisk, krav på väggförankring eller tippskydd
- om varan bara är avsedd för inomhus- eller utomhusbruk, eller inte för yrkesmässigt bruk
- el-, brand-, värme-, kläm- och kvävningsrisker samt batterisäkerhet
- krav på montering av vuxen eller enligt anvisning
- angivna säkerhetsstandarder (t.ex. EN 71, CE) när texten säger att varan uppfyller dem

Ta INTE med:
- säljargument, även om de nämner säkerhet ("stabil konstruktion", "säkert för hela familjen")
- mått, färger, material eller funktioner som inte är en säkerhetsgräns
- något som inte står i texten. Hitta aldrig på en varning, en ålder eller en siffra.
- varumärken, butiksnamn eller platshållare

Skriv varje uppgift som en kort, fristående mening på svenska, med siffror och enheter exakt som i källan ("Maxbelastning: 120 kg."). Slå ihop uppgifter som säger samma sak. Högst 12 meningar.

Svara ENBART med JSON: {"sakerhet": ["…", "…"]}. Finns ingen säkerhetsinformation i texten: {"sakerhet": []}.`;

export type Utvinnare = (kallText: string) => Promise<string[] | null>;

/**
 * En utvinning. Null betyder att båda modellerna misslyckades — anroparen ska
 * då INTE spara något, så att produkten försöks igen nästa körning. En tom
 * lista är däremot ett riktigt svar: texten saknar säkerhetsuppgifter.
 */
export const utvinnSakerhet: Utvinnare = async (kallText) => {
  const svar = await completeJsonRouted<{ sakerhet?: unknown } | null>({
    system: SYSTEM,
    user: kallText,
    op: OP,
    model: TEXT_MODEL,
    maxTokens: 900,
    temperature: 0,
    // Resultatet sparas per produkt i lib/gpsr/lager.ts, med källans
    // fingeravtryck. LLM-cachen har 30 dagars livslängd och vore fel lager.
    cacheKey: null,
    failOpen: null,
    // Över budget väntar produkten till nästa körning i stället för att få en
    // säkerhetstext från reservmodellen.
    utanGemini: true,
  });
  if (!svar || !Array.isArray(svar.sakerhet)) return null;
  return tvattaSakerhet(svar.sakerhet);
};
