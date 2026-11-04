#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""lagg_mattbild.py <rundkatalog> <block.json>: lägger VEVOR:s mått- och funktionsbilder som ett källblock i kallor.json.

`block.json` är `{id8: [rad, ...]}`. Raderna är siffror och etiketter lästa ur VEVOR:s bilder på position 2-7, på engelska
som i bilden. Utkastets sex bilder är VEVOR:s position 9, 8, 1, 10, 11 och 12, så måttbilden och funktionsbilderna ligger
aldrig i galleriet och siffrorna i dem når texten bara genom det här blocket (`FLAGGADE-VEVOR.md` (iv)).

Blocket får rubriken RUB. Finns rubriken redan ersätts bara det blocket (fram till nästa rad som börjar med `=== `), så att
blocken från `vevor_kalla.py` efter det inte försvinner; annars läggs blocket sist. Rundornas egna skript klippte förr allt
efter rubriken, och vevor-blocken försvann när skriptet kördes om efter `vevor_kalla.py` (runda vevor-leksak-8). Anropet
är idempotent och ordningen mellan de två verktygen spelar ingen roll.

En rad som bär modellnumrets etikett nekas (*model number*, *modell*, *artikel*): måttbilden har modellnumret i sin
tabell, och repot är publikt. Felet skriver bara radens nummer, aldrig raden."""
import json
import re
import sys

RUB = '=== källa: VEVOR:s måttbild och funktionsbilder (siffror och etiketter lästa ur bilderna, som inte ligger i galleriet) ==='
MODELL = re.compile(r'model\s*(number|no\b)|modell|artikel|item\s*no', re.I)


def lagg(text, rader):
    lines = text.split('\n')
    if RUB in lines:
        i = lines.index(RUB)
        j = i + 1
        while j < len(lines) and not lines[j].startswith('=== '):
            j += 1
        ny = lines[:i] + [RUB] + rader + lines[j:]
        return '\n'.join(ny).rstrip('\n') + '\n'
    return text.rstrip('\n') + '\n' + RUB + '\n' + '\n'.join(rader) + '\n'


if __name__ == '__main__':
    rot, fil = sys.argv[1], sys.argv[2]
    B = json.load(open(fil, encoding='utf-8'))
    for k, rader in B.items():
        for n, r in enumerate(rader, 1):
            if MODELL.search(r) or r.startswith('=== '):
                sys.exit(f'{k}: rad {n} bär modellnumrets etikett eller börjar på === och nekas')
    for k, rader in B.items():
        p = f'{rot}/skriv/{k}/kallor.json'
        d = json.load(open(p, encoding='utf-8'))
        d[k] = lagg(d[k], rader)
        json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(k, len(d[k]))
