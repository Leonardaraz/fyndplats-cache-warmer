import glob, os, numpy as np
from PIL import Image
def g(p):
    return np.asarray(Image.open(p).convert("L").resize((320,320)), dtype=np.float32)
kand = {}
for p in sorted(glob.glob("img/*.jpg")):
    kand.setdefault(os.path.basename(p).split("-")[0], []).append((p, g(p)))
pub = [(p, g(p)) for p in sorted(glob.glob("pub/*.jpg"))]
print(f"{len(pub)} publicerade bilder, {sum(len(v) for v in kand.values())} kandidatbilder\n")
for k, bilder in kand.items():
    basta = (999.0, None, None)
    for pk, a in bilder:
        for pp, b in pub:
            d = float(np.abs(a-b).mean())
            if d < basta[0]: basta = (d, os.path.basename(pk), os.path.basename(pp))
    dom = "DUBBLETT" if basta[0] < 1.0 else "annan produkt"
    print(f"{k}  lagsta {basta[0]:6.2f}  {basta[1]} ~ {basta[2]}   -> {dom}")

# --- intern grind: kandidat mot kandidat ---
print("\nINTERNT (kandidat mot kandidat):")
ks=sorted(kand)
for i,a in enumerate(ks):
    for b in ks[i+1:]:
        m=min(float(np.abs(x-y).mean()) for _,x in kand[a] for _,y in kand[b])
        if m < 6.0: print(f"  {a} ~ {b}: {m:.2f}  {'DUBBLETT' if m<1.0 else 'nara'}")
print("  (inget under 6,0 listas)")
