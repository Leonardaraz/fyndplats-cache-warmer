# -*- coding: utf-8 -*-
"""Runda 60 — bevisar att varje grind FAKTISKT fäller.

☠️ Varje mutation kräver ett NAMNGIVET fel, inte "någon brist". Runda 59:
en grind som letade efter ordet "fem" passerade när påståendet togs bort,
eftersom ordet stod tre gånger till i texten.
☠️ Och testet läser RETURVÄRDET från kontrollera(), inte stdout. Ett test som
läser stdout rapporterar en krasch som "godkänt".
"""
import sys, os, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import texter, lint

ORIGINAL = copy.deepcopy(texter.P)

def kor(mutation, vantad, beskrivning):
    texter.P.clear()
    texter.P.update(copy.deepcopy(ORIGINAL))
    mutation(texter.P)
    try:
        fel = lint.kontrollera()
    except Exception as e:
        return ("KRASCH", "%s: grinden kraschade — %r" % (beskrivning, e))
    traffar = [f for f in fel if vantad in f]
    if not traffar:
        return ("MISS", "%s: väntade ett fel med %r, fick %r" % (beskrivning, vantad, fel))
    return ("OK", "%s → %s" % (beskrivning, traffar[0][:96]))

MUTATIONER = [
 (lambda P: P["6edbe425"].__setitem__("html", P["6edbe425"]["html"].replace(
     "<h2>Vanliga frågor</h2>",
     "<h2>Vanliga frågor</h2><p>En kopp kokar på 5 minuter.</p>")),
  "femminuterspåståendet", "återinför 5-minuterslögnen på fyrskivorssetet"),

 (lambda P: P["1121b59a"].__setitem__("html", P["1121b59a"]["html"].replace(
     "en enskild kopp kokar på 42 sekunder", "vattnet kokar på 42 sekunder")),
  "utan att säga EN KOPP", "tar bort 'kopp' vid 42 sekunder"),

 (lambda P: P["d8c2dec6"].__setitem__("html", P["d8c2dec6"]["html"].replace(
     "en kopp kokar på 50 sekunder", "vattnet kokar på 50 sekunder")),
  "utan att säga EN KOPP", "tar bort 'kopp' vid 50 sekunder"),

 (lambda P: P["4ac902ed"].__setitem__("html", P["4ac902ed"]["html"].replace(
     "Sex lägen: uppvärmning, grillning, varmluft, rostning, bakning och fritering",
     "Sju lägen för allt du vill laga")),
  "sex lägena saknas", "byter ut raden som räknar upp de sex lägena"),

 (lambda P: P["4ac902ed"].__setitem__("html", P["4ac902ed"]["html"].replace(
     "som gör sex saker med samma vred", "med sju lägen på samma vred")),
  "påstår sju lägen", "smyger in sju lägen i ingressen"),

 (lambda P: P["6edbe425"].__setitem__("html", P["6edbe425"]["html"].replace(
     "4060 W", "mycket ström")),
  "summerade effekten", "tar bort den summerade effekten från fyrskivorssetet"),

 (lambda P: P["b330de9c"].__setitem__("html", P["b330de9c"]["html"].replace(
     "3130 W", "en del ström")),
  "summerade effekten", "tar bort den summerade effekten från bikakesetet"),

 (lambda P: P["0ceeb412"].__setitem__("html", P["0ceeb412"]["html"].replace(
     "<h2>Vanliga frågor</h2>",
     "<h2>Vanliga frågor</h2><p>Torkningsgraden är 90 %.</p>")),
  "omätbart procenttal", "återinför 90 %-talet på torkapparaten"),

 (lambda P: P["d8c2dec6"].__setitem__("html", P["d8c2dec6"]["html"].replace(
     "Färg: Grå med kopparfärgade detaljer", "Färg: Grå och rosa")),
  "saknar 'Färg:", "skriver rosa i stället för kopparfärgat"),

 (lambda P: (P["1121b59a"].__setitem__("name", "Frukostset i svart med kokare"),
             P["b330de9c"].__setitem__("name", "Frukostset i svart med bikakemönster")),
  "står också i", "låter två sidor bära samma fokussökord"),
 (lambda P: P["70b6bfe2"].__setitem__("html", P["70b6bfe2"]["html"].replace(
     "55/60/80/85/90/100 °C.</p>", "55, 60, 80, 85, 90 och 100 °C.</p>")),
  "spec-kommalista", "gör om temperaturlistan till en kommalista"),

 (lambda P: P["106eafc5"].__setitem__("html", P["106eafc5"]["html"].replace(
     "Termostat som slår av kannan", "Otter-termostat som slår av kannan")),
  "husmärke", "namnger komponentmärket i stället för funktionen"),

 (lambda P: P["4ac902ed"].__setitem__("html", P["4ac902ed"]["html"].replace(
     "<h2>Användning och skötsel</h2>",
     "<h2>Användning och skötsel</h2><p><strong>Bra att veta</strong></p>")),
  "defensivt block", "lägger in ett Bra att veta-block"),

 (lambda P: P["0ceeb412"].__setitem__("html", P["0ceeb412"]["html"].replace(
     "Yttermått: 32 × 32 × 27 cm", "Yttermått: 32 x 32 x 27 cm")),
  "mätvärdet", "byter × mot x i måttet"),

 (lambda P: P["b330de9c"].__setitem__("html", P["b330de9c"]["html"].replace(
     'href="https://www.fyndplats.se/produkt/vattenkokare-1-7-liter-gra-koppar"',
     'href="/produkt/vattenkokare-1-7-liter-gra-koppar"')),
  "relativ eller främmande länk", "gör korshänvisningen relativ"),

 (lambda P: P["106eafc5"].__setitem__("meta", P["106eafc5"]["meta"] + " " * 20 + "x" * 20),
  "meta", "gör meta-beskrivningen för lång"),
]

if __name__ == "__main__":
    utfall = [kor(m, v, b) for m, v, b in MUTATIONER]
    for status, rad in utfall:
        print("%-7s %s" % (status, rad))
    dåliga = [u for u in utfall if u[0] != "OK"]
    print()
    print("Mutationstest: %d/%d grindar bevisade." % (len(utfall) - len(dåliga), len(utfall)))
    raise SystemExit(1 if dåliga else 0)
