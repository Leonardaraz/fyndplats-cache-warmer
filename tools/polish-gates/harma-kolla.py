#!/usr/bin/env python3
"""harma-kolla.py <plan.json> <slugs.txt> <fore-katalog> [--katalog DIR] [--hamta] [--tappade tappade.json] [--ids id8,id8]: kontrollerar "Härma Aosom" mot butikens egen sidodata (2026-10-24).

Skriver ingenting. Läser samma sidodata som kunden får (katalogkontroll-tva-axlar-bilder.py: images, imageKopplingar, imageAlts, variantAxes, variantTable) och jämför med
planen som harma-skriv.js skrev (`bygg-harma.py`: [{"id": <Wix-id>, "filer": [{"h": <32 hex>, "alt": ..., "a": [valets namn ...]}]}]).

  <slugs.txt>      en rad per sida: "<åtta första tecknen i Wix-id> <slug>"
  <fore-katalog>   `sida_<id8>.json` från FÖRE skrivningen (kk.sidodata sparad som JSON). Utan den hoppas jämförelserna med läget före över.
  --hamta          hämtar sidorna från butiken till DIR/<id8>.html (curl, sex åt gången, med `age` och cache-status), annars läses redan hämtade filer
  --tappade        JSON {id8: [sex första tecknen i fil-id, ...]} med filer som skriptet medvetet inte lade till (tak på 15 länkade bilder per val). Då ska exakt de saknas.
  --live DIR       utskrifterna från harma-live.sh (`live-<id8>.txt`, webbläsarens galleri per kombination). Då läggs en åttonde kontroll till (se nedan).

Sju kontroller per sida (åtta med --live), alla ur butikens data och inte ur Wix:
  1. SIDAN gick att läsa och bär `imageKopplingar` (annars räknas vyn med den gamla regeln och jämförelsen betyder något annat).
  2. FILERNA: varje fil i planen ligger i galleriet, utom de som skriptet tappade. Med --tappade ska mängden som saknas vara exakt den.
  3. ALT: alt-texten i butikens data är planens, tecken för tecken.
  4. SYNLIGHET: för varje kombination syns en ny fil om och bara om kombinationen uppfyller filens ägare (per option: ett av de namngivna valen, options utan ägare begränsar inte).
  5. GAMLA BILDER: för varje kombination syns exakt samma gamla bilder som före skrivningen (ingen bild försvinner ur en vy och ingen kommer till).
  6. FÖRSTA BILD: varje variants `variantTable[].image` (butikens uträkning) är densamma som före.
  7. ANTAL: bilder per kombination före → efter, och kombinationer under fyra bilder.
  8. LIVE (bara med --live): webbläsarens galleri för varje kombination har exakt de bilder butikens data säger (samma mängd), den första bilden är variantens bild i sidans data, och
     resten ligger i galleriets ordning. Det är vad kunden SER; 1–7 är vad butiken tänker visa.
Utskriften är en rad per sida plus avvikelserna, och sist SUMMA. Exit 1 vid minst en avvikelse (1–6 och 8). Antal under fyra (7) är ett besked och fäller inte.

☠️ Butikens cache fylls på var femte minut efter en skrivning, och `age` i svaret säger hur gammal sidan är. Ett ☠️ strax efter en skrivning är oftast en gammal sida (se FRISK i
utskriften): mät om efter några minuter innan en sida kallas trasig. Det här är butikens modell; webbläsaren (live-alla-kombinationer.sh, live-galleri.mjs) visar vad kunden ser.
Variantens bild i WIX (varukorg, kassa, order) mäts inte här: kör variantbild.yml i läget torr eller variantbild-farg.js.
"""
import importlib.util
import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

AQ = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("kk", os.path.join(AQ, "katalogkontroll-tva-axlar-bilder.py"))
kk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(kk)

UA = kk.UA


def norm(s):
    return re.sub(r"\s+", " ", (s or "").lower().replace("×", "x").replace(" x ", "x").replace(",", ".")).strip()


