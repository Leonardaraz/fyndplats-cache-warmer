# -*- coding: utf-8 -*-
"""Bevisar att live-grindens hamta() VÄNTAR UT en STALE-rad.

Runda 60: alla åtta nyss publicerade sidor svarade `404 x-vercel-cache: STALE
age: 1410` medan Wix samtidigt sa `visible: true` på rätt slug. Den gamla
grinden gjorde två hämtningar i rad och tog den andra som mätning — men
omvalideringen är ASYNKRON och hann inte klart emellan, så grinden fällde åtta
korrekt publicerade sidor.

Tre grenar, och alla tre behövs: väntan får inte utebli på en STALE-rad, den
får inte KOSTA något på en färsk sida, och en äkta 404 ska falla direkt i
stället för att väntas ut i fem minuter per produkt.
"""
import sys, os

HAR = os.path.dirname(os.path.abspath(__file__))
kalla = open(os.path.join(HAR, "live.py"), encoding="utf-8").read()
m = type(sys)("livemod")
m.__dict__["__file__"] = os.path.join(HAR, "live.py")
# Bara definitionerna — huvudloopen hämtar skarpa sidor och ska inte köras här.
exec(compile(kalla.split("fel, rader = [], []")[0], "live.py", "exec"), m.__dict__)
m.time.sleep = lambda s: None

fel = []

svar = [("404", "1410", "STALE", ""), ("404", "1410", "STALE", ""),
        ("200", "3", "MISS", "<html>klar</html>")]
rundor = []
m.en_hamtning = lambda slug, n: (rundor.append(n), svar[min(n, len(svar) - 1)])[1]
status, _, cache, _ = m.hamta("nagon-slug")
if rundor != [0, 1, 2] or (status, cache) != ("200", "MISS"):
    fel.append("A: STALE väntades inte ut — %r, slutade på %s %s"
               % (rundor, status, cache))

rundor2 = []
m.en_hamtning = lambda slug, n: (rundor2.append(n), ("200", "5", "HIT", "x"))[1]
if m.hamta("s")[0] != "200" or rundor2 != [0]:
    fel.append("B: en färsk sida kostade %d hämtningar" % len(rundor2))

rundor3 = []
m.en_hamtning = lambda slug, n: (rundor3.append(n), ("404", "0", "MISS", "x"))[1]
if m.hamta("s")[0] != "404" or rundor3 != [0]:
    fel.append("C: en äkta 404 väntades ut i stället för att fällas")

for f in fel:
    print("FEL:", f)
print("Väntan: alla tre grenar stämmer." if not fel
      else "VÄNTETESTET FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
