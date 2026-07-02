// Deterministisk svensk översättning av variantaxlar ("Color", "Size") och
// vanliga variantvärden ("Red", "Black") vid import. INGA AI-anrop — ren
// uppslagstabell, $0 kostnad. Fallback är alltid råvärdet, så en okänd axel/
// värde lämnas oförändrad (ingen risk att tappa data).
//
// Två lookup-tabeller:
//   AXIS_TRANSLATIONS  — optionsnamn (axlar). Fullt match efter kolon-strip.
//   VALUE_TRANSLATIONS — optionsvärden. Fullt match, annars första-ord-match.
//
// Universella värden (S/M/L/XL, antal, mått som "10cm") lämnas avsiktligt
// oöversatta — de saknas i tabellen och faller därför tillbaka på råvärdet.

export const AXIS_TRANSLATIONS: Record<string, string> = {
  color: "Färg",
  colour: "Färg",
  size: "Storlek",
  sizes: "Storlek",
  material: "Material",
  pattern: "Mönster",
  style: "Stil",
  styles: "Stil",
  length: "Längd",
  width: "Bredd",
  height: "Höjd",
  diameter: "Diameter",
  thickness: "Tjocklek",
  capacity: "Kapacitet",
  volume: "Volym",
  quantity: "Antal",
  count: "Antal",
  number: "Antal",
  pcs: "Antal",
  pack: "Förpackning",
  package: "Förpackning",
  bundle: "Paket",
  set: "Set",
  type: "Typ",
  model: "Modell",
  version: "Version",
  variant: "Variant",
  shape: "Form",
  weight: "Vikt",
  voltage: "Spänning",
  power: "Effekt",
  wattage: "Effekt",
  plug: "Kontakt",
  "plug type": "Kontakttyp",
  socket: "Uttag",
  shipping: "Frakt",
  "ships from": "Skickas från",
  "ship from": "Skickas från",
  origin: "Ursprung",
  flavor: "Smak",
  flavour: "Smak",
  taste: "Smak",
  scent: "Doft",
  fragrance: "Doft",
  design: "Design",
  edition: "Utgåva",
  specification: "Specifikation",
  spec: "Specifikation",
  option: "Alternativ",
  options: "Alternativ",
  bust: "Byst",
  waist: "Midja",
  hip: "Höft",
  hips: "Höft",
  gender: "Kön",
  age: "Ålder",
  season: "Säsong",
  connector: "Anslutning",
  interface: "Anslutning",
  memory: "Minne",
  storage: "Lagring",
  resolution: "Upplösning",
  finish: "Finish",
  texture: "Textur",
  feature: "Egenskap",

  // --- Djup utbyggnad (2026-07): fler verkliga AE-axelnamn. Axlar matchas
  //     alltid FULLT (efter kolon-strip) → noll risk för token-krock; en okänd
  //     axel faller som förut tillbaka på råvärdet. ---
  // Belysning & el
  "emitting color": "Ljusfärg",
  "light color": "Ljusfärg",
  "lamp color": "Ljusfärg",
  "led color": "Ljusfärg",
  "color temperature": "Färgtemperatur",
  "bulb type": "Lamptyp",
  "base type": "Sockel",
  "lamp base": "Sockel",
  "power source": "Strömkälla",
  "power supply": "Strömförsörjning",
  "battery type": "Batterityp",
  "battery capacity": "Batterikapacitet",
  "charging type": "Laddningstyp",
  "charging method": "Laddningstyp",
  frequency: "Frekvens",
  current: "Strömstyrka",
  amperage: "Strömstyrka",
  "socket type": "Uttagstyp",
  // Kablar & anslutning
  connectivity: "Anslutning",
  connection: "Anslutning",
  "interface type": "Anslutning",
  "wire length": "Kabellängd",
  "cable length": "Kabellängd",
  "cord length": "Kabellängd",
  "hose length": "Slanglängd",
  // Kompatibilitet (tillbehör/reservdelar)
  compatibility: "Kompatibilitet",
  "compatible model": "Passar modell",
  "compatible models": "Passar modell",
  "applicable model": "Passar modell",
  "applicable models": "Passar modell",
  "compatible brand": "Passar märke",
  "phone model": "Telefonmodell",
  "car model": "Bilmodell",
  // Kläder, skor & smycken
  "sleeve length": "Ärmlängd",
  "heel height": "Klackhöjd",
  "cup size": "Kupstorlek",
  "shoe size": "Skostorlek",
  "ring size": "Ringstorlek",
  "metal color": "Metallfärg",
  "stone color": "Stenfärg",
  "gem color": "Stenfärg",
  "main stone color": "Stenfärg",
  "chain length": "Kedjelängd",
  "band color": "Bandfärg",
  "band width": "Bandbredd",
  "band length": "Bandlängd",
  "dial color": "Urtavlans färg",
  "strap type": "Remtyp",
  "hair color": "Hårfärg",
  "hair length": "Hårlängd",
  density: "Densitet",
  fabric: "Tyg",
  "fabric type": "Tyg",
  // Möbler & material
  "wood type": "Träslag",
  "frame material": "Rammaterial",
  "frame color": "Ramfärg",
  "shaft material": "Skaftmaterial",
  filling: "Fyllning",
  firmness: "Fasthet",
  hardness: "Hårdhet",
  "load capacity": "Maxbelastning",
  "max load": "Maxbelastning",
  "bearing weight": "Maxbelastning",
  "weight capacity": "Maxbelastning",
  // Målgrupp & tillfälle
  "applicable age": "Ålder",
  "age range": "Ålder",
  "recommended age": "Ålder",
  "applicable gender": "Kön",
  "applicable season": "Säsong",
  occasion: "Tillfälle",
  "applicable scene": "Tillfälle",
  theme: "Tema",
  character: "Figur",
  // Övrigt vanligt
  "wheel size": "Hjulstorlek",
  "screen size": "Skärmstorlek",
  "lens color": "Linsfärg",
  "lenses color": "Linsfärg",
  "item type": "Typ",
  "product type": "Typ",
  function: "Funktion",
  mode: "Läge",
  speed: "Hastighet",
  level: "Nivå",
  angle: "Vinkel",
  side: "Sida",
  temperature: "Temperatur",
  packing: "Förpackning",
  packaging: "Förpackning",
  combination: "Kombination",
  configuration: "Utförande",
  "control type": "Styrning",
  "mount type": "Fästtyp",
  "filter type": "Filtertyp",
  grit: "Kornstorlek",
  language: "Språk",
  certification: "Certifiering",
  brand: "Märke",
  print: "Tryck",
};

