# -*- coding: utf-8 -*-
"""Runda 115 Steg 9 — alt-texter för 42 mediaposter (7 produkter × 6 lägen).

☠️ ALT-TEXTEN PASSERAR INGEN AV TEXTGRINDARNA AV SIG SJÄLV. Den skrivs rakt in
   i Wix media och finns inte i `texter.py`. Runda 106 mätte konsekvensen: sex
   sidor vars brödtext sa att hagen INTE är en kaninbostad, och fem av dem hade
   "kaniner" i en alt-text. Grinden var grön på alla sex.
   Därför körs rundans EGEN grind (`grind.granska`) mot alt-texterna här —
   samma lista, samma mönster, inte en omskriven variant.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbild är iscensatt.
   Barnet, hjälmen och trädgården är inte produktinformation; fordonet och
   underlaget är det. Runbokens formulering nämner uttryckligen *barnet*.

☠️ VARUMÄRKET NÄMNS ALDRIG I ALT-TEXTEN. Sex av sju bär ett husmärke fysiskt i
   plasten (Leonards linje: rör det inte, "det är så produkten ser ut"), men
   bara `23ba27a5` har en NAMNGIVEN licens i underlaget. Att skriva ut märket
   på de andra vore ett påhittat påstående — och alt-texten är det ställe där
   Google läser det. `39d85f18`:s bild 4 är en närbild på just en märkeslogotyp
   i ratten; den beskrivs som "logotypen i rattnavet", utan namn.

☠️ FAKTAKORTET BÖRJAR MED "Faktakort: " och beskriver FAKTA, inte kortet.
"""
import bildplan as B
import matt as M
import texter as T

# ── Position 1: hjälte, studio på vit botten ────────────────────────────────
HJALTE = {
 "cc6b56f9": "Gul och svart grävmaskin att sitta på, fotograferad snett bakifrån "
             "mot vit botten. Grävarmen med skopa sitter bakom sitsen, och "
             "fordonet står på fyra svarta hjul med mönstrat slitbana.",
 "fb142c5c": "Gul och svart hjullastare att sitta på mot vit botten. Den svarta "
             "skopan sitter framtill på en arm, ratten mitt på huven och "
             "styrhandtaget bakom sitsen.",
 "738ca991": "Gul och svart bandgrävare att sitta på mot vit botten. Underredet "
             "är byggt som ett larvband runt om, och grävarmen med skopa "
             "sträcker sig framåt över fronten.",
 "0c05c1a0": "Gul frontlastare att sitta på mot vit botten, med en stor svart "
             "skopa på en arm framtill. Ratten och en svart växelspak sitter "
             "framför sitsen.",
 "23ba27a5": "Gul sparktraktor med påkopplat släp mot vit botten, visad från två "
             "håll. Traktorn har svart sits och ratt, och i släpet står en "
             "skopa och en grep uppställda.",
 "39d85f18": "Gul sparktraktor med påkopplat släp mot vit botten. Sitsen och "
             "ratten är svarta, och i släpet står en blå kratta och en blå "
             "sandskyffel.",
 "389ac5ac": "Blå sparktraktor med påkopplat släp mot vit botten. Sitsen och "
             "ratten är svarta, och i släpet står en gul kratta och en gul "
             "sandskyffel.",
}

# ── Position 2: livsstil. VARAN och UNDERLAGET, inte barnet ─────────────────
LIVSSTIL = {
 "cc6b56f9": "Grävmaskinen att sitta på ute på en asfalterad gång med gräs och "
             "blommande rabatter bakom. Grävarmen är fälld bakåt och sitsen "
             "uppfälld.",
 "fb142c5c": "Hjullastaren att sitta på ute på en jämn gångbana. Skopan vilar "
             "mot marken framför fordonet, redo att skjutas in i lasten.",
 "738ca991": "Bandgrävaren att sitta på ute på en stenlagd uteplats. Larvbanden "
             "ligger platt mot marken och grävarmen pekar snett framåt.",
 "0c05c1a0": "Frontlastaren att sitta på intill en sandhög på en plattlagd yta. "
             "Den stora skopan är sänkt ner mot sanden.",
 "23ba27a5": "Sparktraktorn med släpet påkopplat ute på en stenlagd gård. Släpet "
             "följer efter traktorn på en dragstång.",
 "39d85f18": "Den gula sparktraktorn med släpet påkopplat ute på en plattlagd "
             "yta framför en häck. Krattan och sandskyffeln står kvar i släpet.",
 "389ac5ac": "Den blå sparktraktorn med släpet påkopplat ute på en plattlagd yta "
             "framför en häck. Krattan och sandskyffeln står kvar i släpet.",
}

