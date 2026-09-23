# -*- coding: utf-8 -*-
"""Beskär de tre tyska måttritningarna och PADDA TILLBAKA TILL KVADRAT.

☠️ Paddningen är inte kosmetik. PDP:n hämtar bilden med `fill/…,al_c`, som
   mittbeskär — och på en liggande ritning är det precis sidorna där
   måttetiketterna sitter. Runda 112 lärde sig det på en ritning som tappade
   sina siffror i butiken men såg hel ut i filen.
"""
import io, urllib.request
from PIL import Image
import bildplan

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_1400,h_1400,al_c,q_92/f.jpg"
FIL = {("47a91a17", 3): "b379ce_dbb3d6421eec4e019458bffea697290f~mv2.jpg",
       ("15d30e23", 3): "b379ce_a459fb6bf6714c0a9a29917a0d3b6b3b~mv2.jpg",
       ("fdbfcea0", 3): "b379ce_75c96b552dc248ed8f0b16d4d0d3a9fe~mv2.jpg"}

for k, per in bildplan.BESKARNING.items():
    for i, ((x0, y0, x1, y1), skal) in per.items():
        req = urllib.request.Request(BAS % FIL[(k, i)], headers={"User-Agent": "Mozilla/5.0"})
        b = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
        w, h = b.size
        klipp = b.crop((int(w * x0 / 100), int(h * y0 / 100),
                        int(w * x1 / 100), int(h * y1 / 100)))
        # ☠️ Övermålningen görs FÖRE paddningen, och procenten räknas mot den
        #    beskurna bilden — det är den enda referens som är stabil.
        for (mx0, my0, mx1, my1) in bildplan.OVERMALNING.get(k, {}).get(i, []):
            kw, kh = klipp.size
            ruta = (int(kw * mx0 / 100), int(kh * my0 / 100),
                    int(kw * mx1 / 100), int(kh * my1 / 100))
            # ☠️ EN PLATT FYLLNING SYNS. Första försöket la en enfärgad grå
            #    ruta mitt i en texturerad bakgrund — den tog bort texten och
            #    satte dit en artefakt i stället, alltså ett annat fel.
            #    Bandet KOPIERAS i stället från raderna strax under, som är
            #    samma suddiga bakgrund, och speglas lodrätt så skarven inte
            #    upprepar ett mönster.
            hojd = ruta[3] - ruta[1]
            kalla = klipp.crop((ruta[0], ruta[3], ruta[2], min(ruta[3] + hojd, kh)))
            if kalla.height < hojd:
                kalla = kalla.resize((ruta[2] - ruta[0], hojd))
            klipp.paste(kalla.transpose(Image.FLIP_TOP_BOTTOM), (ruta[0], ruta[1]))
        sida = max(klipp.size)
        # bakgrunden är mörk på alla tre — paddningsfärgen tas ur bildens
        # egen övre vänstra pixelrad så skarven inte syns
        botten = klipp.getpixel((2, 2))
        kvadrat = Image.new("RGB", (sida, sida), botten)
        kvadrat.paste(klipp, ((sida - klipp.width) // 2, (sida - klipp.height) // 2))
        namn = "beskurna/%s-%d.jpg" % (k, i)
        kvadrat.save(namn, quality=93)
        print("%s  %s → %s  (%s)" % (namn, klipp.size, kvadrat.size, skal[:48]))
