// lib/kassa/formular.ts
//
// Kassans formulär (vår egen kassa på /kassa, Leonards val 2026-11-05):
// kontakt och leveransadress, prövade och normaliserade innan något skickas
// till Wix. Ren modul utan importer, så att node --test kan köra den.
//
// Texterna är kundens. Varje fel säger vad som ska stå i fältet, inte vad som
// är fel med det kunden skrev.

export type Falt = "epost" | "fornamn" | "efternamn" | "telefon" | "gata" | "rad2" | "co" | "postnr" | "ort" | "lan" | "kupong";

export interface KassaIn {
  epost?: unknown;
  fornamn?: unknown;
  efternamn?: unknown;
  telefon?: unknown;
  gata?: unknown;
  rad2?: unknown;
  co?: unknown;
  postnr?: unknown;
  ort?: unknown;
  lan?: unknown;
  kupong?: unknown;
}

export interface KassaVarden {
  epost: string;
  fornamn: string;
  efternamn: string;
  /** E.164, till exempel +46701234567. */
  telefon: string;
  gata: string;
  /**
   * Adressrad 2 som kunden skrev den ("lgh 1201", "c/o Berg"), utan tillägg.
   * Stripes adressfält har en sådan rad; kassans egna fält har c/o i stället.
   * Tom när kunden inte skrev något.
   */
  rad2: string;
  /** Tom när kunden inte skrev något. Skickas som "c/o …". */
  co: string;
  /** "152 44", som Wix skriver svenska postnummer. */
  postnr: string;
  ort: string;
  /** Länet som ISO 3166-2 ("SE-N"): kundens val, annars ur postnumret. Tomt när det inte går att avgöra. */
  lan: string;
  /** Tom när kunden inte skrev någon kod. */
  kupong: string;
}

export type KassaProv = { ok: true; varden: KassaVarden } | { ok: false; fel: Partial<Record<Falt, string>> };

const text = (v: unknown): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");


