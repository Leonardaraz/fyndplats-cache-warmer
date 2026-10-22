// Har en Aosom-vara el eller batterier?
//
// VARFÖR DEN FINNS (Leonard 2026-10-22, egen kassa med Stripe för Danmark).
// Planen öppnar Danmark med Aosom-varor UTAN el och batterier. Producentansvaret
// i Danmark registreras per slag: förpackningar gäller allt vi säljer, men el
// (WEEE) och batterier är egna registreringar med egna avgifter. Utan dem
// räcker ett ombud för förpackningarna.
//
// ☠️ KLASSNINGEN LUTAR ÅT ATT STOPPA. En vara som felaktigt släpps igenom säljs
// i Danmark utan registrering. En vara som felaktigt stoppas säljs bara inte där
// än. Därför räcker en enda stark signal, och en LED-list i ett TV-bord stoppar
// hela bordet: det är elektronik i lagens mening.
//
// TVÅ NIVÅER (2026-10-22, efter första körningen). Den första versionen hade en
// enda lista med breda ord, och den stoppade 1 340 av 4 241 sidor. En granskning
// av namnen visade att ungefär 400 av dem saknar el: soffor med "Seitentaschen
// für Fernbedienungen", köksskåp med "Mikrowellenfach", textilier som tål
// "Waschmaschine", klätterleksaker som tränar "motorische Fähigkeiten", fönster-
// skärmar som dämpar "Geräusche" och kolgrillar som "aufheizen". Därför:
//
//   STARKA (MONSTER) stoppar sidan. Orden är snävade till de former som betyder
//   att varan själv har el: "mit Fernbedienung", inte "Fernbedienung".
//   BREDA (BRED) är den första versionens ord, ordagrant. De stoppar ingenting,
//   men en träff bärs med ett textutdrag, så att en människa kan se varför en
//   sida släpptes. Tar den breda listan något som den starka missar är det där
//   det syns.
//
// Underlaget är Aosoms tyska text (namn, kategori, säljpunkter, beskrivning)
// och vårt svenska namn. Feedens mått och paketmått läses inte: där står W och
// V för bredd och annat, inte för watt och volt.
//
// Varje träff har en fast etikett, och räknarna i den publika Actions-loggen
// räknar bara etiketter. Utdragen är Aosoms text och följer bara med i den
// krypterade listan, med artikelnummerformer bortredigerade.

import { redigera } from "../polish/skrivplan";

export type Signalgrupp =
  | "batteri"
  | "el"
  | "ljus"
  | "varme_kyla"
  | "ljud"
  | "massage"
  | "hushall"
  | "klocka";

export interface Signal {
  grupp: Signalgrupp;
  /** Fast etikett för träffen, t.ex. "LED" eller "Akku". Aldrig ett textutdrag. */
  ord: string;
}

export interface Traff extends Signal {
  /** Texten runt den första träffen, högst ~150 tecken, artikelnummer bortredigerade. */
  utdrag: string;
}

export interface Klassning {
  /** Starka signaler: varan har el eller batterier. En räcker för att stoppa. */
  starka: Traff[];
  /** Breda ord som inte stoppar, utan etiketterna som redan finns bland de starka. */
  svaga: Traff[];
}

interface Monster {
  grupp: Signalgrupp;
  ord: string;
  re: RegExp;
}

// JavaScripts \b räknar bara A–Z, 0–9 och _ som bokstäver, även med u-flaggan.
// För den var W:et i "5 Würfel" ett helt ord, och tärningarna blev 5 watt. ‹ och
// › i mönstren nedan är ordgränser som räknar å, ä, ö, ü och ß som bokstäver.
const ORDETS_BORJAN = "(?<![\\p{L}\\p{N}])";
const ORDETS_SLUT = "(?![\\p{L}\\p{N}])";
function rx(kalla: string, flaggor = "iu"): RegExp {
  return new RegExp(kalla.replaceAll("‹", ORDETS_BORJAN).replaceAll("›", ORDETS_SLUT), flaggor);
}

