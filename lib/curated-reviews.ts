// Handplockade, ORDAGRANNA Google-omdömen — visas på /omdomen tills det
// officiella Business Profile-API:t (lib/google-reviews.ts) är aktiverat med
// credentials. Då tar API-datan automatiskt över (se app/omdomen/page.tsx).
//
// REGLER: lägg ENDAST in äkta omdömen, ordagrant, med kundens publika namn från
// Google. Hitta aldrig på text eller betyg. Avhuggna meningar ("… Mer") trimmas
// till sista hela mening — orden ändras aldrig. Ordningen nedan = visningsordning
// (mest innehållsrika/senaste först); GoogleReviews-komponenten visar 6 och
// expanderar resten. Datum är ungefärliga (Google visar bara "för X sedan");
// de ersätts av exakta datum när API:t är på.
//
// Snittbetyg + TOTALantal kommer INTE härifrån utan från getSocialProof()
// (lib/social-proof-live.ts): Googles egna siffror när API:t svarar, annars
// reserven i lib/social-proof.ts. Korten nedan (23 st med text) är ett urval —
// "Se alla på Google" länkar till samtliga. Resten av profilens omdömen är
// stjärn-bara utan text och har inget att visa här; de räknas ändå in i totalen.
//
// KUNDBILDER (`photos`) ÄR OCKSÅ HANDPLOCKADE, OCH MÅSTE VARA DET.
// Business Profile-API:ts reviews-endpoint returnerar ingen media alls —
// kundbilder ligger i en separat media-endpoint utan koppling till omdömets id.
// Och app/omdomen/page.tsx BYTER lista, den slår inte ihop dem:
//   const data = google.reviews.length > 0 ? google : CURATED_RESULT;
// Slås API:t på försvinner alltså hela den här listan — bilderna med den. Det
// är inget som går sönder tyst i dag (API:t saknar credentials), men den som
// aktiverar det måste veta: antingen behålls bytet och bilderna offras, eller
// så får raden ovan bli en sammanslagning som ympar in `photos` på de live-
// omdömen de hör till. Det senare kräver en pålitlig nyckel — författarnamn
// ensamt räcker inte, två kunder kan heta lika och en bild på fel persons kort
// är värre än ingen bild alls.
//
// Lägg bara in bilder kunden själv publicerat på sitt eget omdöme, och beskriv
// i `alt` vad bilden visar — aldrig kundens namn.

import type { GoogleReview, GoogleReviewsResult } from "./google-reviews";
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from "./social-proof";

