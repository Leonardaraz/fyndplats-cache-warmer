#!/usr/bin/env python3
"""Bygger rundans skrivplan.json — det workflowen "Polering — skriv en runda
till Wix" skickar till /api/admin/polish-write.

Ersätter steg1–5.js och bygg-steg.py (2026-09-24). Fram till N56 skrevs hela
skrivskriptet, ~87 000 tecken, av i chatten och kördes i Wix körmiljö. Nu
ligger planen i grenen: workflowen läser den därifrån och kontrollerar den mot
sha256:n som det här skriptet skriver ut. Ingenting skrivs av, varken för hand
eller i chatten, så det finns inget avskriftsfel att fånga.

Läser (alla från rundans katalog):
  ids.tsv  namn.tsv  slugs.txt  seo.tsv  <kort>.html  nyttolast-media.json
  kategori.tsv  sku.tsv  variant.tsv  vantat-hash.tsv

☠️ FACIT RÄKNAS OM HÄR. vantat-hash.tsv jämförs mot <kort>.html genom
wixnorm, och är den inaktuell faller bygget. Ett inaktuellt facit hade fått
återläsningen att rapportera en korrekt skrivning som fel — och en grind som
lyser rött på rätt svar lär mottagaren att sluta läsa den.

Reglerna för vad en plan får innehålla bor i lib/polish/skrivplan.ts
(valideraPlan), inte här, så de inte kan glida isär. Workflowens torra läge
kör dem mot planen innan något skrivs.

☠️ GRINDARNA KÖRS HÄR, INTE BREDVID (2026-09-27). Steg 7 var tio separata
kommandon, och planen byggdes lika gärna om ett av dem aldrig körts eller om
en fil ändrats efteråt. En bildlista som inte byggts om efter en ändrad
alt-text gav dessutom samma plan och samma sha, utan fel. Bygget kör därför
varje grind i tur och ordning, bygger bildlistan på nytt och vägrar skriva
planen vid ett enda fynd.

Ett fynd som inte går att laga i filerna (källan saknar till exempel
totalmått, så bygg-axelfacit.py avbryter) kvitteras i `grind-undantag.txt`:
"<skript> <skäl>", en rad per skript. Grinden körs och skrivs ut ändå, men
stoppar inte bygget. Skälet är obligatoriskt, samma form som foto-tal.txt.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/bygg-skrivplan.py
"""
import hashlib, io, json, os, subprocess, sys
HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
from gatelib import fnv
from wixnorm import normalisera

MAX_PRODUKTER = 20

# I den ordning runbooken beskriver dem. bygg-media.py sist: den skriver
# nyttolast-media.json, som planen läser.
KEDJA = ("gate.py", "gate-alt.py", "gate-seo.py", "gate-sku.py", "gate-lager.py",
         "gate-superlativ.py", "bygg-axelfacit.py", "gate-axel.py", "bygg-media.py")


def undantag():
    ut = {}
    if os.path.exists("grind-undantag.txt"):
        for rad in io.open("grind-undantag.txt", encoding="utf-8"):
            delar = rad.strip().split(None, 1)
            if not delar or delar[0].startswith("#"):
                continue
            if len(delar) < 2:
                raise SystemExit(f"  [AVBRYT] grind-undantag.txt: {rad.strip()!r} saknar skäl")
            ut[delar[0]] = delar[1]
    return ut


def kor_grindarna():
    """Kör kedjan. Returnerar skripten som föll utan kvittens."""
    kvitt, foll = undantag(), []
    for skript in KEDJA:
        r = subprocess.run([sys.executable, os.path.join(HAR, skript)],
                           capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  {skript}: ren")
            continue
        ut = (r.stdout + r.stderr).rstrip()
        if skript in kvitt:
            print(f"  {skript}: föll, kvitterad ({kvitt[skript]})")
        else:
            print(f"  {skript}: FÖLL\n" + "\n".join("    " + x for x in ut.splitlines()[-25:]))
            foll.append(skript)
    return foll


def tsv(namn, n):
    ut = {}
    for r in io.open(namn, encoding="utf-8"):
        if r.strip():
            d = r.rstrip("\n").split("\t", n - 1)
            ut[d[0]] = d[1:]
    return ut


def main():
    runda = os.path.basename(os.getcwd())
    print("Grindarna:")
    foll = kor_grindarna()
    if foll:
        sys.stderr.write(f"BYGGET FALLER — {', '.join(foll)} har fynd. Rätta filerna, "
                         "eller kvittera i grind-undantag.txt om källan inte räcker.\n")
        sys.exit(1)
    ids = tsv("ids.tsv", 3)
    namn = tsv("namn.tsv", 2)
    seo = tsv("seo.tsv", 3)
    sku = tsv("sku.tsv", 2)
    var = tsv("variant.tsv", 2)
    kat = tsv("kategori.tsv", 2)
    vh = tsv("vantat-hash.tsv", 3)
    slug = {r.split()[0]: r.split()[1] for r in io.open("slugs.txt", encoding="utf-8") if r.strip()}
    media = json.load(io.open("nyttolast-media.json", encoding="utf-8"))

    fel = []
    if len(ids) > MAX_PRODUKTER:
        fel.append(f"{len(ids)} produkter i ids.tsv — högst {MAX_PRODUKTER} per plan")

    produkter = []
    for k, (pid, _etikett) in ids.items():
        saknas = [nm for kalla, nm in ((namn, "namn.tsv"), (seo, "seo.tsv"), (sku, "sku.tsv"),
                                       (var, "variant.tsv"), (kat, "kategori.tsv"),
                                       (vh, "vantat-hash.tsv"), (slug, "slugs.txt"),
                                       (media, "nyttolast-media.json"))
                  if k not in kalla]
        if not os.path.isfile(f"{k}.html"):
            saknas.append(f"{k}.html")
        if saknas:
            fel.append(f"{k}: saknar rad i {', '.join(saknas)}")
            continue

        kalla = io.open(f"{k}.html", encoding="utf-8").read()
        lagras = normalisera(kalla)
        if (fnv(lagras), str(len(lagras))) != (vh[k][0], vh[k][1]):
            fel.append(f"{k}: vantat-hash.tsv stämmer inte med {k}.html — kör hasha.py")

        produkter.append({
            "kort": k,
            "pid": pid,
            "namn": namn[k][0],
            "slug": slug[k],
            # Strängen SOM DEN SKICKAS: filens avslutande radbrytning följer inte med.
            "html": kalla.rstrip("\n"),
            "seoTitel": seo[k][0],
            "seoBesk": seo[k][1],
            "media": [{"id": m["id"], "altText": m["altText"]} for m in media[k]],
            "kat": [x.strip() for x in kat[k][0].split(" + ")],
            "sku": sku[k][0],
            "variantId": var[k][0],
            "textHash": vh[k][0],
            "textTecken": int(vh[k][1]),
        })

    if fel:
        sys.stderr.write("BYGGET FALLER — skrivplan.json skrivs inte:\n" + "\n".join("  " + f for f in fel) + "\n")
        sys.exit(1)

    data = (json.dumps({"runda": runda, "produkter": produkter}, ensure_ascii=False, indent=1) + "\n").encode("utf-8")
    io.open("skrivplan.json", "wb").write(data)
    print(f"skrivplan.json: {len(produkter)} produkter, {len(data)} byte")
    print(f"plan_sha256: {hashlib.sha256(data).hexdigest()}")


if __name__ == "__main__":
    main()
