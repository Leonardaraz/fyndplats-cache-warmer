import re, glob, html, os, sys

def text(p):
    h=open(p,encoding="utf-8",errors="replace").read()
    h=re.sub(r'<script.*?</script>','',h,flags=re.S); h=re.sub(r'<style.*?</style>','',h,flags=re.S)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',h)))

def tal(t):
    """alla cm-tal pa sidan: bade '75 × 56 × 115 cm' och '385 cm'"""
    ut=set()
    for m in re.finditer(r'(\d{1,3}(?:[,.]\d)?)(?=\s*(?:cm|[x×]))', t):
        ut.add(float(m.group(1).replace(",",".")))
    return ut

# Kandidaternas YTTERMATT (b, d, h) ur den tyska specen
KAND = {
 "7d28f235": (74,43,88),
 "dd08c210": (79,43,92),
 "78404955": (100,62,65),
 "bd3fe8da": (110,55,117),
 "616b057f": (83,40,92),
 "275e9b8a": (77,54.2,179),
 "0e9ec85b": (120,61,62),
 "25ed0c55": (147,68,198),
}
if "--kontroll" in sys.argv:
    KAND["c9a24404 (KONTROLL, kand dubblett)"] = (75,56,115)

pub={os.path.basename(p)[:-5]: tal(text(p)) for p in sorted(glob.glob("sidor/*.html"))}
print(f"{len(pub)} publicerade sidor lasta\n")
fel=0
for k,(b,d,h) in KAND.items():
    bast=[]
    for s,ns in pub.items():
        n=sum(1 for v in (b,d,h) if any(abs(v-x)<=1.0 for x in ns))
        bast.append((n,s))
    bast.sort(reverse=True)
    n,s = bast[0]
    dom = "DUBBLETTMISSTANKE" if n==3 else ("nara" if n==2 else "unik")
    if n==3: fel+=1
    print(f"{k:<38} {b}x{d}x{h}  basta traff {n}/3 -> {s}   [{dom}]")
print(f"\n{fel} kandidat(er) med alla tre yttermatt pa en publicerad sida")