/** "152 44", "15244", " 152-44 " → "152 44". Annars null. Svenska postnummer börjar aldrig med 0. */
export function normalPostnr(v: unknown): string | null {
  const s = text(v).replace(/[\s-]/g, "");
  return /^[1-9]\d{4}$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3)}` : null;
}

/**
 * Telefonnumret i E.164. Svenska nummer skrivs ofta med nolla först
 * ("070-123 45 67"), utländska med + eller 00. Annars null.
 */
export function normalTelefon(v: unknown): string | null {
  let s = text(v).replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (/^0\d/.test(s)) s = `+46${s.slice(1)}`;
  if (!/^\+\d{7,15}$/.test(s)) return null;
  // +460… är ett felskrivet svenskt nummer (nollan följde med).
  if (s.startsWith("+460")) s = `+46${s.slice(4)}`;
  if (s.startsWith("+46") && !/^\+46\d{7,10}$/.test(s)) return null;
  return s;
}

export const KASSA_TEXT: Record<Falt, { saknas: string; fel?: string }> = {
  epost: { saknas: "Skriv din e-postadress.", fel: "Skriv den som namn@exempel.se." },
  fornamn: { saknas: "Skriv ditt förnamn." },
  efternamn: { saknas: "Skriv ditt efternamn." },
  telefon: { saknas: "Skriv ditt mobilnummer.", fel: "Skriv det som 070 123 45 67." },
  gata: { saknas: "Skriv gatuadress och nummer." },
  rad2: { saknas: "", fel: "Högst 60 tecken." },
  co: { saknas: "", fel: "Högst 60 tecken." },
  postnr: { saknas: "Skriv postnumret.", fel: "Fem siffror, som 152 44." },
  ort: { saknas: "Skriv staden." },
  lan: { saknas: "" },
  kupong: { saknas: "", fel: "Rabattkoden ser inte rätt ut." },
};

const MAX: Record<Falt, number> = { epost: 254, fornamn: 60, efternamn: 60, telefon: 20, gata: 100, rad2: 60, co: 60, postnr: 6, ort: 50, lan: 5, kupong: 40 };

/**
 * Fälten i den ordning kunden ser dem på sidan. Fokus går till det första
 * felet uppifrån: provaKassa lägger felen i en annan ordning, och kassan
 * hoppade därför förbi ett tomt mobilnummer till förnamnet under det.
 */
export const FALT_ORDNING: readonly Falt[] = ["epost", "telefon", "fornamn", "efternamn", "gata", "rad2", "co", "postnr", "ort", "lan", "kupong"];

/** Det första fältet uppifrån som har ett fel, eller null. */
export function forstaFel(fel: Partial<Record<Falt, string>>): Falt | null {
  return FALT_ORDNING.find((f) => Boolean(fel[f])) ?? null;
}

/**
 * Är fältet ifyllt som kassan vill ha det? Samma regler som provaKassa, ett
 * fält i taget: kassan visar en bock när kunden lämnat ett giltigt fält.
 * c/o och rabattkoden är frivilliga och får ingen bock när de är tomma.
 */
export function faltGiltigt(f: Falt, v: unknown): boolean {
  const t = text(v);
  switch (f) {
    case "epost":
      return epostFel(t) === null;
    case "telefon":
      return normalTelefon(t) !== null;
    case "postnr":
      return normalPostnr(t) !== null;
    case "lan":
      return arLanKod(t);
    case "kupong":
      return false;
    default:
      return t.length > 0 && t.length <= MAX[f];
  }
}

const KORG_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Det kassan skickar till korgen när kunden lämnat e-postfältet (/api/kassa/kontakt). */
export interface Kontakt {
  cartId: string;
  epost: string;
  /** E.164, eller null när kunden inte skrivit ett giltigt nummer. */
  telefon: string | null;
}

/**
 * Kroppen till /api/kassa/kontakt, prövad: korgens id, en giltig e-post och
 * numret om det är giltigt. Annars null, och ingenting skickas till Wix.
 * Påminnelsemejlen bygger på e-posten (lib/kassa/aterta.ts).
 */
export function kontaktUrKropp(b: unknown): Kontakt | null {
  const k = (b ?? {}) as Record<string, unknown>;
  const cartId = typeof k.cartId === "string" ? k.cartId : "";
  const epost = text(k.epost);
  if (!KORG_ID.test(cartId) || !faltGiltigt("epost", epost)) return null;
  return { cartId, epost, telefon: normalTelefon(k.telefon) };
}

/**
 * Ett svenskt mobilnummer som kunden känner igen det: "0701234567",
 * "+46 70 123 45 67" och "070-123 45 67" blir "070 123 45 67". Allt annat
 * (fasta nummer, utländska, ofullständiga) lämnas som kunden skrev det.
 */
export function snyggtTelefon(v: string): string {
  const e164 = normalTelefon(v);
  if (!e164 || !/^\+467\d{8}$/.test(e164)) return v;
  const d = `0${e164.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

// ── E-postadressen: kan den finnas? ────────────────────────────────────────
//
// Kassan nekar en adress som säkert är fel, i webbläsaren (bocken och felet
// under fältet) och på servern (provaKassa), med samma regler. Order 10233
// lades med en adress som slutade på .con: bekräftelsen, kvittot och
// spårningen kom aldrig fram (Leonard 2026-11-18).
//
// Tre spärrar, som i kassorna hos de stora butikerna:
//   1. Formen: namn@doman.topp, utan mellanslag och med en hel domän.
//   2. Toppdomänen finns. Listan nedan är IANA:s hela lista:
//      https://data.iana.org/TLD/tlds-alpha-by-domain.txt
//   3. Domänen kan ta emot e-post (DNS, lib/kassa/epost-dns.ts). Den frågan
//      ställs till servern när kunden lämnat fältet (/api/kassa/epost-kontroll).
// Stavfel i kända tjänster får dessutom ett förslag (lib/kassa/epost-forslag.ts).
//
// ☠️ Bara det som SÄKERT är fel nekas. En adress som ser ovanlig ut men kan
// finnas släpps igenom: en nekad riktig kund är värre än en felstavad adress.
// ☠️ Listan ska vara HELA listan, inte ett urval. En toppdomän som saknas
// stänger ute en riktig kund. Nya tillkommer några gånger per år: hämta filen
// ovan, ersätt listan och versionen, och kör proven. lib/kassa/epost.test.ts
// fäller när listan är äldre än två år.
// Reglerna står här och inte i en egen fil: modulen ska gå att läsa av
// node --test utan importer, och bygget tillåter inte importer med .ts-ändelse.

/** Versionen i IANA-filens första rad (ÅÅÅÅMMDDNN). */
export const TOPPDOMANER_VERSION = "2026111700";

const LISTA =
  "aaa aarp abb abbott abbvie abc able abogado abudhabi ac academy accenture accountant accountants aco actor ad ads adult ae aeg aero aetna af afl " +
  "africa ag agakhan agency ai aig airbus airforce airtel akdn al alibaba alipay allfinanz allstate ally alsace alstom am amazon americanexpress " +
  "americanfamily amex amfam amica amsterdam analytics android anquan anz ao aol apartments app apple aq aquarelle ar arab aramco archi army arpa art " +
  "arte as asda asia associates at athleta attorney au auction audi audible audio auspost author auto autos aw aws ax axa az azure ba baby baidu banamex " +
  "band bank bar barcelona barclaycard barclays barefoot bargains baseball basketball bauhaus bayern bb bbc bbt bbva bcg bcn bd be beats beauty beer " +
  "berlin best bestbuy bet bf bg bh bharti bi bible bid bike bing bingo bio biz bj black blackfriday blockbuster blog bloomberg blue bm bms bmw bn " +
  "bnpparibas bo boats boehringer bofa bom bond boo book booking bosch bostik boston bot boutique box br bradesco bridgestone broadway broker brother " +
  "brussels bs bt build builders business buy buzz bv bw by bz bzh ca cab cafe cal call calvinklein cam camera camp canon capetown capital capitalone car " +
  "caravan cards care career careers cars casa case cash casino cat catering catholic cba cbn cbre cc cd center ceo cern cf cfa cfd cg ch chanel channel " +
  "charity chase chat cheap chintai christmas chrome church ci cipriani circle cisco citadel citi citic city ck cl claims cleaning click clinic clinique " +
  "clothing cloud club clubmed cm cn co coach codes coffee college cologne com commbank community company compare computer comsec condos construction " +
  "consulting contact contractors cooking cool coop corsica country coupon coupons courses cpa cr credit creditcard creditunion cricket crown crs cruise " +
  "cruises cu cuisinella cv cw cx cy cymru cyou cz dad dance data date dating datsun day dclk dds de deal dealer deals degree delivery dell deloitte " +
  "delta democrat dental dentist desi design dev dhl diamonds diet digital direct directory discount discover dish diy dj dk dm dnp do docs doctor dog " +
  "domains dot download drive dtv dubai dupont durban dvag dvr dz earth eat ec eco edeka edu education ee eg email emerck energy engineer engineering " +
  "enterprises epson equipment er ericsson erni es esq estate et eu eurovision eus events exchange expert exposed express extraspace fage fail fairwinds " +
  "faith family fan fans farm farmers fashion fast fedex feedback ferrari ferrero fi fidelity fido film final finance financial fire firestone firmdale " +
  "fish fishing fit fitness fj fk flickr flights flir florist flowers fly fm fo foo food football ford forex forsale forum foundation fox fr free " +
  "fresenius frl frogans frontier ftr fujitsu fun fund furniture futbol fyi ga gal gallery gallo gallup game games gap garden gay gb gbiz gd gdn ge gea " +
  "gent genting george gf gg ggee gh gi gift gifts gives giving gl glass gle global globo gm gmail gmbh gmo gmx gn godaddy gold goldpoint golf goodyear " +
  "goog google gop got gov gp gq gr grainger graphics gratis green gripe grocery group gs gt gu gucci guge guide guitars guru gw gy hair hamburg hangout " +
  "haus hbo hdfc hdfcbank health healthcare help here hermes hiphop hisamitsu hitachi hiv hk hkt hm hn hockey holdings holiday homedepot homegoods homes " +
  "homesense honda horse hospital host hosting hot hotels hotmail house how hr hsbc ht hu hughes hyatt hyundai ibm icbc ice icu id ie ieee ifm ikano il " +
  "im imamat imdb immo immobilien in inc industries infiniti info ing ink institute insurance insure int international intuit investments io ipiranga iq " +
  "ir irish is ismaili ist istanbul it itau itv jaguar java jcb je jeep jetzt jewelry jio jll jm jmp jnj jo jobs joburg jot joy jp jpmorgan jprs juegos " +
  "kaufen kddi ke kerryhotels kerryproperties kfh kg kh ki kia kids kim kindle kitchen kiwi km kn koeln komatsu kosher kp kpmg kpn kr krd kred kuokgroup " +
  "kw ky kyoto kz la lacaixa lamborghini lamer land landrover lanxess lasalle lat latino latrobe law lawyer lb lc lds lease leclerc lefrak legal lego " +
  "lexus lgbt li lidl life lifeinsurance lifestyle lighting like lilly limited limo lincoln link live living lk llc llp loan loans locker locus lol " +
  "london lotte lotto love lpl lplfinancial lr ls lt ltd ltda lu lundbeck luxe luxury lv ly ma madrid maif maison makeup man management mango map market " +
  "marketing markets marriott marshalls mattel mba mc mckinsey md me med media meet melbourne meme memorial men menu merck merckmsd mg mh miami microsoft " +
  "mil mini mint mit mitsubishi mk ml mlb mls mm mma mn mo mobi mobile moda moe moi mom monash money monster mormon mortgage moscow moto motorcycles mov " +
  "movie mp mq mr ms msd mt mtn mtr mu museum music mv mw mx my mz na nab nagoya name navy nba nc ne nec net netbank netflix network neustar new news " +
  "next nextdirect nexus nf nfl ng ngo nhk ni nico nike nikon ninja nissan nissay nl no nokia norton now nowruz nowtv np nr nra nrw ntt nu nyc nz obi " +
  "observer office okinawa olayan olayangroup ollo om omega one ong onl online ooo open oracle orange org organic origins osaka otsuka ott ovh pa page " +
  "panasonic paris pars partners parts party pay pccw pe pet pf pfizer pg ph pharmacy phd philips phone photo photography photos physio pics pictet " +
  "pictures pid pin ping pink pioneer pizza pk pl place play playstation plumbing plus pm pn pnc pohl poker politie porn post pr praxi press prime pro " +
  "prod productions prof progressive promo properties property protection pru prudential ps pt pub pw pwc py qa qpon quebec quest racing radio re read " +
  "realestate realtor realty recipes red redumbrella rehab reise reisen reit reliance ren rent rentals repair report republican rest restaurant review " +
  "reviews rexroth rich richardli ricoh ril rio rip ro rocks rodeo rogers room rs rsvp ru rugby ruhr run rw rwe ryukyu sa saarland safe safety sakura " +
  "sale salon samsclub samsung sandvik sandvikcoromant sanofi sap sarl sas save saxo sb sbi sbs sc scb schaeffler schmidt scholarships school schule " +
  "schwarz science scot sd se search seat secure security seek select sener services seven sew sex sexy sfr sg sh shangrila sharp shell shia shiksha " +
  "shoes shop shopping shouji show si silk sina singles site sj sk ski skin sky skype sl sling sm smart smile sn sncf so soccer social softbank software " +
  "sohu solar solutions song sony soy spa space sport spot sr srl ss st stada staples star statebank statefarm stc stcgroup stockholm storage store " +
  "stream studio study style su sucks supplies supply support surf surgery suzuki sv swatch swiss sx sy sydney systems sz tab taipei talk taobao target " +
  "tatamotors tatar tattoo tax taxi tc tci td tdk team tech technology tel temasek tennis teva tf tg th thd theater theatre tiaa tickets tienda tips " +
  "tires tirol tj tjmaxx tjx tk tkmaxx tl tm tmall tn to today tokyo tools top toray toshiba total tours town toyota toys tr trade trading training " +
  "travel travelers travelersinsurance trust trv tt tube tui tunes tushu tv tvs tw tz ua ubank ubs ug uk unicom university uno uol ups us uy uz va " +
  "vacations vana vanguard vc ve vegas ventures verisign versicherung vet vg vi viajes video vig viking villas vin vip virgin visa vision viva vivo " +
  "vlaanderen vn vodka volvo vote voting voto voyage vu wales walmart walter wang wanggou watch watches weather weatherchannel web webcam weber website " +
  "wed wedding weibo weir wf whoswho wien wiki williamhill win windows wine winners wme woodside work works world wow ws wtc wtf xbox xerox xihuan xin xn " +
  "--11b4c3d xn--1ck2e1b xn--1qqw23a xn--2scrj9c xn--30rr7y xn--3bst00m xn--3ds443g xn--3e0b707e xn--3hcrj9c xn--3pxu8k xn--42c2d9a xn--45br5cyl xn-- " +
  "45brj9c xn--45q11c xn--4dbrk0ce xn--4gbrim xn--54b7fta0cc xn--55qw42g xn--55qx5d xn--5su34j936bgsg xn--5tzm5g xn--6frz82g xn--6qq986b3xl xn--80adxhks " +
  "xn--80ao21a xn--80aqecdr1a xn--80asehdb xn--80aswg xn--8y0a063a xn--90a3ac xn--90ae xn--90ais xn--9dbq2a xn--9et52u xn--9krt00a xn--b4w605ferd xn-- " +
  "bck1b9a5dre4c xn--c1avg xn--c2br7g xn--cck2b3b xn--cckwcxetd xn--cg4bki xn--clchc0ea0b2g2a9gcd xn--czr694b xn--czrs0t xn--czru2d xn--d1acj3b xn--d1alf " +
  "xn--e1a4c xn--eckvdtc9d xn--efvy88h xn--fct429k xn--fhbei xn--fiq228c5hs xn--fiq64b xn--fiqs8s xn--fiqz9s xn--fjq720a xn--flw351e xn--fpcrj9c3d xn-- " +
  "fzc2c9e2c xn--fzys8d69uvgm xn--g2xx48c xn--gckr3f0f xn--gecrj9c xn--gk3at1e xn--h2breg3eve xn--h2brj9c xn--h2brj9c8c xn--hxt814e xn--i1b6b1a6a2e xn-- " +
  "imr513n xn--io0a7i xn--j1aef xn--j1amh xn--j6w193g xn--jlq480n2rg xn--jvr189m xn--kcrx77d1x4a xn--kprw13d xn--kpry57d xn--kput3i xn--l1acc xn-- " +
  "lgbbat1ad8j xn--mgb9awbf xn--mgba3a3ejt xn--mgba3a4f16a xn--mgba7c0bbn0a xn--mgbaam7a8h xn--mgbab2bd xn--mgbah1a3hjkrd xn--mgbai9azgqp6j xn-- " +
  "mgbayh7gpa xn--mgbbh1a xn--mgbbh1a71e xn--mgbc0a9azcg xn--mgbca7dzdo xn--mgbcpq6gpa1a xn--mgberp4a5d4ar xn--mgbgu82a xn--mgbi4ecexp xn--mgbpl2fh xn-- " +
  "mgbt3dhd xn--mgbtx2b xn--mgbx4cd0ab xn--mix891f xn--mk1bu44c xn--mxtq1m xn--ngbc5azd xn--ngbe9e0a xn--ngbrx xn--node xn--nqv7f xn--nqv7fs00ema xn-- " +
  "nyqy26a xn--o3cw4h xn--ogbpf8fl xn--otu796d xn--p1acf xn--p1ai xn--pgbs0dh xn--pssy2u xn--q7ce6a xn--q9jyb4c xn--qcka1pmc xn--qxa6a xn--qxam xn-- " +
  "rhqv96g xn--rovu88b xn--rvc1e0am3e xn--s9brj9c xn--ses554g xn--t60b56a xn--tckwe xn--tiq49xqyj xn--unup4y xn--vermgensberater-ctb xn-- " +
  "vermgensberatung-pwb xn--vhquv xn--vuq861b xn--w4r85el8fhu5dnra xn--w4rs40l xn--wgbh1c xn--wgbl6a xn--xhq521b xn--xkc2al3hye2a xn--xkc2dl3a5ee0h xn-- " +
  "y9a3aq xn--yfro4i67o xn--ygbi2ammx xn--zfr164b xxx xyz yachts yahoo yamaxun yandex ye yodobashi yoga yokohama you youtube yt yun za zappos zara zero " +
  "zip zm zone zuerich zw ";

/** Varje toppdomän som finns, med gemener. Internationella står i sin ASCII-form (xn--…). */
export const TOPPDOMANER: ReadonlySet<string> = new Set(LISTA.trim().split(/\s+/));

/** Finns toppdomänen? Skiftläget spelar ingen roll. */
export function toppdomanFinns(topp: string): boolean {
  return TOPPDOMANER.has(topp.trim().toLowerCase());
}

/** Felskrivna toppdomäner och vad de troligen skulle vara. Samma par som i lib/kassa/epost-forslag.ts (provet jämför). */
const TOPPDOMAN_RATT: Record<string, readonly string[]> = {
  com: ["con", "cm", "co", "om", "cpm", "vom", "xom", "comm", "cim", "clm", "ocm", "coom", "c0m", "cmo"],
  se: ["s", "es", "see", "sse"],
  net: ["ne", "nt", "nett", "met", "bet", "ner"],
  me: ["m", "em"],
};

export type EpostFel = "format" | "toppdoman";

const EPOST_FORM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Ett led i en domän: bokstäver (också å, ä, ö), siffror och bindestreck, inte bindestreck först eller sist. */
const EPOST_LED = /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u;
const MAX_EPOST = 254;
const MAX_EPOST_NAMN = 64;

/** Domänen efter @, med gemener, eller null när adressen saknar en. */
export function epostDoman(adress: string): string | null {
  const v = adress.trim();
  const at = v.lastIndexOf("@");
  if (at < 1 || at === v.length - 1) return null;
  return v.slice(at + 1).toLowerCase();
}

/** Toppdomänen: det som står efter sista punkten i domänen. */
export function epostToppdoman(adress: string): string | null {
  const d = epostDoman(adress);
  if (!d || !d.includes(".")) return null;
  return d.slice(d.lastIndexOf(".") + 1);
}

/** Vad som är fel med adressen, eller null när den kan finnas. */
export function epostFel(adress: string): EpostFel | null {
  const v = adress.trim();
  if (!EPOST_FORM.test(v) || v.length > MAX_EPOST) return "format";
  const at = v.lastIndexOf("@");
  if (at > MAX_EPOST_NAMN) return "format";
  const led = v.slice(at + 1).toLowerCase().split(".");
  if (led.some((l) => !EPOST_LED.test(l))) return "format";
  const topp = led[led.length - 1];
  // En toppdomän med andra tecken än a–z (till exempel .рф) står i listan som
  // xn--…; den prövas inte här utan släpps igenom.
  if (/^[a-z0-9-]+$/.test(topp)) {
    if (/^\d+$/.test(topp)) return "format";
    if (!toppdomanFinns(topp)) return "toppdoman";
  }
  return null;
}

/** Kan adressen finnas? */
export function epostGiltig(adress: string): boolean {
  return epostFel(adress) === null;
}

/** Den toppdomän som en felskriven troligen skulle vara ("con" → "com"), eller null. */
export function rattToppdoman(topp: string): string | null {
  const t = topp.toLowerCase();
  for (const [ratt, fel] of Object.entries(TOPPDOMAN_RATT)) if (fel.includes(t)) return ratt;
  return null;
}

/**
 * Texten under e-postfältet när adressen inte kan finnas, eller null.
 * En toppdomän som inte finns sägs rakt ut, med den rätta när felet är ett
 * känt stavfel: order 10233 lades med en adress som slutade på .con.
 */
export function epostFelText(adress: string): string | null {
  const vad = epostFel(adress);
  if (vad === null) return null;
  if (vad === "toppdoman") {
    const topp = epostToppdoman(adress) ?? "";
    const ratt = rattToppdoman(topp);
    return `Adressen slutar på .${topp}, som inte finns.${ratt ? ` Menade du .${ratt}?` : " Kontrollera stavningen."}`;
  }
  return KASSA_TEXT.epost.fel ?? "Skriv den som namn@exempel.se.";
}

/** Prövar hela formuläret. Alla fel på en gång, så att kunden ser allt som saknas. */
export function provaKassa(inn: KassaIn): KassaProv {
  const fel: Partial<Record<Falt, string>> = {};
  const r = (f: Falt) => text(inn[f]);
  const langd = (f: Falt, v: string) => {
    if (v.length > MAX[f]) fel[f] = KASSA_TEXT[f].fel ?? `Högst ${MAX[f]} tecken.`;
  };

  const epost = r("epost");
  if (!epost) fel.epost = KASSA_TEXT.epost.saknas;
  else fel.epost = epostFelText(epost) ?? undefined;
  if (fel.epost === undefined) delete fel.epost;

  for (const f of ["fornamn", "efternamn", "gata", "ort"] as const) {
    const v = r(f);
    if (!v) fel[f] = KASSA_TEXT[f].saknas;
    else langd(f, v);
  }

  const telRa = r("telefon");
  const telefon = normalTelefon(telRa);
  if (!telRa) fel.telefon = KASSA_TEXT.telefon.saknas;
  else if (!telefon) fel.telefon = KASSA_TEXT.telefon.fel;

  const pnRa = r("postnr");
  const postnr = normalPostnr(pnRa);
  if (!pnRa) fel.postnr = KASSA_TEXT.postnr.saknas;
  else if (!postnr) fel.postnr = KASSA_TEXT.postnr.fel;

  const rad2 = r("rad2");
  langd("rad2", rad2);
  const co = r("co");
  langd("co", co);

  const kupong = r("kupong").replace(/\s/g, "");
  if (kupong && (kupong.length > MAX.kupong || !/^[\p{L}\p{N}_-]+$/u.test(kupong))) fel.kupong = KASSA_TEXT.kupong.fel;

  if (Object.keys(fel).length > 0) return { ok: false, fel };
  return {
    ok: true,
    varden: {
      epost,
      fornamn: r("fornamn"),
      efternamn: r("efternamn"),
      telefon: telefon!,
      gata: r("gata"),
      rad2,
      co,
      postnr: postnr!,
      ort: r("ort"),
      // Kundens val när det är ett län, annars ur postnumret (Wix och leverantörerna vill ha det).
      lan: arLanKod(r("lan").toUpperCase()) ? r("lan").toUpperCase() : (lanFranPostnr(postnr) ?? ""),
      kupong,
    },
  };
}

// ── Länet ──────────────────────────────────────────────────────────────────
// Länet i kundens leveransadress (Leonard 2026-11-06: "stad och län, så det
// blir samma som vi ger till Aosom och VEVOR"). Wix vill ha det som ISO
// 3166-2 ("SE-N"), och motorn gör om det till leverantörens provinsfält
// (deriveProvince i motorns lib/orders/tasks.ts; Aosoms klumporder har en
// kolumn "Province"). Kunden behöver aldrig välja: länet kommer ur Googles
// adressförslag ("Hallands län") eller ur postnumret, och går att ändra.
//
// Postnumren pekar ut länet: två siffror räcker för det mesta, och de kända
// blandzonerna avgörs på tre. Tabellen är motorns (provinceFromSwedishPostalCode,
// order #10015, 2026-08-08) med länskoder i stället för AliExpress-namn.

export interface Lan {
  kod: string;
  namn: string;
}

/** De 21 länen i bokstavsordning, som de står i valet. */
export const LAN: readonly Lan[] = [
  { kod: "SE-K", namn: "Blekinge län" },
  { kod: "SE-W", namn: "Dalarnas län" },
  { kod: "SE-I", namn: "Gotlands län" },
  { kod: "SE-X", namn: "Gävleborgs län" },
  { kod: "SE-N", namn: "Hallands län" },
  { kod: "SE-Z", namn: "Jämtlands län" },
  { kod: "SE-F", namn: "Jönköpings län" },
  { kod: "SE-H", namn: "Kalmar län" },
  { kod: "SE-G", namn: "Kronobergs län" },
  { kod: "SE-BD", namn: "Norrbottens län" },
  { kod: "SE-M", namn: "Skåne län" },
  { kod: "SE-AB", namn: "Stockholms län" },
  { kod: "SE-D", namn: "Södermanlands län" },
  { kod: "SE-C", namn: "Uppsala län" },
  { kod: "SE-S", namn: "Värmlands län" },
  { kod: "SE-AC", namn: "Västerbottens län" },
  { kod: "SE-Y", namn: "Västernorrlands län" },
  { kod: "SE-U", namn: "Västmanlands län" },
  { kod: "SE-O", namn: "Västra Götalands län" },
  { kod: "SE-T", namn: "Örebro län" },
  { kod: "SE-E", namn: "Östergötlands län" },
];

const KODER = new Set(LAN.map((l) => l.kod));

export function arLanKod(v: unknown): v is string {
  return typeof v === "string" && KODER.has(v);
}

export function lanNamn(kod: string): string | null {
  return LAN.find((l) => l.kod === kod)?.namn ?? null;
}

/** Län som delar tvåsiffrigt prefix med ett annat: tre siffror avgör. */
const TRE: Record<string, string> = {
  "285": "SE-G", // Markaryd (Skåneprefix)
  "293": "SE-K", // Olofström
  "294": "SE-K", // Sölvesborg
  "361": "SE-H",
  "577": "SE-H",
  "579": "SE-H",
  "598": "SE-H",
  // Kungsbacka och Varberg ligger i Halland trots Göteborgsprefixet 43.
  "430": "SE-N",
  "432": "SE-N",
  "434": "SE-N",
  "439": "SE-N",
  "610": "SE-D", // Nyköpings omland
  "611": "SE-D",
  "613": "SE-D",
  "619": "SE-D",
  "662": "SE-O",
  "666": "SE-O",
  "668": "SE-O",
  "814": "SE-C",
  "815": "SE-C",
  "819": "SE-C",
  "841": "SE-Y",
  "933": "SE-BD",
  "938": "SE-BD",
};

const TVA: Record<string, string> = {};
const satt = (fran: number, till: number, kod: string) => {
  for (let n = fran; n <= till; n++) TVA[String(n)] = kod;
};
satt(10, 19, "SE-AB");
satt(20, 29, "SE-M");
satt(30, 31, "SE-N");
satt(33, 33, "SE-F");
satt(34, 36, "SE-G");
satt(37, 37, "SE-K");
satt(38, 39, "SE-H");
satt(40, 47, "SE-O");
satt(50, 54, "SE-O");
satt(55, 57, "SE-F");
satt(58, 61, "SE-E");
satt(62, 62, "SE-I");
satt(63, 64, "SE-D");
satt(65, 68, "SE-S");
satt(69, 71, "SE-T");
satt(72, 73, "SE-U");
satt(74, 75, "SE-C");
satt(76, 76, "SE-AB"); // Norrtälje, Rimbo, Hallstavik
satt(77, 79, "SE-W");
satt(80, 82, "SE-X");
satt(83, 84, "SE-Z");
satt(85, 89, "SE-Y");
satt(90, 93, "SE-AC");
satt(94, 98, "SE-BD");

/** Länskoden ur ett svenskt postnummer ("434 41", "43441"), annars null. */
export function lanFranPostnr(postnr: unknown): string | null {
  const s = typeof postnr === "string" ? postnr.replace(/\D/g, "") : "";
  if (!/^[1-9]\d{4}$/.test(s)) return null;
  return TRE[s.slice(0, 3)] ?? TVA[s.slice(0, 2)] ?? null;
}

/** "Västra Götalands län" → "vastra gotaland": små bokstäver, utan prickar och utan "län". */
const nyckel = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(lan|county)\b/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();

const NAMN = new Map<string, string>();
for (const l of LAN) {
  const n = nyckel(l.namn);
  NAMN.set(n, l.kod);
  // Genitivets s: "hallands" → "halland", "stockholms" → "stockholm" (inte "skane", "kalmar", "uppsala", "orebro").
  if (n.endsWith("s")) NAMN.set(n.slice(0, -1), l.kod);
}

/**
 * Länskoden ur ett länsnamn som Google eller kunden skriver det ("Hallands
 * län", "Halland", "Skåne län", "Stockholm County"), eller ur en kod ("SE-N").
 * Annars null.
 */
export function lanFranText(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (!t) return null;
  const kod = t.toUpperCase();
  if (KODER.has(kod)) return kod;
  return NAMN.get(nyckel(t)) ?? null;
}

// ── Stripes adressfält ─────────────────────────────────────────────────────

/** Det kassan läser ur Stripes adressfält (StripeAddressElementChangeEvent["value"]). */
export interface StripeAdressVarde {
  firstName?: string | null;
  lastName?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
  } | null;
}

