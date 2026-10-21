#!/usr/bin/env python3
"""mkaterlas2.py <rundakatalog> <ut.js>: bygger återläsningen med options och variantval (efter sammanslagningar)."""
import subprocess, sys
SP = '/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
R, out = sys.argv[1], sys.argv[2]
subprocess.run(['python3', f'{SP}/n167/bygg_aterlas.py', R, out], check=True, capture_output=True)
s = open(out, encoding='utf-8').read()
a = '      revision: p.revision,\n'
assert s.count(a) == 1
s = s.replace(a, a + '      options: (p.options || []).map(function (o) { return { n: o.name, c: ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return c.name + ":" + ((c.linkedMedia || []).length); }) }; }),\n')
b = 'return { sku: x.sku, vis: x.visible, pris:'
assert s.count(b) == 1
s = s.replace(b, 'return { sku: x.sku, vis: x.visible, ch: (x.choices || []).map(function (c) { return (c.optionChoiceNames && c.optionChoiceNames.choiceName) || ""; }).join("/"), pris:')
open(out, 'w', encoding='utf-8').write(s)
print(len(s), 'tecken')
