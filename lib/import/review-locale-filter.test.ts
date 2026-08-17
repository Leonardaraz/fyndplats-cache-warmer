import { describe, expect, it } from "vitest";
import { foreignLocaleVerdict, mentionsForeignDelivery } from "./review-locale-filter";

// De faktiska raderna som fällde beslutet (Leonards rapport 2026-08-16).
describe("skarpa fall från första importomgången", () => {
  const skaBort: [string, string][] = [
    ["Kom snabbt till Tjeckien. Mycket väl förpackad.", "land"],
    ["Leveransen till Frankrike gick mycket snabbt, 3–4 dagar.", "land"],
    ["Hej, den kom till Rumänien på 4 dagar och fungerar.", "land"],
    ["Med rabatter kostade den mig 70 € så jag är supernöjd.", "valuta"],
    ["Jag lyckades köpa utrustningen för 129 zł. Ett mästerligt pris.", "valuta"],
    ["Köpt för 47,70 euro den 19 december 2025.", "valuta"],
    ["Men jag fick betala 330 kronor i förtullning.", "tull"],
    ["samma väska kostar 370 zł på Allegro", "valuta"],
    ["Till och med manualen är på franska! Otroligt.", "språk"],
  ];
  for (const [text, reason] of skaBort) {
    it(`fäller: ${text.slice(0, 45)}…`, () => {
      const v = foreignLocaleVerdict(text);
      expect(v.foreign).toBe(true);
      expect(v.reason).toBe(reason);
    });
  }
});

describe("det som ska släppas igenom", () => {
  // Avsändarland är inte samma sak som mottagarland — varorna skickas från
  // EU-lager även till svenska kunder.
  it("avsändarland fälls inte", () => {
    expect(mentionsForeignDelivery("Mycket snabb frakt från Polen. Fot och bord i gjutjärn.")).toBe(false);
    expect(mentionsForeignDelivery("Frakten från Spanien var megasnabb.")).toBe(false);
    expect(mentionsForeignDelivery("Very fast shipping from Poland.")).toBe(false);
  });

  it("fraktbolag som kör i Sverige fälls inte", () => {
    expect(mentionsForeignDelivery("Budet (DPD) var inte särskilt varsamt med paketet.")).toBe(false);
    expect(mentionsForeignDelivery("GLS lämnade paketet hos grannen.")).toBe(false);
  });

  it("svenska priser fälls inte", () => {
    expect(mentionsForeignDelivery("Kostade 1 299 kr, väl värt pengarna.")).toBe(false);
    expect(mentionsForeignDelivery("Bra pris, 899 SEK.")).toBe(false);
  });

  it("Sverige nämnt är precis vad vi vill ha", () => {
    expect(mentionsForeignDelivery("Kom till Sverige på fyra dagar.")).toBe(false);
  });

  it("vanliga omdömen utan platsuppgift går igenom", () => {
    expect(mentionsForeignDelivery("Väldigt praktisk! Den fälls ihop utmärkt och håller vikten bra.")).toBe(false);
    expect(mentionsForeignDelivery("Fodralet är lite skräpigt, men själva britsen är perfekt.")).toBe(false);
    expect(mentionsForeignDelivery("Levererad på 2 dagar, fantastiskt fynd.")).toBe(false);
  });

  it("mått och temperaturer förväxlas inte med valuta", () => {
    expect(mentionsForeignDelivery("På 15 minuter går temperaturen från 14 °C till 38 °C.")).toBe(false);
    expect(mentionsForeignDelivery("8 kW räcker för att värma 20 m².")).toBe(false);
    expect(mentionsForeignDelivery("Den klarar personer på 95–100 kg utan problem.")).toBe(false);
  });

  it("tom text kraschar inte", () => {
    expect(mentionsForeignDelivery("")).toBe(false);
    expect(mentionsForeignDelivery("   ")).toBe(false);
  });
});

// Filtret ska fungera FÖRE översättning, annars betalar vi för text vi kastar.
describe("originalspråk (före översättning)", () => {
  it("fäller landsnamn på källspråket", () => {
    expect(mentionsForeignDelivery("Came fast to Czech Republic.")).toBe(true);
    expect(mentionsForeignDelivery("livraison France très rapide 3/4 j.")).toBe(true);
    expect(mentionsForeignDelivery("Hi 4 gunde Romania a geldi calisiyor")).toBe(true);
    expect(mentionsForeignDelivery("Wysyłka do Polski bardzo szybka")).toBe(true);
  });

  it("fäller valutasymboler oavsett språk", () => {
    expect(mentionsForeignDelivery("con descuentos me costó 70€")).toBe(true);
    expect(mentionsForeignDelivery("zszedłem z ceną do 254zl")).toBe(true);
    expect(mentionsForeignDelivery("für Schlappe 136 Euronen")).toBe(true);
  });

  it("fäller tull på källspråket", () => {
    expect(mentionsForeignDelivery("Але заплатив за розмитнення це 330 крон")).toBe(true);
  });
});