/**
 * Adressfältets värde som kassans fält. Länet kommer ur Googles förslag
 * ("Hallands län" i `state`, fast det svenska formuläret inte visar något
 * länsfält), annars ur postnumret. Postnumret skrivs "434 41" när det är giltigt.
 */
export function adressFranStripe(v: StripeAdressVarde): { fornamn: string; efternamn: string; gata: string; rad2: string; postnr: string; ort: string; lan: string } {
  const a: NonNullable<StripeAdressVarde["address"]> = v.address ?? {};
  const pnRa = text(a.postal_code);
  return {
    fornamn: text(v.firstName),
    efternamn: text(v.lastName),
    gata: text(a.line1),
    rad2: text(a.line2),
    postnr: normalPostnr(pnRa) ?? pnRa,
    ort: text(a.city),
    lan: lanFranText(a.state) ?? lanFranPostnr(pnRa) ?? "",
  };
}

/** Fälten som står i Stripes adressfält när kassan använder det (resten är kassans egna). */
export const ADRESS_FALT: readonly Falt[] = ["fornamn", "efternamn", "gata", "rad2", "co", "postnr", "ort"];

// ── Plånboken (snabbkassan) ────────────────────────────────────────────────

/**
 * Det kassan läser ur Apple Pay och Google Pay (Stripes Express Checkout
 * Element, händelsen "confirm"): e-post och telefon i `billingDetails`, namn
 * och adress i `shippingAddress`.
 */
