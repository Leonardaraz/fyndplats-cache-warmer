# Bygger runda N1:s fyra egna Fyndplats-kort — ett måttkort per produkt som
# FÖRLORADE sin måttritning till en tysk banner (se FOTOFYND.md).
#
# ☠️ FOTNOTEN CITERAR INTE KÄLLAN. KORTLACKAN.md: nio publicerade kort bär
# Aosoms artikelnummer i pixlarna, för att den som byggde dem angav sin
# källa. Gott hantverk överallt utom här — ingen textgrind kan läsa en
# sträng som ligger i en JPEG. Fotnoten säger därför bara vad kortet ÄR.
#
# Raderna är hämtade ur produktens EGEN spec-flik, inte ur en mall och inte
# ur grannens kort. Två av de fyra (45e68631 och 59aeb88a) är båda breda
# manchestersoffor — deras rubriker säger därför ut vad som SKILJER dem.
import sys; sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

U = lambda t, u: f'{t}&nbsp;<span class=u>{u}</span>'

KORT = {
 "b99570fd": dict(
   kicker="MODULSOFFA 146 CM", titel="Två fristående moduler, 62 cm sittdjup",
   farg="gräddvitt konstläder",
   rader=[("Mått", U("146 × 85 × 78", "cm")), ("Sits", U("146 × 62 × 40", "cm")),
          ("Sittdyna", U("15", "cm tjock")), ("Ryggdyna", U("18", "cm tjock")),
          ("Ryggens höjd", U("40", "cm")), ("Benhöjd", U("3", "cm")),
          ("Bärförmåga", U("240", "kg")), ("Vikt", U("28,5", "kg"))]),
 "617ce9ff": dict(
   kicker="TVÅSITSSOFFA 117 CM", titel="Bara 117 cm bred, med vingrygg",
   farg="beige chenille, ben i gummiträ",
   rader=[("Mått", U("117 × 65 × 78,5", "cm")), ("Sits", U("112 × 50 × 48", "cm")),
          ("Sittdyna", U("23", "cm tjock")), ("Rygg över sitsen", U("38", "cm")),
          ("Ryggens tjocklek", U("10", "cm")), ("Benhöjd", U("24", "cm")),
          ("Kuddar som ingår", U("2 × 43 × 33 × 13", "cm")), ("Bärförmåga", U("220", "kg"))]),
 "45e68631": dict(
   kicker="TRESITSSOFFA 218 CM", titel="Fickfjädring i sitsen och 50 cm sitthöjd",
   farg="ljusgrå manchester",
   rader=[("Mått", U("218 × 79 × 91", "cm")), ("Sits", U("175 × 49 × 50", "cm")),
          ("Sittdyna", U("18", "cm tjock")), ("Ryggkudde", U("89 × 47 × 27", "cm")),
          ("Armstöd", U("20,5 × 74,5", "cm")), ("Armstöd över golv", U("63", "cm")),
          ("Bärförmåga", U("360", "kg")), ("Vikt", U("54,8", "kg"))]),
 "59aeb88a": dict(
   kicker="TRESITSSOFFA 212 CM", titel="Stålram för 450 kg och 56 cm sittdjup",
   farg="krämvit manchester",
   rader=[("Mått", U("212 × 80 × 88", "cm")), ("Sits", U("176 × 56 × 45", "cm")),
          ("Sittdyna", U("16", "cm tjock")), ("Ryggkudde", U("88 × 40", "cm")),
          ("Armstöd", U("74 × 17", "cm")), ("Armstöd över sitsen", U("14", "cm")),
          ("Bärförmåga", U("450", "kg")), ("Vikt", U("53,4", "kg"))]),
}

namn = []
for pid, k in KORT.items():
    ck.hero_white(f"orig/{pid}.jpg", f"out/{pid}-hjalte.jpg")
    ck.card_spec(f"{pid}-spec", f"out/{pid}-hjalte.jpg", k["kicker"],
                 k["titel"], k["rader"], note=f'måtten i klartext · {k["farg"]}')
    namn.append(f"{pid}-spec")
print(ck.render(namn))