// Fraser som tas bort innan de starka mönstren läses. De ersätts med lika många
// blanksteg, så att träffarnas plats i texten stämmer för utdragen.
const BORT: readonly RegExp[] = [
  // Tv-apparater som ett tv-bord eller ett tv-ställ är gjort för: "für LED-,
  // LCD- und Plasma-Fernseher" är inte el i bordet.
  rx(
    "(?:(?:LED|LCD|OLED|QLED|Plasma)[-\\s,/]*(?:(?:und|oder|&)[-\\s,/]*)?)+(?:TVs?|Fernseher\\w*|Flachbildfernseher\\w*|Bildschirm\\w*|Monitor\\w*)",
    "giu",
  ),
  // Det varan INTE behöver. Bara former som säger det om varan själv: "wird
  // ohne Batterien geliefert" betyder att varan behöver batterier, så "ohne
  // Batterie" ensamt tas inte bort.
  rx(
    "(?:benötigt|braucht|erfordert)\\s+(?:keine?n?|kein)\\s+(?:[^\\s.,;:!?]+\\s+){0,2}?(?:strom\\w*|batterie\\w*|akku\\w*|elektrizität|steckdose\\w*)",
    "giu",
  ),
  rx(
    "(?:funktioniert|läuft|arbeitet|kühlt|bewegt sich)\\s+(?:ganz\\s+|komplett\\s+|völlig\\s+)?ohne\\s+(?:[^\\s.,;:!?]+\\s+){0,2}?(?:strom\\w*|batterie\\w*|akku\\w*|elektrizität|motor\\w*)",
    "giu",
  ),
  rx(
    "(?:keine?n?|kein)\\s+(?:[^\\s.,;:!?]+\\s+){0,2}?(?:strom\\w*|batterie\\w*|akku\\w*|elektrizität|motor\\w*)\\s+(?:nötig|notwendig|erforderlich|benötigt)",
    "giu",
  ),
  rx("‹ohne\\s+(?:strom|elektrizität|stromanschluss)›", "giu"),
  rx("batterie(?:n)?frei|‹stromlos›|stromunabhängig|nicht elektrisch|keine elektrischen? (?:teile|komponenten|bauteile)", "giu"),
  // Våra svenska namn säger det rakt ut ("Kylbox 42,6 liter utan el").
  rx("‹utan\\s+(?:el|elektricitet|batterier?|ström|sladd|motor)›", "giu"),
  rx("kräver\\s+(?:ingen|inte|inga)\\s+(?:el|ström|batterier?)›", "giu"),
];

