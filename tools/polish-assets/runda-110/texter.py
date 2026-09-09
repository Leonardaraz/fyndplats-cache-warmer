# -*- coding: utf-8 -*-
"""Runda 110 — sex vikskärmar i tre konstruktioner.

☠️ TEXTEN SKRIVS I FIL FÖRST (runda 64: 9 fel mot 0). En sträng som skrivs
rakt in i ett API-anrop kan ingen grind läsa innan den lämnar chatten, och
PATCH-svaret ekar tillbaka exakt det man skrev — det ser rätt ut för att det
ÄR det man skrev.

☠️ TRE KONSTRUKTIONER, TRE TEXTER. Runda 108/109 kunde dela ETT block över
åtta sidor för att alla åtta var samma modell i olika storlek och färg. Här
är A plastväv på tallram, B bambuväv på tallram och C helt i bambu — och ett
delat block hade tvingat fram en formulering som är sann om ingen av dem.
Det som FAKTISKT är gemensamt (att en fristående vikskärm står på formen och
inte på tyngden) ligger i `STADIGT` och delas av alla sex.

⚠️ GRUPP A ÄR SAMMA PRODUKTLINJE SOM DE ÅTTA LIVE-SIDORNA i runda 108/109 —
samma polypropenväv, samma tallram, samma bågformade överkant — men en annan
modell: 45 cm per panel mot 40, 180 cm hög mot 170, 1,7 cm djup mot 1,6.
Ordvalet ärvs därför ordagrant därifrån, och sidorna korslänkas. Att skriva
om samma material med andra ord på grannsidan är hur en katalog blir otydlig.
"""

import matt

BAS = "https://www.fyndplats.se/produkt/"

L = lambda slug, text: f'<a href="{BAS}{slug}">{text}</a>'
P = lambda t: f"<p>{t}</p>"
H = lambda t: f"<h2>{t}</h2>"
LI = lambda t: f"<li>{t}</li>"
UL = lambda rader: "<ul>" + "".join(LI(f"<strong>{a}:</strong> {b}") for a, b in rader) + "</ul>"
F = lambda q, s: f"<p><strong>{q}</strong></p><p>{s}</p>"

ORD = {3: "tre", 4: "fyra"}

#            färgens namn i namn//spec, färg i slug, materialfras (namn),
#            materialfras (spec)
STIL = {
 "a999f2b1": ("vit",          "vit",     "vit polypropenväv på tallram",
              "polypropenväv på tallram"),
 "c35f9d4f": ("gråbrun",      "grabrun", "gråbrun polypropenväv på tallram",
              "polypropenväv på tallram"),
 "d72bde5e": ("naturfärgad",  "bambu",   "bambuväv på tallram",
              "bambuväv på tallram"),
 "316f9945": ("brun och svart", "svart", "bambuväv på svart tallram",
              "bambuväv på tallram"),
 "f8fd1b62": ("naturfärgad",  "bambu",   "flätad bambu",
              "flätad bambu, gångjärn i metall"),
 "309076e2": ("naturfärgad",  "bambu",   "flätad bambu",
              "flätad bambu, gångjärn i metall"),
}

# Runda 108:s två fyrpanelssidor, LIVE sedan 2026-09-08. Samma väv och samma
# ram som grupp A, men den lägre serien: 160 × 1,6 × 170 cm.
LIVE_170 = [("vit, 160 × 170 cm", "rumsavdelare-160-vit"),
            ("brun, 160 × 170 cm", "rumsavdelare-160-brun")]


def slug_av(nyckel):
    """☠️ Kort med flit. SKU:n byggs ur sluggen och kapas vid 24 tecken, så en
    lång mitt hade ätit upp det som skiljer sidorna åt. Längst är
    `rumsavdelare-180-grabrun` på exakt 24."""
    bredd = matt.RUNDAN[nyckel][1]
    return f"rumsavdelare-{bredd}-{STIL[nyckel][1]}"


def foga(delar):
    """Svensk uppräkning: 'a', 'a och b', 'a, b och c'."""
    if len(delar) <= 1:
        return "".join(delar)
    return ", ".join(delar[:-1]) + " och " + delar[-1]


