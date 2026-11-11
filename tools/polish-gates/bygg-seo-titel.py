#!/usr/bin/env python3
"""Bygger planen som workflowen "SEO — titel och metabeskrivning på publicerade
sidor" skickar till /api/admin/seo-titel.

Används när en redan PUBLICERAD sida ska få en egen SEO-titel eller
metabeskrivning utan att något annat på sidan rörs (2026-11-11: 63 sidor delade
titel med en annan sida). Ett utkast poleras i en vanlig runda.

Läser (från rundans katalog, tools/polish-assets/runda-seo-<plan>/):
  ids.tsv          "<kort>\\t<pid>", en rad per sida (fler kolumner går bra)
  seo.tsv          "<kort>\\t<titel>\\t<beskrivning>", samma form som i en runda
  live/<kort>.html den publicerade sidan, källan för siffergrinden

Skriver:
  ../seo-titel/<plan>.json   { namn, rader: [{ kort, pid, seoTitel, seoBesk }] }

☠️ GRINDEN KÖRS HÄR, INTE BREDVID. gate-seo.py prövar varje titel och
beskrivning mot den publicerade sidan (siffror, husmärken, artikelnummer,
tecken, längd, suffix). Ett enda fynd, och planen skrivs inte.

Vad en plan får innehålla avgör lib/polish/seo-titel.ts (valideraSeoPlan), och
att ingen titel redan står på en annan publicerad sida avgör rutten mot butiken
själv, i workflowens torra läge. Här prövas bara det som går att pröva i filerna.

ANVÄNDNING (från rundans katalog):
  python3 ../../polish-gates/bygg-seo-titel.py <plan>
"""
import hashlib, json, os, re, subprocess, sys

HAR = os.path.dirname(os.path.abspath(__file__))
PLAN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
KORT = re.compile(r"^[0-9a-f]{8}$")
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def rader(fil, minst):
    ut = []
    for nr, rad in enumerate(open(fil, encoding="utf-8").read().splitlines(), 1):
        if not rad.strip():
            continue
        delar = rad.split("\t")
        if len(delar) < minst:
            raise SystemExit(f"{fil} rad {nr}: väntade {minst} tabbavgränsade fält, fick {len(delar)}")
        ut.append(delar)
    return ut


def main(plan):
    if not PLAN.match(plan):
        raise SystemExit("planens namn ska ha formen semrush-1 (små bokstäver, siffror och bindestreck)")
    for fil in ("ids.tsv", "seo.tsv"):
        if not os.path.exists(fil):
            raise SystemExit(f"{fil} saknas — kör från rundans katalog")

    pid = {}
    for delar in rader("ids.tsv", 2):
        kort, p = delar[0], delar[1]
        if not KORT.match(kort) or not UUID.match(p) or not p.startswith(kort):
            raise SystemExit(f"ids.tsv: {kort} hör inte ihop med sitt pid")
        if kort in pid:
            raise SystemExit(f"ids.tsv: {kort} står två gånger")
        pid[kort] = p

    seo = rader("seo.tsv", 3)
    kortlista = [d[0] for d in seo]
    for kort in kortlista:
        if kort not in pid:
            raise SystemExit(f"seo.tsv: {kort} saknas i ids.tsv")
        if not os.path.exists(os.path.join("live", f"{kort}.html")):
            raise SystemExit(f"live/{kort}.html saknas — hämta den publicerade sidan först")
    dubbla = sorted({k for k in kortlista if kortlista.count(k) > 1})
    if dubbla:
        raise SystemExit(f"seo.tsv: står två gånger: {', '.join(dubbla)}")
    utan = sorted(set(pid) - set(kortlista))
    if utan:
        raise SystemExit(f"ids.tsv har sidor utan rad i seo.tsv: {', '.join(utan)}")

    # Grinden prövar texterna mot de publicerade sidorna. Dess utskrift visas
    # som den är; ett fynd stoppar bygget.
    grind = subprocess.run([sys.executable, os.path.join(HAR, "gate-seo.py"), "seo.tsv"])
    if grind.returncode != 0:
        raise SystemExit("gate-seo.py har fynd — planen skrivs inte")

    ut = {
        "namn": plan,
        "rader": [{"kort": k, "pid": pid[k], "seoTitel": t, "seoBesk": b} for k, t, b in (d[:3] for d in seo)],
    }
    mapp = os.path.join("..", "seo-titel")
    os.makedirs(mapp, exist_ok=True)
    fil = os.path.join(mapp, f"{plan}.json")
    text = json.dumps(ut, ensure_ascii=False, indent=1) + "\n"
    with open(fil, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"\n{fil}: {len(ut['rader'])} sidor")
    print(f"sha256: {hashlib.sha256(text.encode('utf-8')).hexdigest()}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    sys.exit(main(sys.argv[1]))
