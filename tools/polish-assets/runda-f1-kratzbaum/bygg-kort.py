# Bygger runda F1:s åtta egna Fyndplats-kort (Steg 9, ett spec-kort per produkt).
# Kör från en scratchpad-katalog med produkternas huvudbilder i ./orig/<id>.jpg —
# adresserna hämtas ur live/<id>.html:s og:image.
import sys; sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

U = lambda t, u: f'{t}&nbsp;<span class=u>{u}</span>'

FAMILJ = {
 "A": dict(kicker="TAKHÖGT KLÖSTRÄD", titel="Golv till tak på 43 × 27 cm golvyta",
   rader=[("Höjd", U("228–260", "cm")), ("Golvyta", U("43 × 27", "cm")),
          ("Plan, inkl. golvplattan", U("4", "st")), ("Justerbart spännrör", U("32", "cm")),
          ("Pelarens diameter", U("9,5", "cm")), ("Stomme", "Spånskiva E1"),
          ("Klädsel", "Plyschliknande polyester"), ("Klösyta", "Sisal på stolpen")],
   note="mätt på produkten"),
 "B": dict(kicker="KLÖSTRÄD I FEM PLAN", titel="Fem plan mellan golv och tak",
   rader=[("Höjd", U("230–260", "cm")), ("Golvyta", U("40 × 34", "cm")),
          ("Plan, inkl. golvplattan", U("5", "st")), ("Maxlast totalt", U("15", "kg")),
          ("Maxlast per plan", U("8", "kg")), ("Stomme", "Spånskiva P2"),
          ("Klädsel", "Kortplysch"), ("Klösyta", "Sisal på mittenstammen")],
   note="mätt på produkten"),
 "C": dict(kicker="KLÖSTUNNA 100 CM", titel="Två grottor och en bädd överst",
   rader=[("Höjd", U("100", "cm")), ("Golvyta", U("59 × 35", "cm")),
          ("Grotta, per styck", U("Ø30 × 28", "cm")), ("Ingång", U("Ø16", "cm")),
          ("Bädd överst", U("Ø36 × 7", "cm")), ("Rekommenderad kattvikt", U("under 5", "kg")),
          ("Klädsel", "Plysch, 100 % polyester"), ("Klösyta", "Sisalrep på stolparna")],
   note="mätt på produkten"),
}

PRODUKTER = [
 ("75391d11", "A", "beige"), ("8db487c1", "A", "grå"), ("6f0b43f0", "A", "ljusbrun"),
 ("62f7cf98", "B", "beige"), ("75293096", "B", "grå"), ("8ab169e8", "B", "mörkbrun"),
 ("c802ac19", "C", "cremevit"), ("cc31a73b", "C", "grå"),
]

namn = []
for pid, fam, farg in PRODUKTER:
    f = FAMILJ[fam]
    ck.hero_white(f"orig/{pid}.jpg", f"out/{pid}-hjalte.jpg")
    ck.card_spec(f"{pid}-spec", f"out/{pid}-hjalte.jpg", f["kicker"],
                 f["titel"], f["rader"], note=f'{f["note"]} · {farg}')
    namn.append(f"{pid}-spec")
print(ck.render(namn))
