// lib/feed/djupare-kategori.ts
//
// Djupare g:google_product_category per vara, ur varans namn.
//
// VARFÖR. Google-flödet ger varje underkategori i Wix en enda nod
// (GOOGLE_CATEGORY_BY_SLUG i app/feed/google.xml/route.ts), och där en
// kategori blandar varor fick den den närmaste nod som stämmer för alla:
// Fåtöljer blev "Furniture", Leksaker & Spel "Toys & Games". Pinterests
// diagnostik 2026-11-15 (inläsningen 10:12) varnade för det på 7 046 varor
// (varning 126: "bara en eller två nivåer ... kan begränsa synligheten i
// rekommendationer, sökresultat och shoppingupplevelser") och 133 utan
// kategori (varning 157). Mätt på flödet samma dag: 7 322 av 10 061 varor
// hade noll till två nivåer. Leonard bad om att det rättas (2026-11-15).
//
// HUR. Här finns regler per underkategori (nyckeln är kategorins slug, som
// i kartan). Reglerna prövas mot varans namn i ordning, och den första som
// träffar vinner:
//  1. först mot namnets huvud, det som står före första tankstrecket ("Gungstol
//     i chenille" ur "Gungstol i chenille – bär 120 kg - Brun"), så att en
//     egenskap längre bak ("med massagepunkter") inte styr,
//  2. sedan mot hela namnet ("Naturehike Cloud Up 2 – tält för två"),
//  3. sist underkategorins standardnod, regeln utan ord, om den finns.
// En regel med id null betyder "behåll kartans nod": en vara som inte ska
// flyttas (leggings i Träning & Gym, smyckeskrin med krokar).
// Träffar ingenting gäller kartan som förut.
//
// ☠️ Varje id är kontrollerat mot Googles taxonomifil
// (taxonomy-with-ids.en-US.txt, version 2021-09-21) 2026-11-15, och namnet
// står bredvid. Provet (djupare-kategori.test.ts) fäller samma id med två olika
// namn och en nod som är grundare än tre nivåer, utom de få löv som saknar
// djupare noder. En ny regel: läs id:t ur taxonomifilen, inte ur minnet.
//
// ☠️ Inga noder under "Apparel & Accessories". Kläder kräver kön, ålder,
// storlek och färg i Merchant Center, och en vara som flyttas dit utan dem
// avvisas. Därför behåller kläderna i Träning & Gym sin nod.
//
// LÖVMODUL med flit (inga importer), så att node --test kan ladda den.

export type Regel = {
  /** Ord i varans namn (gemener). null: underkategorins standardnod, står sist. */
  ord: RegExp | null;
  /** Nodens id i Googles taxonomi. null: behåll kartans nod. */
  id: number | null;
  /** Nodens namn i taxonomin, för läsaren och provet. */
  namn: string;
};

const R = (ord: RegExp | null, id: number | null, namn: string): Regel => ({ ord, id, namn });
const BEHALL = "behåll kartans nod";

/**
 * Tänger, ord för ord. ☠️ Inte "tång" eller "tänger" fritt i namnet: det
 * träffar mitt i andra ord (ledstång, mätstång, stocklyfttång, fyrkantsstänger).
 */
const TANGER = /kombinationstång|spetstång|polygrip|vattenpumpstång|låstång|griptång|avbitartång|sidavbitare|avbitare|krymptång|presstång|tångset|^tång/;

/** Skumklossar och mjuka klätterset. ☠️ Inte "klätterset" fritt: det finns i trä och furu också. */
const SKUMKLOSSAR = /skumklossar|skumblock|mjuka (bygg)?klossar|mjukt klätterset|klätterset i (skum|sammet)|mjuklek/;

