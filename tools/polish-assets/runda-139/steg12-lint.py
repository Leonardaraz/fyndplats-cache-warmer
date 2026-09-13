# -*- coding: utf-8 -*-
"""Steg 12, mekaniska halvan. Grinden ar byggd ur KODPUNKTER (runda 46),
och varje grind pastar nagot om sig sjalv innan den kors."""
import re, sys, json, itertools
sys.path.insert(0, "..")
import texter, grindar

IDS = json.load(open("ids.json"))["produkter"]
PIDS = sorted(texter.NAMN)

# ---- osynliga tecken: harledda ur kodpunkter, aldrig skrivna som tecken ----
OSYNLIGT = {chr(c): "U+%04X" % c for c in (0x00AD, 0x00A0, 0x200B, 0xFEFF, 0x200E, 0x200F)}
assert all(ord(t) > 0x20 for t in OSYNLIGT), "grinden ar avvapnad"
assert len(OSYNLIGT) == 6, "en nyckel har kollapsat"

fel = []
def f(pid, txt): fel.append((pid, txt))

T = {}
for pid in PIDS:
    T[pid] = texter.bygg(pid)

# 1. osynliga tecken
for pid, h in T.items():
    for tecken, namn in OSYNLIGT.items():
        if tecken in h:
            f(pid, "osynligt tecken %s" % namn)

# 2. defensiv rost / leverantorsrost
DEFENSIVT = [
    r"leverantören ange\w*", r"tillverkaren ange\w*", r"enligt leverantören",
    r"vi har inga uppgifter", r"vi vet inte", r"vi kan inte garantera",
    r"uppges? vara", r"ska enligt uppgift", r"var ärlig",
    r"kontrollera själv", r"mät själv", r"väg själv",
]
for pid, h in T.items():
    for m in DEFENSIVT:
        if re.search(m, h, re.I):
            f(pid, "defensiv rost: %s" % m)

# 3. superlativ MOT EGEN BATCH -- matbart, alltsa matt
SUP = {
    "högst":  ("hojd_cm", max), "högsta":  ("hojd_cm", max),
    "lägst":  ("hojd_cm", min), "lägsta":  ("hojd_cm", min),
    "tyngst": ("vikt_kg", max), "tyngsta": ("vikt_kg", max),
    "lättast": ("vikt_kg", min), "lättaste": ("vikt_kg", min),
    "bredast": ("bredd_cm", max), "bredaste": ("bredd_cm", max),
    "störst": ("bredd_cm", max), "största": ("bredd_cm", max),
    "minst":  ("bredd_cm", min), "minsta":  ("bredd_cm", min),
}
def tal(pid, falt):
    s = texter.SPEC.get(pid, [])
    for etikett, varde in s:
        e = etikett.lower()
        if falt == "hojd_cm" and ("mått" in e or "höjd" in e):
            m = re.findall(r"(\d+[,.]?\d*)", varde)
            if m: return max(float(x.replace(",", ".")) for x in m)
        if falt == "vikt_kg" and "vikt" in e:
            m = re.search(r"(\d+[,.]?\d*)", varde)
            if m: return float(m.group(1).replace(",", "."))
    return None

# Bara ett superlativ som SKALAR MOT SORTIMENTET ar ett pastaende om batchen.
# "toppbadden sitter hogst" och "borja med den lagsta delen" handlar om produkten
# sjalv -- att falla dem lar lasaren att bladdra forbi (runbokens Steg 12, fynd 3).
SORTIMENT = re.compile(
    r"(av\s+v[åa]ra|bland\s+v[åa]ra|i\s+sortimentet|av\s+alla\s+v[åa]ra|"
    r"vi\s+har|av\s+v[åa]rt|i\s+v[åa]rt\s+sortiment|hos\s+oss)", re.I)
RACKVIDD = 90   # tecken pa vardera sidan

