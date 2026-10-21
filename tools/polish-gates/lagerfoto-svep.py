#!/usr/bin/env python3
"""Hittar leverantörens lagerfoton i butikens gallerier (2026-10-19).

Leonard: andra bilden på barnnattduksbordet kändes konstig. Den var feedens
position 2, ett amatörfoto från lagret med smutsigt golv, och livsbildsregeln
(2026-10-01) hade lagt den som andra bild. Sådana foton har en gemensam form:
ett liggande (eller stående) foto inramat med vita band i en kvadratisk fil,
där fotot går kant i kant. En ren produktbild har vit bakgrund runt varan och
vita kanter; en miljöbild har inga vita band alls.

Svepet läser bara publika adresser: butikens Google-flöde (bildordningen per
sida) och en liten miniatyr per bild från static.wixstatic.com. Det skriver
ingenting och laddar inte ner originalen.

Kalibrerat 2026-10-19 på de tre barnmöblerna: alla fem kända lagerfoton
fälldes och ingen av de nio andra bilderna. Hela katalogen (4 944 sidor,
28 162 bilder) tog tolv minuter och gav 110 inramade bilder, varav tolv var
lagerfoton. Resten var stående miljöbilder, renderingar och kort, så varje
träff ska ses med ögonen innan något flyttas.

⚠️ Kollen ser bara inramade foton. Ett lagerfoto i en fil som inte är kvadratisk
   (6:5, 4:3) har inga vita band och fälls inte. Två sådana fanns 2026-10-19
   och hittades först när alla 671 icke-kvadratiska bilder sågs med ögonen.
   Utfilen bär miniatyrens mått (w, h), så de bilderna går att lista.
⚠️ Flödet cachas i upp till ett dygn, så en sida som ändrats i dag kan visa
   gårdagens ordning.

ANVÄNDNING (kräver Pillow, numpy och requests):
  python3 lagerfoto-svep.py pos2 ut.tsv            # andra bilden på varje sida
  python3 lagerfoto-svep.py alla ut.tsv            # varje galleribild
  python3 lagerfoto-svep.py alla ut.tsv 2c63cfbc   # bara sidor vars id börjar så

Utfilen har en rad per sida och bild: produkt, slug, rad (variantraden i
flödet), position, fil-id, `inramad` (liggande / staende / tomt) och måtten.
"""
import csv, io, json, os, re, sys, time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import requests
from PIL import Image

FLODE = "https://www.fyndplats.se/feed/google.xml"
G = "{http://base.google.com/ns/1.0}"
SIDA = 200  # miniatyrens sida i pixlar
VIT = 236  # en pixel är vit när alla tre kanaler når hit (JPEG-brus)
CA = os.environ.get("REQUESTS_CA_BUNDLE") or None


def hamta_sidor(sess):
    r = sess.get(FLODE, timeout=120, verify=CA or True)
    r.raise_for_status()
    sidor = {}
    for it in ET.fromstring(r.content).iter("item"):
        grupp = (it.findtext(G + "item_group_id") or it.findtext(G + "id") or "").strip()
        lank = it.findtext(G + "link") or ""
        m = re.search(r"/produkt/([^?]+)", lank)
        bilder = [it.findtext(G + "image_link") or ""] + [
            e.text or "" for e in it.findall(G + "additional_image_link")]
        ids = []
        for u in bilder:
            f = re.search(r"/media/([^/]+)", u)
            if f:
                ids.append(f.group(1))
        sida = sidor.setdefault(grupp, {"slug": m.group(1) if m else "", "rader": []})
        sida["rader"].append(ids)
    return sidor


def band(v):
    """Antal rader (eller kolumner) i följd från kanten som är helt vita."""
    n = 0
    for x in v:
        if x < 0.97:
            break
        n += 1
    return n


