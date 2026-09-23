# -*- coding: utf-8 -*-
"""Runda 63 — muterar texten och kräver att grinden FÄLLER.

☠️ En grind som aldrig setts fälla är inte mätt, bara skriven. Runda 62 hade
fyra mutationer som INTE fångades, och alla fyra var fel i mutationen: den rörde
bara HTML:en medan grinden läser fyra bärare (namn, titel, meta, brödtext).

⚠️ En mutation som inte TAR BORT påståendet prövar ingenting (runda 59: "fem"
stod tre gånger till). Rätta därför per ORD, i alla bärare.
"""
import copy
import re
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import lint      # noqa: E402
import texter    # noqa: E402


def med(kort, **falt):
    """Kopierar batchen och byter fält på EN produkt."""
    ut = copy.deepcopy(texter.PRODUKTER)
    for p in ut:
        if p["kort"] == kort:
            p.update(falt)
    return ut


def ersatt(kort, gammalt, nytt, aven_rubriker=True):
    """Byter en sträng ÖVERALLT i produkten — brödtext, egenskaper, spec, FAQ,
    och (om aven_rubriker) namn, titel och meta. Det är den formen som prövar
    grinden; en mutation i bara ett fält lämnar påståendet kvar i de andra."""
    ut = copy.deepcopy(texter.PRODUKTER)
    for p in ut:
        if p["kort"] != kort:
            continue
        for f in ("ingress",):
            p[f] = p[f].replace(gammalt, nytt)
        for f in ("eg", "spec", "skotsel"):
            p[f] = [r.replace(gammalt, nytt) for r in p[f]]
        p["faq"] = [(q.replace(gammalt, nytt), a.replace(gammalt, nytt))
                    for q, a in p["faq"]]
        if p.get("villkor"):
            p["villkor"] = p["villkor"].replace(gammalt, nytt)
        if aven_rubriker:
            for f in ("name", "title", "meta"):
                p[f] = p[f].replace(gammalt, nytt)
    return ut


def kor(produkter):
    fel = []
    for p in produkter:
        fel += lint.granska(p)
    fel += lint.batchgrindar(produkter)
    fel += lint.korsgrind(produkter)
    return fel