export const VALUE_TRANSLATIONS: Record<string, string> = {
  // --- Färger ---
  red: "Röd",
  blue: "Blå",
  black: "Svart",
  white: "Vit",
  green: "Grön",
  yellow: "Gul",
  pink: "Rosa",
  purple: "Lila",
  violet: "Lila",
  orange: "Orange",
  brown: "Brun",
  grey: "Grå",
  gray: "Grå",
  silver: "Silver",
  gold: "Guld",
  golden: "Guld",
  beige: "Beige",
  navy: "Marinblå",
  "navy blue": "Marinblå",
  turquoise: "Turkos",
  cyan: "Turkos",
  mint: "Mintgrön",
  "mint green": "Mintgrön",
  rose: "Rosé",
  ivory: "Elfenben",
  khaki: "Khaki",
  burgundy: "Vinröd",
  wine: "Vinröd",
  "wine red": "Vinröd",
  coffee: "Kaffebrun",
  champagne: "Champagne",
  transparent: "Transparent",
  clear: "Transparent",
  multicolor: "Flerfärgad",
  multicolour: "Flerfärgad",
  colorful: "Flerfärgad",
  "light blue": "Ljusblå",
  "dark blue": "Mörkblå",
  "sky blue": "Himmelsblå",
  "royal blue": "Kungsblå",
  "light pink": "Ljusrosa",
  "hot pink": "Cerise",
  "light green": "Ljusgrön",
  "dark green": "Mörkgrön",
  "army green": "Armégrön",
  "light grey": "Ljusgrå",
  "light gray": "Ljusgrå",
  "dark grey": "Mörkgrå",
  "dark gray": "Mörkgrå",
  "rose gold": "Roséguld",
  "light purple": "Ljuslila",
  "dark purple": "Mörklila",
  // --- Material ---
  cotton: "Bomull",
  wool: "Ull",
  silk: "Siden",
  linen: "Linne",
  polyester: "Polyester",
  nylon: "Nylon",
  plastic: "Plast",
  metal: "Metall",
  leather: "Läder",
  "pu leather": "PU-läder",
  "genuine leather": "Äkta läder",
  suede: "Mocka",
  wood: "Trä",
  bamboo: "Bambu",
  glass: "Glas",
  ceramic: "Keramik",
  rubber: "Gummi",
  silicone: "Silikon",
  "stainless steel": "Rostfritt stål",
  steel: "Stål",
  iron: "Järn",
  aluminum: "Aluminium",
  aluminium: "Aluminium",
  copper: "Koppar",
  brass: "Mässing",
  velvet: "Sammet",
  canvas: "Kanvas",
  denim: "Denim",
  acrylic: "Akryl",
  // --- Vanliga adjektiv/övrigt ---
  small: "Liten",
  medium: "Mellan",
  large: "Stor",
  "extra large": "Extra stor",
  default: "Standard",
  standard: "Standard",
  classic: "Klassisk",
  round: "Rund",
  square: "Fyrkantig",
  oval: "Oval",
  matte: "Matt",
  glossy: "Blank",
  men: "Herr",
  women: "Dam",
  unisex: "Unisex",
  kids: "Barn",
  child: "Barn",
  adult: "Vuxen",
  summer: "Sommar",
  winter: "Vinter",
  spring: "Vår",
  autumn: "Höst",
  fall: "Höst",
  // Sverige-tema (dyker upp i AE-titlar för svenska butiker)
  sweden: "Sverige",
  swedish: "Svensk",

  // --- Sammanbindande ord (för token-vis översättning av sammansatta värden,
  //     t.ex. "Black with LED" → "Svart med LED") ---
  with: "med",
  without: "utan",
  and: "och",

  // --- Djur (vanliga i barn-/husdjursprodukter) ---
  lion: "Lejon",
  elephant: "Elefant",
  rabbit: "Kanin",
  bunny: "Kanin",
  tiger: "Tiger",
  cow: "Ko",
  penguin: "Pingvin",
  fox: "Räv",
  squirrel: "Ekorre",
  skunk: "Skunk",
  raccoon: "Tvättbjörn",
  koala: "Koala",
  monkey: "Apa",
  pig: "Gris",
  crocodile: "Krokodil",
  duck: "Anka",

  // --- Mat / smaker ---
  doughnut: "Munk",
  donut: "Munk",
  watermelon: "Vattenmelon",
  carrot: "Morot",
  bone: "Ben",
  soymilk: "Sojamjölk",
  "lychee berry": "Litchibär",
  "chestnut cocoa": "Kastanj & kakao",
  "green grape": "Gröna druvor",
  "sesame bean": "Sesam & böna",
  "sea salt coconut": "Havssalt & kokos",
  "chicken leg": "Kycklingben",

  // --- Instrument ---
  trumpet: "Trumpet",
  maracas: "Maracas",
  castanets: "Kastanjetter",
  xylophone: "Xylofon",
  drum: "Trumma",

  // --- Kontakttyper (värden) ---
  "eu plug": "EU-kontakt",
  "us plug": "USA-kontakt",
  "uk plug": "UK-kontakt",
  "au plug": "AU-kontakt",

  // --- Övriga vanliga engelska värden / fraser ---
  camera: "Kamera",
  cloud: "Moln",
  camouflage: "Kamouflage",
  "touchscreen model": "Pekskärmsmodell",
  "baby monitor": "Babyvakt",
  "ice cream machine": "Glassmaskin",
  "coffee machine": "Kaffemaskin",
  "coffe machine": "Kaffemaskin",
  "kitchen utensils": "Köksredskap",
  "makeup set": "Sminkset",
  "kitchen set": "Köksset",
  "adventure suit": "Äventyrsdräkt",
  "with dual light": "Med dubbelt ljus",
  "random color 1 pc": "Slumpmässig färg, 1 st",
  // färgnyanser / beskrivande som inte redan finns ovan
  long: "Lång",
  "deep blue": "Mörkblå",
  skyblue: "Himmelsblå",
  "rose red": "Rosenröd",
  "reddish brown": "Rödbrun",
  "ginger yellow": "Ingefärsgul",
  "leather pink": "Läderrosa",
  "long rose red": "Lång rosenröd",
  "sakula pink": "Körsbärsrosa",
  "d white": "Vit",
  bown: "Brun", // vanlig AE-stavfel av "brown"

  // --- Paritet med storefront-ordboken (lib/option-i18n.ts): exakta fraser ur
  //     katalogen som annars bara delvis översätts token-vis. Säkra (matchar
  //     hela värden / kapas inte upp). Håll dessa i synk med frontend-ordboken. ---
  model: "Modell",
  pc: "st",
  pcs: "st",
  // Enheter: tum för inch (token-vis → "100 inch" → "100 tum"). Görs vid import så
  // värdet är svenskt FRÅN START — i V3 speglar choice.name den låsta choice.key:en,
  // så att döpa om värdet i efterhand fastnar inte och riskerar leverantörs-mappningen.
  inch: "tum",
  inches: "tum",
  "s-shaped": "S-formad",
  "y-shaped": "Y-formad",
  "1 tunnels": "1 tunnel",
  "4 tunnels": "4 tunnlar",
  "type-c to usb-a": "Type-C till USB-A",
  "type-c to type-c": "Type-C till Type-C",
  "gym 1": "Gym 1",
  "gym with tent": "Gym med tält",
  "gym with pendent": "Gym med hänge",
  "gym with pendent 2": "Gym med hänge 2",
  "doctor toy with box": "Doktorsleksak med låda",
  "doctor toy no box": "Doktorsleksak utan låda",
  "farm stacking toy": "Stapelleksak bondgård",
  "bunny pacifier chain": "Napphållare kanin",
  "rain tube": "Regnrör",
  "knock drum": "Knacktrumma",
  "triangle bell": "Triangel",
  "moon castanets": "Kastanjetter, måne",
  "leaf maracas": "Maracas, löv",
  "squirrel maracas": "Maracas, ekorre",
  "eighth xylophone": "Xylofon (8 toner)",
  "five xylophone": "Xylofon (5 toner)",
  "seven xylophone": "Xylofon (7 toner)",
  "5 pc cup": "5 koppar",
  "5 pc set": "5-delars set",
  "4pc sets": "4-delars set",
  "9pc cup set": "9-delars koppset",
  "10pc cup set": "10-delars koppset",
  "5pc sets 1": "5-delars set 1",
  "5pc sets 2": "5-delars set 2",
  "5pc sets 3": "5-delars set 3",
  "5pc sets 4": "5-delars set 4",
  "5pc sets 5": "5-delars set 5",
  "5pc sets 6": "5-delars set 6",
  "1 st mysteri box": "1 st mysterieask",
  "6 st mysteri box": "6 st mysterieask",
  "1pc 8mp poe camera": "1 st 8MP POE-kamera",
  "1pcs 5mp poe camera": "1 st 5MP POE-kamera",
  "2pcs 5mp poe camera": "2 st 5MP POE-kamera",
  "2pcs 8mp poe camera": "2 st 8MP POE-kamera",
  "3pcs 5mp poe camera": "3 st 5MP POE-kamera",
  "3pcs 8mp poe camera": "3 st 8MP POE-kamera",

  // --- Utökning: fler vanliga AE-variantord → svenska, så att halv-engelska
  //     värden ("100 inch", "With Battery", "1 Pair") inte slinker igenom.
  //     ALLA poster här är token-säkra: ord vars svenska översättning är
  //     entydig oavsett kontext. Tvetydiga adjektiv (deep/light/dark/free,
  //     left/right, wide) UTELÄMNAS medvetet — de krockar med färg-/vinkel-
  //     fraser ("Deep Red", "Right Angle", "Wide Angle") och skulle ge FEL
  //     översättning, vilket är värre än ett kvarvarande engelskt ord.
  //
  // Enheter (token-vis; "6 feet" → "6 fot"). cm/mm lämnas orörda (samma på
  // svenska); inch/inches finns redan ovan.
  feet: "fot",
  foot: "fot",
  // Antal/förpackning (kompletterar pc/pcs ovan). "1 Pair" → "1 par" — vanligt
  // för handskar/strumpor/örhängen.
  pair: "par",
  pairs: "par",
  // Universalstorlek (FULLT match → ingen token-uppdelning, så "free"/"one"
  // översätts aldrig löst — bara i dessa fasta fraser).
  "free size": "Universalstorlek",
  "one size": "Universalstorlek",
  onesize: "Universalstorlek",
  "plus size": "Plusstorlek",
  // Tillbehör ("With X"-värden). "with"→"med" finns redan, så "With Battery"
  // → "Med Batteri" (innehållsord behåller sin versal). Höga-frekvens-substantiv.
  battery: "Batteri",
  charger: "Laddare",
  cable: "Kabel",
  holder: "Hållare",
  mount: "Fäste",
  bracket: "Fäste",
  strap: "Rem",
  screen: "Skärm",
  lens: "Lins",
  // "remote" läggs som HEL fras, inte löst ord: "Fjärrkontroll" rymmer redan
  // "control", så ett löst "remote" hade gjort "Remote Control" → "Fjärrkontroll
  // Control" (dubblerat/fel). Som fras träffar bara exakt "Remote Control".
  "remote control": "Fjärrkontroll",
  // Kvalificerare (token-säkra adjektiv; entydiga oavsett efterföljande ord).
  foldable: "Hopfällbar",
  portable: "Bärbar",
  adjustable: "Justerbar",
  waterproof: "Vattentät",
  wireless: "Trådlös",
  rechargeable: "Uppladdningsbar",
  upgraded: "Uppgraderad",
  regular: "Standard",
  thick: "Tjock",
  thin: "Tunn",

  // --- Fäll-fixar (audit 2026-06): ord som ovan översätts token-vis till en
  //     FÄRG/SÄSONG men i dessa fasta fraser betyder något annat. Som HEL fras
  //     vinner de över token-uppdelningen, så "Spring Steel" blir "Fjäderstål"
  //     i stället för "Vår Stål". Råa engelska bakgrunden står kvar (spring→Vår
  //     osv.) för sina giltiga färg-/säsongs-användningar. ---
  "spring steel": "Fjäderstål", // spring(fjäder) ≠ Vår(säsong)
  "wine glass": "Vinglas", // wine(dryck) ≠ Vinröd(färg)
  "bone china": "Benporslin", // material, inte "ben"
  "coffee maker": "Kaffebryggare", // apparat, inte Kaffebrun(färg)
  "coffee cup": "Kaffekopp",
  "iron box": "Strykjärn", // apparat, inte Järn(material)
  "steam iron": "Ångstrykjärn",

  // --- LED-färgtemperatur (mycket vanlig AE-kategori). Fasta fraser så de blir
  //     HELT svenska ("Warm White" → "Varmvit", inte token-vis "Warm Vit"). ---
  "warm white": "Varmvit",
  "cool white": "Kallvit",
  "natural white": "Naturvit",
  "neutral white": "Neutralvit",
  "warm light": "Varmt ljus",
  "cool light": "Kallt ljus",
  "white light": "Vitt ljus",

  // ==========================================================================
  // Djup utbyggnad (2026-07, efter lekhage-fyndet "4500-5500sq.in."): täck de
  // vanligaste kvarvarande engelska AE-värdena. Samma regler som ovan gäller:
  // ALLA lösa ord är token-säkra (entydiga oavsett kontext); allt tvetydigt
  // ligger som HEL fras eller utelämnas medvetet (fel översättning är värre än
  // kvarvarande engelska — svansen fångas av AI-fallbacken/poleringskön).
  // Medvetet utelämnade + varför:
  //   apple/cherry  → "Apple Watch"/"Cherry MX" (varumärken i kompat-värden)
  //   plane         → hyvel vs flygplan ("airplane" finns i stället)
  //   bag/box/case  → väska/påse/ask/fodral beror helt på produkten
  //   cup/plate     → kopp vs kupa (BH), tallrik vs plätering ("Gold Plate")
  //   lbs/lb/oz     → kräver OMRÄKNING (inte 1:1-namnbyte som inch→tum);
  //                   lämnas → flaggas som engelska → AI/polering avgör
  //   light/dark/deep/free/left/right/wide → sedan tidigare (se ovan)
  // ==========================================================================

  // --- Fler färger (fasta nyanser som annars blir halv-engelska) ---
  apricot: "Aprikos",
  peach: "Persika",
  coral: "Korall",
  salmon: "Laxrosa",
  lavender: "Lavendel",
  lilac: "Syrenlila",
  teal: "Blågrön",
  emerald: "Smaragdgrön",
  "emerald green": "Smaragdgrön",
  olive: "Olivgrön",
  "olive green": "Olivgrön",
  mustard: "Senapsgul",
  // Bart "cream" är tvetydigt (färg/glass/hudkräm) → BARA fraser; ensamt värde
  // lämnas → AI/polering. "Ice Cream" är egen fäll-fix längre ned.
  "cream white": "Gräddvit",
  "creamy white": "Gräddvit",
  "off white": "Benvit",
  "off-white": "Benvit",
  "milk white": "Mjölkvit",
  "milky white": "Mjölkvit",
  "pearl white": "Pärlvit",
  "snow white": "Snövit",
  "pure white": "Helvit",
  "matte white": "Mattvit",
  "matte black": "Mattsvart",
  // AE-stavfel för matte ("Mat Black") — annars token-fel via mat→Matta.
  "mat black": "Mattsvart",
  "mat white": "Mattvit",
  "jet black": "Kolsvart",
  "pure black": "Helsvart",
  "glossy black": "Blanksvart",
  "gloss black": "Blanksvart",
  "dark red": "Mörkröd",
  "dark brown": "Mörkbrun",
  "light brown": "Ljusbrun",
  "light yellow": "Ljusgul",
  "baby blue": "Babyblå",
  "baby pink": "Babyrosa",
  "lake blue": "Sjöblå",
  "ice blue": "Isblå",
  "midnight blue": "Midnattsblå",
  "sapphire blue": "Safirblå",
  "cobalt blue": "Koboltblå",
  "denim blue": "Jeansblå",
  "grass green": "Gräsgrön",
  "fruit green": "Äppelgrön",
  "apple green": "Äppelgrön",
  "dusty pink": "Gammalrosa",
  "rose pink": "Rosenrosa",
  bronze: "Brons",
  graphite: "Grafitgrå",
  charcoal: "Kolgrå",
  gunmetal: "Stålgrå",
  chrome: "Krom",
  "smoke grey": "Rökgrå",
  "smoke gray": "Rökgrå",
  "antique brass": "Antik mässing",
  "antique bronze": "Antik brons",
  rainbow: "Regnbågsfärgad",
  random: "Slumpmässig",
  "random color": "Slumpmässig färg",
  mixed: "Blandad",
  "mixed color": "Blandade färger",
  "mix color": "Blandade färger",

  // --- "Som på bilden"-familjen (extremt vanlig på AE) ---
  "as picture": "Som på bilden",
  "as pictures": "Som på bilden",
  "as shown": "Som på bilden",
  "as picture shown": "Som på bilden",
  "as the picture": "Som på bilden",
  "picture color": "Som på bilden",
  "photo color": "Som på bilden",
  "same as picture": "Som på bilden",
  "same as photo": "Som på bilden",

  // --- Mönster ---
  "leopard print": "Leopardmönster",
  "zebra print": "Zebramönster",
  camo: "Kamouflage",
  floral: "Blommig",
  flower: "Blomma",
  striped: "Randig",
  stripe: "Randig",
  stripes: "Randig",
  plaid: "Rutig",
  checkered: "Rutig",
  checked: "Rutig",
  "polka dot": "Prickig",
  dotted: "Prickig",
  gradient: "Tonad",
  "wood grain": "Trämönster",
  marble: "Marmor",
  // Fäll-fix: "solid" ensamt är tvetydigt (enfärgad vs massiv) → BARA fraser.
  "solid color": "Enfärgad",
  "solid wood": "Massivt trä",

  // --- Fler material ---
  oak: "Ek",
  pine: "Furu",
  walnut: "Valnöt",
  birch: "Björk",
  beech: "Bok",
  "tempered glass": "Härdat glas",
  "carbon fiber": "Kolfiber",
  "carbon fibre": "Kolfiber",
  alloy: "Legering",
  "aluminum alloy": "Aluminiumlegering",
  "aluminium alloy": "Aluminiumlegering",
  "zinc alloy": "Zinklegering",
  microfiber: "Mikrofiber",
  flannel: "Flanell",
  corduroy: "Manchester",
  chiffon: "Chiffong",
  lace: "Spets",
  "faux leather": "Konstläder",
  "artificial leather": "Konstläder",
  "synthetic leather": "Konstläder",
  "faux fur": "Fuskpäls",
  fur: "Päls",
  plush: "Plysch",
  felt: "Filt",
  foam: "Skum",
  "memory foam": "Memoryskum",
  resin: "Harts",
  crystal: "Kristall",
  rhinestone: "Strass",
  "oxford cloth": "Oxfordväv",
  "oxford fabric": "Oxfordväv",
  "particle board": "Spånskiva",

  // --- El, belysning & drivning ---
  wired: "Trådbunden",
  dimmable: "Dimbar",
  "non-dimmable": "Ej dimbar",
  "not dimmable": "Ej dimbar",
  "with light": "Med belysning",
  "with lights": "Med belysning",
  "without light": "Utan belysning",
  "with led": "Med LED",
  "with led light": "Med LED-belysning",
  "with music": "Med musik",
  "with sound": "Med ljud",
  music: "Musik",
  batteries: "Batterier",
  "no battery": "Utan batteri",
  "battery powered": "Batteridriven",
  "battery operated": "Batteridriven",
  corded: "Med sladd",
  cordless: "Sladdlös",
  "plug in": "Nätdriven",
  "plug-in": "Nätdriven",
  "with plug": "Med kontakt",
  "no plug": "Utan kontakt",
  "without plug": "Utan kontakt",
  "european plug": "EU-kontakt",
  "no remote": "Utan fjärrkontroll",
  solar: "Soldriven",
  "app control": "Appstyrning",
  "voice control": "Röststyrning",
  "touch control": "Touchstyrning",
  // Fäll-fix: skydda USB-namnen som HELA fraser, så generiska "Type A/B"
  // (stil-varianter) kan token-översättas till "Typ A/B" utan att USB-värden
  // blir "Typ-C".
  "type-c": "Type-C",
  "type c": "Type-C",
  "type-a": "Type-A",
  "type-b": "Type-B",
  "usb type-c": "USB Type-C",
  "usb type c": "USB Type-C",
  type: "typ",

  // --- Kvalificerare & egenskaper ---
  "heavy duty": "Extra kraftig",
  heavy: "Tung",
  lightweight: "Lättvikt",
  "light weight": "Lättvikt",
  compact: "Kompakt",
  big: "Stor",
  "big size": "Stor",
  "large size": "Stor",
  "medium size": "Mellan",
  "small size": "Liten",
  "extra small": "Extra liten",
  new: "Ny",
  // Fäll-fix: stadsnamn ska inte token-översättas ("New York" ≠ "Ny York").
  "new york": "New York",
  style: "Stil",
  upgrade: "Uppgraderad",
  magnetic: "Magnetisk",
  "self-adhesive": "Självhäftande",
  adhesive: "Självhäftande",
  "non-slip": "Halkfri",
  "non slip": "Halkfri",
  "anti-slip": "Halkfri",
  "anti slip": "Halkfri",
  shockproof: "Stöttålig",
  dustproof: "Dammtät",
  windproof: "Vindtät",
  breathable: "Andningsbar",
  washable: "Tvättbar",
  "machine washable": "Maskintvättbar",
  reusable: "Återanvändbar",
  silent: "Tyst",
  quiet: "Tyst",
  mute: "Tyst", // AE-engelska för "tystgående" (fläktar/pumpar)
  automatic: "Automatisk",
  manual: "Manuell",
  electric: "Elektrisk",
  electronic: "Elektronisk",
  mechanical: "Mekanisk",
  hydraulic: "Hydraulisk",
  heated: "Uppvärmd",
  single: "Enkel",
  double: "Dubbel",
  dual: "Dubbel",
  triple: "Trippel",
  only: "endast",
  none: "Ingen",
  other: "Annan",

  // --- Antal, delar & tillbehör ---
  accessories: "Tillbehör",
  accessory: "Tillbehör",
  replacement: "Reserv",
  spare: "Reserv",
  "spare parts": "Reservdelar",
  parts: "delar",
  part: "del",
  pieces: "st",
  piece: "st",
  sets: "set",
  "full set": "Komplett set",
  "complete set": "Komplett set",
  rolls: "rullar",
  roll: "rulle",
  sheets: "ark",
  layers: "lager",
  layer: "lager",
  "1 tier": "1 våning",
  "2 tier": "2 våningar",
  "3 tier": "3 våningar",
  "4 tier": "4 våningar",
  "5 tier": "5 våningar",
  "6 tier": "6 våningar",
  "with box": "Med ask",
  "without box": "Utan ask",
  "with gift box": "Med presentask",
  "left side": "Vänster sida",
  "right side": "Höger sida",

  // --- Barnteman, djur & fordon (leksakskategorin) ---
  boy: "Pojke",
  girl: "Flicka",
  boys: "Pojkar",
  girls: "Flickor",
  dinosaur: "Dinosaurie",
  unicorn: "Enhörning",
  butterfly: "Fjäril",
  bee: "Bi",
  ladybug: "Nyckelpiga",
  owl: "Uggla",
  giraffe: "Giraff",
  shark: "Haj",
  whale: "Val",
  dolphin: "Delfin",
  turtle: "Sköldpadda",
  frog: "Groda",
  horse: "Häst",
  sheep: "Får",
  cat: "Katt",
  dog: "Hund",
  // Fäll-fixar: lekmat + nätverkskablar ska inte bli djur.
  "hot dog": "Varmkorv",
  "cat 5": "Cat 5",
  "cat 5e": "Cat 5e",
  "cat 6": "Cat 6",
  "cat 6a": "Cat 6a",
  "cat 7": "Cat 7",
  "cat 8": "Cat 8",
  mouse: "Mus", // både djuret och datormusen heter "mus" på svenska
  deer: "Hjort",
  wolf: "Varg",
  swan: "Svan",
  hedgehog: "Igelkott",
  octopus: "Bläckfisk",
  crab: "Krabba",
  fish: "Fisk",
  bird: "Fågel",
  snake: "Orm",
  chicken: "Kyckling",
  mermaid: "Sjöjungfru",
  princess: "Prinsessa",
  pirate: "Pirat",
  car: "Bil",
  truck: "Lastbil",
  train: "Tåg",
  airplane: "Flygplan",
  rocket: "Raket",
  boat: "Båt",
  excavator: "Grävmaskin",
  "fire truck": "Brandbil",
  "police car": "Polisbil",
  ambulance: "Ambulans",
  star: "Stjärna",
  moon: "Måne",
  sun: "Sol",
  heart: "Hjärta",
  crown: "Krona",

  // --- Kök & hem (vanliga värden i set-/tillbehörsaxlar) ---
  bowl: "Skål",
  spoon: "Sked",
  fork: "Gaffel",
  knife: "Kniv",
  chopsticks: "Ätpinnar",
  mug: "Mugg",
  teapot: "Tekanna",
  kettle: "Vattenkokare",
  lid: "Lock",
  "with lid": "Med lock",
  handle: "Handtag",
  "with handle": "Med handtag",
  wheels: "Hjul",
  wheel: "Hjul",
  "with wheels": "Med hjul",
  shelf: "Hylla",
  shelves: "Hyllor",
  drawer: "Låda",
  drawers: "Lådor",
  hook: "Krok",
  hooks: "Krokar",
  // Fäll-fix: "Hook and Loop" = kardborre (stängningstyp), inte "Krok och Loop".
  "hook and loop": "Kardborre",
  "hook & loop": "Kardborre",
  stand: "Ställ",
  "with stand": "Med ställ",
  tray: "Bricka",
  basket: "Korg",
  pillow: "Kudde",
  cushion: "Dyna",
  blanket: "Filt",
  towel: "Handduk",
  curtain: "Gardin",
  mat: "Matta",
  mirror: "Spegel",
  lamp: "Lampa",
  clock: "Klocka",
  vase: "Vas",
  frame: "Ram",
  "photo frame": "Fotoram",
  "air fryer": "Airfryer",
  blender: "Mixer",
  "vacuum cleaner": "Dammsugare",
  "hair dryer": "Hårtork",
  // Fäll-fix: lekmat/glass — inte "Ice Gräddvit" (bart "cream" är uteslutet).
  "ice cream": "Glass",

  // --- Smaker & dofter (entydiga; apple/cherry utelämnade, se ovan) ---
  vanilla: "Vanilj",
  jasmine: "Jasmin",
  lemon: "Citron",
  strawberry: "Jordgubbe",
  banana: "Banan",
  grape: "Druva",
  coconut: "Kokos",
  chocolate: "Choklad",
};

