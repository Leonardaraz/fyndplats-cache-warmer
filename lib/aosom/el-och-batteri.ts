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
// än. Därför räcker ett enda ord, och en LED-list i ett TV-bord stoppar hela
// bordet: det är elektronik i lagens mening.
//
// Underlaget är Aosoms tyska text (namn, kategori, säljpunkter, beskrivning)
// och vårt svenska namn. Feedens mått och paketmått läses inte: där står W och
// V för bredd och annat, inte för watt och volt.
//
// Varje träff har en fast etikett. Svaret räknar etiketter, aldrig textutdrag,
// så att räkningen kan stå i en publik Actions-logg.

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

interface Monster {
  grupp: Signalgrupp;
  ord: string;
  re: RegExp;
}

// Ordningen spelar ingen roll. Varje mönster har en kommentar när det undviker
// en känd falsk träff, för det är där nästa ändring riskerar att öppna den igen.
const MONSTER: readonly Monster[] = [
  // Batterier. Tyska "Batterie" och svenska "batteri" i samma mönster. En
  // "Mischbatterie" eller "Wannenbatterie" är en blandarkran, inte ett batteri.
  {
    grupp: "batteri",
    ord: "Batteri",
    re: /(?<!misch|wannen|einhebel|brause|dusch|waschtisch|spültisch|küchen)batteri/i,
  },
  { grupp: "batteri", ord: "Akku", re: /akku/i },
  { grupp: "batteri", ord: "Knappcell", re: /knopfzelle|knappcell/i },
  { grupp: "batteri", ord: "Laddbar", re: /wiederaufladbar|aufladbar|uppladdningsbar|laddbar/i },
  { grupp: "batteri", ord: "Sladdlös", re: /kabellos|sladdlös/i },
  // Solcellslampor och solcellsfontäner har ett batteri.
  { grupp: "batteri", ord: "Solcell", re: /solar|solcell|solpanel/i },

  // El. "elektrolytisch/elektroverzinkt" (förzinkat stål i bodar och burar)
  // och "elektrostatisch" är inte el i varan.
  { grupp: "el", ord: "Elektrisk", re: /elektr(?!o?lyt|o ?-?verzink|ostat|isch verzink)/i },
  { grupp: "el", ord: "El-", re: /\bel-?(?:bil|bilar|kamin|grill|cykel|sparkcykel|motor|värme|driven|uttag|ledning)/i },
  { grupp: "el", ord: "Ström", re: /\bstrom|\bström/i },
  // "Gartenstecker" är en dekoration på en pinne, så Stecker räknas bara som
  // eget ord.
  {
    grupp: "el",
    ord: "Stickkontakt",
    re: /netzteil|netzstecker|netzkabel|stromkabel|steckdose|\bstecker\b|nätadapter|nätsladd|eluttag|stickpropp|laddare/i,
  },
  { grupp: "el", ord: "Laddning", re: /ladegerät|ladekabel|ladestation|ladefunktion|laddkabel|laddstation/i },
  { grupp: "el", ord: "USB", re: /\bUSB\b/ },
  { grupp: "el", ord: "Volt", re: /\bvolt\b|\b\d+(?:[.,]\d+)?\s?V\b/i },
  // Watt: "wattiert" (vadderad) stoppas av \b, och ett W i ett mått
  // ("120 x 60W x 75H", "60W cm") stoppas av för- och efterledet. Versalt W
  // med flit: ett gement w efter en siffra är inte watt.
  { grupp: "el", ord: "Watt", re: /\b(?:[Ww]att|WATT)\b|(?<![x×*]\s*)\b\d+(?:[.,]\d+)?\s?W\b(?!\s*(?:[x×*]|cm|mm))/ },
  // "Motorik/motorik" (barnleksaker som tränar motoriken) och "Motorrad" är inte
  // en motor: suffixen är uppräknade och ordet slutar där.
  { grupp: "el", ord: "Motor", re: /\bmotor(?:en|er|n|erna)?\b|motoris|motordriv|motorbetrieben/i },
  { grupp: "el", ord: "Kompressor", re: /kompressor/i },
  // Luft-, hand- och fotpumpar är manuella, och en "Schwengelpumpe" är en
  // trädgårdsdekoration. Svenska "pumpa" (pumpa) är ingen pump.
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
  // "sensorisch/sensorisk" (sinnesleksaker) är inte en sensor.
  { grupp: "el", ord: "Sensor", re: /sensor(?!isch|isk|y|ik)|bewegungsmelder|rörelsevakt/i },
  { grupp: "el", ord: "Kamera", re: /kamera|camera/i },
  { grupp: "el", ord: "Display", re: /\bLCD\b|digitalanzeige|digitale anzeige|digitaldisplay|trainingscomputer/i },
  // "lasergeschnitten/lasergraviert" (laserskuren metall) är inte en laser i varan.
  { grupp: "el", ord: "Laser", re: /\blaser(?:pointer|projektor|licht)?\b|projektor/i },
  { grupp: "el", ord: "Timer", re: /\btimer\b/i },
  // Löpband och motionscyklar har motor eller en display med batterier.
  {
    grupp: "el",
    ord: "Träningsmaskin",
    re: /laufband|löpband|ergometer|crosstrainer|heimtrainer|motionscykel|spinningcykel|rudergerät|roddmaskin/i,
  },

  // Ljus. Tyska "Licht" ensamt räknas inte: "Sonnenlicht", "lichtdurchlässig"
  // och "Tageslicht" står på parasoller och växthus. "leuchtende Farben" är
  // inte en lampa, så Leuchte måste sluta på e eller en.
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

  // Värme och kyla. "Wärme" och "värme" ensamt räknas inte ("Wärmedämmung",
  // "värmebeständig").
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
  // "Lüftung" (ventilationsöppningar i burar och växthus) är inte en fläkt.
  { grupp: "varme_kyla", ord: "Fläkt", re: /ventilator|lüfter|gebläse|fläkt/i },
  {
    grupp: "varme_kyla",
    ord: "Luftbehandling",
    re: /luftentfeuchter|luftbefeuchter|luftreiniger|avfuktare|luftrenare|luftfuktare/i,
  },

  // Ljud. "geräuscharm" och "geräuschlos" (tysta hjul och lådor) räknas inte,
  // och inte heller "ljuddämpande".
  {
    grupp: "ljud",
    ord: "Musik och ljud",
    re: /\bmusik|\bsound|melodie|geräusche(?:n|ffekte?n?)?\b|ljudeffekt|\bljud\b|högtalare|lautsprecher|mikrofon|\bradio\b|\bmp3\b/i,
  },
  { grupp: "ljud", ord: "Signalhorn", re: /\bhupe\b|signalhorn|\btuta\b/i },
  { grupp: "ljud", ord: "AUX", re: /\bAUX\b/ },

  // Massage. En massagebänk utan motor räknas inte, så ordet måste ha en
  // efterled som betyder en apparat.
  {
    grupp: "massage",
    ord: "Massage",
    re: /massage(?:sessel|stuhl|funktion|kissen|gerät|pistole|matte|auflage|fåtölj|stol|dyna|apparat|pistol)|vibration/i,
  },

  // Hushållsapparater. "Trockner" ensamt räknas inte: ett torkställ kan heta så.
  {
    grupp: "hushall",
    ord: "Hushållsapparat",
    re: /haushaltsgerät|küchengerät|elektrogerät|mikrowelle|wasserkocher|kaffeemaschine|toaster|standmixer|\bmixer\b|backofen|\bherd\b|kochplatte|induktion|dörrautomat|dörrgerät|entsafter|staubsauger|waschmaschine|ablufttrockner|kondenstrockner|wärmepumpentrockner|bügeleisen|eiswürfel|popcorn|zuckerwatte|nähmaschine|mikrovågsugn|vattenkokare|kaffebryggare|brödrost|dammsugare|tvättmaskin|torktumlare|isbitsmaskin|kokplatta/i,
  },

  // Klockor går på batteri. "Uhrzeit" och "Luftzufuhr" räknas inte.
  {
    grupp: "klocka",
    ord: "Klocka",
    re: /\b(?:wand|stand|tisch|kuckucks|digital|funk|pendel)?uhr(?:en)?\b|wecker|klocka|klockor/i,
  },
];

/** Alla etiketter, för en räkning som ska visa noll också. */
export const SIGNALORD: readonly string[] = [...new Set(MONSTER.map((m) => m.ord))];

/**
 * Signalerna i texterna, en per etikett, i mönstrens ordning. Tom lista betyder
 * att inget tyder på el eller batterier, inte att det är bevisat.
 */
export function elOchBatteriSignaler(texter: ReadonlyArray<string | null | undefined>): Signal[] {
  const text = texter.filter(Boolean).join("\n");
  if (!text) return [];
  const ut: Signal[] = [];
  for (const m of MONSTER) {
    if (m.re.test(text)) ut.push({ grupp: m.grupp, ord: m.ord });
  }
  return ut;
}
