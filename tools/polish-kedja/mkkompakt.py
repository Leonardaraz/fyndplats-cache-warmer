#!/usr/bin/env python3
"""mkkompakt.py <rundakatalog> <ut.js> [givare-id8=fullt-id ...]: återläsning med options/variantval, kompakt SEO och givarsynlighet, utan pad."""
import subprocess, sys, json
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
R, out = sys.argv[1], sys.argv[2]
giv = dict(a.split('=', 1) for a in sys.argv[3:])
subprocess.run(['python3', f'{SP}/mkaterlas3.py', R, out], check=True, capture_output=True)
s = open(out, encoding='utf-8').read()
a = '      seo: p.seoData || null,\n'
assert s.count(a) == 1
s = s.replace(a, "      seo: (function () { const t = ((p.seoData && p.seoData.tags) || []); const ti = t.filter(function (x) { return x.type === 'title'; })[0]; const me = t.filter(function (x) { return x.type === 'meta' && x.props && x.props.name === 'description'; })[0]; return { title: ti ? ti.children : null, desc: me && me.props ? me.props.content : null, n: t.length, kw: ((p.seoData && p.seoData.settings && p.seoData.settings.keywords) || []).length }; })(),\n")
b = '    pad: "x".repeat(101000)\n'
assert s.count(b) == 1
s = s.replace(b, '    givare: gv\n')
c = '  const lika = ut.filter'
assert s.count(c) == 1
blk = '  const GIV = ' + json.dumps(giv) + ';\n  const gv = [];\n  for (const k of Object.keys(GIV)) {\n    const r2 = await wix.request({ method: "GET", url: "https://www.wixapis.com/stores/v3/products/" + GIV[k] });\n    const p2 = (r2.data || r2).product;\n    gv.push({ k: k, visible: p2.visible, slug: p2.slug });\n  }\n'
s = s.replace(c, blk + c)
s = s.replace('    allaSkiljer: lika === 0 && ut.length > 1,\n', '    allaSkiljer: lika === 0 && ut.length > 1,\n')
open(out, 'w', encoding='utf-8').write(s)
print(len(s), 'tecken')
