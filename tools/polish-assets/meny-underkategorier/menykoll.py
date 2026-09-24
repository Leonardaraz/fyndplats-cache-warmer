#!/usr/bin/env python3
"""Menyns underkategorier i server-HTML: jämför två byggen sida för sida.
Argument: <nytt bygge> <förra bygget>. Räknar /kategori/-länkar utanför <script>,
unika underkategorier (allt utom de tio avdelningarna), sidstorlek rå och gzip."""
import gzip, re, subprocess, sys
AVD = {"hem-inredning","mobler","tradgard-utemobler","husdjur","sport-fritid","barn-familj",
       "kok-husgerad","skonhet-halsa","elektronik-tillbehor","mode-accessoarer"}
SIDOR = ["/", "/kategori/mobler", "/kategori/tv-bankar", "/produkt/agilityset-hund-3-delar",
         "/butik", "/blogg", "/vanliga-fragor"]
def hamta(bas, v):
    r = subprocess.run(["curl", "-sS", "--compressed", "--max-time", "90", "-w", "\n%{http_code}", bas + v],
                       capture_output=True)
    body, _, kod = r.stdout.rpartition(b"\n")
    return kod.decode(), body
def matt(html):
    t = html.decode("utf8", "replace")
    utan = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    hrefs = re.findall(r'<a\b[^>]*href="/kategori/([a-z0-9-]+)', utan)
    under = {h for h in hrefs if h not in AVD}
    paneler = len(re.findall(r'class="meganav-panel"', utan))
    dolda = len(re.findall(r'class="meganav-panel"[^>]*hidden', utan))
    return len(hrefs), len(under), paneler, dolda, len(html), len(gzip.compress(html))
nytt, fore = sys.argv[1].rstrip("/"), sys.argv[2].rstrip("/")
alla_under = set()
print(f"{'sida':38} {'status':>7} {'kat.länkar':>11} {'underkat':>9} {'paneler':>8} {'dolda':>6} {'rå kB':>12} {'gzip kB':>12}")
for v in SIDOR:
    k1, b1 = hamta(nytt, v); k0, b0 = hamta(fore, v)
    m1, m0 = matt(b1), matt(b0)
    t1 = b1.decode("utf8", "replace")
    alla_under |= set(re.findall(r'<a\b[^>]*class="meganav-sub"[^>]*href="/kategori/([a-z0-9-]+)', re.sub(r"<script.*?</script>", "", t1, flags=re.S)))
    print(f"{v[:38]:38} {k0+'→'+k1:>7} {str(m0[0])+'→'+str(m1[0]):>11} {str(m0[1])+'→'+str(m1[1]):>9} "
          f"{m1[2]:>8} {m1[3]:>6} {m0[4]/1024:5.0f}→{m1[4]/1024:<5.0f} {m0[5]/1024:5.1f}→{m1[5]/1024:<5.1f}")
print(f"\nunika underkategorier i menypanelerna: {len(alla_under)}")
