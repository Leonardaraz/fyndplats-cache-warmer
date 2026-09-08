# -*- coding: utf-8 -*-
"""Runda 103 dubblettkoll mot PUBLICERADE sidor.

Den andra sessionens mätning 2026-09-08: en koll mot enbart `Mått:`-raden
täcker 19 % av sidorna och gav 0 träffar, medan en koll mot VARJE trippel
"a × b × c cm" täcker 71 % och gav 8 träffar. Det här svepet gör det senare.

Wix API kan inte hjälpa: `plainDescription` är inte filtrerbar (mätt, 400
"not declared as filterable"), och fritextsökningen tokeniserar talen och
returnerar orelaterade utkast. Alltså läses de LIVE-renderade sidorna.
"""
import re, subprocess, sys, html, time

MINA = {"82","99","103"}
MINA_SLUGS = {"massagefatolj-ljusgra-vippfunktion-landvarme",
              "massagefatolj-morkbrun-vippfunktion-landvarme",
              "massagefatolj-cremevit-vippfunktion-landvarme",
              "massagefatolj-svart-vippfunktion-landvarme"}
# Ord som gör en sida till en tänkbar stol-dubblett. Bredare än familjen.
STOL = re.compile(r"(fatolj|fåtölj|stol|recliner|vilstol|massage|lounge|sits)", re.I)

def curl(u, t=25):
    r = subprocess.run(["curl","-s","--max-time",str(t),u], capture_output=True, text=True)
    return r.stdout

print("hämtar sitemap …")
sm = curl("https://www.fyndplats.se/sitemap.xml", 40)
kartor = re.findall(r"<loc>([^<]+)</loc>", sm)
urls = []
if any("sitemap" in k for k in kartor):
    for k in kartor:
        if "sitemap" in k:
            urls += re.findall(r"<loc>([^<]+)</loc>", curl(k, 40))
else:
    urls = kartor
produkter = [u for u in urls if "/produkt/" in u]
print("publicerade produktsidor i sitemapen:", len(produkter))

kandidater = [u for u in produkter
              if STOL.search(u.rsplit("/",1)[-1]) and u.rsplit("/",1)[-1] not in MINA_SLUGS]
print("stol-liknande slugs att svepa:", len(kandidater))

TRIPPEL = re.compile(r"(\d{1,3})(?:[,.]\d+)?\s*(?:cm)?\s*[x×]\s*"
                     r"(\d{1,3})(?:[,.]\d+)?\s*(?:cm)?\s*[x×]\s*"
                     r"(\d{1,3})(?:[,.]\d+)?\s*cm", re.I)

traffar, medtrippel, lasta = [], 0, 0
for i, u in enumerate(kandidater, 1):
    h = curl(u)
    if len(h) < 2000:            # ISR-väckning: läs om en gång
        time.sleep(2); h = curl(u)
    if len(h) < 2000:
        continue
    lasta += 1
    txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h)))
    tripler = {frozenset(t) for t in TRIPPEL.findall(txt)}
    if tripler: medtrippel += 1
    if frozenset(MINA) in tripler:
        traffar.append(u)
        print("  ☠️ TRÄFF:", u)
    if i % 25 == 0:
        print("  … %d/%d lästa, %d med trippel, %d träffar"
              % (i, len(kandidater), medtrippel, len(traffar)))

print()
print("=" * 60)
print("lästa sidor            :", lasta)
print("varav med NÅGON trippel:", medtrippel,
      "(%d %%)" % (100*medtrippel//max(lasta,1)))
print("träffar på 82/99/103   :", len(traffar))
for t in traffar: print("   ", t)
print()
print("⚠️ TÄCKNING: %d av %d lästa sidor bär en trippel. En nolla här är ett"
      % (medtrippel, lasta))
print("   GOLV, inte ett bevis — sidor utan trippel kan inte prövas.")