MUTATIONER = [
    # (namn, muterad batch)
    ("plast kallas rotting rakt av",
     ersatt("b3672df6", "konstrotting", "rotting")),
    ("plast kallas rotting i EN spec-rad",
     med("ad90a1cc", spec=[r.replace("PE-konstrotting", "äkta rotting")
                           for r in next(p for p in texter.PRODUKTER
                                         if p["kort"] == "ad90a1cc")["spec"]])),
    ("naturgräset kallas rotting",
     ersatt("e16338a9", "vattenhyacintgräs", "rotting")),
    ("fotpallen påstår flätat material",
     ersatt("d82950a3", "sammetslook", "vattenhyacint")),
    ("MDF döljs",
     ersatt("d82950a3", "MDF", "massivt trä")),

    ("tvättbar kudde påstås där leverantören säger nej",
     ersatt("165471af", "Nej. Leverantören anger uttryckligen att den tjocka "
                        "kudden inte är tvättbar — borsta av den och vädra den "
                        "i stället.",
            "Ja, kudden dras ur och tvättas i maskin.")),
    ("tvättbarhet påstås där källan tiger",
     ersatt("f6e3098e", "Mjuk kudde på Ø32 cm i bomull",
            "Mjuk kudde på Ø32 cm, tvättbar i maskin")),

    ("monterad produkt sägs komma färdig",
     ersatt("e16338a9", "Ja, den kommer platt i kartong och skruvas ihop.",
            "Nej, den levereras färdig.")),
    ("färdig produkt sägs behöva monteras",
     ersatt("b3672df6", "Nej, den kommer färdig i ett paket på 51 × 51 × 26 cm.",
            "Ja, den skruvas ihop på plats.")),

    ("fel lasttal",
     ersatt("b3672df6", "10 kg", "20 kg")),
    ("lasttal på den vars källa motsäger sig själv",
     ersatt("f6e3098e", "Leverantörens uppgifter om vikt går isär, så vi anger "
                        "ingen maxlast här.",
            "Maxlasten är 10 kg.")),

    ("utomhusbruk påstås på flätat naturgräs",
     ersatt("73cb432c", "Nej. Vattenhyacint och obehandlat trä tål inte väta.",
            "Ja, den fungerar lika bra på altanen.")),

    ("fotpallen säljs som sittplats",
     ersatt("d82950a3", "Nej. Ovansidan bär 30 kg och pallen är avsedd för "
                        "fötterna.",
            "Ja, det går utmärkt att sitta på den.")),
    ("lastgränsens rubrik tas bort",
     med("d82950a3", villkor="")),
    ("den uttryckliga förnekelsen tas bort",
     med("d82950a3", villkor=next(p for p in texter.PRODUKTER
                                  if p["kort"] == "d82950a3")["villkor"]
         .replace("<strong>inte</strong> en sittplats", "en sittplats"))),

    ("korshänvisning med FEL lasttal om syskonet",
     ersatt("d82950a3", "som bär 80 kg", "som bär 30 kg")),
    ("korshänvisning kallar ett plastsyskon vattenhyacint",
     ersatt("f6e3098e", "kattkoja i vattenhyacint", "kattkoja i konstrotting")),
    ("korshänvisning till en slug som inte finns",
     ersatt("b3672df6", "kattigloo-flatad-50-cm", "kattigloo-som-inte-finns")),

    ("artikelnumret i texten",
     ersatt("ad90a1cc", "Färg: ljusbrun", "Artikelnummer: 845-030CG")),
    ("relativ länk",
     ersatt("b3672df6", "https://www.fyndplats.se/produkt/kattigloo-flatad-50-cm",
            "/produkt/kattigloo-flatad-50-cm")),
    ("land utskrivet",
     ersatt("165471af", "Trebent stativ", "Trebent stativ från Tyskland")),
    ("husmärke",
     ersatt("1ed0d9cb", "Klotformad grotta", "PawHut klotformad grotta")),
    ("tyskt ord",
     ersatt("e16338a9", "Två kuddar, båda tvättbara",
            "Zwei Kissen, beide waschbar")),
    ("superlativ",
     ersatt("73cb432c", "Rund pall", "Marknadens bästa runda pall")),
    ("medicinskt påstående",
     ersatt("ad90a1cc", "drar sig undan", "lindrar stress och drar sig undan")),

    ("titeln blir identisk med namnet",
     med("b3672df6", title=next(p for p in texter.PRODUKTER
                                if p["kort"] == "b3672df6")["name"])),
    ("namnet blir för långt",
     med("b3672df6", name="Kattbädd " + "med kattöron " * 8)),
    ("sökordet försvinner ur sluggen",
     med("ad90a1cc", slug="flatad-korg-50-cm")),
    ("två sidor får samma slug",
     med("f6e3098e", slug="kattbadd-med-kattoron-50-cm")),
    ("två sidor får samma sökord",
     med("1ed0d9cb", sokord="kattigloo",
         name="Kattigloo upphöjd 58 cm – klotformad korg på ben, tål 10 kg",
         title="Upphöjd kattigloo 58 cm på ben | Fyndplats")),

    ("decimalpunkt",
     ersatt("73cb432c", "44 × 43 × 42 cm", "44.0 × 43 × 42 cm")),
    ("x i stället för ×",
     ersatt("e16338a9", "36 × 36 cm", "36 x 36 cm")),
    ("<br> i beskrivningen",
     ersatt("b3672df6", "Levereras färdig", "Levereras<br>färdig")),
]


def avtryck(batch):
    """Varje fält NÅGON grind läser, som en jämförbar sträng.

    ☠️ Ett första utkast tog bara namn, titel, meta och brödtext. Då såg två
    ÄKTA mutationer (slug-krock och tappat sökord i sluggen) ut som tomma —
    fältet de rörde ingick inte i avtrycket. Tomhetskontrollen måste täcka
    exakt de fält grindarna läser, annars blir den själv ett falsklarm."""
    return "\x1f".join(p["name"] + p["title"] + p["meta"] + p["slug"]
                       + p["sokord"] + p["sku"] + texter.bygg(p)
                       for p in batch)


def main():
    if kor(texter.PRODUKTER):
        print("☠️ OMUTERAD BATCH FÄLLER — grinderna är trasiga. Avbryter.")
        return 1
    print("Omuterad batch: ren.\n")
    original = avtryck(texter.PRODUKTER)
    missade, tomma = [], []
    for namn, batch in MUTATIONER:
        # ☠️ EN MUTATION SOM INTE ÄNDRAR NÅGOT PRÖVAR INGENTING, och den ser
        #    ut exakt som en missad grind. Runda 62 hade fyra sådana och
        #    letade efter hål i grindarna som inte fanns. Här fälls den som
        #    ett eget fel i stället, med sitt eget namn.
        if avtryck(batch) == original:
            print("  TOM    %s  — texten är oförändrad" % namn)
            tomma.append(namn)
            continue
        fel = kor(batch)
        status = "fälld " if fel else "MISSAD"
        print("  %s  %s" % (status, namn))
        if not fel:
            missade.append(namn)
        elif len(sys.argv) > 1 and sys.argv[1] == "-v":
            print("        %s" % fel[0])
    print()
    print("%d av %d mutationer fångade, %d tomma."
          % (len(MUTATIONER) - len(missade) - len(tomma), len(MUTATIONER),
             len(tomma)))
    for m in missade:
        print("MISSAD:", m)
    for m in tomma:
        print("TOM MUTATION:", m)
    return 1 if (missade or tomma) else 0


if __name__ == "__main__":
    raise SystemExit(main())
