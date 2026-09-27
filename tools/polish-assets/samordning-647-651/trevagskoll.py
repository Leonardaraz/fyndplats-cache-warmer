#!/usr/bin/env python3
"""Kontrollerar kategoritexterna efter att #647 och #651 slagits ihop.

    python3 trevagskoll.py <butikens arbetskatalog> <bas> <#647> <#651>

Läser CATEGORY_SEO och CATEGORY_CONTENT ur tre git-versioner och ur
arbetskatalogen, alltså den sammanslagna koden, och prövar varje kategori-slug:

- #647 har lagt till eller ändrat den: resultatet ska vara #647:s version.
- Annars, om #651 har ändrat den: resultatet ska vara #651:s version.
- Annars: basens.

En slug som BÅDA ändrat godtas bara om #651:s ändring är en ren 3–7 → 3–6 och
#647:s version inte nämner någon leveranstid. Allt annat är OKLAR och behöver
en människa. Utfallet 2026-09-24 på 02f123f9 + 1b0cc5d0: 122 av 122 i båda.
"""
import json, os, subprocess, sys, tempfile

if len(sys.argv) != 5:
    sys.exit(__doc__)
butik, refs = os.path.abspath(sys.argv[1]), dict(zip(("bas", "var", "deras"), sys.argv[2:]))
FILER = ("category-seo.ts", "category-content.ts")
DUMP = """const d = process.argv[2];
const { CATEGORY_SEO } = await import(d + "/lib/category-seo.ts");
const { CATEGORY_CONTENT } = await import(d + "/lib/category-content.ts");
console.log(JSON.stringify({ seo: CATEGORY_SEO, content: CATEGORY_CONTENT }));
"""

def las(katalog):
    ut = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", dump, katalog],
                        capture_output=True, text=True, check=True).stdout
    return json.loads(ut)

with tempfile.TemporaryDirectory() as tmp:
    dump = os.path.join(tmp, "dump.mts")
    open(dump, "w", encoding="utf-8").write(DUMP)
    v = {}
    for namn, ref in refs.items():
        os.makedirs(os.path.join(tmp, namn, "lib"))
        for f in FILER:
            kod = subprocess.run(["git", "-C", butik, "show", f"{ref}:lib/{f}"],
                                 capture_output=True, text=True, check=True).stdout
            open(os.path.join(tmp, namn, "lib", f), "w", encoding="utf-8").write(kod)
        v[namn] = las(os.path.join(tmp, namn))
    v["resultat"] = las(butik)

def j(x):
    return json.dumps(x, ensure_ascii=False)

fel = 0
for del_ in ("seo", "content"):
    b, o, t, r = (v[n][del_] for n in ("bas", "var", "deras", "resultat"))
    nycklar = sorted(set(b) | set(o) | set(t) | set(r))
    lika = 0
    for k in nycklar:
        cb, co, ct, cr = b.get(k), o.get(k), t.get(k), r.get(k)
        if co != cb and ct != cb:
            if j(cb).replace("3–7", "3–6") != j(ct) or "3–7" in j(co) or "3–6" in j(co):
                print(f"  OKLAR {del_}/{k}: båda har ändrat, och inte bara leveranstiden")
                fel += 1
                continue
            vantat = co
        elif co != cb:
            vantat = co
        elif ct != cb:
            vantat = ct
        else:
            vantat = cb
        if cr != vantat:
            fel += 1
            print(f"  FEL {del_}/{k}: {'saknas' if cr is None else 'avviker'}")
        else:
            lika += 1
    kvar = sum(j(x).count("3–7") for x in r.values())
    print(f"{del_}: {lika} av {len(nycklar)} slugar som väntat, '3–7' kvar: {kvar}")
print("KLART: inga fel" if fel == 0 else f"{fel} FEL")
sys.exit(1 if fel else 0)
