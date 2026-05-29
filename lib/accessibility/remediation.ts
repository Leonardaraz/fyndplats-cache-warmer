// Åtgärds-kunskapsbas för tillgänglighetsrapporten.
//
// Per feltyp (samma id som scannerns regler): varför det spelar roll för riktiga
// användare, hur man fixar det konkret, och en grov arbetsinsats. Detta är "köttet"
// i den betalda rapporten — helt självständigt, ingen extern data.

export type Effort = "låg" | "medel" | "hög";

export interface Remediation {
  /** Varför felet drabbar riktiga användare. */
  why: string;
  /** Konkret hur man åtgärdar. */
  fix: string;
  effort: Effort;
}

export const REMEDIATION: Record<string, Remediation> = {
  "img-alt": {
    why: "Skärmläsare läser upp alt-texten i stället för bilden. Utan den hör en " +
      "synskadad besökare ingenting, eller bara filnamnet — produktbilder blir osynliga.",
    fix: 'Lägg till ett beskrivande alt-attribut på varje <img>, t.ex. ' +
      '`alt="Blå bomullströja, framifrån"`. Rent dekorativa bilder ska ha tomt `alt=""`.',
    effort: "låg",
  },
  "html-lang": {
    why: "Utan språkdeklaration vet skärmläsaren inte vilket uttal som gäller och " +
      "kan läsa svensk text med engelskt uttal — svårbegripligt.",
    fix: 'Sätt språk på rot-elementet: `<html lang="sv">`.',
    effort: "låg",
  },
  "doc-title": {
    why: "Sidtiteln läses upp först av skärmläsare och visas i webbläsarflikar och " +
      "sökresultat. Saknas den blir sidan svår att identifiera.",
    fix: "Ge varje sida en unik, beskrivande <title>, t.ex. ”Herrtröjor – Min Butik”.",
    effort: "låg",
  },
  "link-text": {
    why: "Skärmläsaranvändare bläddrar ofta länk för länk. ”Klicka här” utan kontext " +
      "säger ingenting om vart länken leder.",
    fix: "Skriv ut länkmålet i texten, t.ex. ”Läs mer om våra fraktvillkor” i stället " +
      "för ”läs mer”.",
    effort: "låg",
  },
  "button-name": {
    why: "En knapp utan text eller etikett annonseras bara som ”knapp” — användaren " +
      "vet inte vad den gör (köp? ta bort? stäng?).",
    fix: 'Lägg text i knappen, eller ett `aria-label` om den bara har en ikon, t.ex. ' +
      '`<button aria-label="Stäng">`.',
    effort: "låg",
  },
  "meta-viewport": {
    why: "Att blockera zoom stänger ute personer med nedsatt syn som behöver förstora " +
      "texten. WCAG kräver att sidan går att zooma till minst 200 %.",
    fix: "Ta bort `user-scalable=no` och `maximum-scale=1` ur viewport-metataggen.",
    effort: "låg",
  },
  "page-h1": {
    why: "En tydlig huvudrubrik (H1) hjälper skärmläsaranvändare att förstå vad sidan " +
      "handlar om och är en viktig orienteringspunkt.",
    fix: "Lägg en enda beskrivande <h1> överst i sidans huvudinnehåll.",
    effort: "låg",
  },
  "input-label": {
    why: "Ett formulärfält utan etikett läses upp som bara ”textfält” — användaren vet " +
      "inte vad som ska fyllas i (namn? e-post? sökord?).",
    fix: 'Koppla en <label> till fältet med `for`/`id`, eller använd `aria-label`. ' +
      "Placeholder-text räcker inte.",
    effort: "medel",
  },
  "iframe-title": {
    why: "Inbäddat innehåll (karta, video, formulär) utan title annonseras som en " +
      "anonym ram — användaren vet inte vad den innehåller.",
    fix: 'Lägg ett beskrivande `title` på varje <iframe>, t.ex. `title="Karta till butiken"`.',
    effort: "låg",
  },
  "empty-link": {
    why: "Ikon- och bildlänkar utan text eller alt blir tomma för skärmläsare — ofta " +
      "drabbar det viktiga länkar som varukorg och sociala ikoner.",
    fix: "Ge bilden i länken en alt-text, eller sätt `aria-label` på själva länken.",
    effort: "låg",
  },
  "media-autoplay": {
    why: "Ljud/video som startar automatiskt stör skärmläsare och kan vara " +
      "desorienterande för personer med kognitiva funktionsnedsättningar.",
    fix: "Ta bort `autoplay`, eller starta utan ljud och ge tydliga play/paus-kontroller.",
    effort: "medel",
  },
  "positive-tabindex": {
    why: "Positivt tabindex tvingar en egen tab-ordning som sällan matchar den visuella " +
      "— tangentbordsanvändare hoppar oförutsägbart runt på sidan.",
    fix: "Använd `tabindex=\"0\"` eller `-1` och låt DOM-ordningen styra fokus; undvik " +
      "positiva värden.",
    effort: "medel",
  },
  "multiple-h1": {
    why: "Flera H1 gör sidans struktur otydlig för skärmläsare som navigerar via rubriker.",
    fix: "Behåll en enda <h1> och gör övriga till <h2>/<h3> enligt hierarkin.",
    effort: "låg",
  },

  // --- SEO & teknik ---
  "no-https": {
    why: "Utan HTTPS varnar webbläsare för osäker sida, kunder tappar förtroende och " +
      "Google rankar ner sidan.",
    fix: "Aktivera SSL/TLS (oftast ett klick hos din webbhotell-/plattformsleverantör) " +
      "och tvinga omdirigering från http till https.",
    effort: "låg",
  },
  "meta-description": {
    why: "Meta-description är texten som visas under rubriken i Googles sökresultat. " +
      "Saknas den skriver Google något eget — ofta sämre — vilket sänker klick.",
    fix: "Lägg en unik description på 50–160 tecken per sida som sammanfattar innehållet " +
      "och lockar till klick.",
    effort: "låg",
  },
  "title-length": {
    why: "För långa titlar kapas i sökresultaten; för korta utnyttjar inte utrymmet och " +
      "missar sökord.",
    fix: "Sikta på cirka 30–60 tecken med det viktigaste sökordet först.",
    effort: "låg",
  },
  "no-canonical": {
    why: "Utan canonical kan Google se flera varianter av samma sida som dubbletter, " +
      "vilket splittrar rankingen.",
    fix: 'Lägg `<link rel="canonical" href="...">` i <head> som pekar på sidans rätta adress.',
    effort: "låg",
  },
  "no-opengraph": {
    why: "Utan Open Graph-taggar blir delningar i sociala medier och chattar fula — ingen " +
      "bild eller rubrik — vilket sänker klick.",
    fix: 'Lägg `og:title`, `og:description` och `og:image` i <head>.',
    effort: "låg",
  },
  "robots-noindex": {
    why: "noindex säger åt Google att INTE visa sidan i sökresultaten alls — ofta ett " +
      "misstag som gör att sidan blir helt osynlig.",
    fix: "Ta bort noindex ur robots-metataggen om sidan ska synas i Google.",
    effort: "låg",
  },
  "no-favicon": {
    why: "Favicon (den lilla ikonen i webbläsarfliken) stärker varumärket och gör fliken " +
      "lättare att hitta bland många.",
    fix: 'Lägg en favicon och referera den med `<link rel="icon" href="/favicon.ico">`.',
    effort: "låg",
  },

  // --- AI-synlighet (AEO) ---
  "no-structured-data": {
    why: "Strukturerad data (schema.org) hjälper både Google och AI-svarsmotorer att förstå " +
      "vad sidan handlar om — produkter, priser, recensioner — och citera den korrekt.",
    fix: "Lägg JSON-LD med relevant schema (t.ex. Product, Organization, BreadcrumbList) i sidan.",
    effort: "medel",
  },
  "no-semantic-html": {
    why: "Semantiska element (main, article, nav) gör sidans delar tydliga för AI och " +
      "skärmläsare, så rätt innehåll kan extraheras.",
    fix: "Bygg upp sidan med <header>, <nav>, <main> och <article> i stället för enbart <div>.",
    effort: "medel",
  },
  "thin-content": {
    why: "AI-svarsmotorer behöver text att citera. Tunna sidor blir sällan källa i ett AI-svar.",
    fix: "Lägg beskrivande, hjälpsam text — t.ex. utförliga produkt- och kategoritexter samt en om-sida.",
    effort: "medel",
  },
  "weak-headings": {
    why: "Tydliga underrubriker (H2) gör att AI lättare hittar svar på specifika frågor i texten.",
    fix: "Dela upp innehållet med beskrivande H2-rubriker, gärna formulerade som frågor kunder ställer.",
    effort: "låg",
  },
  "no-faq": {
    why: "FAQ-innehåll med FAQPage-schema är ett format AI-svarsmotorer ofta plockar upp och citerar.",
    fix: "Lägg en FAQ-sektion med vanliga frågor och märk upp den med FAQPage-schema (JSON-LD).",
    effort: "medel",
  },
  "no-robots": {
    why: "robots.txt vägleder sökmotorer om vad de får hämta. Saknas den tappar du " +
      "kontroll och kan inte peka ut din sitemap.",
    fix: "Lägg en robots.txt i roten med en Sitemap-rad och rimliga regler.",
    effort: "låg",
  },
  "blocks-ai-crawlers": {
    why: "Om robots.txt blockerar AI-crawlers (GPTBot, ClaudeBot, PerplexityBot, " +
      "Google-Extended) kan din butik inte synas eller citeras i AI-svar – en växande " +
      "trafikkälla stängs ute.",
    fix: "Ta bort Disallow: / för de AI-crawlers du vill vara synlig för i robots.txt.",
    effort: "låg",
  },
  "no-sitemap": {
    why: "En sitemap hjälper sök- och AI-motorer att hitta alla dina sidor. Utan referens " +
      "i robots.txt kan de missa innehåll.",
    fix: "Skapa en sitemap.xml och lägg `Sitemap: https://dindomän/sitemap.xml` i robots.txt.",
    effort: "låg",
  },
  "no-llms-txt": {
    why: "llms.txt är en framväxande standard för att vägleda AI-modeller till ditt " +
      "viktigaste innehåll. Tidiga användare kan få ett försprång i AI-synlighet.",
    fix: "Lägg en llms.txt i roten som pekar ut dina viktigaste sidor i klartext.",
    effort: "låg",
  },

  // --- Prestanda & best practices ---
  "img-no-dimensions": {
    why: "Utan width/height vet webbläsaren inte hur mycket plats bilden tar – sidan " +
      "hoppar när bilden laddas (dålig CLS), vilket stör besökaren och sänker Google-ranking.",
    fix: "Ange width och height (eller CSS aspect-ratio) på bilderna.",
    effort: "låg",
  },
  "img-no-lazy": {
    why: "Utan lazy-loading laddas alla bilder direkt, även de långt ner – långsammare " +
      "första intryck, särskilt på mobil.",
    fix: 'Lägg `loading="lazy"` på bilder under första vyn.',
    effort: "låg",
  },
  "render-blocking-js": {
    why: "Skript i <head> utan async/defer pausar visningen tills de laddats – sidan " +
      "känns långsam att öppna.",
    fix: "Lägg `defer` (eller `async`) på script-taggarna, eller flytta dem sist i <body>.",
    effort: "låg",
  },
  "large-dom": {
    why: "Tunga sidor tar längre tid att ladda och tolka, särskilt på mobil och svagare nät.",
    fix: "Minska sidvikt: färre/komprimerade element, ladda sektioner vid behov, rensa onödig markup.",
    effort: "medel",
  },
  "no-charset": {
    why: "Utan teckenkodning kan å, ä och ö visas fel, och webbläsaren måste gissa kodningen.",
    fix: 'Lägg `<meta charset="utf-8">` högst upp i <head>.',
    effort: "låg",
  },
};

/** Slår upp åtgärdsinfo för ett fel-id; faller tillbaka på en generisk text. */
export function remediationFor(id: string): Remediation {
  return (
    REMEDIATION[id] ?? {
      why: "Detta påverkar hur väl personer med funktionsnedsättning kan använda sidan.",
      fix: "Se WCAG-kriteriet för vägledning.",
      effort: "medel",
    }
  );
}
