// =============================================================================
//  Auktoritativ EU/EES-lands­lista för HELA tillägget — EN sanningskälla.
// =============================================================================
//
// Tidigare hade popup.js, content.js och discover.js varsin hårdkodad lista:
// discover.js körde 27 länder medan popup.js/content.js bara 9. Följden var att
// en produkt med lager i t.ex. SE eller DK fick "EU"-badge på sök-/kategorisidan
// men "Kina/okänt" i popupen — samma produkt, olika svar i samma tillägg.
//
// Nu definieras listan EN gång här och inkluderas före de andra skripten:
//   - manifest.json content_scripts: ["eu-countries.js", "content.js"] (item)
//   - manifest.json content_scripts: ["eu-countries.js", "discover.js"] (sök)
//   - popup.html: <script src="eu-countries.js"> före <script src="popup.js">
//
// Eftersom content-skript kör flera filer i SAMMA isolerade värld men varje fil
// har sitt eget topp-scope (top-level `const`/`let` läcker INTE mellan filer),
// exponerar vi listan via `globalThis.FP_EU` så syskon-skripten kan läsa den.
//
// HÅLL I SYNK med serverns lib/aliexpress/eu-countries.ts (DEFAULT_EU_COUNTRIES).
// Det är två modulsystem (browser-global vs TS-import) så de kan inte dela fil —
// men listorna MÅSTE vara identiska. Ändrar du här, ändra även där.
//
// Listan är "27 EU/EES-warehouse-länder": EU-medlemmar + EES (NO) + GB. GB tas
// med för att många "EU"-lager i praktiken är UK-lager med snabb västeuropa-
// shipping. Urvalet speglar snabb leverans (3–7 dagar) till svenska kunder.