def mat(fil, sess):
    url = f"https://static.wixstatic.com/media/{fil}/v1/fit/w_{SIDA},h_{SIDA},q_85/file.jpg"
    for forsok in range(4):
        try:
            r = sess.get(url, timeout=30, verify=CA or True)
            if r.status_code == 200:
                break
            if r.status_code in (403, 404):
                return {"fel": r.status_code}
        except requests.RequestException:
            pass
        time.sleep(1 + 2 * forsok)
    else:
        return {"fel": "natverk"}
    a = np.asarray(Image.open(io.BytesIO(r.content)).convert("RGB")).astype(np.int16)
    h, w, _ = a.shape
    vit = a.min(axis=2) >= VIT
    rad, kol = vit.mean(axis=1), vit.mean(axis=0)
    topp, botten = band(rad), band(rad[::-1])
    vanster, hoger = band(kol), band(kol[::-1])
    ut = {"w": w, "h": h, "topp": topp, "botten": botten, "vanster": vanster, "hoger": hoger}
    # Liggande: band upptill och nedtill, och fotot däremellan går kant i
    # kant (kantkolumnerna är inte vita) och är foto rakt igenom.
    liggande = staende = False
    if topp >= 0.05 * h and botten >= 0.05 * h and topp + botten < 0.6 * h:
        inre = vit[topp:h - botten]
        kant = 1 - np.concatenate([inre[:, :3].ravel(), inre[:, -3:].ravel()]).mean()
        liggande = kant >= 0.6 and (1 - inre.mean()) >= 0.6
    if vanster >= 0.05 * w and hoger >= 0.05 * w and vanster + hoger < 0.6 * w:
        inre = vit[:, vanster:w - hoger]
        kant = 1 - np.concatenate([inre[:3, :].ravel(), inre[-3:, :].ravel()]).mean()
        staende = kant >= 0.6 and (1 - inre.mean()) >= 0.6
    ut["inramad"] = "liggande" if liggande else ("staende" if staende else "")
    return ut


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("pos2", "alla"):
        sys.exit(__doc__)
    lage, utfil = sys.argv[1], sys.argv[2]
    prefix = tuple(sys.argv[3].split(",")) if len(sys.argv) > 3 and sys.argv[3] else None
    sess = requests.Session()
    sess.mount("https://", requests.adapters.HTTPAdapter(pool_connections=16, pool_maxsize=16))
    sidor = hamta_sidor(sess)
    jobb = {}
    for grupp, s in sidor.items():
        if prefix and not grupp.startswith(prefix):
            continue
        for ri, lista in enumerate(s["rader"]):
            for pos, fil in enumerate(lista, start=1):
                if lage == "pos2" and pos != 2:
                    continue
                jobb.setdefault(fil, []).append((grupp, s["slug"], ri, pos))
    print(f"{len(sidor)} sidor i flödet, {len(jobb)} bilder att mäta", file=sys.stderr)
    t0, res = time.time(), {}

    def gor(fil):
        try:
            return fil, mat(fil, sess)
        except Exception as e:  # en trasig bild får inte fälla svepet
            return fil, {"fel": type(e).__name__}

    with ThreadPoolExecutor(12) as ex:
        for i, (fil, r) in enumerate(ex.map(gor, list(jobb)), 1):
            res[fil] = r
            if i % 1000 == 0:
                print(f"  {i} mätta, {time.time() - t0:.0f} s", file=sys.stderr)
    falt = ["inramad", "w", "h", "topp", "botten", "vanster", "hoger", "fel"]
    with open(utfil, "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f, delimiter="\t")
        wr.writerow(["produkt", "slug", "rad", "pos", "fil"] + falt)
        for fil, platser in jobb.items():
            r = res.get(fil, {})
            for grupp, slug, ri, pos in platser:
                wr.writerow([grupp, slug, ri, pos, fil] + [r.get(k, "") for k in falt])
    inramade = {f for f, r in res.items() if r.get("inramad")}
    fel = sum(1 for r in res.values() if r.get("fel"))
    print(f"klart på {time.time() - t0:.0f} s: {len(inramade)} inramade bilder, {fel} fel",
          file=sys.stderr)
    if fel:
        sys.exit(1)


if __name__ == "__main__":
    main()