export interface PlanbokVarde {
  billingDetails?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  shippingAddress?: {
    name?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
}

/**
 * Ett namn på en rad ("Anna Maria Svensson") som kassans två fält: efternamnet
 * är sista ordet och förnamnet resten, eftersom dubbla förnamn är vanligare än
 * dubbla efternamn. Apple Pay har för- och efternamn var för sig, men Stripe
 * skickar dem som en rad, och Google Pay har bara raden. Hela namnet står
 * ändå kvar i samma ordning på ordern och paketet.
 */
export function delaNamn(namn: unknown): { fornamn: string; efternamn: string } {
  const ord = text(namn).split(" ").filter(Boolean);
  if (ord.length < 2) return { fornamn: ord[0] ?? "", efternamn: "" };
  return { fornamn: ord.slice(0, -1).join(" "), efternamn: ord[ord.length - 1] };
}

/**
 * Plånbokens uppgifter som kassans formulär. provaKassa prövar dem sedan som
 * om kunden skrivit dem själv. Namnet kommer från leveransadressen; saknar den
 * efternamn används kortets namn om det har både för- och efternamn. Länet
 * kommer ur plånbokens region ("Hallands län"), annars ur postnumret.
 * `epost` ersätter plånbokens e-post när kassan redan vet vem kunden är
 * (medlemmens korg): köpet ska räknas på kontot.
 */
export function kundFranPlanbok(p: PlanbokVarde, o: { kupong?: string; epost?: string | null } = {}): KassaIn {
  const lev = p.shippingAddress ?? {};
  const a = lev.address ?? {};
  const kandidater = [text(lev.name), text(p.billingDetails?.name)].filter(Boolean);
  const namn = kandidater.find((n) => n.includes(" ")) ?? kandidater[0] ?? "";
  const { fornamn, efternamn } = delaNamn(namn);
  const pn = text(a.postal_code);
  return {
    epost: text(o.epost) || text(p.billingDetails?.email),
    telefon: text(p.billingDetails?.phone),
    fornamn,
    efternamn,
    gata: text(a.line1),
    rad2: text(a.line2),
    co: "",
    postnr: pn,
    ort: text(a.city),
    lan: lanFranText(a.state) ?? lanFranPostnr(pn) ?? "",
    kupong: o.kupong ?? "",
  };
}