def syskon(nyckel):
    """Rundans egna, inom samma KONSTRUKTION. Sorteringen är fast så att en
    omkörning ger byte-identisk text."""
    g = matt.GRUPPER[nyckel]
    ut = []
    for k in matt.RUNDAN:
        if k == nyckel or matt.GRUPPER[k] != g:
            continue
        pan2, bredd2 = matt.RUNDAN[k][0], matt.RUNDAN[k][1]
        farg2 = STIL[k][0]
        if bredd2 == matt.RUNDAN[nyckel][1]:
            etikett = f"samma skärm i {farg2}"
        else:
            etikett = f"samma skärm med {ORD[pan2]} paneler, {bredd2} cm"
        ut.append((bredd2, k, etikett, slug_av(k)))
    ut.sort()
    return [(t, s) for _b, _k, t, s in ut]


STADIGT = (
    H("Den står genom att vinklas")
    + P("En fristående skärm bär sig själv på formen, inte på tyngden. Vecklas "
        "panelerna ut i en mjuk sicksack står den stadigt på egen hand; dras de "
        "ut spikrakt har den ingenting att stödja sig mot. Så fungerar en "
        "fristående vikskärm, och det avgör var den kan stå.")
)

FRISTAENDE = P(
    "Fötterna vilar på golvet utan att skruvas fast. Det finns ingen "
    "väggförankring, och därför hör skärmen hemma där den får stå ifred — "
    "utmed en vägg, runt ett hörn av rummet, bakom en soffa. Den är en "
    "avskärmning, inte en barriär, och ska inte användas för att stänga inne "
    "barn eller djur.")

# ── Grupp A: polypropenväv på tallram ────────────────────────────────────────
VAV_A = (
    H("Skymmer insyn, mörklägger inte")
    + P("Väven är gjord av polypropen som flätats över en ram i massiv tall. "
        "Mönstret är tätt nog att bryta blicken men inte tätt nog att stänga "
        "ute ljus — sett rakt framifrån är den en vägg, sett i motljus anas "
        "konturer igenom. Det gör den till en bra avdelare framför en "
        "arbetsplats eller en säng, och till ett dåligt mörkläggningsdraperi.")
    + P("Banden är plast, inte papper eller natursnöre. Polypropen är samma "
        "sorts fiber som i utemattor: den tål att torkas av och tappar inte "
        "formen om någon lutar sig mot den.")
    + P("Träet är inte bara en ram runt kanten. Banden är flätade över stående "
        "stommar av trä inne i panelen, och eftersom flätningen är öppen syns "
        "träet i mellanrummen mellan raderna — närmast som en glimt av ljust "
        "virke bakom väven.")
)

SKOTSEL_A = (
    H("Användning och skötsel")
    + P("Torka av väven med en fuktig trasa och torka efter med en torr. "
        "Polypropen tål vatten, men tallramen ska inte bli stående blöt — "
        "dammsug hellre med möbelmunstycke än att skölja.")
    + P("Skärmen är gjord för inomhusbruk. Tallramen är obehandlad och väven är "
        "inte UV-stabiliserad för säsonger ute, så låt den stanna inne — på en "
        "inglasad balkong går det bra, i regn gör det inte det.")
    + P("Lyft i ramen, aldrig i väven. Flätningen bär sin egen vikt men är inte "
        "gjord för att ta hela skärmens.")
)

# ── Grupp B: bambuväv på tallram ─────────────────────────────────────────────
VAV_B = {
 "d72bde5e": (
    H("Bambu på tråd, i en ram av tall")
    + P("Panelen är inte en skiva utan en väv. Tunna bambuspjälor ligger på "
        "rad och hålls samman av bomullstråd, ungefär som en rullgardin i "
        "naturmaterial — och eftersom spjälorna växlar mellan gräddvitt och "
        "grått får ytan ett fint rutmönster på håll som löser upp sig i "
        "enskilda spjälor när man går närmare.")
    + P("Ramen runt varje panel är ljust obehandlat trä och det är den som bär. "
        "Väven är spänd i ramen, inte tvärtom.")
    + P("Tätheten räcker för att bryta blicken rakt framifrån. Den räcker inte "
        "för att mörklägga: i motljus lyser mellanrummen mellan spjälorna "
        "igenom som tunna streck.")),
 "316f9945": (
    H("Flätad bambu i en svartmålad ram")
    + P("Ramen är svartmålad tall och det är det första man ser. Panelen "
        "innanför är flätad bambu, och i närbild är den tredelad: svarta "
        "spjälor, gräddvita band som löper i lodräta stråk och kopparbruna "
        "trådar som binder ihop dem. På avstånd smälter de tre till en mörk, "
        "varm yta med struktur i.")
    + P("Fötterna är fyrkantiga och lyfter panelerna 5,5 cm från golvet, så att "
        "skärmen står stabilt och underkanten inte skaver mot golvet när den "
        "flyttas.")
    + P("Tätheten räcker för att bryta blicken rakt framifrån. Den räcker inte "
        "för att mörklägga: i motljus anas ljuset mellan spjälorna.")),
}