/** Regler per underkategori. Nyckeln är kategorins slug (asciiSlug av namnet i Wix). */
export const DJUPARE_KATEGORIER: Readonly<Record<string, readonly Regel[]>> = {
  // ── Möbler ────────────────────────────────────────────────────────────────
  fatoljer: [
    R(/massagestol|massagefåtölj/, 2919, "Furniture > Chairs > Electric Massaging Chairs"),
    R(/gungstol|gungfåtölj/, 2002, "Furniture > Chairs > Rocking Chairs"),
    R(/golvfåtölj|golvstol|golvsoffa/, 500051, "Furniture > Chairs > Floor Chairs"),
    R(/sittsäck|saccosäck/, 438, "Furniture > Chairs > Bean Bag Chairs"),
    R(/hängstol|hängfåtölj/, 7197, "Furniture > Chairs > Hanging Chairs"),
    R(/gamingstol/, 6800, "Furniture > Chairs > Gaming Chairs"),
    R(/kontorsstol/, 2045, "Furniture > Office Furniture > Office Chairs"),
    R(null, 6499, "Furniture > Chairs > Arm Chairs, Recliners & Sleeper Chairs"),
  ],
  kontorsstolar: [
    R(/gamingstol/, 6800, "Furniture > Chairs > Gaming Chairs"),
    R(null, 2045, "Furniture > Office Furniture > Office Chairs"),
  ],
  "matbord-stolar": [
    R(/barstol|barpall/, 1463, "Furniture > Chairs > Table & Bar Stools"),
    R(/matgrupp|bord (med|och) (två|tre|fyra|sex|åtta|\d+) (stolar|pallar)|bord med stolar/, 6347, "Furniture > Furniture Sets > Kitchen & Dining Furniture Sets"),
    R(/bänk/, 6850, "Furniture > Benches > Kitchen & Dining Benches"),
    R(/pall/, 1463, "Furniture > Chairs > Table & Bar Stools"),
    R(/stol/, 5886, "Furniture > Chairs > Kitchen & Dining Room Chairs"),
    R(/bord/, 4355, "Furniture > Tables > Kitchen & Dining Room Tables"),
  ],
  skrivbord: [
    // Här ligger också skärmstöd, skrivbordsstativ, bordsskivor och arkivskåp.
    // Skärmstödet bara först i namnet: "datorbord med monitorställ" är ett bord.
    R(/^(\S+ )?(monitorställ|skärmstöd|skärmhöjare|skärmstativ|laptopställ)|^sängbord för laptop/, 5489, "Electronics > Electronics Accessories > Computer Accessories > Computer Risers & Stands"),
    R(/skrivbordsram|skrivbordsstativ/, 503766, "Furniture > Office Furniture Accessories > Desk Parts & Accessories"),
    R(/^(\S+ )?bordsskiva/, 6910, "Furniture > Table Accessories > Table Tops"),
    R(/arkivskåp/, 5938, "Furniture > Cabinets & Storage > Storage Cabinets & Lockers"),
    R(/ritbord/, 2242, "Furniture > Office Furniture > Workspace Tables > Art & Drafting Tables"),
    R(/racingstativ/, null, BEHALL),
    R(null, 4191, "Furniture > Office Furniture > Desks"),
  ],
  "soffor-baddsoffor": [
    R(/bäddsoffa|sovsoffa|futon/, 450, "Furniture > Futons"),
    R(null, 460, "Furniture > Sofas"),
  ],
  "soffbord-smabord": [
    R(/nattduksbord|sängbord/, 462, "Furniture > Tables > Nightstands"),
    R(/soffbord/, 1395, "Furniture > Tables > Accent Tables > Coffee Tables"),
    R(/konsolbord|hallbord/, 1602, "Furniture > Tables > Accent Tables > Sofa Tables"),
    R(/sidobord|småbord|satsbord|lampbord|avlastningsbord/, 1549, "Furniture > Tables > Accent Tables > End Tables"),
    R(null, 6369, "Furniture > Tables > Accent Tables"),
  ],
  "sangar-sovrum": [
    R(/översängsbord/, null, BEHALL),
    R(/sminkbord/, 6360, "Furniture > Cabinets & Storage > Vanities > Bedroom Vanities"),
    R(/nattduksbord|sängbord/, 462, "Furniture > Tables > Nightstands"),
    R(/sängbänk|sittbänk|förvaringsbänk/, 6851, "Furniture > Benches > Storage & Entryway Benches"),
    R(/garderob/, 4063, "Furniture > Cabinets & Storage > Armoires & Wardrobes"),
    R(/byrå/, 4195, "Furniture > Cabinets & Storage > Dressers"),
    R(/madrasstöd|madrassbotten|ribbotten|sängbotten/, 2720, "Furniture > Beds & Accessories > Mattress Foundations"),
    // Gaveln och madrassen räknas bara först i namnet: "sängram med sänggavel"
    // och "extrasäng med madrass" är sängar.
    R(/^(\S+ )?(sänggavel|huvudgavel)/, 451, "Furniture > Beds & Accessories > Headboards & Footboards"),
    R(/^(\S+ )?(bädd)?madrass(?!kydd|-skydd)/, 2696, "Furniture > Beds & Accessories > Mattresses"),
    R(/säng|dagbädd/, 505764, "Furniture > Beds & Accessories > Beds & Bed Frames"),
  ],
  pallar: [
    R(/pianopall|pianobänk/, 505328, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > Music Benches & Stools"),
    R(/sminkpall|pall till sminkbord/, 4241, "Furniture > Benches > Vanity Benches"),
    R(/(två|tre) steg/, 635, "Hardware > Tools > Ladders & Scaffolding > Step Stools"),
    R(/förvaringspall/, 458, "Furniture > Ottomans"),
    R(/fotpall/, 458, "Furniture > Ottomans"),
    R(/hopfällbar|fällbar/, 3358, "Furniture > Chairs > Folding Chairs & Stools"),
    R(null, 1463, "Furniture > Chairs > Table & Bar Stools"),
  ],
  rumsavdelare: [
    R(/skrivbordsavdelare/, 6909, "Furniture > Office Furniture Accessories > Workstation & Cubicle Accessories"),
    R(null, 4163, "Furniture > Room Dividers"),
  ],
  "serveringsvagnar-rullvagnar": [R(null, 453, "Furniture > Carts & Islands > Kitchen & Dining Carts")],
  "koksoar-koksvagnar": [
    R(/köksö/, 6374, "Furniture > Carts & Islands > Kitchen Islands"),
    R(null, 453, "Furniture > Carts & Islands > Kitchen & Dining Carts"),
  ],

  // ── Hem & Inredning ───────────────────────────────────────────────────────
  "forvaring-organisering": [
    R(/smyckeskrin|smyckesskåp/, null, BEHALL),
    R(/under skrivbordet|skrivbordslåda/, 503766, "Furniture > Office Furniture Accessories > Desk Parts & Accessories"),
    R(/skrivbord/, 4191, "Furniture > Office Furniture > Desks"),
    R(/paraplyställ/, 5494, "Home & Garden > Household Supplies > Storage & Organization > Storage Hooks & Racks > Umbrella Stands & Racks"),
    R(/skohylla|skoställ|skoskåp|skobänk|skoförvaring|skoorganis/, 5559, "Home & Garden > Household Supplies > Storage & Organization > Clothing & Closet Storage > Shoe Racks & Organizers"),
    R(/tyggarderob|garderob(?!ssystem)/, 4063, "Furniture > Cabinets & Storage > Armoires & Wardrobes"),
    R(/klädställ|klädhängare|klädstång|garderobssystem/, 5714, "Home & Garden > Household Supplies > Storage & Organization > Clothing & Closet Storage > Closet Organizers & Garment Racks"),
    R(/förvaringsbänk|sittbänk|hallbänk|bänk/, 6851, "Furniture > Benches > Storage & Entryway Benches"),
    R(/förvaringspall|sittpuff|puff/, 458, "Furniture > Ottomans"),
    R(/byrå|kommod/, 4195, "Furniture > Cabinets & Storage > Dressers"),
    R(/mediahylla|dvd|mediaförvaring/, 6358, "Furniture > Cabinets & Storage > Media Storage Cabinets & Racks"),
    R(/vägghylla|svävande hylla/, 6372, "Furniture > Shelving > Wall Shelves & Ledges"),
    R(/bokhylla|hylla|hyllor|hyllställ/, 465, "Furniture > Shelving > Bookcases & Standing Shelves"),
    R(/skåp/, 5938, "Furniture > Cabinets & Storage > Storage Cabinets & Lockers"),
    R(/förvaringslåd|förvaringsbox|förvaringskorg|låda med lock|korg/, 5631, "Home & Garden > Household Supplies > Storage & Organization > Household Storage Containers"),
    R(/krokar|krok\b|krokhängare/, 2446, "Home & Garden > Household Supplies > Storage & Organization > Storage Hooks & Racks"),
  ],
  badrumsskap: [
    R(/spegelskåp|medicinskåp/, 2418, "Home & Garden > Bathroom Accessories > Medicine Cabinets"),
    R(/tvättställ|handfat|badrumsmöbel/, 2081, "Furniture > Cabinets & Storage > Vanities > Bathroom Vanities"),
    R(null, 5938, "Furniture > Cabinets & Storage > Storage Cabinets & Lockers"),
  ],
  "badrum-hemtextil": [
    R(/spegelskåp|medicinskåp/, 2418, "Home & Garden > Bathroom Accessories > Medicine Cabinets"),
    R(/badrumsskåp|skåp/, 5938, "Furniture > Cabinets & Storage > Storage Cabinets & Lockers"),
    R(/spegel/, 595, "Home & Garden > Decor > Mirrors"),
    R(/duschdraperi|duschförhäng/, 580, "Home & Garden > Bathroom Accessories > Shower Curtains"),
    R(/badrumsmatta|badmatta|duschmatta/, 577, "Home & Garden > Bathroom Accessories > Bath Mats & Rugs"),
    R(/handduksstång|handdukshängare|handdukshållare|handduksställ|handdukshylla|handduksstege/, 586, "Home & Garden > Bathroom Accessories > Towel Racks & Holders"),
    R(/toalettpappershållare|toarullehållare/, 584, "Home & Garden > Bathroom Accessories > Toilet Paper Holders"),
    R(/toalettborste/, 583, "Home & Garden > Bathroom Accessories > Toilet Brushes & Holders"),
    R(/tvålpump|tvålautomat/, 4971, "Home & Garden > Bathroom Accessories > Soap & Lotion Dispensers"),
    R(/duschhylla|duschkorg|badkarsbricka/, 575, "Home & Garden > Bathroom Accessories > Bath Caddies"),
    R(/hylla|hyllor/, 465, "Furniture > Shelving > Bookcases & Standing Shelves"),
    R(/handduk|badlakan/, 4077, "Home & Garden > Linens & Bedding > Towels"),
    R(/matta/, 598, "Home & Garden > Decor > Rugs"),
    R(/prydnadskudde|dekorationskudde|kuddfodral/, 4454, "Home & Garden > Decor > Throw Pillows"),
    // Kuddarna här är sängkuddar: nackkudde, läskudde, graviditetskudde.
    R(/kudde|kuddar/, 2700, "Home & Garden > Linens & Bedding > Bedding > Pillows"),
    R(/pläd|filt/, 1985, "Home & Garden > Linens & Bedding > Bedding > Blankets"),
    R(/^(vägg|golv|bords|väckar)?klocka/, 3890, "Home & Garden > Decor > Clocks"),
  ],
  "dekoration-prydnad": [
    R(/spegel/, 595, "Home & Garden > Decor > Mirrors"),
    R(/konstgjord|konstgjort|konstväxt|konstblomm/, 6265, "Home & Garden > Decor > Artificial Flora"),
    R(/kruka|krukor/, 721, "Home & Garden > Lawn & Garden > Gardening > Pots & Planters"),
    R(/vas\b|vaser|golvvas/, 602, "Home & Garden > Decor > Vases"),
    // Bara först i namnet: en klockuppdragare är ingen klocka.
    R(/^(vägg|golv|bords|väckar)?klocka/, 3890, "Home & Garden > Decor > Clocks"),
    R(/ljuslykta|ljusstake|lykta/, 2784, "Home & Garden > Decor > Home Fragrance Accessories > Candle Holders"),
    R(/tavla|tavlor|poster|canvas|väggkonst|väggdekor/, 9, "Home & Garden > Decor > Artwork"),
    R(/fotoram|bildram|displayram/, 597, "Home & Garden > Decor > Picture Frames"),
    R(/skulptur|staty|figur/, 5609, "Home & Garden > Decor > Figurines"),
    R(/krans|girlang/, 6267, "Home & Garden > Decor > Wreaths & Garlands"),
  ],
  belysning: [
    R(/ljuskrona|kristallkrona/, 2249, "Home & Garden > Lighting > Lighting Fixtures > Chandeliers"),
    R(/taklampa|takarmatur|plafond|pendellampa|takbelysning/, 2524, "Home & Garden > Lighting > Lighting Fixtures > Ceiling Light Fixtures"),
    R(/vägglampa|vägglykta|väggarmatur/, 6073, "Home & Garden > Lighting > Lighting Fixtures > Wall Light Fixtures"),
    R(/ljusslinga|ledslinga|led-slinga|ljusslang|ledlist|led-list|ljusgardin/, 2608, "Home & Garden > Lighting > Light Ropes & Strings"),
    R(/strålkastare|arbetslampa/, 1546, "Home & Garden > Lighting > Flood & Spot Lights"),
    R(/nattlampa|stämningslampa|stämningsbelysning/, 505826, "Home & Garden > Lighting > Night Lights & Ambient Lighting"),
    R(/lampa|lampor/, 4636, "Home & Garden > Lighting > Lamps"),
  ],
  "tvatt-stad": [
    R(/torktumlare|tvättmaskin|centrifug/, 2706, "Home & Garden > Household Appliances > Laundry Appliances"),
    R(/dammsugare/, 619, "Home & Garden > Household Appliances > Vacuums"),
    R(/ångtvätt|ångmopp|golvtvätt|ångrengörare/, 616, "Home & Garden > Household Appliances > Floor & Steam Cleaners"),
    R(/torkställ|torkvinda|klädtork|tvättlina/, 2677, "Home & Garden > Household Supplies > Laundry Supplies > Drying Racks & Hangers"),
    R(/strykbräda/, 633, "Home & Garden > Household Supplies > Laundry Supplies > Ironing Boards"),
    R(/tvättkorg|tvättsäck|tvättlåda/, 634, "Home & Garden > Household Supplies > Laundry Supplies > Laundry Baskets"),
    R(/galge|galgar/, 631, "Home & Garden > Household Supplies > Storage & Organization > Clothing & Closet Storage > Hangers"),
  ],
  hushallsapparater: [
    R(/dammsugare/, 619, "Home & Garden > Household Appliances > Vacuums"),
    R(/torktumlare|tvättmaskin/, 2706, "Home & Garden > Household Appliances > Laundry Appliances"),
    R(/avfuktare|luftfuktare|luftrenare|fläkt|luftkonditionering|ac-aggregat/, 1626, "Home & Garden > Household Appliances > Climate Control Appliances"),
  ],

  // ── Trädgård & Utemöbler ──────────────────────────────────────────────────
  utemobler: [
    R(/^(överdrag|möbelskydd|skyddsöverdrag|möbelöverdrag|hammocköverdrag)/, 6964, "Furniture > Outdoor Furniture Accessories > Outdoor Furniture Covers"),
    // Dynor bara först i namnet: "två stolar med dynor" är stolar.
    R(/^(\S+ )?(dyna|dynor|dynset|sittdyn|stolsdyn|bänkdyn|pallkudd)/, 4453, "Home & Garden > Decor > Chair & Sofa Cushions"),
    R(/dynbox|dynlåda|dynförvaring|förvaringsbox|förvaringslåda|förvaringskista/, 7310, "Furniture > Outdoor Furniture > Outdoor Storage Boxes"),
    R(/hängmatt(e|s)?(stativ|ställ)/, 6737, "Home & Garden > Lawn & Garden > Outdoor Living > Hammock Parts & Accessories"),
    R(/hängmatta/, 717, "Home & Garden > Lawn & Garden > Outdoor Living > Hammocks"),
    R(/hammock|hollywoodgunga|gungsoffa|hängsoffa|trädgårdsgunga/, 718, "Home & Garden > Lawn & Garden > Outdoor Living > Porch Swings"),
    R(/hängstol|hängfåtölj|äggstol/, 7197, "Furniture > Chairs > Hanging Chairs"),
    R(/solsäng|solstol|vilstol|liggstol|däckstol|schäslong/, 4105, "Furniture > Outdoor Furniture > Outdoor Seating > Sunloungers"),
    R(/utebädd|dagbädd|daybed/, 6892, "Furniture > Outdoor Furniture > Outdoor Beds"),
    // Parasollet först i namnet: "bord med parasollhål" är ett bord.
    R(/^\S*parasoll(?!hål)/, 719, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Umbrellas & Sunshades"),
    R(/bistroset|balkongset|caféset|cafeset|trädgårdsset|sittgrupp|loungegrupp|loungeset|soffgrupp|matgrupp|möbelgrupp|möbelset|(\d|två|tre|fyra|fem|sex|sju|åtta) delar|stolar och bord|bord och (två|fyra|sex|\d+) stolar|med (två|fyra|sex|\d+) stolar/, 6367, "Furniture > Outdoor Furniture > Outdoor Furniture Sets"),
    R(/bänk/, 5044, "Furniture > Outdoor Furniture > Outdoor Seating > Outdoor Benches"),
    R(/soffa|soffor|tvåsits|tresits/, 4513, "Furniture > Outdoor Furniture > Outdoor Seating > Outdoor Sofas"),
    // Pallen bara först i namnet: "fåtölj med fotpall" är en fåtölj.
    R(/^(\S+ )?(fotpall|pall|puff|sittpuff)/, 6822, "Furniture > Outdoor Furniture > Outdoor Ottomans"),
    R(/bord/, 2684, "Furniture > Outdoor Furniture > Outdoor Tables"),
    R(/stol(?!pe)|fåtölj/, 6828, "Furniture > Outdoor Furniture > Outdoor Seating > Outdoor Chairs"),
  ],
  "vaxthus-odling": [
    // Odlingslådan först i namnet är en odlingslåda, med spaljé eller växthusduk.
    R(/^(\S+ )?(odlingslåd|planteringslåd|odlingsbädd|pallkrage)/, 721, "Home & Garden > Lawn & Garden > Gardening > Pots & Planters"),
    R(/växthus|drivhus|foliehus|odlingstunnel|drivbänk|odlingstält|tomathus/, 693, "Home & Garden > Lawn & Garden > Gardening > Greenhouses"),
    R(/^(\S+ )?(spaljé|växtstöd|klätterstöd|tomatstöd)/, 499894, "Home & Garden > Lawn & Garden > Gardening > Plant Cages & Supports"),
    R(/blomställ|växthylla|växtställ|blomhylla|växttrappa|piedestal|planteringsställ/, 6428, "Home & Garden > Lawn & Garden > Gardening > Plant Stands"),
    R(/odlingslåd|odlingsbädd|pallkrage|planteringslåd|planteringsvagn|odlingskärl|kruka|krukor|planteringskärl/, 721, "Home & Garden > Lawn & Garden > Gardening > Pots & Planters"),
  ],
  "redskapsbodar-forrad": [
    R(/robotgräsklippare|robotklippare/, 4566, "Home & Garden > Lawn & Garden > Outdoor Power Equipment Accessories > Lawn Mower Accessories"),
    R(/dynbox|förvaringsbox|förvaringslåda|förvaringskista|förvaringsbänk/, 7310, "Furniture > Outdoor Furniture > Outdoor Storage Boxes"),
    R(/skåp/, 5938, "Furniture > Cabinets & Storage > Storage Cabinets & Lockers"),
    R(null, 720, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Sheds, Garages & Carports"),
  ],
  garagetalt: [R(null, 720, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Sheds, Garages & Carports")],
  "tradgardsskotsel-bevattning": [
    R(/slangvinda|slangvagn|slangupprullare|slanghållare|slangbox/, 4199, "Hardware > Hardware Accessories > Tool Storage & Organization > Garden Hose Storage"),
    // Sprutan före slangen: "tryckspruta med slang" är en spruta.
    R(/tryckspruta|ryggspruta|spruta/, 1967, "Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Lawn & Garden Sprayers"),
    R(/gödselspridare|spridarvagn|bogserad spridare|spridare för (utsäde|gödsel)/, 3828, "Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Spreaders"),
    R(/trädgårdsslang|vattenslang|spiralslang|slang\b/, 2313, "Home & Garden > Lawn & Garden > Watering & Irrigation > Garden Hoses"),
    R(/vattenspridare|sprinkler/, 7561, "Home & Garden > Lawn & Garden > Watering & Irrigation > Sprinklers & Sprinkler Heads"),
    R(/regntunna|vattentunna|regnvatten/, 6834, "Home & Garden > Lawn & Garden > Gardening > Rain Barrels"),
    R(/vattenkanna/, 6318, "Home & Garden > Lawn & Garden > Watering & Irrigation > Watering Cans"),
    R(/kompost/, 4085, "Home & Garden > Lawn & Garden > Gardening > Composting"),
    R(/skottkärra|trädgårdsvagn|trädgårdskärra|dragvagn/, 3616, "Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Wheelbarrows"),
    R(/räfsa|kratta/, 3388, "Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Rakes"),
    R(/snöskyffel|snöskopa|snöplog|snöskjutare/, 5363, "Home & Garden > Lawn & Garden > Snow Removal > Snow Shovels"),
    R(/spade|skyffel/, 2147, "Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Shovels & Spades"),
    // Häcksaxarna här drivs av batteri: en maskin, inte en handsax.
    R(/häcksax|häcktrimmer/, 3120, "Home & Garden > Lawn & Garden > Outdoor Power Equipment > Hedge Trimmers"),
    R(/grästrimmer/, 1223, "Home & Garden > Lawn & Garden > Outdoor Power Equipment > Weed Trimmers"),
    R(/grensax|sekatör|beskärningssax/, 3841, "Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Pruning Shears"),
    R(/bevattning/, 3568, "Home & Garden > Lawn & Garden > Watering & Irrigation"),
  ],
  "solskydd-paviljonger": [
    // Parasollets tillbehör först: "viktplattor till parasoll", "myggnät till parasoll".
    R(/^(\S+ )?(parasollfot|parasollställ|parasollhållare|parasollvikt|viktplatt)|till (häng)?parasoll/, 6751, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Umbrella & Sunshade Accessories"),
    R(/^(reservduk|reservtak|ersättningstak|paviljongtak|pergolatak|pergolamarkis|tak till|sidoväggar|sidovägg|myggnät|nätväggar)/, 6105, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories"),
    R(/pergola/, 703, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Garden Arches, Trellises, Arbors & Pergolas"),
    R(/paviljong|partytält|eventtält|gazebo/, 716, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos"),
    R(/markis|skärmtak|entrétak/, 499907, "Home & Garden > Lawn & Garden > Outdoor Living > Awnings"),
    R(/parasoll|solsegel/, 719, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Umbrellas & Sunshades"),
  ],
  "tradgardsdekor-belysning": [
    R(/solcellslampa|solcellslykta|solcellsbelysning|trädgårdsbelysning|marklampa|lyktstolpe|pollare/, 7400, "Home & Garden > Lighting > Landscape Pathway Lighting"),
    R(/ljusslinga/, 2608, "Home & Garden > Lighting > Light Ropes & Strings"),
    R(/spaljé|klätterstöd/, 499894, "Home & Garden > Lawn & Garden > Gardening > Plant Cages & Supports"),
    R(/fågelbad/, 697, "Home & Garden > Decor > Bird Baths"),
    R(/fågelholk|fågelhus/, 500078, "Home & Garden > Decor > Bird & Wildlife Houses"),
    R(/fågelmatare|fågelbord/, 6993, "Home & Garden > Decor > Bird & Wildlife Feeders"),
    R(/fontän|springbrunn/, 702, "Home & Garden > Decor > Fountains & Ponds"),
    R(/blomlåda|kruka|krukor/, 721, "Home & Garden > Lawn & Garden > Gardening > Pots & Planters"),
    R(/skulptur|staty|trädgårdsfigur/, 6547, "Home & Garden > Decor > Lawn Ornaments & Garden Sculptures"),
    R(/vindspel/, 714, "Home & Garden > Decor > Wind Chimes"),
    R(/brevlåda/, 706, "Home & Garden > Decor > Mailboxes"),
  ],
  "grill-utekok": [
    R(/grillöverdrag|grillskydd|grillverktyg|grillgaller|eldkorg/, null, BEHALL),
    R(/grillpaviljong/, 716, "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos"),
    R(/grill|smoker|plancha|kamado/, 2985, "Home & Garden > Kitchen & Dining > Kitchen Appliances > Outdoor Grills"),
  ],

  // ── Barn & Familj ─────────────────────────────────────────────────────────
  "leksaker-spel": [
    R(/elbil|elmotorcykel|elfyrhjuling|elgokart|eltraktor|elmoped|elsparkcykel|radiobil|elektrisk (bil|fyrhjuling|motorcykel|gokart|traktor)/, 2753, "Toys & Games > Toys > Riding Toys > Electric Riding Vehicles"),
    R(/sparkcykel/, 5879, "Sporting Goods > Outdoor Recreation > Riding Scooters"),
    R(/sparkbil|gåbil|trampbil|svängbil|wigglebil|trehjuling|springcykel|balanscykel|gokart|att sitta på|sparktraktor|ridleksak/, 2724, "Toys & Games > Toys > Riding Toys > Push & Pedal Riding Vehicles"),
    R(/gunghäst|gungdjur/, 3441, "Toys & Games > Toys > Riding Toys > Rocking & Spring Riding Toys"),
    R(/käpphäst/, 6407, "Toys & Games > Toys > Riding Toys > Hobby Horses"),
    R(/krypmatta|lekmatta|babygym/, 1243, "Baby & Toddler > Baby Toys & Activity Equipment > Play Mats & Gyms"),
    R(/bordsfotboll|fotbollsspel/, 3847, "Sporting Goods > Indoor Games > Foosball > Foosball Tables"),
    R(/^gåvagn/, 1241, "Baby & Toddler > Baby Toys & Activity Equipment > Baby Walkers & Entertainers"),
    // Skumklossarna före tunneln och rutschkanan som de bygger.
    R(SKUMKLOSSAR, 3172, "Toys & Games > Toys > Building Toys > Foam Blocks"),
    R(/^(kantskydd|skyddsnät|reservnät)/, 5524, "Toys & Games > Outdoor Play Equipment > Trampoline Accessories"),
    R(/vattenrutschkana|vattenbord|vattenlek/, 6464, "Toys & Games > Outdoor Play Equipment > Water Play Equipment"),
    // Hoppborgen före rutschkanan: "hoppborg med rutschkana" är en hoppborg.
    R(/hoppborg/, 6396, "Toys & Games > Outdoor Play Equipment > Inflatable Bouncers"),
    R(/rutschkana/, 2867, "Toys & Games > Outdoor Play Equipment > Slides"),
    R(/studsmatta/, 1738, "Toys & Games > Outdoor Play Equipment > Trampolines"),
    R(/sandlåda/, 2743, "Toys & Games > Outdoor Play Equipment > Sandboxes"),
    R(/lekstuga|lekhus/, 1251, "Toys & Games > Outdoor Play Equipment > Playhouses"),
    R(/gungställning|lekställning|klätterställning|klätterkupol|klättertorn/, 6271, "Toys & Games > Outdoor Play Equipment > Swing Sets & Playsets"),
    R(/gungbräda|vippgunga/, 6450, "Toys & Games > Outdoor Play Equipment > See Saws"),
    R(/gunga|gungor/, 6270, "Toys & Games > Outdoor Play Equipment > Play Swings"),
    R(/lektält|tunnel/, 6397, "Toys & Games > Outdoor Play Equipment > Play Tents & Tunnels"),
    R(/lekkök|leksakskök|barnkök/, 543622, "Toys & Games > Toys > Pretend Play > Toy Kitchens & Play Food > Toy Kitchens"),
    R(/dockhus/, 2499, "Toys & Games > Toys > Dolls, Playsets & Toy Figures > Dollhouses"),
    R(/dockvagn/, 3584, "Toys & Games > Toys > Dolls, Playsets & Toy Figures > Doll & Action Figure Accessories"),
    // Kundvagnen före dockan som ligger i den.
    R(/kundvagn/, 8295, "Toys & Games > Toys > Pretend Play > Pretend Shopping & Grocery"),
    R(/docka|dockor/, 1257, "Toys & Games > Toys > Dolls, Playsets & Toy Figures > Dolls"),
    R(/verktygsbänk|arbetsbänk|leksaksverktyg/, 3751, "Toys & Games > Toys > Pretend Play > Toy Tools"),
    R(/kulbana/, 3163, "Toys & Games > Toys > Building Toys > Marble Track Sets"),
    R(/klossar/, 3617, "Toys & Games > Toys > Building Toys > Wooden Blocks"),
    R(/byggsats|byggset|konstruktionsset/, 1254, "Toys & Games > Toys > Building Toys"),
    R(/träpussel|pusselbräda/, 6725, "Toys & Games > Puzzles > Wooden & Pegged Puzzles"),
    R(/pussel/, 2618, "Toys & Games > Puzzles > Jigsaw Puzzles"),
    R(/fjärrstyrd|radiostyrd|rc-bil|drönare/, 2546, "Toys & Games > Toys > Remote Control Toys"),
    R(/tågbana|tågset/, 5152, "Toys & Games > Toys > Play Vehicles > Toy Trains & Train Sets"),
    R(/bilbana|racerbana/, 3474, "Toys & Games > Toys > Play Vehicles > Toy Race Car & Track Sets"),
    R(/mjukisdjur|gosedjur|nalle/, 1259, "Toys & Games > Toys > Dolls, Playsets & Toy Figures > Stuffed Animals"),
    R(/xylofon|leksaksinstrument|barnpiano|leksakspiano/, 3252, "Toys & Games > Toys > Musical Toys > Toy Instruments"),
  ],
  "elbilar-for-barn": [
    R(/trampbil|pedalbil|gåbil|sparkbil/, 2724, "Toys & Games > Toys > Riding Toys > Push & Pedal Riding Vehicles"),
    R(null, 2753, "Toys & Games > Toys > Riding Toys > Electric Riding Vehicles"),
  ],
  "gunghastar-gungdjur": [
    // En häst på hjul gungar inte: den är en åkleksak.
    R(/på (fyra )?hjul|med pedaler|åkhäst|ridhäst/, 2724, "Toys & Games > Toys > Riding Toys > Push & Pedal Riding Vehicles"),
    R(null, 3441, "Toys & Games > Toys > Riding Toys > Rocking & Spring Riding Toys"),
  ],
  "sparkcyklar-for-barn": [R(null, 5879, "Sporting Goods > Outdoor Recreation > Riding Scooters")],
  leksakskok: [R(null, 543622, "Toys & Games > Toys > Pretend Play > Toy Kitchens & Play Food > Toy Kitchens")],
  sandlador: [
    R(/vattenbord|vattenlek/, 6464, "Toys & Games > Outdoor Play Equipment > Water Play Equipment"),
    R(/sensorisk|aktivitetsbord|lekbord/, 6351, "Furniture > Tables > Activity Tables"),
    R(null, 2743, "Toys & Games > Outdoor Play Equipment > Sandboxes"),
  ],
  "utelek-spel": [
    R(/^(kantskydd|skyddsnät|reservnät)/, 5524, "Toys & Games > Outdoor Play Equipment > Trampoline Accessories"),
    R(/vattenrutschkana|vattenbord|vattenlek|plaskdamm/, 6464, "Toys & Games > Outdoor Play Equipment > Water Play Equipment"),
    R(/hoppborg/, 6396, "Toys & Games > Outdoor Play Equipment > Inflatable Bouncers"),
    R(/rutschkana/, 2867, "Toys & Games > Outdoor Play Equipment > Slides"),
    R(/studsmatta|trampolin/, 1738, "Toys & Games > Outdoor Play Equipment > Trampolines"),
    R(/sandlåda/, 2743, "Toys & Games > Outdoor Play Equipment > Sandboxes"),
    R(/lekstuga|lekhus/, 1251, "Toys & Games > Outdoor Play Equipment > Playhouses"),
    R(/gungställning|lekställning|klätterställning|klätterkupol|klättertorn/, 6271, "Toys & Games > Outdoor Play Equipment > Swing Sets & Playsets"),
    R(/gungbräda|vippgunga/, 6450, "Toys & Games > Outdoor Play Equipment > See Saws"),
    R(/gunga|gungor|gungsits/, 6270, "Toys & Games > Outdoor Play Equipment > Play Swings"),
    R(/lektält|tunnel/, 6397, "Toys & Games > Outdoor Play Equipment > Play Tents & Tunnels"),
    R(/driftkart|elgokart/, 2753, "Toys & Games > Toys > Riding Toys > Electric Riding Vehicles"),
    R(/balanscykel|springcykel|trehjuling|gokart|hjullastare/, 2724, "Toys & Games > Toys > Riding Toys > Push & Pedal Riding Vehicles"),
    R(/lekkök|mudkök/, 543622, "Toys & Games > Toys > Pretend Play > Toy Kitchens & Play Food > Toy Kitchens"),
    R(/basketkorg|basketställning/, 3552, "Toys & Games > Toys > Sports Toys > Basketball Toys"),
    // Saknade kategori helt (varning 157). Grundare än tre nivåer, men rätt gren.
    R(null, 1249, "Toys & Games > Outdoor Play Equipment"),
  ],
  "baby-smabarn": [
    R(/barnvagn|sittvagn|sulky|syskonvagn|joggingvagn/, 568, "Baby & Toddler > Baby Transport > Baby Strollers"),
    R(/lekhage|babyhage|lekgrind/, 539, "Baby & Toddler > Baby Toys & Activity Equipment > Play Yards"),
    R(/babygrind|säkerhetsgrind|trappgrind|grind/, 542, "Baby & Toddler > Baby Safety > Baby & Pet Gates"),
    R(/babysitter|vippstol/, 555, "Baby & Toddler > Baby Toys & Activity Equipment > Baby Bouncers & Rockers"),
    R(/babygunga/, 560, "Baby & Toddler > Baby Toys & Activity Equipment > Baby Jumpers & Swings"),
    R(/gåstol|gåvagn/, 1241, "Baby & Toddler > Baby Toys & Activity Equipment > Baby Walkers & Entertainers"),
    R(/babygym|krypmatta|lekmatta/, 1243, "Baby & Toddler > Baby Toys & Activity Equipment > Play Mats & Gyms"),
    R(/babybadkar|badbalja|badsits/, 4679, "Baby & Toddler > Baby Bathing > Baby Bathtubs & Bath Seats"),
    R(/spjälsäng|babysäng|resesäng/, 6394, "Furniture > Baby & Toddler Furniture > Cribs & Toddler Beds"),
    R(/skötbord/, 558, "Furniture > Baby & Toddler Furniture > Changing Tables"),
    R(/matstol|barnstol|babystol/, 559, "Furniture > Baby & Toddler Furniture > High Chairs & Booster Seats"),
    R(/trehjuling|springcykel|balanscykel|sparkbil|gåbil|att sitta på/, 2724, "Toys & Games > Toys > Riding Toys > Push & Pedal Riding Vehicles"),
    // Klättersetet i skum före rutschkanan: "mjukt klätterset med rutschkana" är skumklossar.
    R(SKUMKLOSSAR, 3172, "Toys & Games > Toys > Building Toys > Foam Blocks"),
    R(/rutschkana/, 2867, "Toys & Games > Outdoor Play Equipment > Slides"),
    R(/basketkorg/, 3552, "Toys & Games > Toys > Sports Toys > Basketball Toys"),
  ],
  barnmobler: [
    R(/sminkbord/, 6360, "Furniture > Cabinets & Storage > Vanities > Bedroom Vanities"),
    R(/skrivbord/, 4191, "Furniture > Office Furniture > Desks"),
    R(/skötbord/, 558, "Furniture > Baby & Toddler Furniture > Changing Tables"),
    R(/nattduksbord/, 462, "Furniture > Tables > Nightstands"),
    R(/matstol/, 559, "Furniture > Baby & Toddler Furniture > High Chairs & Booster Seats"),
    R(/säng/, 6394, "Furniture > Baby & Toddler Furniture > Cribs & Toddler Beds"),
    R(/sittgrupp|bord (med|och) (två |tre |fyra )?(stol|stolar|pallar)|(stol|stolar|pallar) och (ett |runt |rund )?bord|med stol|med stolar/, 6349, "Furniture > Baby & Toddler Furniture > Baby & Toddler Furniture Sets"),
    R(/leksakslåda|leksakskista/, 4268, "Furniture > Cabinets & Storage > Storage Chests > Toy Chests"),
    R(/hylla|hyllor/, 465, "Furniture > Shelving > Bookcases & Standing Shelves"),
    R(/fåtölj|soffa/, 6499, "Furniture > Chairs > Arm Chairs, Recliners & Sleeper Chairs"),
    R(/bord/, 6351, "Furniture > Tables > Activity Tables"),
  ],

  // ── Husdjur ───────────────────────────────────────────────────────────────
  klostrad: [R(null, 4997, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Furniture")],
  katthus: [
    R(/kattbädd|väggbädd|husdjursbädd|kattkorg|katthåla|kattbo\b|kattgrotta i plysch|tipitält/, 4433, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Beds"),
    R(/husdjurstrappa/, 6973, "Animals & Pet Supplies > Pet Supplies > Pet Steps & Ramps"),
    R(/kattbur/, 5087, "Animals & Pet Supplies > Pet Supplies > Pet Playpens"),
    R(null, 4997, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Furniture"),
  ],
  kattlador: [R(null, 5000, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Litter Boxes")],
  "hundbaddar-hundsoffor": [
    R(/kattbädd|kattsäng/, 4433, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Beds"),
    R(null, 4434, "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Beds"),
  ],
  hundkojor: [R(null, 5094, "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Houses")],
  hundburar: [
    R(/hundgård|rastgård/, 7274, "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Kennels & Runs"),
    R(null, 6251, "Animals & Pet Supplies > Pet Supplies > Pet Carriers & Crates"),
  ],
  "mat-vattenskalar": [
    // Utfodring för grisar, får och getter är lantbruk, inte husdjur.
    R(/grisar|för får|getter|nötkreatur|kalvar|höns/, 6990, "Business & Industrial > Agriculture > Animal Husbandry > Livestock Feeders & Waterers"),
    R(/foderbehållare|matbehållare/, 5162, "Animals & Pet Supplies > Pet Supplies > Pet Food Containers"),
    R(null, 6252, "Animals & Pet Supplies > Pet Supplies > Pet Bowls, Feeders & Waterers"),
  ],
  "palsvard-skotsel": [
    // Kliborsten för kor och klippbordet för får är inte husdjursvård.
    R(/nötkreatur|för får|hästar/, null, BEHALL),
    R(null, 6383, "Animals & Pet Supplies > Pet Supplies > Pet Grooming Supplies"),
  ],
  "selar-koppel-transport": [
    R(/hundgaller|bilgrind|lastgaller/, 8474, "Animals & Pet Supplies > Pet Supplies > Vehicle Pet Barriers"),
    R(/hundvagn|husdjursvagn|kattvagn/, 6276, "Animals & Pet Supplies > Pet Supplies > Pet Strollers"),
    R(/cykelkärra|cykelvagn/, 3811, "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Trailers"),
    R(/sele|selar|halsband/, 6250, "Animals & Pet Supplies > Pet Supplies > Pet Collars & Harnesses"),
    R(/koppel/, 6249, "Animals & Pet Supplies > Pet Supplies > Pet Leashes"),
    R(/transportbur|transportväska|transportbox|bärväska|bur\b/, 6251, "Animals & Pet Supplies > Pet Supplies > Pet Carriers & Crates"),
  ],
  "lek-tillbehor-for-husdjur": [
    R(/agility|hinder|slalom|hundvippa|hundbro/, 6983, "Animals & Pet Supplies > Pet Supplies > Pet Agility Equipment"),
    R(/trappa|ramp/, 6973, "Animals & Pet Supplies > Pet Supplies > Pet Steps & Ramps"),
    // Katthjulet är en leksak trots klösmattan. Tunneln av trä och trådnät är
    // en kattgård, som samma vara i Katthus.
    R(/katthjul/, 5001, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Toys"),
    R(/trådnät|kattgård/, 4997, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Furniture"),
    R(/klösbräda|klösmatta|klöspelare|klösstolp|klöstunna/, 4997, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Furniture"),
    R(/kattunnel|kattleksak/, 5001, "Animals & Pet Supplies > Pet Supplies > Cat Supplies > Cat Toys"),
    R(/hundleksak|bollkastare/, 5010, "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Toys"),
  ],

  // ── Sport & Fritid ────────────────────────────────────────────────────────
  "traning-gym": [
    R(/leggings|tights|sport-bh|träningstopp|shorts|t-shirt|tröja|jacka/, null, BEHALL),
    R(/löpband|gåband/, 997, "Sporting Goods > Exercise & Fitness > Cardio > Cardio Machines > Treadmills"),
    R(/roddmaskin/, 995, "Sporting Goods > Exercise & Fitness > Cardio > Cardio Machines > Rowing Machines"),
    R(/crosstrainer|elliptisk/, 992, "Sporting Goods > Exercise & Fitness > Cardio > Cardio Machines > Elliptical Trainers"),
    R(/motionscykel|spinningcykel|träningscykel/, 994, "Sporting Goods > Exercise & Fitness > Cardio > Cardio Machines > Exercise Bikes"),
    R(/stepbräda|aerobicstepper|aerobicstep/, 237166, "Sporting Goods > Exercise & Fitness > Aerobic Steps"),
    R(/stepper|trappmaskin/, 996, "Sporting Goods > Exercise & Fitness > Cardio > Cardio Machines > Stair Climbers & Steppers"),
    // Maskinerna före banden: bandet som följer med gör dem inte till träningsband.
    R(/vibrationsplatta|vibrationsmaskin/, 8066, "Sporting Goods > Exercise & Fitness > Vibration Exercise Machines"),
    R(/pilates(?!boll|matta)|reformer|ryggradskorrigerare/, 3810, "Sporting Goods > Exercise & Fitness > Yoga & Pilates > Pilates Machines"),
    R(/hula hoop|hulahoop/, 3215, "Toys & Games > Toys > Sports Toys > Fitness Toys > Hula Hoops"),
    R(/boxsäckshållare|boxsäcksställ|fäste för boxsäck/, 7129, "Sporting Goods > Athletics > Boxing & Martial Arts > Boxing & Martial Arts Training Equipment > Punching & Training Bag Accessories"),
    R(/boxningsmaskin/, 499720, "Sporting Goods > Athletics > Boxing & Martial Arts > Boxing & Martial Arts Training Equipment"),
    R(/power tower|dipsstation|chins- och dips/, 499912, "Sporting Goods > Exercise & Fitness > Power Towers"),
    R(/chinsstång|chinsräcke|pull[- ]?up|armhävningsstöd|armhävningshandtag|armhävningsbräda/, 8215, "Sporting Goods > Exercise & Fitness > Push Up & Pull Up Bars"),
    R(/hantelställ|viktställ|skivställ|viktskivestativ|viktskiveställ/, 8083, "Sporting Goods > Exercise & Fitness > Weight Lifting > Free Weight Accessories > Free Weight Storage Racks"),
    R(/benpress|multigym|kabelmaskin|smithmaskin|knäböjsställ|squatställ|squat rack|power rack|skivstångsställ/, 3542, "Sporting Goods > Exercise & Fitness > Weight Lifting > Weight Lifting Machines & Racks"),
    R(/inversion/, 355576, "Sporting Goods > Exercise & Fitness > Inversion Tables & Systems"),
    R(/träningsbänk|viktbänk|magbänk|bänk/, 499795, "Sporting Goods > Exercise & Fitness > Exercise Benches"),
    R(/hantel|hantlar|kettlebell|viktskiv/, 3164, "Sporting Goods > Exercise & Fitness > Weight Lifting > Free Weights"),
    R(/skivstång/, 3271, "Sporting Goods > Exercise & Fitness > Weight Lifting > Free Weight Accessories > Weight Bars"),
    R(/yogamatta/, 3640, "Sporting Goods > Exercise & Fitness > Yoga & Pilates > Yoga & Pilates Mats"),
    R(/träningsmatta|gymmatta|pusselmatta|gymgolv|pusselplattor/, 4669, "Sporting Goods > Exercise & Fitness > Exercise Equipment Mats"),
    R(/balansbräda|balanskudde|balansboll/, 499796, "Sporting Goods > Exercise & Fitness > Balance Trainers"),
    R(/gymboll|pilatesboll|träningsboll/, 993, "Sporting Goods > Exercise & Fitness > Exercise Balls"),
    R(/träningsband|motståndsband|gummiband|powerband/, 5869, "Sporting Goods > Exercise & Fitness > Exercise Bands"),
    R(/hopprep/, 2614, "Sporting Goods > Exercise & Fitness > Cardio > Jump Ropes"),
    R(/viktväst/, 6103, "Sporting Goods > Exercise & Fitness > Weighted Clothing"),
    R(/magrulle|ab-?hjul/, 499797, "Sporting Goods > Exercise & Fitness > Ab Wheels & Rollers"),
    R(/boxningssäck|slagsäck/, 3297, "Sporting Goods > Athletics > Boxing & Martial Arts > Boxing & Martial Arts Training Equipment > Punching & Training Bags"),
  ],
  "friluftsliv-resa": [
    R(/duschtält|omklädningstält|toalettält/, 502994, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Portable Toilets & Showers > Portable Showers & Privacy Enclosures"),
    R(/campingtoalett|resetoalett/, 503009, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Portable Toilets & Showers > Portable Toilets & Urination Devices"),
    R(/vindskydd/, 8079, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Windbreaks"),
    R(/tältpinn|tältstång/, 5658, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Tent Accessories > Tent Poles & Stakes"),
    R(/tält/, 1022, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Tents"),
    R(/fältsäng|campingsäng/, 3089, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Camp Furniture > Cots"),
    R(/luftmadrass/, 3695, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Camp Furniture > Air Mattresses"),
    R(/liggunderlag|sovunderlag|självuppblåsande/, 1021, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Sleeping Pads"),
    R(/sovsäck/, 1020, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Sleeping Bags"),
    // Campingköket är ett skåp med bänk, en möbel: köksredskapen är stormkök och kokkärl.
    R(/campingstol|campingbord|campingkök|stol(?!pe)|bord/, 1014, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Camp Furniture"),
    R(/lykta|pannlampa|campinglampa/, 1019, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Camping Lights & Lanterns"),
    R(/stormkök|gasolkök|kokkärl/, 1016, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Camping Cookware & Dinnerware"),
    R(/vandringsstav|vandringsstavar/, 3738, "Sporting Goods > Outdoor Recreation > Camping & Hiking > Hiking Poles"),
    R(/kylbox|kylväska/, 1017, "Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Coolers"),
    R(/kajakställ|kanotställ/, 8172, "Sporting Goods > Outdoor Recreation > Boating & Water Sports > Watercraft Storage Racks > Boat Storage Racks"),
  ],
  "bil-cykel": [
    R(/handskar|byxor|tröja|jacka|cykelkläder|keps/, null, BEHALL),
    R(/cykelkärra|cykelvagn|cykelsläp/, 3811, "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Trailers"),
    R(/cykelställ|cykelhållare|cykelstativ|reparationsställ|cykelförvaring/, 3428, "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Stands & Storage"),
  ],
  bollsport: [
    R(/volleybollträning|volleybolltränare/, 499787, "Sporting Goods > Athletics > Volleyball > Volleyball Training Aids"),
    R(/^bollretur för basket/, 499751, "Sporting Goods > Athletics > Basketball > Basketball Training Aids"),
    // Rebounder och bollretur för fotboll: taxonomin saknar en egen nod, och
    // "fotboll" i namnet gör dem inte till bollar.
    R(/rebounder|bollretur|studsnät/, null, BEHALL),
    R(/basketställning|basketkorg|basketställ/, 1082, "Sporting Goods > Athletics > Basketball > Basketball Hoops"),
    R(/basketboll/, 1083, "Sporting Goods > Athletics > Basketball > Basketballs"),
    R(/fotbollsmål|målbur/, 1113, "Sporting Goods > Athletics > Soccer > Soccer Goals"),
    // Bara när namnet börjar med bollen: "returnät för fotboll" är ingen boll.
    R(/^fotboll(ar)?\b/, 1112, "Sporting Goods > Athletics > Soccer > Soccer Balls"),
    R(/volleyboll/, 1117, "Sporting Goods > Athletics > Volleyball > Volleyball Nets"),
  ],
  "spel-bordsspel": [
    // Ett spelbord har flera spel, vilket som än nämns först.
    R(/spelbord|multispel|\d+[ -]i[ -]1/, 7010, "Sporting Goods > Indoor Games > Multi-Game Tables"),
    R(/pokerset|pokermarker|marker/, 5403, "Toys & Games > Games > Poker Chips & Sets"),
    R(/darttavla|dartspel/, 3559, "Sporting Goods > Indoor Games > Throwing Darts > Dartboards"),
    R(/bordsfotboll|fotbollsspel/, 3847, "Sporting Goods > Indoor Games > Foosball > Foosball Tables"),
    R(/biljard/, 3139, "Sporting Goods > Indoor Games > Billiards > Billiard Tables"),
    R(/airhockey|air hockey/, 3245, "Sporting Goods > Indoor Games > Air Hockey > Air Hockey Tables"),
    R(/bordtennisrack|pingisrack/, 3375, "Sporting Goods > Indoor Games > Ping Pong > Ping Pong Paddles & Sets"),
    R(/bordtennis|pingis/, 3345, "Sporting Goods > Indoor Games > Ping Pong > Ping Pong Tables"),
    R(/kortlek|kortspel/, 1247, "Toys & Games > Games > Card Games"),
    R(/lotteritrumma|bingo/, 3749, "Toys & Games > Games > Bingo Sets"),
  ],
  "hobby-musik": [
    // Tillbehören först, och bara först i namnet: "gitarr med gigbag" är en
    // gitarr, men "gitarrstativ", "gitarrfodral" och "pianobänk" är det inte.
    R(/^(hopfällbart? |justerbart? )?gitarrstativ/, 3646, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > String Instrument Accessories > Guitar Accessories > Guitar Stands"),
    R(/^(hårt |mjukt )?(bas)?gitarrfodral/, 3882, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > String Instrument Accessories > Guitar Accessories > Guitar Cases & Gig Bags"),
    R(/^(violin|viola|cello|fiol)fodral/, 503039, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > String Instrument Accessories > Orchestral String Instrument Accessories > Orchestral String Instrument Cases"),
    R(/^(piano|keyboard)(bänk|pall)/, 505328, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > Music Benches & Stools"),
    R(/^keyboard(väska|fodral)/, 7357, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > Musical Keyboard Accessories > Musical Keyboard Bags & Cases"),
    R(/^trumväsk|^väska .*trum/, 7100, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instrument & Orchestra Accessories > Percussion Accessories > Cymbal & Drum Cases"),
    R(/^(\S+ )?sprutbox/, 6887, "Hardware > Tool Accessories > Paint Tool Accessories > Airbrush Accessories"),
    // Cajonen före gitarren: den har gitarrsträngar men är en trumma.
    R(/cajon/, 7297, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Percussion > Hand Percussion > Hand Drums > Cajons"),
    R(/handpan|tungtrumma/, 7285, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Percussion > Hand Percussion"),
    R(/trumset/, 2518, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Percussion > Drum Kits"),
    R(/cymbal/, 3043, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Percussion > Cymbals"),
    R(/xylofon|klockspel|metallofon/, 7431, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Percussion > Glockenspiels & Xylophones"),
    R(/saxofon/, 91, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Woodwinds > Saxophones"),
    R(/^(violin|fiol)\b/, 86, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > String Instruments > Violins"),
    R(/digitalpiano|elpiano|piano/, 76, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Pianos"),
    R(/keyboard/, 74, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Electronic Musical Instruments > Musical Keyboards"),
    R(/gitarr/, 80, "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > String Instruments > Guitars"),
    R(/teleskop/, 165, "Cameras & Optics > Optics > Scopes > Telescopes"),
    R(/skräddardocka|provdocka/, 6150, "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Tools > Dress Forms"),
    R(/airbrush/, 2486, "Hardware > Tools > Paint Tools > Airbrushes"),
  ],

  // ── Verktyg & Maskiner ────────────────────────────────────────────────────
  "verktyg-hemmafix": [
    R(/verktygsväska|verktygsbag/, 6876, "Hardware > Hardware Accessories > Tool Storage & Organization > Tool Bags"),
    R(/verktygsvagn|verktygsskåp|verktygskista/, 3280, "Hardware > Hardware Accessories > Tool Storage & Organization > Tool Cabinets & Chests"),
    R(/verktygslåda/, 3980, "Hardware > Hardware Accessories > Tool Storage & Organization > Tool Boxes"),
    R(/arbetsbänk|hobbybänk|verkstadsbänk|snickarbänk/, 3919, "Hardware > Hardware Accessories > Tool Storage & Organization > Work Benches"),
    R(/verktygssats|verktygsset|mekanikersats|bitsats|bitssats/, 4919, "Hardware > Tools > Tool Sets"),
    R(/hylshållare|verktygshållare|verktygstavla|verktygsvägg/, 3974, "Hardware > Hardware Accessories > Tool Storage & Organization"),
    R(/hylsnyckelsats|hylssats/, 1195, "Hardware > Tools > Socket Drivers"),
    R(/trappstege|stege|arbetsplattform/, 130, "Hardware > Tools > Ladders & Scaffolding"),
    R(/ledstång|trappräcke/, 499949, "Hardware > Building Materials > Handrails & Railing Systems"),
    R(/säckkärra|sackkärra|plattformsvagn|transportvagn|flyttvagn/, 126, "Hardware > Tools > Dollies & Hand Trucks"),
    R(/domkraft/, 503771, "Business & Industrial > Material Handling > Lifts & Hoists > Jacks & Lift Trucks"),
    R(/vinsch/, 503772, "Business & Industrial > Material Handling > Lifts & Hoists > Winches"),
    R(/bordsben|hairpin/, 6911, "Furniture > Table Accessories > Table Legs"),
    // Bara först i namnet: "kabelskalare för borrmaskin" är ett tillbehör.
    R(/^(\S+ )?(skruvdragare|borrmaskin|slagborr|borrhammare)/, 1217, "Hardware > Tools > Drills"),
    R(/tving|f-klämm|skruvstycke/, 2835, "Hardware > Tools > Tool Clamps & Vises"),
    R(/hammare|slägga/, 1186, "Hardware > Tools > Hammers"),
    R(TANGER, 1958, "Hardware > Tools > Pliers"),
    R(/skiftnyckel|blocknyckel|ringnyckel|momentnyckel|spärrnyckel|nyckelsats|rörtång/, 1632, "Hardware > Tools > Wrenches"),
    R(/skruvmejsel/, 1203, "Hardware > Tools > Screwdrivers"),
    R(/vattenpass|måttband|avståndsmätare/, 1305, "Hardware > Tools > Measuring Tools & Sensors"),
    R(/pannlampa|ficklampa/, 338, "Hardware > Tools > Flashlights & Headlamps"),
    R(/arbetslampa|arbetsbelysning/, 5592, "Hardware > Tools > Work Lights"),
  ],
  handverktyg: [
    // Lyfttänger och avdragare har ingen egen nod. Avdragarsatsens glidhammare
    // gör den inte till en hammare.
    R(/lyfttång|avdragar/, null, BEHALL),
    R(/f-klämm|tving|klämmor|skruvstycke/, 2835, "Hardware > Tools > Tool Clamps & Vises"),
    R(/gängsats|gängtapp|gängsnitt|gängreparation/, 1184, "Hardware > Tools > Taps & Dies"),
    R(/mätstång|nivelleringsstång|avvägningsstång|vattenpass|måttband|tumstock|skjutmått|vinkelhake/, 1305, "Hardware > Tools > Measuring Tools & Sensors"),
    R(/bockare|bockmaskin/, 1667, "Hardware > Tools > Pipe & Bar Benders"),
    R(/rörskärare/, 2080, "Hardware > Tools > Cutters > Pipe Cutters"),
    // Hylsnyckelsatsen före nycklarna: spärrnyckeln i satsen gör den inte till en nyckel.
    R(/hylsnyckel|hylssats|hylsor/, 1195, "Hardware > Tools > Socket Drivers"),
    R(/spärrnyckel|skiftnyckel|blocknyckel|ringnyckel|momentnyckel|insexnyckel|nyckelsats|rörtång/, 1632, "Hardware > Tools > Wrenches"),
    R(TANGER, 1958, "Hardware > Tools > Pliers"),
    R(/hammare|slägga/, 1186, "Hardware > Tools > Hammers"),
    R(/skruvmejsel/, 1203, "Hardware > Tools > Screwdrivers"),
    R(/kniv/, 2198, "Hardware > Tools > Tool Knives"),
    R(/verktygssats|verktygsset|mekanikersats/, 4919, "Hardware > Tools > Tool Sets"),
  ],
  verkstadsmaskiner: [
    // Tillbehör till maskinerna (chuck, spännhylsor, borrbord) är inte maskinerna.
    R(/^\S*(chuck|spännhylssats|spännhylsor|borrbord|kryssbord|fräsbord|delningshuvud)|^roterande bord/, null, BEHALL),
    R(/svarv/, 1663, "Hardware > Tools > Lathes"),
    R(/fräs/, 5077, "Hardware > Tools > Milling Machines"),
    R(/pelarborr|bänkborr|borrpress/, 1216, "Hardware > Tools > Drills > Drill Presses"),
    R(/borrmaskin/, 1217, "Hardware > Tools > Drills"),
    R(/såg\b|bandsåg|kapsåg|cirkelsåg|bordsåg/, 1235, "Hardware > Tools > Saws"),
    R(/bandslip|planslip|excenterslip/, 1188, "Hardware > Tools > Sanders"),
    R(/bänkslip|slipmaskin/, 1219, "Hardware > Tools > Grinders"),
    R(/rörbockare|bockmaskin/, 1667, "Hardware > Tools > Pipe & Bar Benders"),
    R(/blästerskåp|bläster/, 6938, "Hardware > Tools > Abrasive Blasters"),
    R(/kompressor/, 2015, "Hardware > Tools > Compressors"),
  ],
  "kompressorer-tryckluft": [R(/kompressor/, 2015, "Hardware > Tools > Compressors")],
  svetsning: [
    R(/svetshjälm|svetsmask|svetshandsk/, null, BEHALL),
    R(/svetsbord/, 3919, "Hardware > Hardware Accessories > Tool Storage & Organization > Work Benches"),
    R(/svets|plasmaskär/, 1238, "Hardware > Tools > Welding Guns & Plasma Cutters"),
  ],
  elverktyg: [
    R(/nibbler/, 1454, "Hardware > Tools > Cutters > Handheld Metal Shears & Nibblers"),
    R(/mutterdragare|slagskruvdragare/, 1221, "Hardware > Tools > Impact Wrenches & Drivers"),
    R(/skruvdragare|borrmaskin|borrhammare/, 1217, "Hardware > Tools > Drills"),
    R(/excenterslip|planslip|bandslip/, 1188, "Hardware > Tools > Sanders"),
    R(/vinkelslip|slipmaskin/, 1219, "Hardware > Tools > Grinders"),
    R(/såg\b|sågar|cirkelsåg|sticksåg|tigersåg/, 1235, "Hardware > Tools > Saws"),
    R(/multiverktyg|oscillerande/, 5587, "Hardware > Tools > Multifunction Power Tools"),
    R(/värmepistol|varmluftspistol/, 1220, "Hardware > Tools > Heat Guns"),
  ],
  "lyft-transport": [
    R(/säckkärra|sackkärra|handkärra|handtruck|transportvagn|plattformsvagn|flyttvagn|möbelhund|möbeldolly|möbelflyttare|panelvagn|trappvagn|fatvagn|stolsvagn/, 126, "Hardware > Tools > Dollies & Hand Trucks"),
    R(/lyftbord/, 131, "Business & Industrial > Material Handling > Lifts & Hoists"),
    // Viltlyften har en handvinsch men är en lyft.
    R(/viltlyft|talja|telfer|motorlyft/, 503768, "Business & Industrial > Material Handling > Lifts & Hoists > Hoists, Cranes & Trolleys"),
    R(/domkraft/, 503771, "Business & Industrial > Material Handling > Lifts & Hoists > Jacks & Lift Trucks"),
    R(/vinsch/, 503772, "Business & Industrial > Material Handling > Lifts & Hoists > Winches"),
  ],

  // ── Bil & Garage ──────────────────────────────────────────────────────────
  "bil-slap": [
    // Lådan före släpet: "verktygslåda för släpvagn" är en låda.
    R(/flaklåda|flakbox|verktygslåda/, 8378, "Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Storage & Cargo > Truck Bed Storage Boxes & Organizers"),
    R(/släpvagn|släpkärra/, 4027, "Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Storage & Cargo > Motor Vehicle Trailers"),
    R(/cykelhållare|lasthållare|takräcke/, 3472, "Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Storage & Cargo > Motor Vehicle Carrying Racks"),
    R(/lastramp|ramper/, 8147, "Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Storage & Cargo > Motor Vehicle Loading Ramps"),
    R(/lastnät/, 6744, "Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Storage & Cargo > Motor Vehicle Cargo Nets"),
  ],
  garageinredning: [
    R(/verktygsskåp|verktygsvagn/, 3280, "Hardware > Hardware Accessories > Tool Storage & Organization > Tool Cabinets & Chests"),
    R(/arbetsbänk/, 3919, "Hardware > Hardware Accessories > Tool Storage & Organization > Work Benches"),
    R(/cykelhållare|cykelställ|cykelupphängning|cykellyft/, 3428, "Sporting Goods > Outdoor Recreation > Cycling > Bicycle Accessories > Bicycle Stands & Storage"),
    R(/skåp/, 5938, "Furniture > Cabinets & Storage > Storage Cabinets & Lockers"),
    R(/hyllställ|lagerhylla|hylla|hyllor/, 465, "Furniture > Shelving > Bookcases & Standing Shelves"),
  ],

  // ── Kök & Husgeråd ────────────────────────────────────────────────────────
  "vinstall-vinkylar": [
    R(/vinkyl/, 4539, "Home & Garden > Kitchen & Dining > Kitchen Appliances > Wine Fridges"),
    R(/vinskåp|barskåp/, 6357, "Furniture > Cabinets & Storage > Wine & Liquor Cabinets"),
    R(/vinställ|vinhylla|vinrack/, 5578, "Furniture > Cabinets & Storage > Wine Racks"),
  ],
  "matforvaring-koksorganisering": [
    R(/brödlåda|brödburk/, 3337, "Home & Garden > Kitchen & Dining > Food Storage > Bread Boxes & Bags"),
    R(/förvaringsburk|burk|matlåda|förvaringsbox/, 667, "Home & Garden > Kitchen & Dining > Food Storage > Food Storage Containers"),
  ],

  // ── Skönhet & Hälsa ───────────────────────────────────────────────────────
  "massage-aterhamtning": [
    // Fåtöljerna och schäslongerna här har massage: de är massagestolar.
    R(/massagestol|massagefåtölj|massageschäslong|reclinerfåtölj|uppresningsfåtölj|relaxfåtölj|kontorsstol/, 1442, "Health & Beauty > Personal Care > Massage & Relaxation > Massage Chairs"),
    R(/massagebänk|massagebord|massagesäng/, 2074, "Health & Beauty > Personal Care > Massage & Relaxation > Massage Tables"),
    R(/massagedyna|massagekudde|massagesits/, 543595, "Health & Beauty > Personal Care > Massage & Relaxation > Massagers > Massage Cushions"),
    R(/massagepistol|massageapparat|fotmassage|vadmassage|benmassager|luftkompression/, 543596, "Health & Beauty > Personal Care > Massage & Relaxation > Massagers > Electric Massagers"),
    R(null, 5663, "Health & Beauty > Personal Care > Massage & Relaxation"),
  ],
};

/** Namnets huvud: det som står före första tankstrecket eller bindestrecket med mellanslag. */
function huvud(text: string): string {
  return text.split(/\s[–—-]\s/)[0];
}

/**
 * Den djupare noden för en vara i underkategorin `slug`, eller undefined när
 * kartans nod ska gälla (ingen regel för kategorin, ingen som träffar, eller
 * en "behåll"-regel).
 */
export function djupareKategori(slug: string | undefined, titel: string | undefined): number | undefined {
  if (!slug || !Object.hasOwn(DJUPARE_KATEGORIER, slug)) return undefined;
  const regler = DJUPARE_KATEGORIER[slug];
  const hel = (titel ?? "").toLowerCase();
  for (const text of [huvud(hel), hel]) {
    if (!text) continue;
    for (const r of regler) {
      if (r.ord && r.ord.test(text)) return r.id ?? undefined;
    }
  }
  return regler.find((r) => r.ord === null)?.id ?? undefined;
}
