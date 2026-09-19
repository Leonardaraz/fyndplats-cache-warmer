# -*- coding: utf-8 -*-
"""Runda 110, Steg 9 — bygger galleriskrivningen.

Ordningen är runda 108:s och skälet är kundens: studiobild, miljöbild,
FYNDPLATS-KORT, två närbilder, måttritning sist. Kortet hamnar på plats 3, där
det syns i miniatyrraden utan att man behöver bläddra, och ritningen — som är
uppslagsverk och inte säljbild — hamnar sist.

☠️ GALLERIET LÄSES TILLBAKA FÖRE SKRIVNINGEN och jämförs mot de fem väntade
   fil-id:na. Ser det annorlunda ut avbryts produkten i stället för att skrivas
   över: en annan session polerar samma katalog samtidigt.

☠️ MEDIA SKICKAS MED `id`, ALDRIG `url`. En wixstatic-adress i `url`-fältet
   får Wix att IMPORTERA OM filen till en ny kopia — det var det som gjorde
   halva mediabiblioteket till dubbletter (2026-08-28).
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matt, alt as A, kort as K                          # noqa: E402
import texter as T                                        # noqa: E402
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import kortbygge                                          # noqa: E402

# Uppladdade och verifierade READY 2026-09-09 (1600×1600, byte = lokal fil).
KORTFIL = {
 "a999f2b1": "b379ce_53a9a1ae76774f96a4d23d452fef0d95~mv2.jpg",
 "c35f9d4f": "b379ce_b0a6fc4fae754eeeb2573099e27761e2~mv2.jpg",
 "d72bde5e": "b379ce_c50b34bcab1340f2837971796080c08a~mv2.jpg",
 "316f9945": "b379ce_b6bf682ad58249dca1c37520d85811c7~mv2.jpg",
 "f8fd1b62": "b379ce_c63335c14d5d4eaebf8fb15145613bcb~mv2.jpg",
 "309076e2": "b379ce_008f4649dc4c4b02abbfd46f6c2a2f9c~mv2.jpg",
}
# Galleriets nuvarande ordning, läst ur Wix 2026-09-09 (Steg 3).
NUVARANDE = {
 "a999f2b1": ["b379ce_6ed81cc0c2ca479e98e38e202c10ea3e~mv2.jpg",
              "b379ce_0e1ee56e042f42098764fd029a280854~mv2.jpg",
              "b379ce_b9983f9cbd1c47d1ab16fcdff990a152~mv2.jpg",
              "b379ce_8bf5f8db51a54d10bf6a9b7095ef0c99~mv2.jpg",
              "b379ce_cca9bbcfe5d040bdbfbbbdac390669ac~mv2.jpg"],
 "c35f9d4f": ["b379ce_514d90fe161946079e2109e522004e8f~mv2.jpg",
              "b379ce_0022f05465b74d0d93be049c3e2ee004~mv2.jpg",
              "b379ce_4bcb9c3fc7fb43e8be1508f62d69942f~mv2.jpg",
              "b379ce_5da3371be4af4f879acce76c6e813a42~mv2.jpg",
              "b379ce_4979101d9ecd460fab983999b8aa2abd~mv2.jpg"],
 "d72bde5e": ["b379ce_23c3191e28f94ef6bb17bc1ca317d505~mv2.jpg",
              "b379ce_fb0ec6bddc1f4d23912a86685b80c532~mv2.jpg",
              "b379ce_877704b9e1ce46ad9bc073bc10194733~mv2.jpg",
              "b379ce_53e4cd15e2fa47ec919cc720fef053d1~mv2.jpg",
              "b379ce_e0f9034e0f70414ba28f3d249931bef7~mv2.jpg"],
 "316f9945": ["b379ce_f2c703e769f04cd2a44c3977d0a95667~mv2.jpg",
              "b379ce_23a0fc134fc7469696e4456376c5cb5f~mv2.jpg",
              "b379ce_e0eb09c658da4f4c9b6f107d431a239f~mv2.jpg",
              "b379ce_c5b733102f8f4bab9684d6dc5770658c~mv2.jpg",
              "b379ce_7df8a20eaec0498d8b200dea77197e55~mv2.jpg"],
 "f8fd1b62": ["b379ce_d4671000cee142da9ff635e06cfd1dd8~mv2.jpg",
              "b379ce_afd2211fabad4065bcd36acce59af7f6~mv2.jpg",
              "b379ce_eeabac1b621445f9a915a9d149131750~mv2.jpg",
              "b379ce_a18789d03749406da5c25b276fec9ca7~mv2.jpg",
              "b379ce_cc8560eddf5f45588cd23e7a78400b80~mv2.jpg"],
 "309076e2": ["b379ce_30aafb1c105b44929f07bf1eeeeacf85~mv2.jpg",
              "b379ce_47d4d3669e204fef96c806442d85d62a~mv2.jpg",
              "b379ce_6da4dc1fa11641bd8602b6625609ce9b~mv2.jpg",
              "b379ce_addc56021acf4edeba55484be76f27b0~mv2.jpg",
              "b379ce_4523cd0c86e64650b2c7da8229ba2b04~mv2.jpg"],
}


def kortalt(nyckel):
    """☠️ Kortets alt-text byggs ur KORTETS EGNA rader, inte skriven för hand.
    Då kan bilden och texten om bilden inte drifta isär."""
    spec = K.specrader(nyckel)
    delar = ["%s %s" % (e.lower(), kortbygge.varde(spec[i], e))
             for e, i in K.RADER[nyckel] if e in ("Mått utfälld", "Panel", "Material", "Vikt")]
    return "Faktakort: " + ", ".join(delar) + "."


if __name__ == "__main__":
    poster = []
    for k in sorted(matt.RUNDAN, key=lambda x: (matt.GRUPPER[x], -matt.RUNDAN[x][1])):
        o = NUVARANDE[k]
        a = A.ALT[k]
        rader = [
            {"fil": o[0], "alt": a[0]},                    # studio
            {"fil": o[1], "alt": a[1]},                    # miljö
            {"fil": KORTFIL[k], "alt": kortalt(k)},        # Fyndplats-kort
            {"fil": o[3], "alt": a[3]},
            {"fil": o[4], "alt": a[4]},
            {"fil": o[2], "alt": a[2]},                    # måttritning sist
        ]
        poster.append({"k": k, "id": matt.RUNDAN[k][9], "vantade": o, "rader": rader})
    json.dump(poster, open("media.json", "w"), ensure_ascii=False, indent=1)
    for p in poster:
        print("=== %s  %d bilder" % (p["k"], len(p["rader"])))
        for i, r in enumerate(p["rader"], 1):
            print("  %d %s  %s" % (i, r["fil"][7:17], r["alt"][:74]))
