#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""parse_ut.py <fil> [<ut.json>]: läser ett ExecuteWixAPI-svar som verktyget sparat i en fil (svaret är paddat med 101 000 tecken så att
verktyget sparar det) och ger JSON-delen, alltså allt före `,"pad"`. Skriver <ut.json> om det anges och skriver nycklarna till skärmen.
Filen börjar ibland med en rad `[TRUNCATED: ...]`; den hoppas över. Datadelen måste ligga före `pad` i svaret (se pool.js och hamta_vevor.js)."""
import json, sys


def las(fil):
    t = open(fil, encoding='utf-8').read()
    i = t.find('{')
    t = t[i:]
    k = t.find(',"pad"')
    if k >= 0:
        t = t[:k] + '}'
    return json.loads(t)


if __name__ == '__main__':
    d = las(sys.argv[1])
    if len(sys.argv) > 2:
        json.dump(d, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
        print('skrev', sys.argv[2], '| nycklar', list(d)[:12])
    else:
        print('nycklar', list(d)[:12])