// De starka mönstren. Ordningen spelar ingen roll. Varje mönster som undviker en
// känd falsk träff har en kommentar, för det är där nästa ändring riskerar att
// öppna den igen. Samma etikett kan ha flera mönster: det första som träffar
// ger utdraget.
const MONSTER: readonly Monster[] = [
  // Batterier. Tyska "Batterie" och svenska "batteri" i samma mönster. En
  // "Mischbatterie" eller "Wannenbatterie" är en blandarkran, inte ett batteri.
  {
    grupp: "batteri",
    ord: "Batteri",
    re: rx("(?<!misch|wannen|einhebel|brause|dusch|waschtisch|spültisch|küchen|armatur)batteri"),
  },
  // "Akkuschrauber" står i monteringsråd ("ein Akkuschrauber hilft").
  { grupp: "batteri", ord: "Akku", re: rx("akku(?!schrauber)") },
  { grupp: "batteri", ord: "Knappcell", re: rx("knopfzelle|knappcell") },
  { grupp: "batteri", ord: "Laddbar", re: rx("wiederaufladbar|aufladbar|uppladdningsbar|laddbar") },
  { grupp: "batteri", ord: "Sladdlös", re: rx("kabellos|sladdlös") },
  // Solcellslampor och solcellsfontäner har ett batteri. En "Solardusche" är en
  // svart vattentank som solen värmer, och en "Solarplane" en poolduk.
  {
    grupp: "batteri",
    ord: "Solcell",
    re: rx("solar(?!dusche|plane|abdeckung|folie|heizung|kollektor|matte)|solcell|solpanel"),
  },

  // El. Förzinkat, svetsat och lackerat stål ("elektroverzinkt",
  // "elektrogeschweißt", "Elektrotauchlackierung") och utrymme för andras
  // apparater ("Platz für Elektrogeräte", "Elektrowerkzeuge") är inte el i varan.
  {
    grupp: "el",
    ord: "Elektrisk",
    re: rx(
      "elektr(?!o?lyt|o ?-?verzink|ostat|isch verzink|o-?geschwei|o-?galvan|o-?tauch|ophor|o-?lack|o-?beschicht|iker|o-?ger[äa]t|onik›|onikger[äa]t|o-?werkzeug|ische(?:n)? ger[äa]te)",
    ),
  },
  {
    grupp: "el",
    ord: "El-",
    re: rx("‹el-?(?:bil|bilar|kamin|grill|cykel|sparkcykel|motor|värme|driven|uttag|ledning|element)"),
  },
  // "stromlinienförmig" är en form, och tyska "strömt/strömen/Strömung" är luft
  // och vatten som flödar.
  { grupp: "el", ord: "Ström", re: rx("‹strom(?!linie)|‹ström(?!t›|en›|ung|ende|men›)") },
  {
    grupp: "el",
    ord: "Stickkontakt",
    re: rx("netzteil|netzstecker|netzkabel|stromkabel|steckdose|‹stecker›|nätadapter|nätsladd|eluttag|stickpropp|‹laddare›"),
  },
  { grupp: "el", ord: "Laddning", re: rx("ladegerät|ladekabel|ladestation|ladefunktion|laddkabel|laddstation") },
  { grupp: "el", ord: "USB", re: rx("‹USB›") },
  { grupp: "el", ord: "Volt", re: rx("‹volt›") },
  // Versalt V utan bindestreck efter: "2 V-Bremsen" och "72 V-Ringe" är bromsar
  // och ringar, och "2 Vögel" är fåglar.
  { grupp: "el", ord: "Volt", re: rx("‹\\d+(?:[.,]\\d+)?\\s?V(?![\\p{L}\\p{N}-])", "u") },
  { grupp: "el", ord: "Watt", re: rx("‹watt›") },
  // Versalt W, inte i ett mått ("120 x 60W x 75H", "60W cm") och inte före ett
  // ord ("5 Würfel", "2 Wäschekörbe").
  {
    grupp: "el",
    ord: "Watt",
    re: rx("(?<![xX×*]\\s*)‹\\d+(?:[.,]\\d+)?\\s?W(?![\\p{L}\\p{N}])(?!\\s*(?:[xX×*/]|cm|mm))", "u"),
  },
  // En motor och dess böjningar, med eller utan förled ("Elektromotor"). Men
  // "Motorik" och "motorische Fähigkeiten" tränar barn, och "Motorrad" och
  // "motorcykel" kan trampas eller stå i ett garage.
  { grupp: "el", ord: "Motor", re: rx("motor(?:en|er|n|erna|s)?›|motorisiert|motorbetrieben|motordriv") },
  { grupp: "el", ord: "Kompressor", re: rx("kompressor") },
  // Bara pumpar som är apparater. En "Pumpe" ensam följer ofta med en boll eller
  // en luftmadrass, och en "Schwengelpumpe" är en trädgårdsdekoration.
  {
    grupp: "el",
    ord: "Pump",
    re: rx(
      "(?:filter|wasser|teich|umwälz|solar|tauch|brunnen|pool|schmutzwasser|aquarien|aquarium|fontänen)pumpe|elektrische (?:luft)?pumpe|elektropumpe|(?:fontän|pool|filter|vatten|damm|dränk)pump",
    ),
  },
  // "Fernbedienung" ensam står i varannan soffa: "Seitentaschen für
  // Fernbedienungen". Det är varan MED en fjärrkontroll som har el. Upp till
  // tre ord får stå emellan ("mit 2,4G Fernbedienung"), men inte "für".
  {
    grupp: "el",
    ord: "Fjärrkontroll",
    re: rx(
      "ferngesteuert|fernsteuerung|‹(?:mit|per|über|inkl\\.?|inklusive|samt)\\s+(?:(?!für›|zur›|zum›|von›|als›)(?:\\d+(?:[.,]\\d+)*\\p{L}*|[^\\s.,;:!?]+)\\s+){0,3}fernbedienung|fernbedienung\\s+(?:ist\\s+)?(?:inklusive|enthalten|im lieferumfang|mitgeliefert|beiliegend)|fjärrstyrd|radiostyrd|(?<!för |till )fjärrkontroll(?!s?(?:ficka|fack|hållare))",
    ),
  },
  { grupp: "el", ord: "RC", re: rx("‹RC›", "u") },
  { grupp: "el", ord: "Bluetooth", re: rx("bluetooth") },
  { grupp: "el", ord: "WLAN", re: rx("‹wlan›|‹wi-?fi›") },
  { grupp: "el", ord: "App", re: rx("‹app›|app-steuerung|appstyrd") },
  // "sensorisch/sensorisk" och "Sensorspielzeug" är sinnesleksaker.
  { grupp: "el", ord: "Sensor", re: rx("sensor(?!isch|isk|y|ik|spiel|leksak)|bewegungsmelder|rörelsevakt") },
  { grupp: "el", ord: "Kamera", re: rx("kamera|camera") },
  { grupp: "el", ord: "Display", re: rx("‹LCD›|digitalanzeige|digitale anzeige|digitaldisplay|trainingscomputer|‹display›") },
  // Laserskuren metall ("lasergeschnitten") och en projektorduk är ingen laser.
  { grupp: "el", ord: "Laser", re: rx("‹laser(?:pointer|projektor|licht|lichter|show)?›") },
  { grupp: "el", ord: "Timer", re: rx("‹timer›") },

  // Ljus. Tyska "Licht" ensamt räknas inte: "Sonnenlicht", "lichtdurchlässig",
  // "Pflanzen mit Licht versorgen". En lampa ensam ("Platz für eine Lampe")
  // står på skrivbord och byråer, så tyska Lampe räknas bara som sammansättning.
  { grupp: "ljus", ord: "LED", re: rx("‹LEDs?›", "u") },
  {
    grupp: "ljus",
    ord: "Lampa",
    re: rx(
      "lampa|lampor|(?:steh|tisch|wand|decken|hänge|pendel|nachttisch|lese|schreibtisch|bogen|solar|garten|boden|stimmungs|nacht|salz|lava|led-)lampe|lampenschirm",
    ),
  },
  // Substantivet med versalt L, eller en sammansättning ("Solarleuchte").
  // Verbet ("die Farben leuchten", "aufleuchten", "beleuchten") räknas inte.
  { grupp: "ljus", ord: "Leuchte", re: rx("‹Leuchten?›", "u") },
  { grupp: "ljus", ord: "Leuchte", re: rx("(?<=\\p{Ll})(?<!‹(?:be|auf|er|ein|an))leuchten?›", "u") },
  // "gut beleuchtet" (av fönstren) räknas inte, "beleuchtete Vitrine" gör det.
  {
    grupp: "ljus",
    ord: "Belysning",
    re: rx(
      "mit (?:integrierter |eingebauter |indirekter |dimmbarer )?(?:led-)?beleuchtung|innenbeleuchtung|beleuchtungsfunktion|‹beleuchtete[nrsm]?›|belysning|upplyst",
    ),
  },
  // "für Lichterketten geeignet" är en gran utan ljus.
  {
    grupp: "ljus",
    ord: "Ljuseffekt",
    re: rx(
      "lichteffekt|lichtfunktion|nachtlicht|‹(?:mit|inkl\\.?|inklusive)\\s+(?:[^\\s.,;:!?]+\\s+){0,2}lichter(?:n|kette|ketten)?›|licht[- ]und (?:sound|ton|geräusch|musik)|(?:sound|ton|geräusch|musik)\\S*[- ]und licht|‹blinkend|‹blinkt›|leuchtende augen|ljusslinga|ljusslingor|nattlampa|ljuseffekt|lysande",
    ),
  },
  // "Scheinwerfer" på en trampbil kan vara gjutna i plasten, och en riktig
  // lampa säger LED. Det står bland de breda orden.
  { grupp: "ljus", ord: "Glödlampa", re: rx("glühbirne|leuchtmittel|glödlampa|‹strahler›|spotlight|‹E27›|‹E14›|‹GU10›") },

  // Värme och kyla. "Heizkörper" (elementskydd), "Fußbodenheizung" (mattor),
  // "Heizquelle" (eldkorgar), "aufheizen" (grillar), "Heizpilz" och
  // "Gas-Heizstrahler" (gasol) räknas inte, och inte heller "Wärmedämmung" eller
  // "värmebeständig".
  {
    grupp: "varme_kyla",
    ord: "Värme",
    re: rx(
      "heizfunktion|wärmefunktion|heizlüfter|heizelement|heizstufe|heizdraht|heizgerät|(?<!gas-?)heizstrahler|‹beheizt|beheizbar|sitzheizung|elektroheizung|infrarot-?(?:heiz|strahler|sauna|kabine|panel|wärme|lampe)|värmefunktion|värmeelement|uppvärmd|värmefläkt|infravärme|värmelampa|elvärme|värmare",
    ),
  },
  // En "Kühlbox" kyler ofta med is ("ohne Strom"), och "Kühlschrank" står i
  // texter om skåp som ställs bredvid ett ("neben dem Kühlschrank"). Ett
  // kylskåp som är varan ("Mini-Kühlschrank") räknas.
  {
    grupp: "varme_kyla",
    ord: "Kyla",
    re: rx(
      "kühlgerät|gefriergerät|gefrierschrank|gefriertruhe|klimagerät|klimaanlage|kühlfunktion|kompressorkühl|elektrische kühlbox|(?<!dem |den |der |ihren |ihrem |ihr |einen |einem |einer |neben |über |für |wie )‹kühlschr[äa]nke?›|frysbox|frysskåp|luftkonditionering",
    ),
  },
  // En "Rasenlüfter" är en gräsluftare och "Lüftung" ventilationshål.
  { grupp: "varme_kyla", ord: "Fläkt", re: rx("ventilator|‹lüfter›|heizlüfter|gebläse|fläkt(?:en|ar|arna)?›") },
  {
    grupp: "varme_kyla",
    ord: "Luftbehandling",
    re: rx("luftentfeuchter|luftbefeuchter|luftreiniger|avfuktare|luftrenare|luftfuktare"),
  },

  // Ljud. "Geräusche" ensamt är för det mesta buller som varan dämpar
  // ("Windgeräusche", "verhindert Geräusche"), och "Musik" står i
  // "Musikinstrumente", "Musikständer" och "Musik- und Filmsammlung".
  {
    grupp: "ljud",
    ord: "Musik och ljud",
    re: rx(
      "musikfunktion|musikspieler|musikbox|musiktaste|musikknopf|‹mit musik›|(?:licht|lichtern)[- ]und (?:geräusch|sound|ton|musik)|musik und (?:licht|lichter|sound|geräusch|ton)|(?:licht|lichter|sound|geräusch\\w*|ton)\\s+und\\s+musik|spielt\\s+(?:\\S+\\s+)?(?:musik|melodien?)|musik abspielen|‹melodien?›|soundeffekt|sound-effekt|‹mit sound›|soundfunktion|geräuscheffekt|geräuschfunktion|tierstimmen|tiergeräusch|motorgeräusch|‹mit geräuschen›|realistische[nr]? geräusch|(?<!für (?:ihre |die |den |einen )?)lautsprecher(?!ständer|halter|halterung|regal|boxen ?ständer)|mikrofon|‹radio›|‹mp3›|med ljud|ljudeffekt|vaggvisa|‹melodi|med (?:inbyggda |bluetooth-)?högtalare|sjungande|sjunger|motorljud",
    ),
  },
  { grupp: "ljud", ord: "Signalhorn", re: rx("‹hupe›|signalhorn|‹tuta›") },
  { grupp: "ljud", ord: "AUX", re: rx("‹AUX›", "u") },

  // Massage. En massagebänk och en massagestol för behandlare har ingen motor,
  // så ordet måste ha en efterled som betyder en apparat. "Vibration" ensamt är
  // ofta stötdämpning.
  {
    grupp: "massage",
    ord: "Massage",
    re: rx(
      "massage(?:sessel|funktion|kissen|gerät|pistole|matte|auflage|fåtölj|dyna|apparat|pistol)|vibrationsmassage|vibrationsfunktion|vibrationsplatte|vibrationspunkt|vibrationsmotor|‹vibrierend|‹vibriert›",
    ),
  },

  // Hushållsapparater. Aosoms text nämner apparater i texter om skåp och
  // tvättkorgar ("Mikrowellenfach", "neben der Waschmaschine", "in der
  // Waschmaschine waschbar", "Platz für Kaffeemaschine und Toaster"), så de
  // apparaterna räknas bara i våra svenska namn. En riktig apparat har watt och
  // volt i sin text ändå. De tyska namnen här står inte i möbeltexter.
  {
    grupp: "hushall",
    ord: "Hushållsapparat",
    re: rx(
      "(?<!för |över |ovanför |till )(?:brödrost|vattenkokare|espressomaskin|kaffebryggare|köksmaskin|isbitsmaskin|popcornmaskin|mikrovågsugn(?!s)|dammsugare|torktumlare(?!s)|airfryer|frityrkokare|våffeljärn|smörgåsgrill|elvisp|stavmixer)|(?<!für (?:ihre |die |den |eine |einen |ihren )?)(?:popcornmaschine|zuckerwattemaschine|eiswürfelmaschine|dörrautomat|dörrgerät|entsafter|brotbackautomat|fritteuse|waffeleisen|sandwichmaker|espressomaschine|kaffeevollautomat|standmixer|küchenmaschine|milchaufschäumer|joghurtbereiter|kochplatte|induktionskochfeld|wäschetrockner|ablufttrockner|kondenstrockner|wärmepumpentrockner|mini-?waschmaschine|bügeleisen|nähmaschine(?!n))",
    ),
  },

  // Klockor går på batteri. "rund um die Uhr" och en leksaksklocka med visare
  // räknas inte, och svenska "klocka" är också en ringklocka på en trehjuling.
  {
    grupp: "klocka",
    ord: "Klocka",
    re: rx(
      "wanduhr|standuhr|tischuhr|kuckucksuhr|digitaluhr|funkuhr|pendeluhr|‹wecker›|quarzuhrwerk|‹uhrwerk›|väckarklocka|väggklocka|bordsklocka|golvklocka",
    ),
  },
];