def fil_id(h):
    return "b379ce_%s~mv2.jpg" % h


def hamta(rader, katalog, fresh):
    os.makedirs(katalog, exist_ok=True)

    def en(r):
        id8, slug = r
        ut = subprocess.run(
            ["curl", "-sS", "-m", "60", "-A", UA, "-D", os.path.join(katalog, id8 + ".head"), "-o", os.path.join(katalog, id8 + ".html"), "-w", "%{http_code}",
             "https://www.fyndplats.se/produkt/" + slug + ("?cb=%d" % int(time.time() * 1000) if fresh else "")],
            capture_output=True, text=True,
        )
        return id8, ut.stdout.strip()

    with ThreadPoolExecutor(6) as ex:
        for id8, kod in ex.map(en, rader):
            if kod != "200":
                print("HÄMTNING FÖRE", id8, kod, file=sys.stderr)


def rubrik(katalog, id8):
    try:
        t = open(os.path.join(katalog, id8 + ".head"), encoding="utf-8", errors="replace").read().lower()
    except OSError:
        return None, None
    age = re.search(r"^age:\s*(\d+)", t, re.M)
    cache = re.search(r"^x-vercel-cache:\s*(\S+)", t, re.M)
    return (int(age.group(1)) if age else None), (cache.group(1).upper() if cache else None)


def axlar(d):
    etik = {a["name"]: [c["label"] for c in a["choices"]] for a in d["variantAxes"]}
    fax = [a for a in etik if a.lower().startswith("färg")]
    sax = [a for a in etik if a not in fax]
    return etik, fax, sax


def kombinationer(d):
    """Alla varianter som har ett val i varje option: [(ordnade val, variantTable-rad)]."""
    etik, _, _ = axlar(d)
    ut = []
    for v in d["variantTable"]:
        if all(a in v.get("choices", {}) for a in etik):
            ut.append(v)
    return ut


def nyckel(v, etik):
    return "|".join(v["choices"][a] for a in etik)


def agare_per_option(d, namn):
    """Planens ägare (valens namn) per option: {option: {etikett, ...}}. Ett namn som inte finns på sidan ger None."""
    etik, _, _ = axlar(d)
    per = {}
    for n in namn:
        hit = [(a, l) for a in etik for l in etik[a] if norm(l) == norm(n)]
        if len(hit) != 1:
            return None
        per.setdefault(hit[0][0], set()).add(hit[0][1])
    return per


def synlig_forvantad(per, v):
    return all(v["choices"].get(a) in lab for a, lab in per.items())


