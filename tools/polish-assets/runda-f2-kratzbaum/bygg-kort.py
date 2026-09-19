# Bygger runda F2:s åtta egna Fyndplats-kort (Steg 9, ett spec-kort per produkt).
#
# Till skillnad från runda F1 är de åtta INTE tre familjer utan åtta olika
# produkter, så varje kort har sin egen radlista. Raderna är hämtade ur
# produktens EGEN spec-tabell i <id>.html — inte ur en mall, och inte ur
# grannens kort.
#
# ⚠️ 70f4481a och d82beee4 är ett storlekspar (140 mot 160 cm) och ser nästan
# likadana ut på bild. Kortens rubriker säger därför ut vad som SKILJER dem —
# hålornas höjd (25 mot 29 cm) och stegens längd (32 mot 43 cm) — i stället
# för att upprepa det som är lika. Ett kort som inte skiljer syskonen åt är
# ett kort som inte gör någon nytta.
#
# Kör från en scratchpad-katalog med huvudbilderna i ./orig/<kort>.jpg,
# hämtade på mediaId ur steg8.tsv.
import sys; sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

U = lambda t, u: f'{t}&nbsp;<span class=u>{u}</span>'

KORT = {
 "68f7d530": dict(
   kicker="KATTORN 192 CM", titel="Två hålor, två hängmattor och en ramp upp",
   farg="ljusgrå + krämvit",
   rader=[("Höjd", U("192", "cm")), ("Golvyta", U("48 × 48", "cm")),
          ("Nedre håla", U("34 × 30 × 30", "cm")), ("Övre håla", U("30 × 30 × 30", "cm")),
          ("Bädd överst", U("Ø30 × 13", "cm")), ("Plattformar", U("4", "st")),
          ("Stolpens diameter", U("6,5", "cm")), ("Klösyta", "Sisal på stolparna")]),
 "a65a39f1": dict(
   kicker="KATTORN 206 CM FÖR HÖRNET", titel="Två hus, två hängmattor och en klösbräda",
   farg="mörkgrå + krämvit",
   rader=[("Höjd", U("206", "cm")), ("Golvyta", U("60 × 50", "cm")),
          ("Nedre hus", U("48 × 30 × 28,5", "cm")), ("Övre hus", U("Ø30 × 30", "cm")),
          ("Hängmattor", U("50 × 45 och Ø35", "cm")), ("Klösbräda", U("30 × 20", "cm")),
          ("Maxlast", U("18", "kg")), ("Klösyta", "Sisal och klösbräda")]),
 "39ec9d58": dict(
   kicker="TAKSPÄNT KLÖSTRÄD", titel="Golv till tak, 240–260 cm",
   farg="mörkgrå",
   rader=[("Höjd", U("240–260", "cm")), ("Golvyta", U("60 × 45", "cm")),
          ("Sovhålor", U("2 × 45 × 35 × 25", "cm")), ("Hålornas öppning", U("18 × 18", "cm")),
          ("Hängmattor", U("2", "st")), ("Maxlast", U("cirka 10", "kg")),
          ("Rekommenderad kattvikt", U("upp till 5", "kg")), ("Klösyta", "Sisal på stammarna")]),
 "0801a975": dict(
   kicker="KATTORN 148 CM", titel="Håla med rund öppning och bädd överst",
   farg="beige",
   rader=[("Höjd", U("148", "cm")), ("Golvyta", U("45 × 40", "cm")),
          ("Plan nedifrån", U("25 × 20, 36 × 28, Ø30", "cm")), ("Hålans öppning", U("Ø18", "cm")),
          ("Maxlast totalt", U("30", "kg")), ("Maxlast i hålan", U("4,5", "kg")),
          ("Stolpens diameter", U("6,8", "cm")), ("Klösyta", "Sisal på stolparna")]),
 "55dc854b": dict(
   kicker="TAKSPÄNT KLÖSTRÄD I FEM PLAN", titel="Bär 30 kg — två till tre katter",
   farg="mörkgrå",
   rader=[("Höjd", U("220–265", "cm")), ("Golvyta", U("55 × 45", "cm")),
          ("Kattbox", U("52 × 40 × 30", "cm")), ("Plan uppåt", U("35 × 28 och 3 × 40 × 30", "cm")),
          ("Maxlast", U("30", "kg")), ("Största takhöjd", U("265", "cm")),
          ("Klädsel", "Kortplysch 400 g/m²"), ("Klösyta", "Sisal på stammarna")]),
 "d82beee4": dict(
   kicker="KATTORN 160 CM", titel="Två hålor, hängmatta och stege på 43 cm",
   farg="beige + krämvit",
   rader=[("Höjd", U("160", "cm")), ("Golvyta", U("48 × 48", "cm")),
          ("Nedre håla", U("30 × 30 × 29", "cm")), ("Övre håla", U("45 × 30 × 29", "cm")),
          ("Hängmatta", U("Ø30", "cm")), ("Stege", U("43 × 18", "cm")),
          ("Maxlast", U("15", "kg")), ("Rekommenderad kattvikt", U("under 5", "kg"))]),
 "70f4481a": dict(
   kicker="KATTORN 140 CM", titel="Lägre syskon — grundare hålor och kortare stege",
   farg="beige + krämvit",
   rader=[("Höjd", U("140", "cm")), ("Golvyta", U("48 × 48", "cm")),
          ("Nedre håla", U("30 × 30 × 25", "cm")), ("Övre håla", U("45 × 30 × 25", "cm")),
          ("Hängmatta", U("Ø30", "cm")), ("Stege", U("32 × 18", "cm")),
          ("Maxlast", U("15", "kg")), ("Rekommenderad kattvikt", U("under 5", "kg"))]),
 "ab6c0b93": dict(
   kicker="SMALT KLÖSTRÄD", titel="Bara 37 × 21 cm i golvyta",
   farg="grön + gul",
   rader=[("Höjd", U("202–242", "cm")), ("Golvyta", U("37 × 21", "cm")),
          ("Sittplan", U("37 × 21", "cm")), ("Stolpens diameter", U("9,6", "cm")),
          ("Vikt", U("7,2", "kg")), ("Rekommenderad kattvikt", U("under 5", "kg")),
          ("Klädsel", "ABS-plast med konstgjorda blad"), ("Klösyta", "Jutesnöre på stolparna")]),
}

namn = []
for pid, k in KORT.items():
    ck.hero_white(f"orig/{pid}.jpg", f"out/{pid}-hjalte.jpg")
    ck.card_spec(f"{pid}-spec", f"out/{pid}-hjalte.jpg", k["kicker"],
                 k["titel"], k["rader"], note=f'mätt på produkten · {k["farg"]}')
    namn.append(f"{pid}-spec")
print(ck.render(namn))
