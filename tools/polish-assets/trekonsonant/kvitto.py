# -*- coding: utf-8 -*-
"""Kvittot på trekonsonantsrättningen: LÄS KUNDENS SIDA, inte Wix svar.

☠️ Wix-återläsningen sa 22 av 22 rena. Det bevisar vad Wix bär, inte vad
   kunden ser — och nionde gången i det här huset: ett svar utan fel är
   inget kvitto. ISR-cachen ligger en timme, så hämtningen MÅSTE cache-busta;
   runda 60 fällde åtta korrekta sidor på just det.
"""
import concurrent.futures as cf
import re
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import grindar as G                                              # noqa: E402

# ☠️ `&amp;` ÖVERLEVER `synlig_meningstext`. Strykningen skrevs först med
#    `&` och bet därför inte: sex klösträdssidor rapporterades bära
#    `kattträd` i VÅR text när ordet i själva verket stod i butikens
#    blogglänk. Samma teckenfälla som `EU_TULL`-mönstret i grindar.py,
#    där två av tre former täcktes och raden såg fullständig ut.
BLOGG = "Klösträd &amp; kattträd – så väljer du rätt"
ORD = re.compile(r"[0-9A-Za-zÅÄÖåäöÉéÜü][0-9A-Za-zÅÄÖåäöÉéÜü-]*")
BAS = "https://www.fyndplats.se/produkt/"

SIDOR = """klattervagg-for-katt-med-hangmatta klostrad-200-cm-sex-nivaer
hopfallbar-bardisk-portabel hornskrivbord-150x150-natur-svart
hornskrivbord-168-cm-ljus-ekton hornskrivbord-168-cm-rustik-brun
byra-86-cm-beige-atta-tyglador klostrad-101-cm-giraff-med-tunnel
gungstol-beige-manchester-bokmedar gungstol-gul-manchester-bokmedar
kontorsstol-morkgra-220-kg-62-cm-sits ritstol-gra-natrygg-fotring-56-76-cm
koksskap-i-lantstil-100-cm koksskap-med-glasdorrar-172-cm takhogt-katttrad
hornsoffa-242-cm-vandbar-schaslong roddmaskin-hemmet-12-nivaer-hydraulisk
boxboll-vaggfaste-plattform-60-cm takkorg-bil-lastkorg-vaska
kloskrapa-katt-soffa-kartong klostrad-140-cm
klosmobel-tunnform-99-cm-tre-vaningar
klosmobel-zebra-tunnel-93-cm klostrad-109-cm-tunna-badd
klostrad-150-cm-tva-flatade-kojor""".split()


def granska(slug):
    # ☠️ max_age är hela poängen med omkörningen: utan vakten svarade
    #    hämtningen `HIT age=289` med den GAMLA texten och såg ut som ett
    #    kvitto. Taket är satt under ISR-fönstret på en timme.
    try:
        html, h = G.hamta_isr(BAS + slug, max_age=900)
    except SystemExit as e:
        return slug, "GAMMAL", ["GICK INTE ATT LÄSA FÄRSKT: %s" % str(e)[:70]]
    text = G.synlig_meningstext(G.butikstvatt(html)).replace(BLOGG, " ")
    ord_ = []
    for m in G.TREKONSONANT.finditer(text):
        o = ORD.search(text, max(0, m.start() - 40))
        while o and o.end() <= m.start():
            o = ORD.search(text, o.end())
        ord_.append(o.group(0) if o else m.group(0))
    return slug, h.get("x-vercel-cache", "?"), sorted(set(ord_))


with cf.ThreadPoolExecutor(max_workers=6) as ex:
    rader = list(ex.map(granska, SIDOR))

fel = 0
for slug, cache, ord_ in rader:
    fel += len(ord_)
    print("%-46s %-6s %s" % (slug, cache, " ".join(ord_) if ord_ else "rent"))
print("\nSUMMA: %d sidor, %d kvarvarande ord" % (len(rader), fel))
sys.exit(1 if fel else 0)