SKOTSEL_B = (
    H("Användning och skötsel")
    + P("Damma av med en torr trasa eller dammsug med möbelmunstycke. Bambu och "
        "trä mår inte bra av att bli stående blött — torka en fläck med lätt "
        "fuktad trasa och torka genast efter med en torr.")
    + P("Skärmen är gjord för inomhusbruk. Ta inte ut den i regn eller låt den "
        "stå i direkt sol säsong efter säsong; på en inglasad balkong fungerar "
        "den bra.")
    + P("Lyft i ramen, aldrig i väven.")
)

# ── Grupp C: helt i bambu ────────────────────────────────────────────────────
VAV_C = (
    H("Flätad bambu, lika på båda sidor")
    + P("Panelerna är breda, flata bambuspjälor flätade i korgmönster över "
        "hela ytan. Flätningen går på båda sidor, så skärmen ser likadan ut "
        "framifrån och bakifrån — det spelar roll för en rumsavdelare, som per "
        "definition har en baksida som någon tittar på.")
    + P("Bambun är varmt naturfärgad och obehandlad, och ramen är av samma "
        "material som väven. Det enda som inte är bambu är gångjärnen, som är "
        "i metall.")
    + P("Mönstret är tätare än en spjälvävd skärm men fortfarande inte "
        "ljustätt. Den skymmer insyn; den mörklägger inte.")
)

SKOTSEL_C = (
    H("Användning och skötsel")
    + P("Damma av med en torr trasa eller dammsug med möbelmunstycke. Bambun är "
        "obehandlad — torka en fläck med lätt fuktad trasa och torka genast "
        "efter med en torr, och låt den aldrig bli stående blöt.")
    + P("Skärmen är gjord för inomhusbruk. På en inglasad balkong fungerar den, "
        "i regn gör den inte det.")
    + P("Lyft i ramen, aldrig i väven.")
)

VAV_BLOCK = {"A": lambda k: VAV_A, "B": lambda k: VAV_B[k], "C": lambda k: VAV_C}
SKOTSEL = {"A": SKOTSEL_A, "B": SKOTSEL_B, "C": SKOTSEL_C}

# ☠️ EN MEKANIKORD-LISTA PER PRODUKT, inte per grupp. Steg 5, punkt 7: varje
# mekanikord ska gå att peka på i en källa. `d72bde5e` skriver bara
# "Durch Scharniere verbunden" — INGET material. De andra fem skriver
# uttryckligen metall, och `a999f2b1`/`c35f9d4f` dessutom antalet nio.
GANGJARN = {
 "a999f2b1": ("nio metallgångjärn, tre per skarv", "nio i metall, tre per skarv"),
 "c35f9d4f": ("nio metallgångjärn, tre per skarv", "nio i metall, tre per skarv"),
 "d72bde5e": ("gångjärn som viker åt båda hållen", "gångjärn"),
 "316f9945": ("metallgångjärn som viker åt båda hållen", "metall"),
 "f8fd1b62": ("metallgångjärn som viker åt båda hållen", "metall"),
 "309076e2": ("metallgångjärn som viker åt båda hållen", "metall"),
}
NAMNSVANS = {
 "a999f2b1": "– vit polypropenväv på tallram",
 "c35f9d4f": "– gråbrun polypropenväv på tallram",
 "d72bde5e": "– bambuväv på tallram",
 "316f9945": "– bambuväv på svart tallram",
 "f8fd1b62": "i flätad bambu",
 "309076e2": "i flätad bambu",
}
# ☠️ EGEN FRAS FÖR LÖPTEXT OCH META. `matspec` bär gångjärnsmaterialet, vilket
# hör hemma i spec-tabellen och ingen annanstans — "fyra paneler i flätad
# bambu, gångjärn i metall" är ingen mening man skriver i en meta.
# Och den bär FÄRGEN: utan den blev A-parets två metas byte-identiska, alltså
# två publicerade sidor med samma meta description.
MAT_PROSA = {
 "a999f2b1": "vit polypropenväv på tallram",
 "c35f9d4f": "gråbrun polypropenväv på tallram",
 "d72bde5e": "naturfärgad bambuväv på tallram",
 "316f9945": "bambuväv på svart tallram",
 "f8fd1b62": "naturfärgad flätad bambu",
 "309076e2": "naturfärgad flätad bambu",
}
KORT = {"a999f2b1": "vit", "c35f9d4f": "gråbrun", "d72bde5e": "bambu",
        "316f9945": "svart", "f8fd1b62": "bambu", "309076e2": "bambu"}
