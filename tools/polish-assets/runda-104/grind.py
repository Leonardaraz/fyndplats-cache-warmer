# -*- coding: utf-8 -*-
import re, hashlib, sys, texter

FEL = []
def fel(pid, msg): FEL.append("%s: %s" % (pid[:8], msg))

AKTOR = re.compile(r"(?<![A-Za-zÅÄÖåäö0-9])(leverantör\w*|tillverkar\w*|producent\w*|"
                   r"importör\w*|grossist\w*|fabrikant\w*|distributör\w*)"
                   r"(?![A-Za-zÅÄÖåäö0-9])", re.I)
ARTNR   = re.compile(r"\b\d{3}-\d{3}[A-Z0-9]{3,}\b")
MARKE   = re.compile(r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|AliExpress|Vinsetto", re.I)
LAND    = re.compile(r"(?<![A-Za-zÅÄÖåäö])(Tyskland|Spanien|tysk[a]?|spansk[a]?|Kina|kines\w*|"
                     r"Polen|EU-lager|lagerland)(?![A-Za-zÅÄÖåäö])", re.I)
TYSKA   = re.compile(r"\b(und|mit|der|die|das|für|Sessel|Farbe|Maße|ca\.|bis zu|Modi)\b")
PRIS    = re.compile(r"\b(kr|kronor|SEK|billig\w*|prisvärd\w*|rabatt\w*|kampanj\w*)\b", re.I)
JARGONG = re.compile(r"\b(rundan|batch\w*|utkast|polering\w*|mappning\w*)\b", re.I)
ARTNR_ETIKETT = re.compile(r"(Artikelnummer|Modellreferens|Artikelnr|Referens)\s*:", re.I)
# ☠️ Obelagda överensstämmelsepåståenden. Produkterna ÄR CE-märkta (Leonards
# besked), men vi har inte certifikatet att citera — och ett påstående vi inte
# kan lägga fram underlag för är ett eget fel oavsett om det råkar vara sant.
OBELAGT = re.compile(r"(CE-godk\w+|EU-godk\w+|s\u00e4kerhetsgodk\w+|certifierad\w*|"
                     r"uppfyller EN ?\d|EN ?71|EN ?62115|giftfri\w*|ftalatfri\w*|"
                     r"BPA-fri\w*|brandsäker\w*|flamsäker\w*|testad av oberoende)", re.I)
# ☠️ Får aldrig antyda att åkleksaken får framföras i trafik
TRAFIK = re.compile(r"(vägtrafikgodk\w+|godkänd för trafik|får köras på (trottoar|gata|väg))", re.I)
OSYNLIGA = {"­":"U+00AD mjukt bindestreck","​":"U+200B",
            "﻿":"U+FEFF"," ":"U+00A0 hårt mellanslag"}
# Kända felstavningar huset redan betalat för
STAVFEL = ["dögnsvarv","engangsjobb","ihopsattningen","för hard","Dynstjocklek",
           "massagefatölj","fåtolj","landvarme","konstlader","mugghallare"]

# Fakta som MÅSTE stämma med ritningen — inga andra tal får förekomma i den rollen
MASTE = ["96 × 61 × 56 cm", "36 cm bred", "18 cm djup", "Ø 24 cm", "3–5 år",
         "30 kg", "3–7 km/h", "15 m", "2 × 12 V, 25 W", "12 V, 4,5 Ah",
         "8–12 timmar", "45 minuter", "15,6 kg", "90 × 53 × 29 cm"]
# ☠️ 3-8 år står i bildernas alt-text men saknar stöd i spec OCH ritning.
# Ritningen är facit. Samma sak med talen från grannmodellerna.
FORBJUDNA_TAL = ["3–8 år", "3-8 år", "100 × 64", "106,5", "98 × 59", "25 kg",
                 "3–5 km/h", "6 km/h", "8 km/h"]

kroppar = {}
for pid, s in texter.SIDOR.items():
    txt = s["brod"]
    kroppar[pid] = hashlib.sha256(txt.encode()).hexdigest()[:12]
    allt = txt + " " + s["namn"] + " " + s["seoTitle"] + " " + s["seoDesc"] + " " + " ".join(s["alt"])

    for rx, vad in ((AKTOR,"aktörsord"), (ARTNR,"artikelnummer"), (MARKE,"husmärke"),
                    (OBELAGT,"OBELAGT överensstämmelsepåstående"), (TRAFIK,"trafikpåstående"),
                    (LAND,"land/lagerland"), (PRIS,"prisord"), (JARGONG,"intern jargong"),
                    (ARTNR_ETIKETT,"artikelnummer-etikett")):
        m = rx.findall(allt)
        if m: fel(pid, "%s: %r" % (vad, sorted(set(map(str, m)))[:4]))
    for t in TYSKA.findall(re.sub(r"<[^>]+>","",allt)):
        fel(pid, "tyskt ord: %r" % t)
    for ch, namn in OSYNLIGA.items():
        if ch in allt: fel(pid, "osynligt tecken %s" % namn)
    # ☠️ Stavningen granskas på SYNLIG text. Slugarna i href är avsiktligt
    # av-accenterade ("...-landvarme") och är inte felstavningar; att grinda
    # dem hade gett tre falsklarm och lärt läsaren att ignorera grinden.
    synligt = re.sub(r"<[^>]+>", " ", allt)
    for sf in STAVFEL:
        if sf.lower() in synligt.lower(): fel(pid, "känt stavfel: %r" % sf)
    for f in MASTE:
        if f not in txt: fel(pid, "SAKNAR ritningens tal: %r" % f)
    for f in FORBJUDNA_TAL:
        if f in txt: fel(pid, "☠️ BÄR a0760ed1:s tal: %r" % f)
    # färgen ska stå i ingressen OCH i Färg-raden
    farg = s["farg"].lower()
    ingress = txt[:txt.index("<h3")]
    if farg.rstrip("a") not in ingress.lower() and farg not in ingress.lower():
        fel(pid, "färgen %r saknas i ingressen" % s["farg"])
    if ('>Färg:</span> ' + s["farg"]) not in txt:
        fel(pid, "Färg-raden saknar %r" % s["farg"])
    # syskonlänkar: exakt tre, och aldrig till sig själv
    lankar = re.findall(r'/produkt/([a-z0-9-]+)"', txt)
    # antalet syskon är rundans, inte en konstant: n-1 länkar i en familj om n
    forvantat = len(texter.SIDOR) - 1
    if len(lankar) != forvantat:
        fel(pid, "fel antal syskonlänkar: %d (väntat %d)" % (len(lankar), forvantat))
    if s["slug"] in lankar: fel(pid, "länkar till sig själv")
    if len(set(lankar)) != len(lankar): fel(pid, "dubblerad syskonlänk")
    # struktur
    for tag in ("<h2>Tekniska specifikationer</h2>", "<h2>Vanliga frågor</h2>"):
        if tag not in txt: fel(pid, "saknar %s" % tag)
    # Skötselstycket ska finnas men får heta vad som passar produkten.
    if not re.search(r"<h2>(Användning och skötsel|Innan barnet kör|Skötsel[^<]*)</h2>", txt):
        fel(pid, "saknar skötsel-/användningsstycke")
    if txt.count("<h3>") < 4: fel(pid, "färre än fyra H3")
    if len(s["seoTitle"]) > 60: fel(pid, "seoTitle %d tecken" % len(s["seoTitle"]))
    if not (120 <= len(s["seoDesc"]) <= 165): fel(pid, "seoDesc %d tecken" % len(s["seoDesc"]))
    if len(s["namn"]) > 80: fel(pid, "namn %d tecken (Wix kapar ~80)" % len(s["namn"]))

if len(set(kroppar.values())) != len(kroppar):
    FEL.append("☠️ IDENTISKA brödtexter: %r" % kroppar)

print("brödtext-hashar:", kroppar)
if FEL:
    print("\n--- %d FEL ---" % len(FEL))
    for f in FEL: print(" ", f)
    sys.exit(1)
print("\n✅ GRINDEN GRÖN — 3 sidor, 0 fel")