// Den första versionens ord, ordagrant (2026-10-22). De stoppar ingenting. En
// träff här som inte är en stark signal visas med utdrag i listan, så att en
// människa kan se varför sidan släpptes.
const BRED: readonly Monster[] = [
  {
    grupp: "batteri",
    ord: "Batteri",
    re: /(?<!misch|wannen|einhebel|brause|dusch|waschtisch|spültisch|küchen)batteri/i,
  },
  { grupp: "batteri", ord: "Akku", re: /akku/i },
  { grupp: "batteri", ord: "Knappcell", re: /knopfzelle|knappcell/i },
  { grupp: "batteri", ord: "Laddbar", re: /wiederaufladbar|aufladbar|uppladdningsbar|laddbar/i },
  { grupp: "batteri", ord: "Sladdlös", re: /kabellos|sladdlös/i },
  { grupp: "batteri", ord: "Solcell", re: /solar|solcell|solpanel/i },
  { grupp: "el", ord: "Elektrisk", re: /elektr(?!o?lyt|o ?-?verzink|ostat|isch verzink)/i },
  { grupp: "el", ord: "El-", re: /\bel-?(?:bil|bilar|kamin|grill|cykel|sparkcykel|motor|värme|driven|uttag|ledning)/i },
  { grupp: "el", ord: "Ström", re: /\bstrom|\bström/i },
  {
    grupp: "el",
    ord: "Stickkontakt",
    re: /netzteil|netzstecker|netzkabel|stromkabel|steckdose|\bstecker\b|nätadapter|nätsladd|eluttag|stickpropp|laddare/i,
  },
  { grupp: "el", ord: "Laddning", re: /ladegerät|ladekabel|ladestation|ladefunktion|laddkabel|laddstation/i },
  { grupp: "el", ord: "USB", re: /\bUSB\b/ },
  { grupp: "el", ord: "Volt", re: /\bvolt\b|\b\d+(?:[.,]\d+)?\s?V\b/i },
  { grupp: "el", ord: "Watt", re: /\b(?:[Ww]att|WATT)\b|(?<![x×*]\s*)\b\d+(?:[.,]\d+)?\s?W\b(?!\s*(?:[x×*]|cm|mm))/ },
  { grupp: "el", ord: "Motor", re: /\bmotor(?:en|er|n|erna)?\b|motoris|motordriv|motorbetrieben/i },
  { grupp: "el", ord: "Kompressor", re: /kompressor/i },
  { grupp: "el", ord: "Pump", re: /(?<!luft|hand|fuß|fuss|schwengel)pumpe\b|\bpump(?:en|ar)?\b/i },
  { grupp: "el", ord: "Termostat", re: /thermostat|termostat/i },
  {
    grupp: "el",
    ord: "Fjärrkontroll",
    re: /fernbedienung|fernsteuerung|ferngesteuert|fjärrkontroll|fjärrstyrd|radiostyrd/i,
  },
  { grupp: "el", ord: "RC", re: /\bRC\b/ },
  { grupp: "el", ord: "Bluetooth", re: /bluetooth/i },
  { grupp: "el", ord: "WLAN", re: /\bwlan\b|\bwi-?fi\b/i },
  { grupp: "el", ord: "App", re: /\bapp\b|app-steuerung|appstyrd/i },
  { grupp: "el", ord: "Sensor", re: /sensor(?!isch|isk|y|ik)|bewegungsmelder|rörelsevakt/i },
  { grupp: "el", ord: "Kamera", re: /kamera|camera/i },
  { grupp: "el", ord: "Display", re: /\bLCD\b|digitalanzeige|digitale anzeige|digitaldisplay|trainingscomputer/i },
  { grupp: "el", ord: "Laser", re: /\blaser(?:pointer|projektor|licht)?\b|projektor/i },
  { grupp: "el", ord: "Timer", re: /\btimer\b/i },
  {
    grupp: "el",
    ord: "Träningsmaskin",
    re: /laufband|löpband|ergometer|crosstrainer|heimtrainer|motionscykel|spinningcykel|rudergerät|roddmaskin/i,
  },
  { grupp: "ljus", ord: "LED", re: /\bLED\b|\bRGB\b/ },
  { grupp: "ljus", ord: "Lampa", re: /lampe|lampa|lampor/i },
  { grupp: "ljus", ord: "Leuchte", re: /leuchten?\b/i },
  { grupp: "ljus", ord: "Belysning", re: /beleuchtung|beleuchtet|belysning|upplyst/i },
  {
    grupp: "ljus",
    ord: "Ljuseffekt",
    re: /lichterkette|lichteffekt|\blichtern?\b|nachtlicht|\bmit licht\b|ljusslinga|ljusslingor|nattlampa|ljuseffekt/i,
  },
  { grupp: "ljus", ord: "Glödlampa", re: /glühbirne|leuchtmittel|glödlampa|\bstrahler\b|scheinwerfer|spotlight/i },
  {
    grupp: "varme_kyla",
    ord: "Värme",
    re: /heiz|wärmefunktion|infrarot|värmare|uppvärmd|värmefunktion|värmelampa|infravärme|värmefläkt/i,
  },
  {
    grupp: "varme_kyla",
    ord: "Kyla",
    re: /kühlschrank|gefrier|kühlbox|kühlgerät|klimagerät|klimaanlage|kylskåp|frysbox|frysskåp/i,
  },
  { grupp: "varme_kyla", ord: "Fläkt", re: /ventilator|lüfter|gebläse|fläkt/i },
  {
    grupp: "varme_kyla",
    ord: "Luftbehandling",
    re: /luftentfeuchter|luftbefeuchter|luftreiniger|avfuktare|luftrenare|luftfuktare/i,
  },
  {
    grupp: "ljud",
    ord: "Musik och ljud",
    re: /\bmusik|\bsound|melodie|geräusche(?:n|ffekte?n?)?\b|ljudeffekt|\bljud\b|högtalare|lautsprecher|mikrofon|\bradio\b|\bmp3\b/i,
  },
  { grupp: "ljud", ord: "Signalhorn", re: /\bhupe\b|signalhorn|\btuta\b/i },
  { grupp: "ljud", ord: "AUX", re: /\bAUX\b/ },
  {
    grupp: "massage",
    ord: "Massage",
    re: /massage(?:sessel|stuhl|funktion|kissen|gerät|pistole|matte|auflage|fåtölj|stol|dyna|apparat|pistol)|vibration/i,
  },
  {
    grupp: "hushall",
    ord: "Hushållsapparat",
    re: /haushaltsgerät|küchengerät|elektrogerät|mikrowelle|wasserkocher|kaffeemaschine|toaster|standmixer|\bmixer\b|backofen|\bherd\b|kochplatte|induktion|dörrautomat|dörrgerät|entsafter|staubsauger|waschmaschine|ablufttrockner|kondenstrockner|wärmepumpentrockner|bügeleisen|eiswürfel|popcorn|zuckerwatte|nähmaschine|mikrovågsugn|vattenkokare|kaffebryggare|brödrost|dammsugare|tvättmaskin|torktumlare|isbitsmaskin|kokplatta/i,
  },
  {
    grupp: "klocka",
    ord: "Klocka",
    re: /\b(?:wand|stand|tisch|kuckucks|digital|funk|pendel)?uhr(?:en)?\b|wecker|klocka|klockor/i,
  },
];

