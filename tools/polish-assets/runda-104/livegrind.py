# -*- coding: utf-8 -*-
import re, sys, html, subprocess, time, texter

BAS = "https://www.fyndplats.se/produkt/"
SIDOR = [(s["slug"], pid, s) for pid, s in texter.SIDOR.items()]
KONTROLL = "elbil-barn-polisbil-12v-fjarrkontroll"   # publicerad grannsida, samma klass

def hamta(slug):
    # ☠️ En ISR-sida måste hämtas TVÅ gånger — den första är väckningen.
    ut = ""
    for i in range(2):
        r = subprocess.run(["curl","-s","--max-time","40", BAS+slug],
                           capture_output=True, text=True)
        ut = r.stdout
        if i == 0: time.sleep(3)
    return ut

def synlig(h):
    h = re.sub(r"<script[^>]*>.*?</script>", " ", h, flags=re.S)
    h = re.sub(r"<style[^>]*>.*?</style>", " ", h, flags=re.S)
    h = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", html.unescape(h))

AKTOR = re.compile(r"(?<![A-Za-zÅÄÖåäö0-9])(leverantör\w*|tillverkar\w*|producent\w*|"
                   r"importör\w*|grossist\w*|fabrikant\w*|distributör\w*)"
                   r"(?![A-Za-zÅÄÖåäö0-9])", re.I)
ARTNR = re.compile(r"\b\d{3}-\d{3}[A-Z0-9]{3,}\b")
MARKE = re.compile(r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|AliExpress|Vinsetto", re.I)
TYSKA = re.compile(r"(?<![A-Za-zÅÄÖåäö])(Elektroauto|Kinder|Fernbedienung|Hupe|Gurt|"
                   r"Kunststoff|Blau|Gelb|Grau|Weiß|Multifarben|Jahre)"
                   r"(?![A-Za-zÅÄÖåäö])")
LAND  = re.compile(r"(?<![A-Za-zÅÄÖåäö])(Tyskland|Spanien|Kina|Polen)(?![A-Za-zÅÄÖåäö])")
OSYNLIGA = {"­":"U+00AD","​":"U+200B","﻿":"U+FEFF"}

print("Hämtar kontrollsidan …")
ktext = synlig(hamta(KONTROLL))
kontroll = {}
for rx, namn in ((AKTOR,"aktör"),(ARTNR,"artnr"),(MARKE,"märke"),(TYSKA,"tyska"),(LAND,"land")):
    kontroll[namn] = set(map(str, rx.findall(ktext)))
KONTROLL_SYSKON = []   # kontrollsidan är inte syskon här
print("  kontrollsidans egna träffar (dras bort):", {k:v for k,v in kontroll.items() if v})
saknade_syskon = [s for s in KONTROLL_SYSKON if s not in ktext]
print("  kontrollsidans syskonlänkar saknas:", saknade_syskon or "inga — alla tre finns")

FEL = []
for slug, pid, s in SIDOR:
    print("\n=== %s (%s) ===" % (slug, pid[:8]))
    rå = hamta(slug)
    txt = synlig(rå)
    if len(txt) < 3000:
        FEL.append("%s: sidan är bara %d tecken — troligen 404/fel" % (slug, len(txt))); continue

    for rx, namn in ((AKTOR,"aktör"),(ARTNR,"artnr"),(MARKE,"märke"),(TYSKA,"tyska"),(LAND,"land")):
        träff = set(map(str, rx.findall(txt))) - kontroll[namn]
        if träff: FEL.append("%s: %s %r" % (slug, namn, sorted(träff)))
    for ch, n in OSYNLIGA.items():
        if ch in txt: FEL.append("%s: osynligt tecken %s" % (slug, n))

    # ORDAGRANN meningsjämförelse mot den grindade filen
    # ☠️ Taggarna ersätts med MELLANSLAG, inte med tomt. Utan det blir
    # "135 kg.</p><h3>Åtta punkter" till "135 kg.Åtta punkter" — en mening
    # som aldrig funnits, och grinden fäller fjorton korrekta stycken.
    ren = re.sub(r"<[^>]+>", " ", s["brod"])
    ren = html.unescape(re.sub(r"\s+", " ", ren))
    meningar = [m.strip() for m in re.split(r"(?<=[.!?])\s+", ren) if len(m.strip()) > 25]
    saknas = [m for m in meningar if m not in txt]
    print("  meningar: %d, saknas: %d" % (len(meningar), len(saknas)))
    for m in saknas[:6]:
        FEL.append("%s: MENING SAKNAS PÅ SIDAN: %r" % (slug, m[:90]))

    # nyckelfakta ordagrant
    for f in ["96 × 61 × 56 cm", "3–5 år", "30 kg", "3–7 km/h", "15 m", "12 V, 4,5 Ah"]:
        if f not in txt: FEL.append("%s: saknar %r" % (slug, f))
    # ☠️ 3-8 år står i bildernas alt-text men saknar stöd i spec OCH ritning.
    # Och obelagda överensstämmelsepåståenden får aldrig nå en kundsida.
    for f in ["3–8 år", "3-8 år", "CE-godkänd", "certifierad", "EN 71", "giftfri"]:
        if f in txt: FEL.append("%s: ☠️ obelagt/felaktigt: %r" % (slug, f))
    # färgen och syskonlänkarna
    if s["farg"].lower() not in txt.lower():
        FEL.append("%s: färgen %r syns inte" % (slug, s["farg"]))
    print("  namn på sidan:", s["namn"] in txt)
    if s["namn"] not in txt: FEL.append("%s: produktnamnet syns inte" % slug)

print("\n" + "="*60)
if saknade_syskon:
    FEL.append("KONTROLLSIDAN (svart, publicerad): syskonlänkar syns inte \u00e4nnu: %r "
               "\u2014 ISR-cachen kan ligga kvar; l\u00e4s om om n\u00e5gra minuter" % saknade_syskon)
if FEL:
    print("%d FEL:" % len(FEL))
    for f in FEL: print("  ", f)
    sys.exit(1)
print("✅ LIVE-GRINDEN GRÖN — 3 sidor, 0 fel")