for ord_, (falt, fn) in SUP.items():
    varden = {p: tal(p, falt) for p in PIDS}
    varden = {k: v for k, v in varden.items() if v is not None}
    if not varden: continue
    vinnare = fn(varden, key=varden.get)
    for pid, h in T.items():
        ren = re.sub(r"<[^>]+>", " ", h)
        for m in re.finditer(r"(?<![A-Za-zÅÄÖåäö])" + ord_ + r"(?![A-Za-zÅÄÖåäö])", ren, re.I):
            fonster = ren[max(0, m.start()-RACKVIDD): m.end()+RACKVIDD]
            if not SORTIMENT.search(fonster):
                continue                      # inom produkten, inte mot batchen
            if pid != vinnare:
                f(pid, "sortimentssuperlativ '%s' men %s har %s=%s"
                     % (ord_, vinnare, falt, varden[vinnare]))

# --- sjalvtest: grinden maste FALLA pa ett inplanterat fel, annars ar den dod ---
def _sjalvtest():
    falt, fn = "hojd_cm", max
    varden = {p: tal(p, falt) for p in PIDS}
    varden = {k: v for k, v in varden.items() if v is not None}
    vinnare = fn(varden, key=varden.get)
    offer = [p for p in PIDS if p != vinnare and tal(p, falt)][0]
    mut = "Den högsta av våra klösmöbler står här."
    traff = SORTIMENT.search(mut) and re.search(
        r"(?<![A-Za-zÅÄÖåäö])högsta(?![A-Za-zÅÄÖåäö])", mut, re.I)
    assert traff, "sortimentsgrinden fyrar inte pa ett inplanterat fel"
    # och den far INTE falla pa den formulering som ar korrekt inom produkten
    ok = "toppbädden sitter högst med fri sikt"
    assert not SORTIMENT.search(ok), "sortimentsgrinden fyrar pa korrekt text"
    return vinnare, offer
_v, _o = _sjalvtest()
print("sjalvtest sortimentssuperlativ: fyrar pa fel, tyst pa ratt (vinnare %s)" % _v)

# 4. ordagrant delade stycken -- matt, inte gissat
def meningar(h):
    ren = re.sub(r"<[^>]+>", " ", h)
    return [m.strip() for m in re.split(r"(?<=[.!?])\s+", ren) if len(m.strip()) > 40]
raknare = {}
for pid, h in T.items():
    for m in set(meningar(h)):
        raknare.setdefault(m, []).append(pid)
delade = {m: p for m, p in raknare.items() if len(p) > 1}

# 5. syskonlikhet, 5-gram Jaccard pa synlig text
def gram(h, n=5):
    ord_ = re.sub(r"<[^>]+>", " ", h).lower().split()
    return set(tuple(ord_[i:i+n]) for i in range(len(ord_)-n+1))
G = {p: gram(h) for p, h in T.items()}
par = []
for a, b in itertools.combinations(PIDS, 2):
    j = len(G[a] & G[b]) / max(1, len(G[a] | G[b]))
    par.append((j, a, b))
par.sort(reverse=True)

print("=== STEG 12 mekanisk ===")
print("produkter: %d" % len(T))
print("osynliga-tecken-grind: %d kodpunkter, alla > U+0020" % len(OSYNLIGT))
print()
print("-- delade meningar (ordagrant, >40 tecken) --")
if delade:
    for m, p in sorted(delade.items(), key=lambda x: -len(x[1])):
        print("  %d sidor: %s" % (len(p), m[:90]))
else:
    print("  inga")
print()
print("-- syskonlikhet, topp 5 av %d par --" % len(par))
for j, a, b in par[:5]:
    print("  %.3f  %s / %s" % (j, a, b))
print("  median %.3f" % sorted(x[0] for x in par)[len(par)//2])
print()
if fel:
    print("GRIND: %d fel" % len(fel))
    for p, t in fel: print("  %s  %s" % (p, t))
    sys.exit(1)
print("GRIND: 0 fel")
