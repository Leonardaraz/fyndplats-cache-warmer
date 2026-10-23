#!/usr/bin/env python3
# farg-tillagg.py <kandlogg> <godkanda.tsv> <ut.json>
# godkanda.tsv: sida8<TAB>val8<TAB>fil-id<TAB>alt-text (alt får vara tom)
# Skriver tillagg.json: {"sidor":[{"id","val","bilder":[{"fil","alt"?}]}]} med de FULLA id:na ur FARG-raderna i loggen.
import re, sys, json, collections

logg, godk, ut = sys.argv[1:4]
full = {}
for rad in open(logg, encoding="utf-8", errors="replace"):
    rad = re.sub(r"^\d{4}-\d\d-\d\dT[\d:.]+Z ", "", rad.rstrip("\n"))
    rad = re.sub(r"\x1b\[[0-9;]*m", "", rad)
    m = re.match(r"^FARG (\S+) (.*?) nuvarande ", rad)
    if m:
        sid, _, val = m.group(1).partition(":")
        full[(sid[:8], val[:8])] = (sid, val)

per = collections.OrderedDict()
for rad in open(godk, encoding="utf-8"):
    if not rad.strip() or rad.startswith("#") or rad.startswith("sida8"):
        continue
    d = rad.rstrip("\n").split("\t")
    sida8, val8, fil = d[0], d[1], d[2]
    alt = d[3].strip() if len(d) > 3 else ""
    if (sida8, val8) not in full:
        sys.exit(f"okänd färg {sida8}:{val8}")
    per.setdefault((sida8, val8), []).append((fil, alt))

sidor = []
for (s8, v8), lista in per.items():
    sid, val = full[(s8, v8)]
    sidor.append({"id": sid, "val": val, "bilder": [({"fil": f, "alt": a} if a else {"fil": f}) for f, a in lista]})
json.dump({"sidor": sidor}, open(ut, "w"), ensure_ascii=False, indent=1)
print(f"{len(sidor)} färger, {sum(len(s['bilder']) for s in sidor)} bilder → {ut}")
