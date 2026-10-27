#!/usr/bin/env python3
"""gate-vardalt-farg.py <värdrundans katalog> <merge.json> [<merge.json> ...]   (eller --self-test)

Fäller en värdbild vars alt-text nämner GIVARENS färg. Körs före pushen av en runda där en värd får en färg ur ett utkast.

Varför: sammanslagningen länkar värdens egna foton till värdens färg med butikens ägarregler (`olankadeAgare` i
lib/aosom/fargbilder.ts, ordagrant ur butikens lib/variant-bilder.ts). En olänkad bild vars alt-text nämner exakt en av sidans två
färger hör till den färgen. Nämner alt-texten alltså givarens färg, som i `en grå och vit katt` på en beige klöstunna, tolkas fotot som
givarens: sammanslagningen länkar det inte till värdens färg, och butiken visar det bara under givarens färg. Värdens beige tunna syns
då under Grå och saknas under Beige. Hände klöstunnan `56cb4143` (N314, 2026-10-25), bild 5, och hittades först när värdens galleri
lästes efter sammanslagningen. En alt-text som nämner båda färgerna är gemensam och syns under båda, vilket är lika fel för ett foto av
EN färg. Kort och måttbilder är gemensamma med flit (`arKort`) och släpps igenom.

merge.json är samma fil som `ghw.py merge` tar (`merge_<prefix>.json` bredvid rundans skript): [{"behall": "<fullt värd-id>", "utkast": "...",
"farg_behall": "Beige", "farg_utkast": "Grå", ...}]. Det är INTE `merge.json` i givarrundans katalog, som saknar färgnamnen och ger
"0 värdar kontrollerade". Rader utan både `farg_behall` och `farg_utkast` hoppas över (storleksval, eller en värd som redan har
färgaxeln: då är fotona redan länkade). Alt-texterna läses ur värdrundans `alt.tsv` (<id8> TAB <etikett> TAB <alt>; etiketten är
bildens plats i `bilder.tsv`, inte galleriplatsen). Avslutar med 1 vid minst ett fynd. Rättning: skriv alt-texten utan färgordet
(`en katt` i stället för `en grå katt`) före värdrundan, eller länka bilden till värdens färg efter sammanslagningen med
`bygg-lank.py`.

Reglerna är portade ur lib/aosom/fargbilder.ts (`fargFormer`, `nammdaFarger`, `arKort`, `BAKGRUND`). Ändras de där måste de ändras här;
`--self-test` prövar dem mot fallet som hittades och fyra kontroller som inte får fälla."""
import json, os, re, sys

L = r'[^\W\d_]'          # en bokstav (å, ä och ö ingår)
ORD = r'[^\W_]'          # bokstav eller siffra
BAKGRUND = re.compile(
    r'(?<!' + L + r')(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\s+'
    r'(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?!' + L + r')', re.I)


def farg_former(etikett):
    w = (etikett or '').strip().lower()
    if not re.fullmatch(L + r'{3,}', w):
        return None
    former = {w, w + 'a', w + 't', w + 'tt'}
    if w.endswith('d'):
        former.add(w[:-1] + 'tt')
    if w.endswith('t'):
        former.add(w + 't')
    return sorted(former)


def nammda_farger(alt, etiketter):
    text = BAKGRUND.sub(' ', alt or '')
    traffar = []
    for e in etiketter:
        former = farg_former(e)
        if not former:
            continue
        if re.search(r'(?<!' + ORD + r')(?:' + '|'.join(re.escape(f) for f in former) + r')(?!' + ORD + r')', text, re.I):
            traffar.append(e)
    return traffar


def ar_kort(alt):
    return bool(
        re.search(r'^\s*(?:fyndplats|mått|specifikation)', alt, re.I)
        or re.search(r'(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort', alt, re.I)
        or re.search(r'mått(?:bild|ritning|skiss|skisser|uppgifter)', alt, re.I))


def bedom(alt, behall, utkast):
    """'ok' (värdens, länkas), 'delad' (kort eller nämner båda: gemensam), 'givare' (nämner bara givarens färg)."""
    if ar_kort(alt):
        return 'delad'
    t = nammda_farger(alt, [behall, utkast])
    if len(t) == 1:
        return 'givare' if t[0] == utkast else 'ok'
    if len(t) > 1:
        return 'delad'
    return 'ok'


def self_test():
    # Fallet som hittades: bild 5 på klöstunnan, värdens färg Beige och givarens Grå.
    f2 = 'Klöstunnan vid en soffa med en orange katt i bädden överst och en grå och vit katt i en öppning'
    assert bedom(f2, 'Beige', 'Grå') == 'givare', 'fallet från N314 ska fällas'
    # Samma text på ett klösträd vars värdfärg är Ljusgrå och givarens Beige: "grå katt" är inte "Ljusgrå".
    f1 = 'Klösträdet i ett vardagsrum med en grå katt överst, en orange katt på nivån under och en kalikåkatt'
    assert bedom(f1, 'Ljusgrå', 'Beige') == 'ok', 'en grå katt hör inte till färgen Ljusgrå'
    # Ett kort är gemensamt med flit, också när det nämner givarens färg.
    assert bedom('Måttbild: klösträdet är 184 cm högt, grått och beige', 'Beige', 'Grå') == 'delad'
    # Bakgrunden beskriver fotot och inte varan.
    assert bedom('Beige klöstunna på grå bakgrund', 'Beige', 'Grå') == 'ok', 'grå bakgrund är inte färgen Grå'
    # Böjningen: gråa, grått.
    assert bedom('Två gråa kuddar i bädden', 'Beige', 'Grå') == 'givare'
    assert bedom('Ett grått tak över bädden', 'Beige', 'Grå') == 'givare'
    # Ett ord som bara innehåller färgordet är inte färgen.
    assert bedom('Klöstunnan med grånande sisal', 'Beige', 'Grå') == 'ok'
    # Båda färgerna: gemensam, alltså visas fotot under båda.
    assert bedom('Beige klöstunna bredvid en grå', 'Beige', 'Grå') == 'delad'
    print('självtest OK')


def main(a):
    if a and a[0] == '--self-test':
        self_test()
        return 0
    if len(a) < 2:
        print(__doc__)
        return 2
    rund = a[0]
    alt = {}
    for rad in open(os.path.join(rund, 'alt.tsv'), encoding='utf-8').read().splitlines():
        d = rad.split('\t')
        if len(d) >= 3:
            alt.setdefault(d[0], []).append((d[1], d[2]))
    fynd = 0
    kollade = 0
    for fil in a[1:]:
        for m in json.load(open(fil, encoding='utf-8')):
            behall, utkast = m.get('farg_behall'), m.get('farg_utkast')
            if not behall or not utkast:
                continue
            id8 = m['behall'][:8]
            rader = alt.get(id8)
            if not rader:
                print(f'{id8}: inga alt-texter i {rund}/alt.tsv (en annan runda?)')
                continue
            kollade += 1
            for etikett, text in rader:
                if bedom(text, behall, utkast) == 'givare':
                    fynd += 1
                    print(f'FÄLLER {id8} bild {etikett}: alt-texten nämner givarens färg {utkast!r}, så sammanslagningen länkar den inte till '
                          f'{behall!r} och butiken visar den bara under {utkast!r}: {text[:110]}')
    print(f'{kollade} värdar kontrollerade, {fynd} fynd')
    return 1 if fynd else 0


sys.exit(main(sys.argv[1:]))