/**
 * Översätter ett axelnamn (optionsnamn). Strippar ev. ":"-suffix
 * ("Color: F2025" → "Color") och normaliserar till gemener före uppslag.
 * Faller tillbaka på råvärdet om axeln inte finns i tabellen.
 */
export function translateAxisName(raw: string): string {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[:：].*$/, "")
    .trim();
  return AXIS_TRANSLATIONS[key] ?? raw.trim();
}

// --- Mått-/storleksdetektering (för felmärkta "Color"-axlar) ----------------

// Värde som ENBART är ett mått: "42 in", "50 inch", "10 cm", `12"` — samt
// dimensionskedjor/intervall ("78.7x58.7in", "50-60 inch") och ytenheter
// ("4500-5500sq.in.", lekhage-fyndet 2026-07).
const MEASUREMENT_VALUE_RE =
  /^\d+(?:[.,]\d+)?(?:\s*[x×*\-–]\s*\d+(?:[.,]\d+)?)*\s*(?:inches|inch|in|tum|cm|mm|m|ft|feet|fot|sq\.?\s*in\.?|sq\.?\s*ft\.?|kvadrattum|kvadratfot|["“”])\.?$/i;
// Rent storleks-label: S/M/L/XL-skalan, ord och universalstorlek.
const SIZE_LABEL_RE =
  /^(?:xxs|xs|s|m|l|xl|xxl|xxxl|[2-9]xl|(?:extra\s+)?small|medium|(?:extra\s+)?large|x-?large|free\s?size|one\s?size|onesize|plus\s?size)$/i;

/**
 * True om SAMTLIGA värden på en axel ser ut som storlekar/mått (tum/cm/S–XL …)
 * och inga är färger. AE-säljare lägger ofta storlekar under "Color"-fältet
 * ("Color: 42 in"); detta upptäcker det så importen kan döpa om axeln till
 * "Storlek" (se buildTranslatorFromBase). Konservativt — kräver att ALLA värden
 * är storlekslika, så en riktig färg bland värdena avbryter omdöpningen.
 */
export function isSizeLikeAxis(values: ReadonlyArray<string>): boolean {
  const vals = values.map((v) => v.trim()).filter(Boolean);
  if (vals.length === 0) return false;
  return vals.every((v) => MEASUREMENT_VALUE_RE.test(v) || SIZE_LABEL_RE.test(v));
}

// Övriga icke-färg-klasser som AE-säljare lägger under "Color"-fältet (utöver
// storlekar). Varje regex matchar ett HELT värde i sin klass; omdöpningen kräver
// att SAMTLIGA värden matchar samma klass → aldrig en falsk positiv på en färg.
const PLUG_RE = /\bplug\b/i; // "EU Plug", "With US Plug"
const COUNT_RE = /^(?:\d+\s*(?:pcs?|pieces?|packs?|pairs?|sets?)|(?:set|pack)\s+of\s+\d+)\s*$/i; // HELA värdet = antal ("2 PCS", "Set of 3"); "2 PCS Red" (blandat m. färg) matchar ej → kvar som "Färg"
const VOLTAGE_RE = /^\d+\s*v(?:olt)?s?$/i; // "110V", "220 Volt"
const STORAGE_RE = /^\d+\s*[gtm]b$/i; // "64GB", "1TB"
const VOLUME_RE = /^\d+(?:[.,]\d+)?\s*(?:ml|cl|dl|l|lit(?:er|re)s?)$/i; // "500ml", "1.5L"
const WATT_RE = /^\d+(?:[.,]\d+)?\s*w(?:att)?s?$/i; // "10W", "60 Watt"
const KELVIN_RE = /^\d{3,5}\s*k$/i; // "3000K", "6500K" (LED-färgtemperatur; 3+ siffror så "18K"-guld inte träffas)
const CAPACITY_RE = /^\d+(?:[.,]\d+)?\s*m?ah$/i; // "2000mAh", "5Ah" (batterier)

/**
 * Bästa svenska axelnamn för en axel som översatts till "Färg" men vars värden
 * INTE är färger — AE-säljare lägger ofta storlekar/kontakter/antal/spänning osv.
 * under produktens "Color"-fält (så kunden annars ser "Färg: 42 in"). Returnerar
 * ett namn BARA när samtliga värden entydigt tillhör EN icke-färg-klass (positiv
 * matchning, aldrig "frånvaro av färg") → inga falska positiva på riktiga färger.
 * null = behåll "Färg" (säkert; täcker äkta + exotiska färger). Medvetet
 * konservativt: hellre kvar som "Färg" än en gissad etikett.
 */
export function inferMislabeledColorAxis(values: ReadonlyArray<string>): string | null {
  const vals = values.map((v) => v.trim()).filter(Boolean);
  if (vals.length === 0) return null;
  if (isSizeLikeAxis(vals)) return "Storlek";
  if (vals.every((v) => PLUG_RE.test(v))) return "Kontakt";
  if (vals.every((v) => COUNT_RE.test(v))) return "Antal";
  if (vals.every((v) => VOLTAGE_RE.test(v))) return "Spänning";
  if (vals.every((v) => STORAGE_RE.test(v))) return "Lagring";
  if (vals.every((v) => VOLUME_RE.test(v))) return "Volym";
  if (vals.every((v) => WATT_RE.test(v))) return "Effekt";
  if (vals.every((v) => KELVIN_RE.test(v))) return "Ljusfärg";
  if (vals.every((v) => CAPACITY_RE.test(v))) return "Kapacitet";
  return null;
}

/**
 * Normaliserar enheter/antal i ett värde till svenska — allt NUMMER-ANKRAT, så
 * lösa ord aldrig rörs: "42 inch"/`42"` → "42 tum", "4500-5500sq.in." →
 * "4500-5500 kvadrattum", "6ft" → "6 fot", "2pcs" → "2 st". Bart "in"
 * konverteras bara när HELA värdet är ett mått ("42 in", "78.7x58.7in" →
 * "… tum"), så "5 in 1"/"5 in stock" lämnas orörda. cm/mm/m är samma på
 * svenska; lbs/oz kräver omräkning (inte namnbyte) och lämnas medvetet →
 * flaggas som engelska → AI/polering. OBS: translateValue slår upp HELA
 * råvärdet i tabellen FÖRE det här passet, så fasta fraser med pc/pcs-former
 * ("1pc 8mp poe camera") aldrig bryts sönder av count-regeln.
 */
function normalizeUnits(value: string): string {
  let v = value
    // Ytenheter FÖRE längdenheter, så "sq.in."/"square inch" inte äts upp som tum.
    .replace(/(\d)\s*(?:sq\.?\s*in\.?|square\s+inch(?:es)?)/gi, "$1 kvadrattum")
    .replace(/(\d)\s*(?:sq\.?\s*ft\.?|square\s+(?:feet|foot))/gi, "$1 kvadratfot")
    .replace(/(\d)\s*(?:sq\.?\s*m\b\.?|square\s+met(?:er|re)s?)/gi, "$1 kvadratmeter")
    .replace(/(\d)\s*inches\b/gi, "$1 tum")
    .replace(/(\d)\s*inch\b/gi, "$1 tum")
    .replace(/(\d)\s*["“”]/g, "$1 tum")
    .replace(/(\d)\s*(?:feet\b|foot\b|ft\b\.?)/gi, "$1 fot")
    .replace(/(\d)\s*(?:pcs\b|pc\b|pieces\b|piece\b)\.?/gi, "$1 st");
  const bare = v
    .trim()
    .match(/^(\d+(?:[.,]\d+)?(?:\s*[x×*]\s*\d+(?:[.,]\d+)?)*)\s*in\.?$/i);
  if (bare) v = `${bare[1]} tum`;
  // Hela värdet är en set-/pack-fras → svensk form ("Set of 3" → "Set om 3",
  // "Pack of 2" → "2-pack").
  const setOf = v.trim().match(/^set\s+of\s+(\d+)$/i);
  if (setOf) v = `Set om ${setOf[1]}`;
  const packOf = v.trim().match(/^pack\s+of\s+(\d+)$/i);
  if (packOf) v = `${packOf[1]}-pack`;
  return appendMetric(v);
}

/**
 * Lägger metrisk motsvarighet i parentes efter tum-/fot-/kvadrattum-värden:
 * "48 tum" → "48 tum (122 cm)", "78.7x58.7 tum" → "78.7x58.7 tum (200x149 cm)",
 * "4500-5500 kvadrattum" → "4500-5500 kvadrattum (2,9-3,5 m²)".
 * Bakgrund (Leonard 2026-07-02, tomatburarna "48 tum"): nästan ingen i Sverige
 * vet vad tum är — kunden måste se cm. Deterministisk omräkning (exakta faktorer,
 * cm avrundas till heltal, m² till en decimal med komma) och BARA när HELA
 * värdet är ett mått som slutar på enheten → aldrig parenteser mitt i fraser.
 */
function appendMetric(value: string): string {
  const m = value.trim().match(/^([\d.,\sx×*–-]+?)\s*(kvadrattum|kvadratfot|tum|fot)$/i);
  if (!m) return value;
  const each = (f: (n: number) => string) =>
    m[1].replace(/\d+(?:[.,]\d+)?/g, (n) => f(parseFloat(n.replace(",", "."))));
  const unit = m[2].toLowerCase();
  const suffix =
    unit === "tum"
      ? `(${each((n) => String(Math.round(n * 2.54)))} cm)`
      : unit === "fot"
        ? `(${each((n) => String(Math.round(n * 30.48)))} cm)`
        : unit === "kvadrattum"
          ? `(${each((n) => (n * 0.00064516).toFixed(1).replace(".", ","))} m²)`
          : `(${each((n) => (n * 0.09290304).toFixed(1).replace(".", ","))} m²)`;
  return `${value.trim()} ${suffix}`;
}

/**
 * Översätter ett optionsvärde. Prioritet:
 *   1. Fullt match (hela värdet) → full översättning ("Light Blue" → "Ljusblå").
 *   2. Första-ord-match → översätt bara första ordet ("Pink Diamond" → "Rosa
 *      Diamond"), resten lämnas orört.
 *   3. Inget match → råvärdet ("5XL" → "5XL").
 * Universella storlekar (S/M/L/XL) och antal finns inte i tabellen och faller
 * därför alltid på steg 3.
 */
export function translateValue(raw: string): string {
  // Fullt match på RÅVÄRDET före all normalisering — skyddar fasta fraser som
  // själva innehåller enhets-/antalsformer ("1pc 8mp poe camera", "5pc sets 3")
  // från att brytas sönder av normalizeUnits count-regler.
  const rawTrimmed = raw.trim();
  const fullRaw = VALUE_TRANSLATIONS[rawTrimmed.toLowerCase()];
  if (fullRaw) return fullRaw;

  const trimmed = normalizeUnits(rawTrimmed);
  const full = VALUE_TRANSLATIONS[trimmed.toLowerCase()];
  if (full) return full;

  // Token-vis: översätt VARJE känt ord (inte bara det första) så sammansatta
  // värden blir helt svenska: "Black with LED" → "Svart med LED", "Long Blue"
  // → "Lång blå", "33-Grey" → "33-Grå". Separatorer (mellanslag/bindestreck)
  // bevaras. Okända ord (koder, mått, modellnamn som "iPhone 15") lämnas orörda
  // → hela värdet faller tillbaka på råvärdet om inget ord kändes igen.
  let touched = false;
  const out = trimmed
    .split(/([\s-]+)/)
    .map((tok) => {
      if (/^[\s-]*$/.test(tok)) return tok;
      const hit = VALUE_TRANSLATIONS[tok.toLowerCase()];
      if (hit) {
        touched = true;
        return hit;
      }
      return tok;
    })
    .join("");
  if (!touched) return trimmed;
  // Normalisera ev. dubbla mellanslag (rörig AE-data) och versalisera första
  // bokstaven (bindeord i tabellen är gemena: "med", "och").
  const norm = out.replace(/\s+/g, " ").trim();
  return norm.charAt(0).toUpperCase() + norm.slice(1);
}

/**
 * Returnerar de tokens i ett RÅVÄRDE som den statiska tabellen INTE kunde
 * översätta och som ser ut som riktig engelska — dvs en bra signal på att värdet
 * fortfarande är (halv-)engelskt. Tomt = värdet är (fullt) hanterat av tabellen.
 *
 * Detektionen körs på RÅVÄRDET (engelska) mot tabellen, inte på utdata, så
 * giltig svenska (t.ex. "Vit", "Stor") aldrig flaggas. En token räknas som
 * engelska om den är ≥3 rena ASCII-bokstäver, inte en akronym/kod i versaler
 * (LED/USB/POE/XXL) och saknas i tabellen. Mått/siffror/koder ("5XL", "33",
 * "B6AC", "KM-6631") matchar inte → flaggas aldrig.
 *
 * Används av variant-ai-translate.ts för att (a) välja vilka värden som skickas
 * till AI-fallbacken och (b) flagga produkter med kvarvarande engelska för
 * polering.
 */
export function residualEnglishTokens(raw: string): string[] {
  const trimmed = raw.trim();
  if (VALUE_TRANSLATIONS[trimmed.toLowerCase()]) return []; // fullt match → hanterat
  const out: string[] = [];
  for (const tok of trimmed.split(/[\s-]+/)) {
    if (!/^[A-Za-z]{3,}$/.test(tok)) continue; // kod/siffra/mått/för kort
    if (tok === tok.toUpperCase()) continue; // akronym/kod i versaler (LED, USB, XXL)
    if (VALUE_TRANSLATIONS[tok.toLowerCase()]) continue; // tabellen översätter token
    out.push(tok);
  }
  return out;
}

/**
 * Översätter ett helt optionsrecord (axel→värde) från en variant. Både nyckeln
 * (axelnamn) och värdet översätts. Används i import-pipelinen så att Wix-options
 * OCH variantval blir konsekvent svenska (de måste matcha varandra exakt).
 */
export function translateVariantOptions(
  options: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(options)) {
    out[translateAxisName(name)] = translateValue(value);
  }
  return out;
}

/**
 * Remappar färgkods-tabellen { [axelnamn]: { [val]: "#hex" } } till samma
 * översatta nycklar som translateVariantOptions producerar. Utan detta skulle
 * swatch-uppslaget i deriveOptions missa (tabellen är keyad på engelska
 * råvärden men options/val är nu svenska).
 */
export function translateOptionColorCodes(
  colorCodes: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [axis, valueMap] of Object.entries(colorCodes)) {
    const translatedAxis = translateAxisName(axis);
    const translatedValues: Record<string, string> = {};
    for (const [value, hex] of Object.entries(valueMap)) {
      translatedValues[translateValue(value)] = hex;
    }
    out[translatedAxis] = { ...(out[translatedAxis] ?? {}), ...translatedValues };
  }
  return out;
}

/**
 * Kollisions-SÄKER översättare för EN produkts varianter.
 *
 * Problem: translateValue mappar olika råvärden till samma svenska sträng
 * ("dark blue" + "deep blue" → båda "Mörkblå", "navy" + "navy blue" → "Marinblå").
 * Om en produkt har BÅDA som distinkta varianter kollapsar de till EN choice i
 * deriveOptions (Set) → två Wix-varianter med identisk options-kombination → Wix
 * slår ihop/avvisar → tappad variant + mappning utan wixVariantId (lager/pris/
 * fulfillment trasig för den varianten).
 *
 * Lösning: bygg EN gång per produkt en raw→översatt-karta per axel som garanterar
 * att distinkta råvärden får distinkta översatta värden (andra+ kollisionen får
 * "(råvärde)"-suffix; chatten kan polera namnet senare). SAMMA karta används för
 * variantoptions, colorCodes och swatch-bilder → nycklarna matchar alltid.
 */
export interface VariantTranslator {
  /** Översätter en variants options (axel→värde) kollisions-säkert. */
  options(raw: Record<string, string>): Record<string, string>;
  /** Remappar en axel→värde→T-tabell (colorCodes/swatch-bilder) med SAMMA nycklar. */
  axisKeyedMap<T>(map: Record<string, Record<string, T>>): Record<string, Record<string, T>>;
}

/**
 * Synkron, deterministisk översättare (enbart statisk tabell). Publik API som
 * används när AI-fallbacken är av. Tunn wrapper över buildTranslatorFromBase.
 */
export function buildVariantTranslator(
  variants: ReadonlyArray<{ options: Record<string, string> }>,
): VariantTranslator {
  return buildTranslatorFromBase(variants, translateValue, translateAxisName);
}

/**
 * Kollisions-säker översättare byggd från en INJICERAD bas-översättning. Den
 * statiska tabellen (translateValue) är default; AI-fallbacken (variant-ai-
 * translate.ts) skickar in en baseValue som slår upp Claude-översatta värden
 * först och faller tillbaka på tabellen. Kollisions-/disambig-logiken är
 * IDENTISK oavsett bas → ingen variant-kollaps, oavsett källa.
 */
export function buildTranslatorFromBase(
  variants: ReadonlyArray<{ options: Record<string, string> }>,
  baseValue: (raw: string) => string,
  baseAxis: (axis: string) => string = translateAxisName,
  /**
   * Per-rå-axel AI-namn för felmärkta "Color"-axlar som de deterministiska
   * klasserna inte fångar (variant-ai-translate.ts skickar in det). Deterministisk
   * klass vinner alltid; override används bara när klassen är okänd.
   */
  axisOverrides?: ReadonlyMap<string, string>,
): VariantTranslator {
  // Råvärden per råaxel i stabil först-sedd-ordning.
  const rawValuesByAxis = new Map<string, string[]>();
  for (const v of variants) {
    for (const [axis, value] of Object.entries(v.options ?? {})) {
      const arr = rawValuesByAxis.get(axis) ?? [];
      if (!arr.includes(value)) arr.push(value);
      rawValuesByAxis.set(axis, arr);
    }
  }
  // Per axel: raw→unik översatt värde + raw-axel→översatt-axel.
  const axisName = new Map<string, string>();
  const valueByAxis = new Map<string, Map<string, string>>();
  for (const [axis, values] of rawValuesByAxis) {
    // Felmärkt "Color"-axel: AE-säljare lägger ofta storlekar/kontakter/antal osv.
    // under färg-fältet ("Color: 42 in"). Blev axeln "Färg"? → 1) deterministisk
    // klass om ALLA värden matchar en (Storlek/Kontakt/Antal/… , gratis), annars
    // 2) ev. AI-föreslaget namn (okända klasser/material), annars 3) kvar som "Färg"
    // (säkert; täcker äkta + exotiska färger). deriveOptions släpper redan swatchen
    // för icke-färgaxlar (isColorAxis); detta fixar det missvisande NAMNET.
    let resolvedAxis = baseAxis(axis);
    if (resolvedAxis === "Färg") {
      resolvedAxis = inferMislabeledColorAxis(values) ?? axisOverrides?.get(axis) ?? "Färg";
    }
    axisName.set(axis, resolvedAxis);
    const used = new Set<string>();
    const m = new Map<string, string>();
    for (const raw of values) {
      const base = baseValue(raw);
      let t = base;
      if (used.has(t)) {
        // Kollision: särskilj med råvärdet; om även det är upptaget, löpnummer.
        // Loopa tills strängen är FRI — annars kan disambig-formen själv krocka
        // (t.ex. ett råvärde som bokstavligen heter "Mörkblå 2", eller whitespace-
        // varianter av samma färg) och unikheten brytas.
        t = `${base} (${raw.trim()})`;
        for (let n = 2; used.has(t); n++) t = `${base} ${n}`;
      }
      used.add(t);
      m.set(raw, t);
    }
    valueByAxis.set(axis, m);
  }
  const tAxis = (axis: string) => axisName.get(axis) ?? baseAxis(axis);
  const tValue = (axis: string, value: string) => valueByAxis.get(axis)?.get(value) ?? baseValue(value);
  return {
    options(raw) {
      const out: Record<string, string> = {};
      for (const [axis, value] of Object.entries(raw ?? {})) out[tAxis(axis)] = tValue(axis, value);
      return out;
    },
    axisKeyedMap<T>(map: Record<string, Record<string, T>>) {
      const out: Record<string, Record<string, T>> = {};
      for (const [axis, valueMap] of Object.entries(map ?? {})) {
        const ta = tAxis(axis);
        const inner: Record<string, T> = {};
        for (const [value, x] of Object.entries(valueMap)) inner[tValue(axis, value)] = x;
        out[ta] = { ...(out[ta] ?? {}), ...inner };
      }
      return out;
    },
  };
}