SOKORD4 = {"A": "insynsskydd inomhus", "B": "rumsavdelare bambu",
           "C": "rumsavdelare bambu"}
OVANKANT = {
 "A": "Höjden är {h} cm mätt till bågens topp. Panelernas ovankant är nämligen "
      "inte rak utan svängd, så kanten dippar en aning vid varje skarv och "
      "stiger igen mitt på panelen. Sittande ser man ingenting över kanten; "
      "stående beror det på hur lång du är.",
 "B": "Höjden är {h} cm och ovankanten är rak hela vägen, utan båge eller "
      "avsats. Sittande ser man ingenting över kanten; stående beror det på "
      "hur lång du är.",
 "C": "Höjden är {h} cm och ovankanten är rak hela vägen, utan båge eller "
      "avsats. Sittande ser man ingenting över kanten; stående beror det på "
      "hur lång du är.",
}
FAQ_MATERIAL = {
 "A": ("Vad är väven gjord av?",
       "Polypropen — en plastfiber av samma sort som i utemattor — flätad över "
       "en ram i massiv tall. Den är alltså varken papper eller natursnöre."),
 "B": ("Vad är väven gjord av?",
       "Bambu, spänd i en ram av tall. Bambun är obehandlad."),
 "C": ("Vad är väven gjord av?",
       "Bambu, både i väven och i ramen. Flätningen går på båda sidor, så "
       "skärmen ser likadan ut framifrån och bakifrån. Gångjärnen är i metall."),
}
FAQ_TVATT = {
 "A": ("Går den att tvätta?",
       "Torka av med fuktig trasa och torka efter. Polypropen tål vatten, men "
       "låt inte tallramen bli stående blöt."),
 "B": ("Går den att tvätta?",
       "Nej, den ska inte blötas. Damma av torrt eller dammsug med "
       "möbelmunstycke, och torka en enstaka fläck med lätt fuktad trasa."),
 "C": ("Går den att tvätta?",
       "Nej, den ska inte blötas. Damma av torrt eller dammsug med "
       "möbelmunstycke, och torka en enstaka fläck med lätt fuktad trasa."),
}