def kontrollera(id8, plan, d, fore, tappade, rapport):
    """Returnerar (avvikelser, antal-rad)."""
    avv = []
    if d is None:
        return ["SIDAN: gick inte att läsa"], None
    if d["imageKopplingar"] is None:
        avv.append("SIDAN: saknar imageKopplingar (butiken räknar med den gamla regeln)")
    etik, fax, sax = axlar(d)
    gal = d["gal"]
    kombo = kombinationer(d)
    nya = []
    for f in plan["filer"]:
        fid = fil_id(f["h"])
        nya.append((fid, f))
    iGal = [fid for fid, _ in nya if fid in gal]
    saknas = [fid for fid, _ in nya if fid not in gal]
    forvantat_saknas = None
    if tappade is not None:
        forvantat_saknas = sorted(fid for fid, _ in nya if fid[7:13] in set(tappade.get(id8, [])))
        if sorted(saknas) != forvantat_saknas:
            avv.append("FILERNA: saknas %s men skulle sakna %s" % ([s[7:13] for s in sorted(saknas)], [s[7:13] for s in forvantat_saknas]))
    elif saknas:
        rapport.append("   (ej i galleriet: %s)" % ",".join(s[7:13] for s in saknas))
    # 3. alt-texter
    for fid, f in nya:
        if fid in gal and (d["imageAlts"].get(fid, "") or "").strip() != (f["alt"] or "").strip():
            avv.append("ALT: %s har %r" % (fid[7:13], (d["imageAlts"].get(fid, "") or "")[:60]))
    # 4. synlighet av nya filer
    for fid, f in nya:
        if fid not in gal:
            continue
        per = agare_per_option(d, f["a"])
        if per is None:
            avv.append("SYNLIGHET: ägaren %s finns inte på sidan (%s)" % (f["a"], fid[7:13]))
            continue
        for v in kombo:
            n = gal.index(fid) + 1
            syns = n in kk.vy(d, v["choices"])
            if syns != synlig_forvantad(per, v):
                avv.append("SYNLIGHET: %s %s under %s" % (fid[7:13], "syns men ska inte" if syns else "syns inte men ska", nyckel(v, etik)))
    # 5. gamla bilder, 6. första bild, 7. antal
    antal = []
    under4 = []
    if fore is not None:
        etik0, _, _ = axlar(fore)
        gal0 = fore["gal"]
        if etik0 != etik:
            avv.append("FÖRE: optionerna eller valen skiljer sig från läget före")
        fkomb = {nyckel(v, etik0): v for v in kombinationer(fore)}
        for v in kombo:
            k = nyckel(v, etik)
            v0 = fkomb.get(k)
            if v0 is None:
                avv.append("FÖRE: kombinationen %s fanns inte före" % k)
                continue
            fore_vy = [gal0[n - 1] for n in kk.vy(fore, v0["choices"])]
            efter_vy = [gal[n - 1] for n in kk.vy(d, v["choices"])]
            gamla_efter = [f for f in efter_vy if f in set(gal0)]
            if set(fore_vy) != set(gamla_efter):
                tappar = [f[7:13] for f in fore_vy if f not in gamla_efter]
                far = [f[7:13] for f in gamla_efter if f not in fore_vy]
                avv.append("GAMLA: %s tappar %s får %s" % (k, tappar, far))
            elif fore_vy != gamla_efter:
                avv.append("GAMLA: %s har samma bilder i annan ordning" % k)
            f0 = kk.fil(v0.get("image", ""))
            f1 = kk.fil(v.get("image", ""))
            if f0 != f1:
                avv.append("FÖRSTA: %s variantens bild %s → %s" % (k, f0[7:13], f1[7:13]))
            antal.append("%s %d→%d" % (k, len(fore_vy), len(efter_vy)))
            if len(efter_vy) < 4:
                under4.append("%s (%d)" % (k, len(efter_vy)))
    else:
        for v in kombo:
            k = nyckel(v, etik)
            n = len(kk.vy(d, v["choices"]))
            antal.append("%s %d" % (k, n))
            if n < 4:
                under4.append("%s (%d)" % (k, n))
    return avv, (antal, under4, len(iGal), len(saknas))