(() => {
  "use strict";

  // ISO-3166-1 alpha-2 → svenskt namn + flagga. Ordningen = "störst/vanligast
  // warehouse först" och används också som EU_PRIORITY (auto-applikationens val).
  const COUNTRIES = [
    ["ES", "Spanien", "🇪🇸"],
    ["PL", "Polen", "🇵🇱"],
    ["CZ", "Tjeckien", "🇨🇿"],
    ["DE", "Tyskland", "🇩🇪"],
    ["FR", "Frankrike", "🇫🇷"],
    ["IT", "Italien", "🇮🇹"],
    ["NL", "Nederländerna", "🇳🇱"],
    ["BE", "Belgien", "🇧🇪"],
    ["SE", "Sverige", "🇸🇪"],
    ["DK", "Danmark", "🇩🇰"],
    ["FI", "Finland", "🇫🇮"],
    ["AT", "Österrike", "🇦🇹"],
    ["GB", "Storbritannien", "🇬🇧"],
    ["IE", "Irland", "🇮🇪"],
    ["PT", "Portugal", "🇵🇹"],
    ["GR", "Grekland", "🇬🇷"],
    ["NO", "Norge", "🇳🇴"],
    ["HU", "Ungern", "🇭🇺"],
    ["RO", "Rumänien", "🇷🇴"],
    ["SK", "Slovakien", "🇸🇰"],
    ["SI", "Slovenien", "🇸🇮"],
    ["HR", "Kroatien", "🇭🇷"],
    ["BG", "Bulgarien", "🇧🇬"],
    ["LT", "Litauen", "🇱🇹"],
    ["LV", "Lettland", "🇱🇻"],
    ["EE", "Estland", "🇪🇪"],
    ["LU", "Luxemburg", "🇱🇺"],
  ];

  const EU_CODES = new Set(COUNTRIES.map(([iso]) => iso));
  const EU_PRIORITY = COUNTRIES.map(([iso]) => iso);
  const ISO_TO_NAME = Object.fromEntries(COUNTRIES.map(([iso, name]) => [iso, name]));
  const FLAG = Object.fromEntries(COUNTRIES.map(([iso, , flag]) => [iso, flag]));

  // Lands-/sidofälts-namn → ISO-2 (engelska + svenska — AE-locale varierar).
  // Inkluderar även några icke-EU-länder så de kan identifieras/varnas för.
  const NAME_TO_ISO = {
    "UNITED KINGDOM": "GB", UK: "GB", BRITAIN: "GB", ENGLAND: "GB", STORBRITANNIEN: "GB",
    SPAIN: "ES", SPANIEN: "ES", "ESPAÑA": "ES",
    GERMANY: "DE", TYSKLAND: "DE", DEUTSCHLAND: "DE",
    "CZECH REPUBLIC": "CZ", CZECHIA: "CZ", TJECKIEN: "CZ",
    POLAND: "PL", POLEN: "PL",
    FRANCE: "FR", FRANKRIKE: "FR",
    ITALY: "IT", ITALIEN: "IT", ITALIA: "IT",
    NETHERLANDS: "NL", NEDERLÄNDERNA: "NL", HOLLAND: "NL",
    BELGIUM: "BE", BELGIEN: "BE",
    SWEDEN: "SE", SVERIGE: "SE",
    DENMARK: "DK", DANMARK: "DK",
    FINLAND: "FI",
    NORWAY: "NO", NORGE: "NO",
    AUSTRIA: "AT", ÖSTERRIKE: "AT",
    IRELAND: "IE", IRLAND: "IE",
    PORTUGAL: "PT",
    GREECE: "GR", GREKLAND: "GR",
    HUNGARY: "HU", UNGERN: "HU",
    ROMANIA: "RO", RUMÄNIEN: "RO",
    SLOVAKIA: "SK", SLOVAKIEN: "SK",
    SLOVENIA: "SI", SLOVENIEN: "SI",
    CROATIA: "HR", KROATIEN: "HR",
    BULGARIA: "BG", BULGARIEN: "BG",
    LITHUANIA: "LT", LITAUEN: "LT",
    LATVIA: "LV", LETTLAND: "LV",
    ESTONIA: "EE", ESTLAND: "EE",
    LUXEMBOURG: "LU", LUXEMBURG: "LU",
    // icke-EU (för att kunna identifiera/varna)
    CHINA: "CN", KINA: "CN",
    TURKEY: "TR", TURKIET: "TR",
    "UNITED STATES": "US", USA: "US", RUSSIA: "RU", RYSSLAND: "RU",
  };

  // ===========================================================================
  //  EU:S TULLUNION — de 27 medlemsstaterna. INTE samma sak som EU_CODES ovan.
  // ===========================================================================
  //
  // EU_CODES svarar på "kommer paketet fram snabbt?" och räknar därför in GB
  // och NO. Den här listan svarar på "kan vi köpa in därifrån utan tull?", och
  // där är svaret nej för båda: Storbritannien lämnade tullunionen, Norge har
  // aldrig varit med. Ett paket därifrån till en svensk kund betyder
  // tulldeklaration, importmoms och förseningar — kostnader som äter marginalen
  // på en hel produkt utan att synas i vår bokföring.
  //
  // Bakgrund (Leonards rapport 2026-08-21, SucceBuy-klädstället 1005005972133031):
  // listningen har sex storlekar i sju lager, och "EU-först" bockade i GB-raderna
  // åt honom eftersom de låg i EU_CODES. Han såg det själv — GB hör inte hemma
  // i ett inköpsbeslut.
  //
  // REGELN: allt som VÄLJER ett lager att köpa från använder EU_TULL_CODES.
  // Allt som beskriver LEVERANSTID (badges, EU-filtret i discover) använder
  // EU_CODES. CY och MT saknas i EU_CODES (de har sällan AE-lager) men är
  // fullvärdiga medlemmar och hör hemma här.
  //
  // HÅLL I SYNK med serverns EU_CUSTOMS_UNION i lib/aliexpress/eu-countries.ts.
  // Ett test i lib/aliexpress/eu-countries.test.ts fäller om de glider isär.
  const EU_TULL_CODES = new Set([
    "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
    "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
    "SE", "SI", "SK",
  ]);

  globalThis.FP_EU = Object.freeze({
    EU_CODES,
    EU_TULL_CODES,
    EU_PRIORITY,
    NAME_TO_ISO,
    ISO_TO_NAME,
    FLAG,
  });
})();