export const CURATED_REVIEWS: GoogleReview[] = [
  {
    id: "sigvard-aberg",
    rating: 5,
    author: "Sigvard Åberg",
    // Google visade "för 12 timmar sedan" 2026-09-04.
    date: "2026-09-04",
    // Andra meningen var avhuggen bakom "… Mer" ("Jag ringde och berättade
    // måtten på mitt badrum och vilken färg …") och är därför utelämnad —
    // texten trimmas till sista HELA mening, orden ändras aldrig.
    text: "Jag är väldigt nöjd med den hjälp jag fick från kundtjänsten när jag skulle köpa ett badrumsskåp.",
  },
  {
    id: "maja-kowalski",
    rating: 5,
    author: "Maja Kowalski",
    // Google visade "för 3 dagar sedan" 2026-09-04.
    date: "2026-09-01",
    // Ordagrant, inklusive att sista meningen saknar punkt på Google.
    text: "Tack för bra service och ett mycket professionellt bemötande! Vi är väldigt nöjda med vårt köp och det kan absolut bli fler affärer framöver",
  },
  {
    id: "adam-ekdahl",
    rating: 5,
    author: "Adam Ekdahl",
    // Google visade "för en vecka sedan" 2026-09-02.
    date: "2026-08-26",
    text: "Jag är supernöjd med min upplevelse! Kundtjänsten var väldigt hjälpsam och gav mig tydlig och bra information om produkten, vilket fick mig att känna mig trygg och säker med mitt köp. Mycket uppskattad service och en stor fördel att de tar sig tid att hjälpa kunden. Varmt rekommenderad!",
  },
  {
    id: "emilia-rosen",
    rating: 5,
    author: "Emilia Rosén",
    date: "2026-08-19",
    text: "Trevlig kundservice! Mycket nöjd.",
  },
  {
    id: "sebastian",
    rating: 5,
    author: "Sebastian",
    date: "2026-08-05",
    text: "Bra! Kom snabbt, funkar bra, bra pris. Vad mer behöver man säga.",
  },
  {
    id: "stefan-gajic",
    rating: 5,
    author: "Stefan Gajic",
    date: "2026-06-23",
    text: "Köpte den som min första drönare, var lite nervös först men det gick lättare än jag trodde. Har flugit några gånger nere vid hamnen.",
  },
  {
    id: "felicia-stromberg",
    rating: 5,
    author: "Felicia Strömberg",
    date: "2026-06-26",
    text: "Toppenbur till min dvärgpapegoja! Min papegoja älskar toppen som går att öppna, sitter däruppe direkt 😄 Stadig, lagom stor och lätt att hålla ren. Rekommenderas!",
  },
  {
    id: "orlando",
    rating: 5,
    author: "Orlando",
    date: "2026-05-30",
    text: "Beställde en projektor från Fyndplats och är väldigt nöjd med köpet. Vi använder den hemma till filmkvällar med barnen och bildkvaliteten är riktigt bra.",
  },
  {
    id: "fredrik-gustafsson",
    rating: 5,
    author: "Fredrik Gustafsson",
    date: "2026-06-09",
    text: "Klockren service och ett så himla trevligt bemötande!",
  },
  {
    id: "nicolas-moreira",
    rating: 5,
    author: "Nicolas Moreira",
    date: "2023-06-15",
    text: "Jag köpte en hundhängmatta och fick hem den efter bestämd tid 12 dagar senare och är jätte nöjd. Tack",
  },
  {
    id: "andrew-herranen",
    rating: 5,
    author: "Andrew Herranen",
    date: "2023-06-15",
    text: "Beställde hem Astronaut lampan, den var väldigt fin i mörkret. Snabb leverans också",
  },
  {
    id: "jonathan-hawsho",
    rating: 5,
    author: "Jonathan Hawsho",
    date: "2026-05-30",
    text: "Tack för hjälpen! Otroligt bra bemötande",
  },
  {
    id: "macke-j",
    rating: 5,
    author: "Macke J",
    date: "2024-06-15",
    text: "Min hund älskar sin nya hundbädd!",
  },
  {
    id: "johan-gustafson",
    rating: 5,
    author: "Johan Gustafson",
    date: "2024-06-15",
    text: "Toppen Service, håller vad dem lovar!",
  },
  {
    id: "josef",
    rating: 5,
    author: "Josef",
    date: "2024-06-15",
    text: "väldigt nöjd med mina hörlurar",
  },
  {
    id: "therese-scherp",
    rating: 5,
    author: "Therese Scherp",
    date: "2024-06-15",
    text: "Mycket trevligt bemötande.",
  },
  {
    id: "zabina-petranyi",
    rating: 5,
    author: "Zabina Petrànyi",
    date: "2023-06-15",
    text: "Fina produkter till bra pris!",
  },
  {
    id: "lukas-agirman",
    rating: 5,
    author: "Lukas Agirman",
    date: "2026-05-30",
    text: "Jättenöjd",
  },
  {
    id: "johanna-jonsson",
    rating: 5,
    author: "Johanna Jonsson",
    date: "2024-06-15",
    text: "Toppen 👍",
  },
  {
    id: "peyruz-swoboda",
    rating: 5,
    author: "Peyruz Swoboda",
    date: "2026-06-16",
    text: "Super bra!",
  },
  {
    id: "phillip",
    rating: 5,
    author: "Phillip",
    date: "2026-06-02",
    text: "Tack!!",
  },
  {
    id: "elie-el-zouki",
    rating: 5,
    author: "Elie EL-Zouki",
    date: "2023-06-15",
    text: "Billigt!!",
  },
  {
    id: "aumid-abdulrahim",
    rating: 3,
    author: "Aumid Abdulrahim",
    date: "2025-06-15",
    text: "Nice",
  },
];

export const CURATED_RESULT: GoogleReviewsResult = {
  count: GOOGLE_REVIEW_COUNT,
  average: Number(GOOGLE_RATING.replace(",", ".")) || null,
  reviews: CURATED_REVIEWS,
};
