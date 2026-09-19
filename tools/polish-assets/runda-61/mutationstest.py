# -*- coding: utf-8 -*-
"""Runda 61 — bevisar att varje grind FAKTISKT fäller.

☠️ Varje mutation kräver ett NAMNGIVET fel, inte "någon brist". Runda 59:
en grind som letade efter ordet "fem" passerade när påståendet togs bort,
eftersom ordet stod tre gånger till i texten. Runda 60: en grind på "kopp"
uppfylldes av ordet "koppar" i meningen som sa raka motsatsen.
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

def byt(k, a, b):
    return lambda P: P[k].__setitem__("html", P[k]["html"].replace(a, b))

def lagg_till(k, text):
    return lambda P: P[k].__setitem__("html", P[k]["html"].replace(
        "<h2>Vanliga frågor</h2>", "<h2>Vanliga frågor</h2><p>" + text + "</p>"))

MUTATIONER = [
 # ── rundans säkerhetsfynd: den summerade effekten ────────────────────────
 (byt("f523b18d", "4060 W", "mycket ström"),
  "summerade effekten", "tar bort summan från det grå fyrskivorssetet"),
 (byt("2f2c1c88", "4060 W", "mycket ström"),
  "summerade effekten", "tar bort summan från det rostfria setet"),
 (byt("0ab3483a", "3130 W", "en del ström"),
  "summerade effekten", "tar bort summan från det rosa setet"),

 # ── de strukna påståendena ───────────────────────────────────────────────
 (lagg_till("83d2db1a", "En full kanna kokar på fyra minuter."),
  "fyraminuterspåståendet", "återinför fyraminuterslögnen på det gräddvita setet"),
 (lagg_till("e7f69e8a", "Kannan kokar på 4 minuter."),
  "fyraminuterspåståendet", "återinför fyraminuterslögnen på det svarta setet"),
 (lagg_till("375bb3c8", "Vattnet sjuder efter 3 min 15 sek."),
  "marknadsföringsbildens", "lyfter in bildens 3 min 15 s"),

 # ── syskonens påståenden får inte blandas ────────────────────────────────
 (lagg_till("7805b8bc", "Temperaturen ställs mellan 40–100 °C."),
  "syskonets temperaturspann", "ger svarta setet syskonets 40–100 °C"),
 (byt("2f2c1c88", "räcker till sju koppar", "räcker till sex koppar"),
  "påstår sex koppar", "byter sju koppar mot sex på det rostfria setet"),
 (byt("0ab3483a", "sex koppar te", "sju koppar te"),
  "påstår sju koppar", "byter sex koppar mot sju på det rosa setet"),

 # ── fackantal och rostlägen skiljer syskonen åt ──────────────────────────
 (byt("375bb3c8", "sex rostlägen", "sju rostlägen"),
  "påstår sju rostlägen", "ger LED-setet sju rostlägen i stället för sex"),
 (byt("83d2db1a", "sju rostlägen", "sex rostlägen"),
  "påstår sex rostlägen", "ger det gräddvita setet sex rostlägen i stället för sju"),
 (byt("f523b18d", "fyra separata fack", "två separata fack"),
  "påstår två fack", "säger två fack i en mening och fyra i en annan"),
 (lambda P: P["f523b18d"].__setitem__("html", P["f523b18d"]["html"]
     .replace("fyra separata fack", "flera fack")
     .replace("brödrosten har fyra fack", "brödrosten har flera fack")
     .replace("Fyra, i fyra separata fack", "Flera, i flera fack")
     .replace("Rostfack: fyra,", "Rostfack: flera,")),
  "har fyra fack", "tar bort fackantalet helt ur det grå setet"),

 # ── husreglerna ──────────────────────────────────────────────────────────
 (lagg_till("f523b18d", "Termostaten kommer från Strix."),
  "husmärke", "namnger termostatens varumärke"),
 (lagg_till("83d2db1a", "Artikelnummer: 800-287V90CW."),
  "artikelnummer", "skriver ut Aosoms artikelnummer"),
 (lagg_till("e7f69e8a", "Setet skickas från Tyskland."),
  "avsändarland", "skriver ut avsändarlandet"),
 (lagg_till("2f2c1c88", "Marknadens bästa frukostset."),
  "superlativ", "lägger in ett superlativ"),
 (lagg_till("375bb3c8", "Rostlägena är 1, 2, 3 och 4."),
  "spec-kommalista", "skriver en spec-lista med kommatecken"),
 (lagg_till("7805b8bc", "Setet är CE-märkt och uppfyller EN 60335."),
  "ogrundad certifiering", "påstår en certifiering utan underlag"),
 (lagg_till("0ab3483a", "Wasserkocher und Toaster."),
  "utländskt ord", "lämnar kvar tyska i texten"),
 (lagg_till("f523b18d", "Family-size Crumb Tray."),
  "utländskt ord", "lämnar kvar ENGELSKA i texten"),

 # ── strukturen ───────────────────────────────────────────────────────────
 (byt("83d2db1a", "<li>Vikt: 3 kg tillsammans</li>", "<li>Vikt: lätt</li>"),
  "mätvärdet '3 kg' saknas", "tar bort vikten ur spec-tabellen"),
 (byt("e7f69e8a", "Färg: Svart med förkromade detaljer", "Färg: Mörk"),
  "saknar 'Färg:", "suddar färgraden"),
 (byt("2f2c1c88", "frukostset-gratt-fyrskivig", "frukostset-som-inte-finns"),
  "okänd slug", "länkar till en slug som inte finns"),
 (lambda P: P["0ab3483a"].__setitem__("meta", P["0ab3483a"]["meta"] + " " * 40),
  "meta", "drar metabeskrivningen över 155 tecken"),
 (lambda P: P["e7f69e8a"].__setitem__("name", "Frukostset i gräddvitt fast svart"),
  "står också i", "låter två sidor bära samma fokussökord"),
]

if __name__ == "__main__":
    utfall = [kor(*m) for m in MUTATIONER]
    for status, rad in utfall:
        print("%-7s %s" % (status, rad))
    dåliga = [u for u in utfall if u[0] != "OK"]
    print()
    print("Mutationstest: %d/%d grindar fäller." % (len(utfall) - len(dåliga), len(utfall)))
    raise SystemExit(1 if dåliga else 0)