def live_kolla(d, fil):
    """Webbläsarens galleri per kombination (KOMBO-rader) mot butikens modell. Returnerar (avvikelser, antal kombinationer)."""
    etik, _, _ = axlar(d)
    try:
        rader = [l for l in open(fil, encoding="utf-8", errors="replace") if l.startswith("KOMBO") and '"galleri"' in l]
    except OSError:
        return ["LIVE: utskriften saknas (%s)" % os.path.basename(fil)], 0
    if not rader:
        return ["LIVE: inga kombinationer lästes"], 0
    kombo = kombinationer(d)
    av = []
    sett = set()
    for l in rader:
        j = json.loads(l[l.index("{"):])
        val = {}
        for del_ in j["val"].split(" | "):
            if "=" in del_:
                k, v = del_.split("=", 1)
                val[k.strip().lower()] = v.strip().lower()
        hit = [v for v in kombo if {a.lower(): c.lower() for a, c in v["choices"].items()} == val]
        if len(hit) != 1:
            av.append("LIVE: kombinationen %s går inte att knyta till sidans varianter" % j["val"])
            continue
        v = hit[0]
        k = nyckel(v, etik)
        sett.add(k)
        vantat = [d["gal"][n - 1][7:13] for n in kk.vy(d, v["choices"])]
        live = [h for h in j["galleri"].split(",") if h]
        saknas = sorted(set(vantat) - set(live))
        extra = sorted(set(live) - set(vantat))
        if saknas or extra:
            av.append("LIVE: %s saknar %s har extra %s" % (k, saknas, extra))
            continue
        forsta = kk.fil(v.get("image", ""))[7:13]
        if live[0] != forsta:
            av.append("LIVE: %s första bilden är %s men variantens bild är %s" % (k, live[0], forsta))
        rest = [h for h in live if h != live[0]]
        gal_ordn = [h for h in vantat if h != live[0]]
        if rest != gal_ordn:
            av.append("LIVE: %s har bilderna i annan ordning än galleriets" % k)
    saknade = [nyckel(v, etik) for v in kombo if nyckel(v, etik) not in sett]
    if saknade:
        av.append("LIVE: kombinationer som inte mättes: %s" % saknade)
    return av, len(sett)


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    plan = {p["id"][:8]: p for p in json.load(open(sys.argv[1], encoding="utf-8"))}
    slug = dict(l.split() for l in open(sys.argv[2], encoding="utf-8") if l.strip())
    fore_dir = sys.argv[3]
    katalog = "sidor"
    if "--katalog" in sys.argv:
        katalog = sys.argv[sys.argv.index("--katalog") + 1]
    live_dir = sys.argv[sys.argv.index("--live") + 1] if "--live" in sys.argv else None
    tappade = None
    if "--tappade" in sys.argv:
        tappade = json.load(open(sys.argv[sys.argv.index("--tappade") + 1], encoding="utf-8"))
    ids = list(plan)
    if "--ids" in sys.argv:
        ids = [i for i in sys.argv[sys.argv.index("--ids") + 1].split(",") if i]
    if "--hamta" in sys.argv:
        hamta([(i, slug[i]) for i in ids], katalog, "--farsk" in sys.argv)
    summa = {"sidor": 0, "rena": 0, "avv": 0, "fel": 0, "under4": 0, "nya": 0, "tappade": 0}
    for id8 in ids:
        summa["sidor"] += 1
        try:
            d = kk.sidodata(katalog, id8)
        except OSError:
            d = None
        fp = os.path.join(fore_dir, "sida_%s.json" % id8)
        fore = json.load(open(fp, encoding="utf-8")) if os.path.exists(fp) else None
        rapport = []
        avv, rad = kontrollera(id8, plan[id8], d, fore, tappade, rapport)
        antal_live = None
        if live_dir and d is not None:
            lav, antal_live = live_kolla(d, os.path.join(live_dir, "live-%s.txt" % id8))
            avv = avv + lav
        age, cache = rubrik(katalog, id8)
        if rad is None:
            summa["fel"] += 1
            print("☠️ %s %s" % (id8, avv[0]))
            continue
        antal, under4, nya, saknas = rad
        summa["nya"] += nya
        summa["tappade"] += saknas
        summa["under4"] += len(under4)
        if avv:
            summa["avv"] += 1
        else:
            summa["rena"] += 1
        print("%s %s  nya i galleriet %d av %d · galleri %d · age %ss %s%s%s" % (
            id8, "☠️" if avv else "OK", nya, len(plan[id8]["filer"]), len(d["gal"]), age if age is not None else "?", cache or "",
            (" · live %d kombinationer" % antal_live) if antal_live is not None else "", " · under fyra: " + ", ".join(under4) if under4 else ""))
        for r in rapport:
            print(r)
        if antal:
            print("   antal: " + " · ".join(antal))
        for a in avv[:20]:
            print("   " + a)
        if len(avv) > 20:
            print("   … och %d till" % (len(avv) - 20))
    print("SUMMA %(sidor)d sidor: %(rena)d utan avvikelse, %(avv)d med avvikelse, %(fel)d som inte gick att läsa · %(nya)d nya filer i gallerierna, %(tappade)d tappade · %(under4)d kombinationer under fyra bilder" % summa)
    sys.exit(1 if (summa["avv"] or summa["fel"]) else 0)


if __name__ == "__main__":
    main()
