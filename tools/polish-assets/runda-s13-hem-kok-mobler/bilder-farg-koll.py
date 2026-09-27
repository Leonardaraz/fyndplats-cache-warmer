#!/usr/bin/env python3
"""Google-flödets extrabilder och färgfacetten, mätt på en butiksadress.

Användning: bilder-farg-koll.py <bas-url> [referensflöde.xml]

Räknar produkter i /feed/google.xml och hur många av dem som har minst en
g:additional_image_link, och produkter med färgnycklar i /alla-produkters
RSC-nyttolast. Med ett referensflöde (till exempel produktionens före en
deploy) räknas också produkter som fått FÄRRE extrabilder än förut.

Före lagningen (butiks-PR #647, 17b2f9d6) hade 557 av 3 393 produkter
extrabilder och ingen produkt en färg. I förhandsbygget hade alla 3 420
produkter extrabilder och 122 produkter en färg, i 19 färger.
"""
import collections, os, re, subprocess, sys, tempfile

bas = sys.argv[1].rstrip("/")
referens = sys.argv[2] if len(sys.argv) > 2 else None
tmp = tempfile.mkdtemp(prefix="bilder-farg-")


def hamta(vag):
    fil = os.path.join(tmp, re.sub(r"\W+", "-", vag).strip("-") or "start")
    r = subprocess.run(["curl", "-sS", "-o", fil, "-w", "%{http_code}", bas + vag],
                       capture_output=True, text=True)
    return r.stdout.strip(), open(fil, encoding="utf-8", errors="replace").read()


def extrabilder(xml):
    per = collections.defaultdict(int)
    for it in re.findall(r"<item>(.*?)</item>", xml, re.S):
        g = re.search(r"<g:item_group_id>([^<]+)", it) or re.search(r"<g:id>([^<]+)", it)
        per[g.group(1)] = max(per[g.group(1)], len(re.findall(r"<g:additional_image_link>", it)))
    return per


kod, xml = hamta("/feed/google.xml")
nu = extrabilder(xml)
med = sum(1 for n in nu.values() if n)
print(f"/feed/google.xml {kod}: {len(nu)} produkter, {med} med extrabilder")
print("  extrabilder per produkt:", sorted(collections.Counter(nu.values()).items()))
if referens:
    fore = extrabilder(open(referens, encoding="utf-8").read())
    farre = [g for g in fore if g in nu and nu[g] < fore[g]]
    print(f"  referensen: {len(fore)} produkter, {sum(1 for n in fore.values() if n)} med extrabilder;"
          f" {len(farre)} har fått färre")

kod, sida = hamta("/alla-produkter")
listor = re.findall(r'colors\\?":\[((?:\\?"[^"\\]+\\?",?)+)\]', sida)
farger = collections.Counter(k for l in listor for k in re.findall(r'\\?"([^"\\]+)\\?"', l))
print(f"/alla-produkter {kod}: {len(listor)} produkter med färg, {len(farger)} färger")
print("  ", farger.most_common(10))