/** De starka etiketterna, för en räkning som ska visa noll också. */
export const SIGNALORD: readonly string[] = [...new Set(MONSTER.map((m) => m.ord))];
/** De breda etiketterna. */
export const SVAGORD: readonly string[] = [...new Set(BRED.map((m) => m.ord))];

const UTDRAG_FORE = 60;
const UTDRAG_EFTER = 60;

function utdrag(text: string, index: number, langd: number): string {
  const a = Math.max(0, index - UTDRAG_FORE);
  const b = Math.min(text.length, index + langd + UTDRAG_EFTER);
  const kropp = redigera(text.slice(a, b).replace(/\s+/g, " ").trim());
  return `${a > 0 ? "…" : ""}${kropp}${b < text.length ? "…" : ""}`;
}

function utanBortfall(text: string): string {
  let t = text;
  for (const re of BORT) t = t.replace(re, (m) => " ".repeat(m.length));
  return t;
}

/**
 * Starka och breda träffar i texterna, en per etikett, i mönstrens ordning.
 * Tom `starka` betyder att inget tyder på el eller batterier, inte att det är
 * bevisat.
 */
export function klassaElOchBatteri(texter: ReadonlyArray<string | null | undefined>): Klassning {
  const text = texter.filter(Boolean).join("\n");
  if (!text) return { starka: [], svaga: [] };
  const rensad = utanBortfall(text);
  const sedda = new Set<string>();
  const starka: Traff[] = [];
  for (const m of MONSTER) {
    if (sedda.has(m.ord)) continue;
    const t = m.re.exec(rensad);
    if (!t) continue;
    sedda.add(m.ord);
    starka.push({ grupp: m.grupp, ord: m.ord, utdrag: utdrag(text, t.index, t[0].length) });
  }
  const svaga: Traff[] = [];
  for (const m of BRED) {
    if (sedda.has(m.ord)) continue;
    const t = m.re.exec(text);
    if (!t) continue;
    sedda.add(m.ord);
    svaga.push({ grupp: m.grupp, ord: m.ord, utdrag: utdrag(text, t.index, t[0].length) });
  }
  return { starka, svaga };
}

/** Bara de starka signalerna, utan utdrag. */
export function elOchBatteriSignaler(texter: ReadonlyArray<string | null | undefined>): Signal[] {
  return klassaElOchBatteri(texter).starka.map(({ grupp, ord }) => ({ grupp, ord }));
}
