# -*- coding: utf-8 -*-
"""Runda 85 — sex sopsorteringstunnor med flera fack.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS GRIND ÄR MATERIALET, OCH DET SKILJER MELLAN SYSKONEN. Fyra av de
   sex har stomme i **410 rostfritt stål**; `a00882ed` har
   *pulverbeschichtetes Metallgehäuse* — pulverlackerad plåt, inte rostfritt
   — och `ec672f4d` är ABS och plast med metallskenor. Att kopiera
   "rostfritt" mellan syskon i samma runda är precis runda 57:s rostfria
   lögn, och här ligger felet en textrad bort.

   ⚠️ Den maskinsatta svenska fliken gör dessutom felet åt BÅDA håll:
   `213be879` får `Material: Edelstahl` där tyskan säger
   `410 Edelstahl, Kunststoff`, och `ec672f4d` får `ABS/Polypropylen` där
   tyskan säger `ABS, Kunststoff, Metall` — metallen som bär hela lådan
   skrivs bort.

☠️ DOFTBLOCKEN INGÅR INTE — OCH BARA TRE TUNNOR HAR HÅLLARE. `17fb1869`,
   `b10b80ee` och `10c47f8e` säger *"integrierte Deo-Halter (ohne Deos)"*.
   `213be879` och `a00882ed` nämner ingen hållare alls, och `ec672f4d`
   inte heller. Samma fälla som runda 84:s 60-litare och runda 52:s
   sandlåda: hållaren finns, blocket gör det inte — och den som kopierar
   meningen till ett syskon lovar en hållare som inte sitter där.

☠️ `ec672f4d` SKA SKRUVAS FAST. *"Montage mit den mitgelieferten
   Schrauben sorgt für eine sichere Befestigung."* De fem andra säger
   uttryckligen *"Keine Montage erforderlich"*.

☠️ OCH DESS "BARNSPÄRR" ÄR INGEN SPÄRR. Källan säger att de dämpade
   skenorna glider *"mit leichtem Widerstand, um Kinder oder Haustiere
   davon abzuhalten, den Behälter herauszuziehen"* — ett LÄTT MOTSTÅND,
   inte ett lås. Att sälja det som barnsäkert vore samma överträdelse som
   runda 55:s magnetlås. Texten säger vad det är: skenorna tar emot, och
   lådan går att dra ut.

☠️ SKU:ERNA ÄR SATTA FÖR HAND, OCH DET ÄR INTE EN VANA. `sku_bas` speglar
   `lib/import/sku.ts` och kapar produktdelen vid 24 tecken på ett helt ord.
   Rundans tre 40-litersmodeller ger då ALLA `FP-soptunna-2-fack-40-liter` —
   samma sträng tre gånger, för det som skiljer dem (`silver`, `svart`,
   `smal`) ligger i sluggens svans och är precis det kapningen tar bort.

   Runda 58 mätte samma sak på hundvagnarna och skrev ned lösningen:
   **behåll den särskiljande svansen och kapa MITTEN i stället.** Därav
   `FP-soptunna-2-fack-40-silver` / `-svart` / `-smal`. Regeln i `sku.ts` är
   skriven för `FP-<produkt>-<variant>` där färgen är ett optionsvärde; när
   familjen är tre separata produkter finns ingen variantdel att reservera
   plats åt, och reservationen äter det enda som skiljer sidorna.

⚠️ `213be879`s tyska text kallar locket *"Deckel des Badmülleimers"* i en
   punkt och *"Küchenmülleimer"* i nästa. Källan är oense om rummet; våra
   sidor namnger därför inget rum för just den.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def rubrikblock(rubrik, stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def spec(rader):
    return ("<h2>Tekniska specifikationer</h2><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def faq(rader):
    # ☠️ Wix STRIPPAR <br>. Fråga och svar måste vara TVÅ <p>.
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def bygg(p):
    return "".join([p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
                    rubrikblock(p["villkor"][0], p["villkor"][1]),
                    rubrikblock("Användning och skötsel", p["skotsel"]),
                    faq(p["faq"])])


# ── Villkorsblocket: sortering är rundans egen fråga ────────────────────────
# ⚠️ Rundans verkliga risk är inte att tunnan går sönder — den är att kunden
#    köper fel STORLEK på facken. Två fack är bara till nytta om båda
#    fraktionerna växer lika fort, och det gör de sällan.
def sorteringsblock(fack, liter):
    return ("Två fack — så väljer du storlek", [
        "Tunnan har %s fack på %d liter vardera, och de är lika stora. Det "
        "låter självklart men avgör om den fungerar hos dig: matavfall och "
        "förpackningar fylls sällan lika fort, och det fack som fylls först "
        "bestämmer hur ofta du går ut." % (fack, liter),
        "Är den ena fraktionen dubbelt så stor hos dig blir en tunna med två "
        "lika fack fel oavsett hur många liter den rymmer totalt. Räkna på "
        "det facket, inte på summan.",
        "Hinkarna lyfts ur var för sig, så du kan byta påse i det ena utan "
        "att röra det andra.",
    ])


DEO_STYCKE = ("I locket sitter hållare för doftblock. <strong>Blocken ingår "
              "inte</strong> — hållarna är tomma när tunnan kommer, så räkna "
              "med att köpa dem separat om du vill ha den delen.")

STAL_SKOTSEL = ("Torka av stålet med en mjuk, fuktig trasa och torka efter. "
                "Rostfritt får fläckar av vattendroppar som får torka in, och "
                "det är det som ser ut som smuts på en tunna som egentligen "
                "är ren.")
LACK_SKOTSEL = ("Torka av med en mjuk, fuktig trasa och torka efter. Ytan är "
                "pulverlackerad plåt, inte rostfritt stål: den tål vatten och "
                "diskmedel men inte skurmedel, och en repa går igenom lacken "
                "i stället för att bara mattas.")
PLAST_SKOTSEL = ("Locken är plast och tål inte skursvamp eller lösningsmedel. "
                 "Diskmedel och ljummet vatten räcker; repor i plasten samlar "
                 "smuts och går inte att polera bort.")
HINK_SKOTSEL = ("Lyft ur hinkarna och skölj dem när något läckt. Det är hela "
                "poängen med en uttagbar innerhink — stommen behöver då inte "
                "torkas ur på plats.")

INGEN_MONTERING_FAQ = ("Behöver den monteras?",
                       "Nej. Tunnan kommer hel; ställ den på plats och sätt i "
                       "påsarna.")

STAL_MATERIAL_FAQ = ("Är hela tunnan i rostfritt stål?",
                     "Nej, och det är värt att veta innan man köper. Stommen "
                     "är 410 rostfritt stål — locken och innerhinkarna är "
                     "plast. Det är locken som tar smällarna och som slits, "
                     "så räkna med plastytor där och en stålyta på resten.")

FINGERAVTRYCK_FAQ = ("Syns fingeravtryck på den?",
                     "Mindre än på blankt stål, men de går inte att undvika "
                     "helt. Ytan är behandlad för att motstå fingeravtryck, "
                     "och det är något annat än att vara fri från dem. En "
                     "torr trasa tar bort det som ändå syns.")


PRODUKTER = [
    # ── Den minsta: 2 × 15 liter ────────────────────────────────────────────
    {
        "kort": "17fb1869", "pris": 899, "sku": "FP-soptunna-2-fack-30-liter", "volym": 30, "fack": 2,
        "name": "Soptunna med 2 fack 30 liter – 43 cm hög, svart",
        "slug": "soptunna-med-2-fack-30-liter",
        "title": "Soptunna med 2 fack 30 liter, låg modell | Fyndplats",
        "meta": ("Sopsorteringstunna med två fack på 15 liter vardera, 30 "
                 "liter totalt. Bara 43,2 cm hög med stomme i rostfritt stål, "
                 "fotpedal och uttagbara innerhinkar."),
        "ingress": (
            "<p><strong>43,2 cm hög — den lägsta tunnan med två fack här.</strong> "
            "Den går in under en bänkskiva eller i ett skåp där en full "
            "sorteringstunna inte kommer åt, och tar 41,7 × 36,6 cm på "
            "golvet.</p>"
            "<p>Två fack på 15 liter vardera, med varsitt lock och varsin "
            "pedal. Locken stänger mjukt och kan hållas öppna när du storstädar "
            "eller packar upp matkassar.</p>"
            "<p>Behöver du mer volym på nästan samma yta finns "
            + lank("soptunna-med-2-fack-40-liter-silver",
                   "40-litersmodellen") + ", och i den publicerade delen av "
            "sortimentet " + lank("soptunna-med-3-fack-45-liter",
                                  "en tunna med tre fack") + ".</p>"),
        "eg": [
            "2 × 15 liter, 30 liter totalt",
            "43,2 cm hög — 41,7 × 36,6 cm på golvet",
            "Varsitt lock och varsin fotpedal per fack",
            "Locken stänger mjukt och kan hållas öppna",
            "Uttagbara innerhinkar med påshål",
            "Hållare för doftblock i locken (blocken ingår inte)",
            "Stomme i rostfritt stål, lock och hinkar i plast",
        ],
        "spec": [
            "Volym: 2 × 15 liter, 30 liter totalt",
            "Mått (B × D × H): 41,7 × 36,6 × 43,2 cm",
            "Antal fack: 2",
            "Öppning: fotpedal per fack",
            "Lock: mjukstängande, kan hållas öppet",
            "Innerhinkar: uttagbara, med hål för påsen",
            "Doftblockshållare: ja, blocken ingår inte",
            "Stomme: 410 rostfritt stål",
            "Lock och innerhinkar: plast",
            "Färg: svart",
            "Vikt: 6,4 kg",
            "Paketmått: 48 × 43 × 51 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": sorteringsblock("två", 15),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, HINK_SKOTSEL],
        "faq": [
            ("Hur låg är den egentligen?",
             "43,2 cm — ungefär knähöjd, och lägre än en sorteringstunna "
             "brukar vara. Mät under bänkskivan eller i skåpet innan du "
             "bestämmer plats: locken fälls upp och behöver fri höjd över "
             "tunnan."),
            ("Ingår doftblocken?",
             "Nej. Locken har hållare för dem, men hållarna är tomma när "
             "tunnan kommer. Blocken köps separat."),
            STAL_MATERIAL_FAQ,
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── 2 × 20 liter, låg modell — silver ───────────────────────────────────
    {
        "kort": "b10b80ee", "pris": 1029, "sku": "FP-soptunna-2-fack-40-silver", "volym": 40, "fack": 2,
        "name": "Soptunna med 2 fack 40 liter – silver, 51,6 cm hög",
        "slug": "soptunna-med-2-fack-40-liter-silver",
        "title": "Soptunna med 2 fack 40 liter i silver | Fyndplats",
        "meta": ("Sopsorteringstunna med två fack på 20 liter vardera, 40 "
                 "liter totalt. Stomme i rostfritt stål, fotpedal per fack och "
                 "uttagbara innerhinkar. 45,8 × 36 × 51,6 cm."),
        "ingress": (
            "<p><strong>Två fack på 20 liter, 51,6 cm hög.</strong> Den låga "
            "höjden är det som skiljer den från den smalare modellen: den här "
            "tar 45,8 cm i bredd och håller sig under skivhöjd, medan "
            + lank("soptunna-med-2-fack-40-liter-smal",
                   "den smala 40-litaren är 40 cm bred och 59 cm hög")
            + ".</p>"
            "<p>Varje fack har eget lock och egen pedal. Locken stänger mjukt "
            "och kan hållas öppna. I locken sitter hållare för doftblock.</p>"
            "<p>Samma tunna finns i "
            + lank("soptunna-med-2-fack-40-liter-svart", "svart") + ". Behöver "
            "du mindre finns " + lank("soptunna-med-2-fack-30-liter",
                                      "30-litersmodellen") + ".</p>"),
        "eg": [
            "2 × 20 liter, 40 liter totalt",
            "51,6 cm hög — 45,8 × 36 cm på golvet",
            "Varsitt lock och varsin fotpedal per fack",
            "Locken stänger mjukt och kan hållas öppna",
            "Uttagbara innerhinkar med påshål",
            "Hållare för doftblock i locken (blocken ingår inte)",
            "Polerad yta som motstår fingeravtryck",
        ],
        "spec": [
            "Volym: 2 × 20 liter, 40 liter totalt",
            "Mått (B × D × H): 45,8 × 36 × 51,6 cm",
            "Antal fack: 2",
            "Öppning: fotpedal per fack",
            "Lock: mjukstängande, kan hållas öppet",
            "Innerhinkar: uttagbara, med hål för påsen",
            "Doftblockshållare: ja, blocken ingår inte",
            "Stomme: 410 rostfritt stål, polerad",
            "Lock och innerhinkar: plast",
            "Färg: silver",
            "Vikt: 7,3 kg",
            "Paketmått: 52 × 40 × 60 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": sorteringsblock("två", 20),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, HINK_SKOTSEL],
        "faq": [
            ("Vad skiljer den från den smala 40-litaren?",
             "Formen, inte volymen. Den här är 45,8 cm bred och 51,6 cm hög; "
             + lank("soptunna-med-2-fack-40-liter-smal",
                    "den smala är 40 cm bred och 59 cm hög")
             + ". Välj på var du har plats — bredd eller höjd."),
            ("Ingår doftblocken?",
             "Nej. Locken har hållare för dem, men hållarna är tomma när "
             "tunnan kommer. Blocken köps separat."),
            FINGERAVTRYCK_FAQ,
            STAL_MATERIAL_FAQ,
        ],
    },
    # ── 2 × 20 liter, låg modell — svart ────────────────────────────────────
    {
        "kort": "10c47f8e", "pris": 1029, "sku": "FP-soptunna-2-fack-40-svart", "volym": 40, "fack": 2,
        "name": "Soptunna med 2 fack 40 liter – svart, 51,6 cm hög",
        "slug": "soptunna-med-2-fack-40-liter-svart",
        "title": "Soptunna med 2 fack 40 liter i svart | Fyndplats",
        "meta": ("Svart sopsorteringstunna med två fack på 20 liter vardera, "
                 "40 liter totalt. Stomme i rostfritt stål, fotpedal per fack "
                 "och uttagbara innerhinkar."),
        "ingress": (
            "<p><strong>Samma tunna som "
            + lank("soptunna-med-2-fack-40-liter-silver", "silvermodellen")
            + ", i svart.</strong> Två fack på 20 liter, 45,8 × 36 cm på "
            "golvet och 51,6 cm hög — måtten är identiska, det är bara ytan "
            "som skiljer.</p>"
            "<p>Varje fack har eget lock och egen pedal. Locken stänger mjukt "
            "och kan hållas öppna. I locken sitter hållare för doftblock.</p>"
            "<p>Svart stål visar vattendroppar tydligare än silver — läs "
            "skötselavsnittet innan du väljer färg.</p>"),
        "eg": [
            "2 × 20 liter, 40 liter totalt",
            "51,6 cm hög — 45,8 × 36 cm på golvet",
            "Varsitt lock och varsin fotpedal per fack",
            "Locken stänger mjukt och kan hållas öppna",
            "Uttagbara innerhinkar med påshål",
            "Hållare för doftblock i locken (blocken ingår inte)",
            "Polerad yta som motstår fingeravtryck",
        ],
        "spec": [
            "Volym: 2 × 20 liter, 40 liter totalt",
            "Mått (B × D × H): 45,8 × 36 × 51,6 cm",
            "Antal fack: 2",
            "Öppning: fotpedal per fack",
            "Lock: mjukstängande, kan hållas öppet",
            "Innerhinkar: uttagbara, med hål för påsen",
            "Doftblockshållare: ja, blocken ingår inte",
            "Stomme: 410 rostfritt stål, polerad",
            "Lock och innerhinkar: plast",
            "Färg: svart",
            "Vikt: 7,3 kg",
            "Paketmått: 52 × 40 × 60 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": sorteringsblock("två", 20),
        "skotsel": [
            "Torka av stålet med en mjuk, fuktig trasa och torka efter. "
            "Svart stål visar vattendroppar och fingeravtryck tydligare än "
            "silver — det är samma yta och samma behandling, men mörka ytor "
            "gör ljusa märken synligare.",
            PLAST_SKOTSEL, HINK_SKOTSEL,
        ],
        "faq": [
            ("Är den likadan som silvermodellen?",
             "Ja, på varenda mått: 45,8 × 36 × 51,6 cm, 2 × 20 liter, 7,3 kg. "
             "Det är samma tunna i en annan ytbehandling — se "
             + lank("soptunna-med-2-fack-40-liter-silver", "silverversionen")
             + "."),
            ("Ingår doftblocken?",
             "Nej. Locken har hållare för dem, men hållarna är tomma när "
             "tunnan kommer. Blocken köps separat."),
            FINGERAVTRYCK_FAQ,
            STAL_MATERIAL_FAQ,
        ],
    },
    # ── 2 × 20 liter, smal modell ───────────────────────────────────────────
    {
        "kort": "213be879", "pris": 1129, "sku": "FP-soptunna-2-fack-40-smal", "volym": 40, "fack": 2,
        "name": "Soptunna med 2 fack 40 liter – smal, 40 cm bred",
        "slug": "soptunna-med-2-fack-40-liter-smal",
        "title": "Smal soptunna med 2 fack 40 liter | Fyndplats",
        "meta": ("Smal sopsorteringstunna med två fack på 20 liter vardera. "
                 "Bara 40 cm bred och 34,8 cm djup, med stomme i rostfritt "
                 "stål, fotpedal och dolda handtag."),
        "ingress": (
            "<p><strong>40 cm bred och 34,8 cm djup</strong> — den smalaste "
            "tunnan med två fack här, gjord för att stå i en springa mellan "
            "skåp eller vid sidan av en diskbänk. Volymen ligger på höjden i "
            "stället: 59 cm.</p>"
            "<p>Två fack på 20 liter, mjukstängande lock och fotpedal. "
            "Innerhinkarna lyfts ur och har hål i kanten som håller påsen på "
            "plats. Dolda handtag i sidorna gör att den går att flytta utan "
            "att man tar i locket.</p>"
            "<p>Har du bredden men inte höjden finns "
            + lank("soptunna-med-2-fack-40-liter-silver",
                   "samma volym i en lägre modell på 51,6 cm") + ".</p>"),
        "eg": [
            "2 × 20 liter, 40 liter totalt",
            "Bara 40 cm bred och 34,8 cm djup",
            "59 cm hög — volymen ligger på höjden",
            "Mjukstängande lock och fotpedal",
            "Uttagbara innerhinkar med hål som håller påsen",
            "Dolda handtag i sidorna",
            "Stomme i rostfritt stål, lock och hinkar i plast",
        ],
        "spec": [
            "Volym: 2 × 20 liter, 40 liter totalt",
            "Mått (B × D × H): 40 × 34,8 × 59 cm",
            "Antal fack: 2",
            "Öppning: fotpedal",
            "Lock: mjukstängande",
            "Innerhinkar: uttagbara, med hål för påsen",
            "Handtag: dolda, i sidorna",
            "Stomme: 410 rostfritt stål",
            "Lock och innerhinkar: plast",
            "Färg: silver",
            "Vikt: 7,2 kg",
            "Paketmått: 46 × 41 × 65 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": sorteringsblock("två", 20),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, HINK_SKOTSEL],
        "faq": [
            ("Hur smal är den jämfört med de andra?",
             "40 cm bred mot 45,8 för "
             + lank("soptunna-med-2-fack-40-liter-silver", "den låga modellen")
             + " med samma volym. Skillnaden är knappt sex centimeter, men "
             "det är ofta precis den springan som finns mellan ett skåp och "
             "en vägg."),
            ("Behöver den fri höjd ovanför?",
             "Ja. Tunnan är 59 cm hög och locket fälls upp, så den passar "
             "inte under en bänkskiva. Ska den stå under något: mät, eller "
             "välj " + lank("soptunna-med-2-fack-40-liter-silver",
                            "den låga modellen på 51,6 cm") + "."),
            FINGERAVTRYCK_FAQ,
            STAL_MATERIAL_FAQ,
        ],
    },
    # ── 2 × 30 liter — pulverlackerad, INTE rostfri ─────────────────────────
    {
        "kort": "a00882ed", "pris": 1379, "sku": "FP-soptunna-2-fack-60-liter", "volym": 60, "fack": 2,
        "name": "Soptunna med 2 fack 60 liter – vit, pulverlackerad",
        "slug": "soptunna-med-2-fack-60-liter",
        "title": "Soptunna med 2 fack 60 liter i vitt | Fyndplats",
        "meta": ("Sopsorteringstunna med två fack på 30 liter vardera, 60 "
                 "liter totalt. Vit pulverlackerad plåt, två oberoende "
                 "mjukstängande lock och fotpedal."),
        "ingress": (
            "<p><strong>Två fack på 30 liter — det största här.</strong> "
            "Sextio liter totalt på 48,8 × 39,5 cm golvyta och 67 cm höjd, "
            "gjord för ett hushåll som sorterar mycket och vill gå ut "
            "sällan.</p>"
            "<p><strong>Stommen är pulverlackerad plåt, inte rostfritt "
            "stål.</strong> Det är skillnaden mot de mindre tunnorna här, och "
            "det märks i skötseln: ytan tål vatten och diskmedel men en repa "
            "går igenom lacken.</p>"
            "<p>De två locken är oberoende av varandra och stänger mjukt. "
            "Behöver du mindre finns "
            + lank("soptunna-med-2-fack-40-liter-silver",
                   "40-litersmodellen i rostfritt stål")
            + ", och i den publicerade delen av sortimentet "
            + lank("soptunna-med-2-fack-56-liter", "en tunna på 56 liter")
            + ".</p>"),
        "eg": [
            "2 × 30 liter, 60 liter totalt",
            "67 cm hög — 48,8 × 39,5 cm på golvet",
            "Två oberoende, mjukstängande lock",
            "Fotpedal öppnar locket",
            "Uttagbara innerhinkar med påshållare",
            "Pulverlackerad plåt — inte rostfritt stål",
            "Ytan motstår fingeravtryck",
        ],
        "spec": [
            "Volym: 2 × 30 liter, 60 liter totalt",
            "Mått (L × B × H): 48,8 × 39,5 × 67 cm",
            "Antal fack: 2",
            "Öppning: fotpedal",
            "Lock: två oberoende, mjukstängande",
            "Innerhinkar: uttagbara, med påshållare",
            "Stomme: pulverlackerad plåt",
            "Lock och innerhinkar: plast",
            "Färg: vit",
            "Vikt: 10,6 kg",
            "Paketmått: 55 × 44 × 76 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": sorteringsblock("två", 30),
        "skotsel": [LACK_SKOTSEL, PLAST_SKOTSEL, HINK_SKOTSEL],
        "faq": [
            ("Är den i rostfritt stål?",
             "Nej. Stommen är pulverlackerad plåt och locken är plast. Det "
             "är en verklig skillnad mot "
             + lank("soptunna-med-2-fack-40-liter-silver",
                    "de mindre tunnorna, som har stomme i 410 rostfritt stål")
             + " — lack tål vatten lika bra men repas igenom, medan en repa "
             "i stål mattas."),
            ("Hur mycket större är den än 40-litersmodellen?",
             "Facken är 30 liter i stället för 20, alltså femtio procent mer "
             "per fack. Tunnan är samtidigt högre och tyngre — se "
             + lank("soptunna-med-2-fack-40-liter-silver",
                    "40-litersmodellen") + " om du har ont om höjd."),
            ("Går locken att öppna var för sig?",
             "Ja. De två locken är oberoende, så det ena kan stå öppet medan "
             "det andra är stängt."),
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── Utdragbar, tre fack ─────────────────────────────────────────────────
    {
        "kort": "ec672f4d", "pris": 1179, "sku": "FP-utdragbar-3-fack-31-liter", "volym": 31, "fack": 3,
        "name": "Utdragbar soptunna med 3 fack 31 liter – för köksskåp",
        "slug": "utdragbar-soptunna-3-fack-31-liter",
        "title": "Utdragbar soptunna med 3 fack, 31 liter | Fyndplats",
        "meta": ("Utdragbar sopsorteringstunna för köksskåp, 31 liter i tre "
                 "fack: 15 liter plus två på 8. Dämpade metallskenor och "
                 "uttagbara hinkar. Ramen mäter 47 × 33 × 32 cm."),
        "ingress": (
            "<p><strong>Tre fack i ett köksskåp: 15 liter plus två på "
            "8.</strong> Behållaren dras ut på dämpade metallskenor och göms "
            "bakom skåpluckan när den är inne.</p>"
            "<p><strong>Mät ramen, inte höljet.</strong> Ramen är 47 cm bred, "
            "33 cm djup och 32 cm hög — det är måttet skåpet måste rymma. "
            "Utdragen mäter enheten 48 × 34,3 × 35,1 cm.</p>"
            "<p><strong>Den skruvas fast</strong> i skåpet med skruvarna som "
            "följer med. Vill du ha en tunna som bara ställs på plats finns "
            + lank("soptunna-med-2-fack-30-liter", "en fristående med två fack")
            + ", och i den publicerade delen av sortimentet "
            + lank("utdragbar-soptunna-koksskap-30-liter",
                   "en utdragbar med två fack") + ".</p>"),
        "eg": [
            "Tre fack: 15 liter + 2 × 8 liter, 31 liter totalt",
            "Ram 47 × 33 × 32 cm — måttet skåpet ska rymma",
            "Dämpade metallskenor, glider tyst",
            "Alla tre hinkar lyfts ur, med handtag",
            "Tätslutande lock håller lukten i skåpet",
            "Skruvas fast i skåpet, skruvar ingår",
            "Stomme i ABS och plast, skenor i metall",
        ],
        "spec": [
            "Volym: 15 + 8 + 8 liter, 31 liter totalt",
            "Antal fack: 3",
            "Rammått (B × D × H): 47 × 33 × 32 cm",
            "Yttermått utdragen (L × B × H): 48 × 34,3 × 35,1 cm",
            "Öppningsmått (B × D): 31,5 × 44,5 cm",
            "Stora hinken (B × D × H): 29 × 21,5 × 29,5 cm",
            "Små hinkarna (B × D × H): 21,3 × 13,5 × 29,5 cm",
            "Skenor: dämpade, i metall",
            "Stomme: ABS och plast",
            "Färg: ljusgrå",
            "Vikt: 5,3 kg",
            "Montering: krävs, skruvar ingår",
            "Paketmått: 53 × 39 × 39,5 cm",
            "Ingår: utdragbar behållare och bruksanvisning",
        ],
        "villkor": ("Tre fack — och måttet som avgör", [
            "Facken är olika stora med flit: 15 liter till det som fylls "
            "snabbast och två på 8 liter till fraktioner som samlas långsamt. "
            "Det är en annan lösning än två lika fack, och den passar den som "
            "sorterar i tre högar men inte i lika delar.",
            "<strong>Mät skåpet mot ramen, 47 × 33 × 32 cm</strong>, och lägg "
            "till utrymme för att luckan ska gå att stänga. Yttermåttet på "
            "48 × 34,3 × 35,1 cm gäller enheten utdragen och är inte det du "
            "ska mäta mot.",
            "Enheten skruvas fast i skåpbotten med skruvarna som följer med. "
            "Det är inte ett tungt jobb, men det kräver en skruvdragare och "
            "att du kommer åt att borra i skåpet.",
        ]),
        "skotsel": [
            "Lyft ur hinkarna och skölj dem. Alla tre har handtag och går ur "
            "var för sig, så du kan ta den som läckt och lämna de andra.",
            "Torka av lådan med en fuktig trasa. Plasten tål diskmedel men "
            "inte lösningsmedel eller skurmedel.",
            "Torka av skenorna då och då. Damm och matrester i skenan är det "
            "som gör att lådan börjar kärva, och det märks långt innan den "
            "fastnar.",
        ],
        "faq": [
            ("Vilket mått ska jag mäta skåpet mot?",
             "Ramen: 47 cm bred, 33 cm djup och 32 cm hög. Yttermåttet 48 × "
             "34,3 × 35,1 cm gäller enheten när den är utdragen. Mät också att "
             "luckan går att stänga när behållaren är inne."),
            ("Behöver den monteras?",
             "Ja. Enheten skruvas fast i skåpet med skruvarna som följer med — "
             "det är det som gör att den sitter still när du drar ut den. Du "
             "behöver en skruvdragare."),
            ("Är den barnsäker?",
             "Nej, och vi vill vara tydliga med det. Skenorna är dämpade och "
             "tar emot något när lådan dras ut, vilket gör den trögare för ett "
             "barn eller ett husdjur att öppna. Det är ett motstånd, inte ett "
             "lås — behöver du en spärr får du montera en separat."),
            ("Vad är den gjord av?",
             "Behållaren och hinkarna är ABS och plast; skenorna är metall. "
             "Det är skenorna som bär vikten när lådan är utdragen och full."),
        ],
    },
]
