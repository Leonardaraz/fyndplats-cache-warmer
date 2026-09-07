# -*- coding: utf-8 -*-
"""Runda 99 — ett eget Fyndplats-kort per produkt (Leonards krav 2026-08-26).

Kortet är det enda i galleriet som är VÅRT. Utan det är sidan en
vidarebefordran av leverantörens marknadsföring.

☠️ VÄRDET HÄRLEDS ur spec-tabellen — `kortbygge.varde()` läser raden och tar
   det som står efter kolonet. Ett kort kan alltså inte skriva ett tal som
   inte står i tabellen.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Bild 1 visar på alla sju möbeln STÄNGD
   framifrån: modell C med lådfronten och kuphandtaget, modell D som en sluten
   låda med skålarna i skivan. Rubrikerna beskriver därför fronten och kulören
   — inte förvaringsvolymen, som är dold i just den bilden.

☠️ OCH MEKANIKEN FÅR INTE BLANDAS IHOP HÄR HELLER. Kortet är det första
   kunden ser; ett kort som säger "låda" på en modell D hade varit runda 97:s
   868cc038 en gång till, på den mest synliga ytan. Grinden är tvåvägs och
   speglar lint.py:s regel 4.

⚠️ TVÅTONEN SKA STÅ PÅ KORTET. 8c1d08c5 och 31d6a3df är spegelvända, och i en
   miniatyr är de lätta att förväxla med varandra. Kortet är just miniatyren.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402

KORT = {
    "8c1d08c5": ("Matskåp för hund", "Grå stomme, vit skiva och en stor låda",
                 ["Mått", "Låda", "Skålar"]),
    "3710a0c3": ("Matskåp för hund", "Mörkbrunt, med en stor utdragbar låda",
                 ["Mått", "Låda", "Skålar"]),
    "5eb270ed": ("Matskåp för hund", "Svart, med en stor utdragbar låda",
                 ["Mått", "Låda", "Skålar"]),
    "31d6a3df": ("Matskåp för hund", "Vit stomme, grå skiva och en stor låda",
                 ["Mått", "Låda", "Skålar"]),
    "a8e376e7": ("Matstation för hund", "Vit, hela skivan lyfts av",
                 ["Mått", "Skiva", "Skålar"]),
    "5d7aab1b": ("Matstation för hund", "Grå, hela skivan lyfts av",
                 ["Mått", "Skiva", "Skålar"]),
    "edd89684": ("Matstation för hund", "Mörkbrun, hela skivan lyfts av",
                 ["Mått", "Skiva", "Skålar"]),
}

# ☠️ Mekanikgrind även på kortet, samma tvåvägsregel som lint.py:s regel 4.
MEKANIK = {"C": ("låda", ("lyfts av", "löstagbar skiva", "lock")),
           "D": ("lyfts av", ("låda", "utdragbar", "kuphandtag"))}


def specrader(pid):
    """Spec-tabellen som "Etikett: värde"-strängar — kortbyggets indataform."""
    return ["%s: %s" % (k, v) for k, v in T.SPEC[pid]]


if __name__ == "__main__":
    produkter, kortdata = [], {}
    for pid in T.PRODUKTER:
        kicker, rubrik, etiketter = KORT[pid]
        kravs, forbjudna = MEKANIK[T.GRUPP[pid]]
        lag = rubrik.lower()
        if kravs not in lag:
            raise SystemExit("kortrubriken på %s saknar %r" % (pid, kravs))
        for f in forbjudna:
            if f in lag:
                raise SystemExit("kortrubriken på %s bär %r — fel mekanik"
                                 % (pid, f))
        # ⚠️ Tvåtonen: står det ett komma i färgraden ska BÅDA kulörerna stå
        #    på kortet. Kortet är miniatyren där de två är lättast att blanda.
        farg = dict(T.SPEC[pid])["Färg"]
        if "," in farg:
            for del_ in [d.strip() for d in farg.split(",")]:
                if del_.split()[0] not in lag:
                    raise SystemExit("kortrubriken på %s saknar %r av tvåtonen"
                                     % (pid, del_))
        rader = specrader(pid)
        idx = []
        for e in etiketter:
            träff = [i for i, r in enumerate(rader) if r.startswith(e + ":")]
            if not träff:
                raise SystemExit("kortet på %s pekar på raden %r som inte finns"
                                 % (pid, e))
            idx.append((e, träff[0]))
        produkter.append({"kort": pid, "spec": rader})
        kortdata[pid] = (kicker, rubrik, idx)
    namn, facit = kortbygge.bygg(".", produkter, kortdata)
    import json
    json.dump(facit, open("kort-facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    # ☠️ KOPIERINGEN LIGGER HÄR, INTE I HANDEN (runda 97:s lärdom): kort/ var
    #    en handkopia och gled isär från jpg/ utan att bygget märkte något.
    import shutil, os
    os.makedirs("kort", exist_ok=True)
    for n_ in namn:
        shutil.copy2("jpg/%s.jpg" % n_, "kort/%s.jpg" % n_)
    print("\n%d kort byggda och kopierade till kort/" % len(namn))
