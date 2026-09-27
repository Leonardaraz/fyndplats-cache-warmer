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
// STÄMD MOT PROFILEN 2026-09-27, mot Leonards skärmdumpar av hela listan. Ett
// omdöme som inte längre finns på Google ska inte stå kvar här — kortet säger
// "Recension från Google" och länkar dit. Sex var borta (Google rensar i svep,
// se noten i lib/social-proof.ts) och togs bort, bilderna med dem; fem nya
// med text lades till.
//
// Snittbetyget kommer INTE härifrån utan från getSocialProof()
// (lib/social-proof-live.ts): Googles eget när API:t svarar, annars reserven i
// lib/social-proof.ts. Korten nedan (22 st med text) är ett urval — "Se alla på
// Google" länkar till samtliga. Resten av profilens omdömen är stjärn-bara utan
// text och har inget att visa här. Något TOTALANTAL visas inte längre någonstans;
// se noten överst i lib/social-proof.ts för varför.
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
//
// ADRESSERNA. Bilderna ligger i sajtens egen Media Manager (uppladdade
// 2026-09-04), inte kvar hos Google — en Google-adress hade slutat svara den
// dag kunden tog bort bilden, och vi hade inte märkt det. `src` bär en
// KVADRATISK fill-transform med flit: rutan i kortet är 84×84 med
// object-fit:cover, så beskärningen sker ändå. Görs den hos Wix i stället för
// i webbläsaren slipper besökaren ladda ner pixlar som aldrig syns — uppmätt
// 7–13 kB per miniatyr mot 27–67 kB för originalet. lib/image-loader.ts skalar
// w_/h_ proportionellt per srcset-bredd, så 1:1 här ger 1:1 hela vägen.
//
// Bilderna kodades om innan uppladdning (sharp, max 900 px, q78). Det var inte
// bara för storleken: omkodningen släpper EXIF, alltså tidpunkt, kameramodell
// och eventuella GPS-koordinater. Kundernas foton ska inte bära med sig var de
// togs. Drönarbildens svarta filmkanter — den var en videoskärmdump — beskars
// bort i samma steg.

import type { GoogleReview, GoogleReviewsResult } from "./google-reviews";
import { GOOGLE_RATING } from "./social-proof";

export const CURATED_REVIEWS: GoogleReview[] = [
  {
    id: "mattias-mentes",
    rating: 5,
    author: "Mattias Mentes",
    // Google visade "för en vecka sedan" 2026-09-27.
    date: "2026-09-20",
    text: "Väldigt nöjd med Fyndplats! Trevlig och hjälpsam kundtjänst som gav ett bra bemötande. Även leveransen överträffade mina förväntningar och allt gick smidigt. Handlar gärna här igen!",
  },
  {
    id: "samia-karam",
    rating: 5,
    author: "Samia Karam",
    // Google visade "för 2 dagar sedan" 2026-09-27.
    date: "2026-09-25",
    text: "Jag tycker allt gick bra och smidigt, produkten var som beskrivet och leveransen kom i tid:)",
  },
  {
    id: "stefan-gajic",
    rating: 5,
    author: "Stefan Gajic",
    date: "2026-06-23",
    text: "Köpte den som min första drönare, var lite nervös först men det gick lättare än jag trodde. Har flugit några gånger nere vid hamnen.",
    // Kundens egen bild — se noten om kundbilder överst i filen.
    photos: [
      {
        src: "https://static.wixstatic.com/media/b379ce_b834b24c38114775a9acac5615766941~mv2.jpg/v1/fill/w_168,h_168,al_c,q_85/file.jpg",
        alt: "En uppackad Potensic ATOM-drönare med väska, batterier, kablar och reservpropellrar.",
      },
    ],
  },
  {
    id: "orlando",
    rating: 5,
    author: "Orlando",
    date: "2026-05-30",
    text: "Beställde en projektor från Fyndplats och är väldigt nöjd med köpet. Vi använder den hemma till filmkvällar med barnen och bildkvaliteten är riktigt bra.",
  },
  {
    id: "malin-eklof",
    rating: 5,
    author: "Malin Eklöf",
    // Google visade "för 2 veckor sedan" 2026-09-27.
    date: "2026-09-13",
    text: "Jag är jättenöjd! Snabb frakt och bra pris:)",
  },
  {
    id: "emilia-rosen",
    rating: 5,
    author: "Emilia Rosén",
    date: "2026-08-19",
    text: "Trevlig kundservice! Mycket nöjd.",
  },
  {
    id: "gabriel-arslan",
    rating: 5,
    author: "Gabriel Arslan",
    // Google visade "för 3 veckor sedan" 2026-09-27.
    date: "2026-09-06",
    text: "Enkelt! Bra service!",
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
    id: "stefan-gajic-musikbox",
    rating: 4,
    author: "Stefan Gajic",
    // Samma kund som drönaromdömet, ett eget äldre omdöme ("för 3 år sedan").
    date: "2023-06-15",
    text: "Det var längre leveranstid än jag förväntade mig. Men den musikaliska boxen jag köpte hade mycket fler ljud och funktioner än jag trodde:)",
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
  // `count` fyller bara typen. Ingen yta visar ett antal omdömen längre (se
  // noten överst i lib/social-proof.ts), och den här listan vet ändå inte hur
  // många profilen har — bara hur många kort som står här. Sätt den inte till
  // ett påhittat profiltotal.
  count: CURATED_REVIEWS.length,
  average: Number(GOOGLE_RATING.replace(",", ".")) || null,
  reviews: CURATED_REVIEWS,
};