# ── Position 4 och 5: detaljfoton ───────────────────────────────────────────
DETALJ = {
 "cc6b56f9": ["Grävmaskinen sedd snett framifrån på sandunderlag, med skopan "
              "nedsänkt mot sanden och grävarmen utsträckt.",
              "Närbild på förarhytten med tonade rutor och den svarta ratten "
              "ovanför huven."],
 "fb142c5c": ["Närbild på den svarta frontskopan på sin gula arm. Skopan har en "
              "tandad framkant och en djup, slät insida.",
              "Närbild på den röda tutknappen infälld i den gula karossen "
              "intill det svarta greppet."],
 "738ca991": ["Närbild på den gula grävskopan med tandad framkant, sedd "
              "uppifrån.",
              "Närbild på grävarmen med sina svarta cylindrar och det svarta "
              "handtaget som armen förs med."],
 "0c05c1a0": ["Närbild på den stora svarta skopan med tandad framkant, sedd "
              "snett uppifrån.",
              "Närbild på den svarta växelspaken och ratten framför sitsen."],
 "23ba27a5": ["Närbild på den svarta dragkroken mellan bakhjulen, där släpets "
              "dragstång fästs.",
              "Närbild på släpflaket med skopan och grepen nedstuckna i det, "
              "sett från sitsen och bakåt."],
 "39d85f18": ["Närbild på rattnavet med den runda logotypen i mitten och "
              "rattens tre svarta ekrar.",
              "Närbild på kopplingen mellan traktor och släp, sedd från sidan "
              "mot ett trägolv."],
 "389ac5ac": ["Närbild på den gula krattan och sandskyffeln nedstuckna i det "
              "blå släpflaket, bakom traktorns svarta ryggstöd.",
              "Närbild på kopplingen mellan traktor och släp, sedd från sidan "
              "mot ett trägolv."],
}


def ritning(k):
    """Position 6 (sist): måttritningen. Talen är produktens egna."""
    b, d, h = M.YTTRE[k]
    return (f"Måttritning av fordonet från sidan och framifrån med måtten "
            f"utsatta: {T.tal(b)} cm långt, {T.tal(d)} cm brett och "
            f"{T.tal(h)} cm högt.")


def kort(k):
    """☠️ Faktakortet: börjar med 'Faktakort: ' och beskriver FAKTA."""
    b, d, h = M.YTTRE[k]
    a1, a2 = M.ALDER[k]
    return (f"Faktakort: {T.tal(b)} × {T.tal(d)} × {T.tal(h)} cm, bär "
            f"{T.tal(M.MAXLAST[k])} kg, {a1}–{a2} månader.")


def alla(k):
    """Sex alt-texter i GALLERI-ordning — kortet på plats 3, ritningen sist."""
    d4, d5 = DETALJ[k]
    per_pos = {1: HJALTE[k], 2: LIVSSTIL[k], 3: ritning(k), 4: d4, 5: d5}
    return [kort(k) if p is None else per_pos[p] for p in B.GALLERI[k]]


def kontroll():
    import grind as G
    fel = []
    for k in B.GALLERI:
        rader = alla(k)
        if len(rader) != 6:
            fel.append(f"{k}: {len(rader)} alt-texter, ska vara 6")
        if len(set(rader)) != len(rader):
            fel.append(f"{k}: två bilder delar alt-text — 'inte samma mall × 5'")
        if not rader[2].startswith("Faktakort: "):
            fel.append(f"{k}: kortets alt-text börjar inte med 'Faktakort: '")
        # ☠️ SAMMA grind som brödtexten, mot ALLA sex på en gång.
        d = {"name": T.NAMN[k], "plainDescription": "".join(
            f"<p>{r}</p>" for r in rader)}
        for f in G.granska(k, d):
            if f.startswith(("PEDALFRÅGAN", "yttermåttet", "fliken",
                             "texten slutar")):
                continue        # strukturkrav på BRÖDTEXTEN, inte på alt-text
            fel.append(f"{k} ALT: {f}")
        for r in rader:
            if len(r) > 300:
                fel.append(f"{k}: alt-text på {len(r)} tecken är för lång")
    if fel:
        raise SystemExit("☠️ ALT-GRINDEN FÄLLER:\n  " + "\n  ".join(fel))
    n = sum(len(alla(k)) for k in B.GALLERI)
    print(f"alt.kontroll: {n} alt-texter på {len(B.GALLERI)} produkter, "
          f"noll dubbletter, noll märken, noll ohärledda tal")


if __name__ == "__main__":
    kontroll()
    for k in B.GALLERI:
        print(f"\n── {k} ──")
        for i, r in enumerate(alla(k), 1):
            print(f"  {i}. {r}")