def bygg(nyckel):
    pan, bredd, djup, hojd, hopf, fot, vikt, paketmatt = matt.RUNDAN[nyckel][:8]
    g = matt.GRUPPER[nyckel]
    pb = matt.PANELBREDD[g]
    farg, _fs, _mf, matspec = STIL[nyckel]
    matprosa = MAT_PROSA[nyckel]
    gj_text, gj_spec = GANGJARN[nyckel]
    panelord = ORD[pan]
    lankar = syskon(nyckel)

    fotrad = (P(f"Fötterna är {fot} cm höga och vilar på golvet utan att skruvas "
                "fast.") if fot else "")
    ocksa = P("Finns också som " + foga([L(s, t) for t, s in lankar]) + ".")
    if g == "A":
        ocksa += P("Samma polypropenväv på tallram finns också i en lägre serie, "
                   "170 cm hög: " + foga([L(s, t) for t, s in LIVE_170]) + ".")

    spec = [("Mått utfälld", f"{bredd} × {djup} × {hojd} cm (B × D × H)"),
            ("Mått hopfälld", f"{pb} × {hopf} × {hojd} cm"),
            ("Panel", f"{pb} × {djup} × {hojd} cm"),
            ("Antal paneler", str(pan)),
            ("Gångjärn", gj_spec)]
    if fot:
        spec.append(("Fothöjd", f"{fot} cm"))
    spec += [("Material", matspec), ("Färg", farg), ("Vikt", vikt),
             ("Paketmått", paketmatt),
             ("Montering", "ingen — levereras färdig"),
             ("Användning", "inomhus")]

    return dict(
        namn=f"Rumsavdelare {bredd} cm med {pan} paneler {NAMNSVANS[nyckel]}",
        slug=slug_av(nyckel),
        titel=f"Rumsavdelare {bredd} cm, {pan} paneler, {KORT[nyckel]} | Fyndplats",
        meta=(f"Rumsavdelare {bredd} × {djup} × {hojd} cm med {panelord} paneler i "
              f"{matprosa}. Vecklas ut direkt, ingen montering."),
        sokord=[("rumsavdelare", True),
                (f"rumsavdelare {pan} paneler", False),
                ("vikbar skärmvägg", False),
                (SOKORD4[g], False)],
        html=(
            P(f"En <strong>rumsavdelare</strong> med {panelord} paneler som mäter "
              f"{bredd} × {djup} × {hojd} cm utfälld. Varje panel är {pb} cm bred "
              f"och {hojd} cm hög, i {matprosa}. Den kommer färdigmonterad — vik ut "
              "den och ställ den där du vill ha den.")
            + H("Så mycket den delar av")
            + P(f"Utfälld i rak linje täcker de {panelord} panelerna {bredd} cm. I "
                "praktiken ställer man den i vinkel, och då blir den kortare men "
                "stadigare: en mjuk sicksack över en bit av rummet räcker för att "
                "skilja en arbetsplats från en soffa eller dölja en säng i ett "
                "enrumsboende.")
            + P(OVANKANT[g].format(h=hojd))
            + STADIGT + fotrad + FRISTAENDE
            + VAV_BLOCK[g](nyckel)
            + P(f"Skärmen väger {vikt} och fälls ihop till {pb} × {hopf} × {hojd} cm. "
                f"Skarvarna hålls av {gj_text}, så att sicksacken kan gå i vilken "
                "riktning rummet kräver.")
            + ocksa
            + H("Tekniska specifikationer") + UL(spec)
            + SKOTSEL[g]
            + H("Vanliga frågor")
            + F("Står den stadigt?",
                "Ja, så länge panelerna vinklas. Rakt utfälld har den inget stöd i "
                "sidled — så är en fristående vikskärm byggd. Ställ den i en mjuk "
                "sicksack, gärna med en av ändarna mot en vägg.")
            + F("Går det att se igenom den?",
                "Väven bryter blicken rakt framifrån men släpper igenom ljus. I "
                "motljus anas konturer. Den skymmer insyn, den mörklägger inte.")
            + F(*FAQ_MATERIAL[g])
            + F("Behöver den monteras?",
                "Nej. Den kommer hopfälld och färdig — du viker ut den och ställer "
                "den på plats.")
            + F("Kan den stå ute?",
                "Nej. Träet är obehandlat och skärmen är inte gjord för väder och "
                "sol över tid. På en inglasad balkong fungerar den, i regn inte.")
            + F("Hur mycket plats tar den hopfälld?",
                f"{pb} × {hopf} × {hojd} cm — en smal packe som ryms bakom en dörr "
                "eller under en säng.")
            + F(*FAQ_TVATT[g])
            + F("Vad väger den?",
                f"{vikt}. En person bär den utan problem — lyft i ramen och inte i "
                "väven.")
        ),
    )


PRODUKTER = {k: bygg(k) for k in matt.RUNDAN}

if __name__ == "__main__":
    for k in sorted(PRODUKTER, key=lambda x: (matt.GRUPPER[x], -matt.RUNDAN[x][1])):
        d = PRODUKTER[k]
        print(f"=== {matt.GRUPPER[k]} {k}")
        print(f"  namn  {len(d['namn']):>3}  {d['namn']}")
        print(f"  slug   {len(d['slug']):>2}  {d['slug']}")
        print(f"  titel {len(d['titel']):>3}  {d['titel']}")
        print(f"  meta  {len(d['meta']):>3}  {d['meta']}")
        print(f"  html  {len(d['html']):>4} tecken   syskon: {len(syskon(k))}")
