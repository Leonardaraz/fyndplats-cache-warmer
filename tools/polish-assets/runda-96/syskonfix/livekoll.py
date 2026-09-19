# -*- coding: utf-8 -*-
"""Syskonfixen — live-kontroll av de tre sidor som INTE ingår i runda 96.

Runda 96:s egen livegrind täcker mörkgrå och kaffebrun. De tre andra
(creme, roströd, mörkgrön) hör till en äldre runda respektive runda 95, och
har inget facit här — kontrollen är därför på PÅSTÅENDENA, inte ordagrann.
"""
import html as htmllib
import random
import re
import subprocess
import sys
import time

SLUG = {
    "507ae3d5": "paviljongtak-3x3-dubbeltak-creme",
    "271327e1": "paviljongtak-3x3-dubbeltak-rostrod",
    "b6ebc5ba": "paviljongtak-3x3-dubbeltak-morkgron",
}
ALLA = ["paviljongtak-3x3-dubbeltak-creme", "paviljongtak-3x3-dubbeltak-rostrod",
        "paviljongtak-3x3-dubbeltak-morkgra", "paviljongtak-3x3-dubbeltak-kaffebrun"]
KRAV = {
    "507ae3d5": ["Samma tak i fyra färger", "Duken är densamma i alla fyra färgerna",
                 "Exakt samma duk finns också i rostrött, mörkgrått och kaffebrunt"],
    "271327e1": ["Samma tak i fyra färger", "Duken är densamma i alla fyra färgerna",
                 "dess lilla tak mäter 88 × 88 cm i stället för 86 × 86 cm",
                 "Samma tak finns i fyra färger"],
    "b6ebc5ba": ["Liknande tak i fyra färger till", "den är ensam om sitt mått",
                 "Samma slags tak finns i creme, rostrött, mörkgrått och kaffebrunt"],
}
BORTA = ["Samma tak i en annan färg", "i samma storlek", "en färg till",
         "i tre färger", "tre färgerna"]


def hamta(slug):
    for i in range(4):
        u = "https://www.fyndplats.se/produkt/%s?cb=fix%d-%d" % (
            slug, i, random.randint(100000, 999999))
        p = subprocess.run(["curl", "-s", "-w", "\n%{http_code}", u],
                           capture_output=True, text=True, timeout=60)
        d = p.stdout.rsplit("\n", 1)
        kod = d[1].strip() if len(d) > 1 else "?"
        if kod == "200":
            return kod, d[0]
        time.sleep(2 + 3 * i)
    return kod, d[0]


def synlig(h):
    t = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", t))).strip()


def kor():
    fel = 0
    for pid, slug in SLUG.items():
        for omtag in range(4):
            kod, h = hamta(slug)
            txt = synlig(h)
            i, j = txt.find("Beskrivning"), txt.find("Liknande produkter")
            var = txt[i:j if j > i else len(txt)] if i >= 0 else txt
            b = []
            if kod != "200":
                b.append("HTTP %s" % kod)
            else:
                for krav in KRAV[pid]:
                    if krav not in var:
                        b.append("saknar %r" % krav[:52])
                for d in BORTA:
                    if d in var:
                        b.append("kvar: %r" % d)
                # ⚠️ SJÄLVLÄNKEN GÅR INTE ATT MÄTA HÄR. Varje sida bär sin
                #    egen adress i canonical, og:url och JSON-LD, så en sökning
                #    i hela HTML:en svarar JA på "länkar till sig själv" för
                #    varje korrekt sida. Den kontrollen hör hemma mot API:t,
                #    där beskrivningens egen HTML går att läsa isolerad — och
                #    där är den redan grön för alla fem.
                for annan in ALLA:
                    if annan != slug and annan not in h:
                        b.append("saknar länk till %s" % annan)
            if not b:
                break
            time.sleep(15)
        print("%s  %-40s HTTP %s  %d tecken  %s"
              % (pid, slug[:40], kod, len(var), "OK" if not b else "%d BRISTER" % len(b)))
        for x in b:
            print("    x", x)
            fel += 1
    print("\n%s" % ("0 brister pa tre live-sidor" if not fel else "%d brister" % fel))
    return fel


if __name__ == "__main__":
    sys.exit(1 if kor() else 0)
