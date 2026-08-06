import { describe, expect, it } from "vitest";

import { buildTabSections } from "../import/tabs";
import { extractFaqSection, faqPageJsonLd, faqPageJsonLdScript, parseFaq } from "./faq-jsonld";

/**
 * Fixturerna är hämtade ordagrant ur live-katalogen 2026-08-06 (Ricos-formen).
 * De är avsiktligt oredigerade — parsern ska klara det som faktiskt ligger där,
 * inte en städad variant.
 */
const ELTRAKTOR =
  '<h2>Vanliga frågor</h2><p><span style="font-weight: 700">Vilken ålder passar eltraktorn för?</span></p>' +
  "<p>Rekommenderad ålder är 3–6 år och maxvikten på föraren är 30 kg.</p>" +
  '<p><span style="font-weight: 700">Hur länge räcker batteriet?</span></p>' +
  "<p>Cirka 45 minuters körning per laddning. Exakt tid varierar med underlag, körsätt och förarens vikt.</p>" +
  '<p><span style="font-weight: 700">Går släpet att ta av?</span></p>' +
  "<p>Ja, släpet är avtagbart och kan köras både på- och avkopplat.</p>";

const ENTRETAK =
  '<h2>Vanliga frågor</h2><p><span style="font-weight: 700">Passar entrétaket över en vanlig ytterdörr?</span></p>' +
  "<p>Takskivan är 122 cm bred och skjuter ut 89 cm från väggen, vilket täcker en standarddörr med marginal på båda sidor.</p>" +
  '<p><span style="font-weight: 700">Blir det mörkare innanför dörren?</span></p>' +
  "<p>Nej. Skivan är transparent och släpper igenom dagsljus.</p>";

describe("extractFaqSection", () => {
  it("klipper vid nästa H2 och tar inte med grannsektionen", () => {
    const html =
      "<h2>Tekniska specifikationer</h2><p>Vikt: 12 kg</p>" +
      ELTRAKTOR +
      "<h2>Användning och skötsel</h2><p>Torka av med fuktig trasa.</p>";
    const s = extractFaqSection(html);
    expect(s).toContain("Vilken ålder");
    expect(s).not.toContain("Torka av");
    expect(s).not.toContain("Vikt: 12 kg");
  });

  it("returnerar tomt när sektionen saknas", () => {
    expect(extractFaqSection("<h2>Tekniska specifikationer</h2><p>x</p>")).toBe("");
    expect(extractFaqSection("")).toBe("");
  });
});

describe("parseFaq – Ricos-formen (två stycken per par)", () => {
  it("plockar ut alla par i rätt ordning", () => {
    const par = parseFaq(ELTRAKTOR);
    expect(par).toHaveLength(3);
    expect(par[0].q).toBe("Vilken ålder passar eltraktorn för?");
    expect(par[0].a).toBe("Rekommenderad ålder är 3–6 år och maxvikten på föraren är 30 kg.");
    expect(par[2].q).toBe("Går släpet att ta av?");
  });

  it("behåller svenska tecken och tankstreck oförvanskade", () => {
    const par = parseFaq(ENTRETAK);
    expect(par[0].a).toContain("122 cm bred");
    expect(par[1].q).toBe("Blir det mörkare innanför dörren?");
  });
});

describe("parseFaq – generatorns form (ett stycke per par)", () => {
  it("läser <strong>F</strong><br/>S", () => {
    const html =
      "<h2>Vanliga frågor</h2>" +
      "<p><strong>Ingår batterier?</strong><br/>Nej, de köps separat.</p>" +
      "<p><strong>Kan den tvättas?</strong><br/>Ja, i 30 grader.</p>";
    expect(parseFaq(html)).toEqual([
      { q: "Ingår batterier?", a: "Nej, de köps separat." },
      { q: "Kan den tvättas?", a: "Ja, i 30 grader." },
    ]);
  });

  it("matchar det buildTabSections faktiskt producerar", () => {
    const sektioner = buildTabSections({
      specs: [],
      packageContents: [],
      faq: [{ q: "Hur lång är kabeln?", a: "5 meter." }],
      careHtml: "",
    } as Parameters<typeof buildTabSections>[0]);
    const faqSektion = sektioner.find((s) => s.title === "Vanliga frågor");
    expect(faqSektion).toBeDefined();
    const html = `<h2>${faqSektion!.title}</h2>${faqSektion!.html}`;
    expect(parseFaq(html)).toEqual([{ q: "Hur lång är kabeln?", a: "5 meter." }]);
  });
});

describe("parseFaq – robusthet", () => {
  it("kastar en fråga som saknar svar i stället för att para ihop fel", () => {
    const html =
      "<h2>Vanliga frågor</h2>" +
      '<p><span style="font-weight: 700">Fråga utan svar?</span></p>' +
      '<p><span style="font-weight: 700">Fråga med svar?</span></p><p>Svaret.</p>';
    expect(parseFaq(html)).toEqual([{ q: "Fråga med svar?", a: "Svaret." }]);
  });

  it("avkodar HTML-entiteter", () => {
    const html =
      "<h2>Vanliga frågor</h2>" +
      "<p><strong>Passar den 60&nbsp;cm?</strong><br/>Ja &amp; med marginal.</p>";
    expect(parseFaq(html)).toEqual([{ q: "Passar den 60 cm?", a: "Ja & med marginal." }]);
  });

  it("hoppar över tomma stycken utan att tappa efterföljande par", () => {
    const html =
      "<h2>Vanliga frågor</h2><p></p>" +
      '<p><span style="font-weight: 700">Fungerar den ute?</span></p><p>&nbsp;</p><p>Ja.</p>';
    expect(parseFaq(html)).toEqual([{ q: "Fungerar den ute?", a: "Ja." }]);
  });
});

describe("faqPageJsonLd", () => {
  it("bygger giltig FAQPage", () => {
    const ld = faqPageJsonLd(ELTRAKTOR) as any;
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(3);
    expect(ld.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Vilken ålder passar eltraktorn för?",
      acceptedAnswer: { "@type": "Answer", text: "Rekommenderad ålder är 3–6 år och maxvikten på föraren är 30 kg." },
    });
  });

  it("returnerar null utan par — hellre inget schema än ett ofullständigt", () => {
    expect(faqPageJsonLd("<h2>Tekniska specifikationer</h2><p>x</p>")).toBeNull();
    expect(faqPageJsonLd("<h2>Vanliga frågor</h2>")).toBeNull();
    expect(faqPageJsonLd("")).toBeNull();
  });

  it("faqPageJsonLdScript kan inte bryta ut ur script-taggen", () => {
    const html =
      "<h2>Vanliga frågor</h2>" +
      "<p><strong>Vad händer vid &lt;/script&gt;?</strong><br/>Inget.</p>";
    // Rått JSON.stringify läcker taggen — det är just därför hjälparen finns.
    expect(JSON.stringify(faqPageJsonLd(html))).toContain("</script>");

    const trygg = faqPageJsonLdScript(html);
    expect(trygg).not.toContain("</script>");
    expect(trygg).not.toContain("<");
    // ...men innehållet är intakt när det parsas tillbaka.
    expect(JSON.parse(trygg).mainEntity[0].name).toBe("Vad händer vid </script>?");
  });

  it("faqPageJsonLdScript ger tom sträng utan par", () => {
    expect(faqPageJsonLdScript("<h2>Tekniska specifikationer</h2><p>x</p>")).toBe("");
  });
});
