# -*- coding: utf-8 -*-
"""Runda 122: fyra städvagnar med press.

☠️ FLIKRUBRIKERNA ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR i butikens `splitFlikar`
   (`components/productview.tsx` → `FLIK_TITLE_PATTERNS`). Rubriken måste heta
   `Användning och skötsel` ORDAGRANT, och korslänkarna måste ligga FÖRE
   `<h2>Tekniska specifikationer</h2>` — allt efter en flikrubrik hamnar inne i
   den fliken.

☠️ MAXLASTEN STÅR INTE PÅ NÅGON SIDA. Leverantörens tal (15 respektive 25 kg)
   är mindre än vad hinkarna rymmer vatten — se STEG2-5.md. Skriv inte in det.

🔒 Inget avsändarland. Inga priser. Inga påhittade tal — varje siffra kommer ur
   spec-blocket, den tyska texten eller måttritningen.
"""

NAMN = {
    "6490e360": "Moppvagn med dubbla hinkar och press – 73 cm på fyra hjul",
    "0cbffcd9": "Städvagn 111 cm med press, sopsäck och två 18-litershinkar – grå",
    "740fa6d0": "Städvagn 111 cm med press, sopsäck och två 18-litershinkar – svart",
    "832f9eec": "Städvagn 93 cm med fyra hinkar, press och sopsäck",
}

SLUG = {
    "6490e360": "moppvagn-dubbla-hinkar-press-73-cm",
    "0cbffcd9": "stadvagn-111-cm-press-sopsack-gra",
    "740fa6d0": "stadvagn-111-cm-press-sopsack-svart",
    "832f9eec": "stadvagn-93-cm-fyra-hinkar-press-sopsack",
}

SKU = {
    "6490e360": "FP-moppvagn-dubbla-hinkar-press",
    "0cbffcd9": "FP-stadvagn-111-cm-press-gra",
    "740fa6d0": "FP-stadvagn-111-cm-press-svart",
    "832f9eec": "FP-stadvagn-93-cm-fyra-hinkar",
}

TITEL = {
    "6490e360": "Moppvagn med två hinkar och press, 73 cm | Fyndplats",
    "0cbffcd9": "Städvagn 111 cm med press och sopsäck, grå | Fyndplats",
    "740fa6d0": "Städvagn 111 cm med press och sopsäck, svart | Fyndplats",
    "832f9eec": "Städvagn 93 cm med fyra hinkar och press | Fyndplats",
}

META = {
    "6490e360": "Moppvagn 73 × 45 × 92 cm med två hinkar och press mellan dem. Fyra hjul, chassi i plast och metall. Väger 9,7 kg.",
    "0cbffcd9": "Städvagn 111 × 63,3 × 103 cm med två 18-litershinkar, press, sopsäck och tre plan. Fem hjul. Grå ram.",
    "740fa6d0": "Städvagn 111 × 63,3 × 103 cm med två 18-litershinkar, press, sopsäck och tre plan. Fem hjul. Svart ram.",
    "832f9eec": "Städvagn 93 × 80 × 97 cm med två 18-litershinkar, två på 6 liter, press och sopsäck. Fyra spårfria hjul.",
}

SOKORD = {
    "6490e360": ["moppvagn med press", "moppvagn två hinkar", "städvagn med press", "moppvagn"],
    "0cbffcd9": ["städvagn med press", "städvagn med sopsäck", "städvagn hotell", "moppvagn"],
    "740fa6d0": ["städvagn med press", "städvagn med sopsäck", "städvagn hotell", "moppvagn"],
    "832f9eec": ["städvagn fyra hinkar", "städvagn med press", "städvagn med sopsäck", "moppvagn"],
}

RUBRIK = {
    "6490e360": "Två hinkar, en press, fyra hjul",
    "0cbffcd9": "Tre plan, sopsäck och två hinkar med press",
    "740fa6d0": "Tre plan, sopsäck och två hinkar med press",
    "832f9eec": "Fyra hinkar med färgskiljda uppgifter",
}

INTRO = {
    "6490e360": "Den här moppvagnen är byggd runt en enkel idé: skölj aldrig moppen i det vatten du just torkat upp med. Två hinkar står bredvid varandra på ett chassi med fyra hjul, och pressen sitter mellan dem — du doppar i den ena, pressar, och det smutsiga hamnar i den andra. Vagnen är 92 cm hög, så du skjuter den framför dig utan att böja rygg.",
    "0cbffcd9": "Det här är städvagnen för ytor där en hink inte räcker. Tre plan bär det du behöver ha med dig, sopsäcken hänger i en egen ram med lock, och två hinkar på 18 liter står nere vid golvet med pressen i den ena. Fem hjul gör att den rullar rakt även fullastad, och handtaget sitter så att du kan styra med en hand.",
    "740fa6d0": "Det här är städvagnen för ytor där en hink inte räcker. Tre plan bär det du behöver ha med dig, sopsäcken hänger i en egen ram med lock, och två hinkar på 18 liter står nere vid golvet med pressen i den ena. Fem hjul gör att den rullar rakt även fullastad, och handtaget sitter så att du kan styra med en hand.",
    "832f9eec": "Fyra hinkar i två storlekar, och de har olika färger av en anledning: du håller isär vad som är till vad. De två stora på 18 liter står nere vid pressen och tar golvvattnet, de två små på 6 liter sitter i en trådkorg i höjd med handen och är till för ytor. Sopsäcken hänger bakom i sin egen ram med lock.",
}

PUNKTER = {
    "6490e360": [
        "Två hinkar sida vid sida, vardera 37,5 × 35 × 31,5 cm",
        "Press mellan hinkarna, 26,5 × 20,5 × 56,5 cm",
        "Fyra hjul på ett chassi i plast",
        "Skjuthandtag med greppgummi",
        "Blå och röd hink på grått chassi",
        "Väger 9,7 kg — lätt att lyfta över en tröskel",
    ],
    "0cbffcd9": [
        "Två hinkar på 18 liter, en av dem med press",
        "Sopsäck i polyesterväv med lock, 69 × 37 cm",
        "Öppen back på mellanplanet, 49,6 × 32,4 × 12 cm",
        "Pressen mäter 26,5 × 20,5 × 56,5 cm",
        "Fem hjul — går rakt även när vagnen är full",
        "Grå ram med blå säck och hinkar i orange och blått",
    ],
    "740fa6d0": [
        "Två hinkar på 18 liter, en av dem med press",
        "Sopsäck i polyesterväv med lock, 69 × 37 cm",
        "Öppen back på mellanplanet, 49,6 × 32,4 × 12 cm",
        "Pressen mäter 26,5 × 20,5 × 56,5 cm",
        "Fem hjul — går rakt även när vagnen är full",
        "Svart ram med blå säck och hinkar i orange och blått",
    ],
    "832f9eec": [
        "Två hinkar på 18 liter nere vid pressen",
        "Två hinkar på 6 liter i trådkorg, i höjd med handen",
        "Färgskiljda hinkar så att rent och smutsigt hålls isär",
        "Sopsäck 81 × 44 cm med öppning på 43 × 28 cm",
        "Fyra hjul med metallaxel som inte lämnar märken",
        "Ljus ram med hinkar i orange och blått",
    ],
}

SPEC = {
    "6490e360": [
        ("Yttermått", "73 × 45 × 92 cm (längd × bredd × höjd)"),
        ("Hinkarnas mått", "37,5 × 35 × 31,5 cm styck, två stycken"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Vikt", "9,7 kg"),
        ("Material", "metall och polypropen"),
        ("Färg", "blå och röd hink på grått chassi"),
        ("Hjul", "fyra stycken"),
        ("Ingår", "vagn med två hinkar, press och monteringsanvisning"),
        ("Montering", "Enkel montering krävs."),
        ("Paketmått", "75 × 43 × 43 cm"),
    ],
    "0cbffcd9": [
        ("Yttermått", "111 × 63,3 × 103 cm (längd × bredd × höjd)"),
        ("Hinkarnas volym", "18 liter styck, två stycken"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Backens mått", "49,6 × 32,4 × 12 cm"),
        ("Sopsäckens mått", "69 × 37 cm"),
        ("Vikt", "22,2 kg"),
        ("Material", "metall, plast och polyesterväv"),
        ("Färg", "grå ram, blå säck, hinkar i orange och blått"),
        ("Hjul", "fem stycken"),
        ("Ingår", "vagn med två hinkar, press, sopsäck och monteringsanvisning"),
        ("Paketmått", "93 × 52 × 46 cm"),
    ],
    "740fa6d0": [
        ("Yttermått", "111 × 63,3 × 103 cm (längd × bredd × höjd)"),
        ("Hinkarnas volym", "18 liter styck, två stycken"),
        ("Pressens mått", "26,5 × 20,5 × 56,5 cm"),
        ("Backens mått", "49,6 × 32,4 × 12 cm"),
        ("Sopsäckens mått", "69 × 37 cm"),
        ("Vikt", "22,2 kg"),
        ("Material", "metall, plast och polyesterväv"),
        ("Färg", "svart ram, blå säck, hinkar i orange och blått"),
        ("Hjul", "fem stycken"),
        ("Ingår", "vagn med två hinkar, press, sopsäck och monteringsanvisning"),
        ("Paketmått", "93 × 52 × 46 cm"),
    ],
    "832f9eec": [
        ("Yttermått", "93 × 80 × 97 cm (längd × bredd × höjd)"),
        ("Stora hinkar", "18 liter styck, två stycken"),
        ("Små hinkar", "6 liter styck, två stycken"),
        ("Sopsäckens mått", "81 × 44 cm"),
        ("Säckens öppning", "43 × 28 cm"),
        ("Material", "järn, plast och polyesterväv"),
        ("Färg", "ljus ram, hinkar i orange och blått, blå säck"),
        ("Hjul", "fyra stycken med metallaxel, spårfria"),
        ("Ingår", "vagn med fyra hinkar, press och sopsäck"),
        ("Paketmått", "76,5 × 52,5 × 47,5 cm"),
    ],
}

SKOTSEL = {
    "6490e360": "Töm båda hinkarna efter varje pass och skölj dem — står smutsvatten kvar över natten sätter sig lukten i plasten. Pressen lyfts ur och sköljs för sig. Torka av chassit med en fuktig trasa; det tål vanligt rengöringsmedel men inte lösningsmedel. Kontrollera hjulen då och då och peta bort hårstrån och trådar som lindat sig runt axlarna, annars börjar vagnen dra åt sidan. Vagnen är gjord för inomhusbruk och ska förvaras torrt.",
    "0cbffcd9": "Töm hinkarna och skölj dem efter varje pass, och lyft ur pressen och skölj den för sig. Sopsäcken är av polyesterväv och kan torkas av eller sköljas ur — låt den torka hängande innan du sätter tillbaka locket, annars blir det instängt. Backen på mellanplanet går att lyfta ut och diska. Torka ramen med en fuktig trasa. Peta bort trådar och hårstrån som lindat sig runt hjulaxlarna, så rullar vagnen rakt. Förvaras torrt inomhus.",
    "740fa6d0": "Töm hinkarna och skölj dem efter varje pass, och lyft ur pressen och skölj den för sig. Sopsäcken är av polyesterväv och kan torkas av eller sköljas ur — låt den torka hängande innan du sätter tillbaka locket, annars blir det instängt. Backen på mellanplanet går att lyfta ut och diska. Torka ramen med en fuktig trasa. Peta bort trådar och hårstrån som lindat sig runt hjulaxlarna, så rullar vagnen rakt. Förvaras torrt inomhus.",
    "832f9eec": "Håll hinkarna åtskilda på uppgift och färg — det är hela poängen med att de är fyra. Töm och skölj alla fyra efter passet, och lyft ur pressen och skölj den separat. Sopsäcken i polyesterväv sköljs ur och får hänga och torka innan locket läggs på. Torka ramen med en fuktig trasa; järnramen är lackerad och tål vatten men ska inte stå blöt. Se till att hjulaxlarna är fria från trådar, annars går vagnen tungt. Förvaras torrt inomhus.",
}

FAQ = {
    "6490e360": [
        ("Ingår moppen?", "Nej. Vagnen levereras med två hinkar, press och monteringsanvisning — moppen köper du separat."),
        ("Varför två hinkar?", "Den ena bär rent vatten, den andra tar emot det du pressar ur moppen. Då sköljer du aldrig moppen i smutsvattnet, och golvet blir renare av samma arbete."),
        ("Hur mycket rymmer hinkarna?", "Varje hink mäter 37,5 × 35 × 31,5 cm invändigt. Någon volym i liter är inte angiven för den här modellen, och vi räknar hellre inte om ett mått till en siffra som skulle bli ungefärlig."),
        ("Måste den monteras?", "Ja, men det är en enkel montering och anvisningen ligger i kartongen."),
        ("Går den att använda hemma?", "Ja. Den är 73 cm lång och 45 cm bred, alltså smalare än de flesta dörrar, och 9,7 kg är lätt nog att lyfta över en tröskel."),
    ],
    "0cbffcd9": [
        ("Ingår moppen?", "Nej. Vagnen kommer med två hinkar, press, sopsäck och monteringsanvisning. Moppen och moppskaftet köper du separat."),
        ("Vad skiljer den här från syskonmodellen?", "Bara ramens färg. Måtten, hinkarna, pressen, sopsäcken och vikten är identiska."),
        ("Hur stora är hinkarna?", "18 liter var, två stycken. Pressen sitter i den ena."),
        ("Varför fem hjul och inte fyra?", "Det femte hjulet sitter mitt under vagnen och tar upp last när den är full, så att de fyra yttre inte snedbelastas."),
        ("Går sopsäcken att ta av?", "Ja, den hänger i en egen ram med lock och kan lyftas ur för att tömmas och sköljas."),
    ],
    "740fa6d0": [
        ("Ingår moppen?", "Nej. Vagnen kommer med två hinkar, press, sopsäck och monteringsanvisning. Moppen och moppskaftet köper du separat."),
        ("Vad skiljer den här från syskonmodellen?", "Bara ramens färg. Måtten, hinkarna, pressen, sopsäcken och vikten är identiska."),
        ("Hur stora är hinkarna?", "18 liter var, två stycken. Pressen sitter i den ena."),
        ("Varför fem hjul och inte fyra?", "Det femte hjulet sitter mitt under vagnen och tar upp last när den är full, så att de fyra yttre inte snedbelastas."),
        ("Går sopsäcken att ta av?", "Ja, den hänger i en egen ram med lock och kan lyftas ur för att tömmas och sköljas."),
    ],
    "832f9eec": [
        ("Ingår moppen?", "Nej. Vagnen levereras med sina fyra hinkar, pressen och sopsäcken. Moppen köper du separat."),
        ("Vad ska de små hinkarna användas till?", "De sitter högt, i höjd med handen, och är tänkta för ytor — bord, handfat, lister. De stora nere vid pressen tar golvvattnet."),
        ("Varför har hinkarna olika färg?", "För att du ska kunna hålla isär vad som är vad. Färgkodning är standard i städbranschen just för att slippa flytta smuts mellan ytor."),
        ("Hur stor är sopsäcken?", "Duken mäter 81 × 44 cm och öppningen 43 × 28 cm. Den hänger i en egen ram med lock."),
        ("Lämnar hjulen märken?", "Nej. Hjulen har metallaxel och är spårfria, alltså gjorda för att rulla på hårda golv utan att svärta ner."),
    ],
}

KORSLANK = {
    "6490e360": [("0cbffcd9", "Större städvagn med sopsäck och tre plan"),
                 ("832f9eec", "Städvagn med fyra hinkar")],
    "0cbffcd9": [("740fa6d0", "Samma städvagn med svart ram"),
                 ("832f9eec", "Städvagn med fyra hinkar i två storlekar")],
    "740fa6d0": [("0cbffcd9", "Samma städvagn med grå ram"),
                 ("832f9eec", "Städvagn med fyra hinkar i två storlekar")],
    "832f9eec": [("0cbffcd9", "Städvagn med två hinkar och tre plan"),
                 ("6490e360", "Mindre moppvagn med två hinkar")],
}


def bygg(pid):
    ut = [f"<p>{INTRO[pid]}</p>"]
    ut.append(f"<h2>{RUBRIK[pid]}</h2><ul>")
    ut += [f"<li>{p}</li>" for p in PUNKTER[pid]]
    ut.append("</ul>")

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN, med flit. Butikens
    #    splitFlikar lägger allt EFTER en flikrubrik inne i den fliken.
    lankar = " ".join(
        f'<a href="https://www.fyndplats.se/produkt/{SLUG[m]}">{t}</a>.'
        for m, t in KORSLANK[pid])
    ut.append("<h2>Passar inte den här?</h2>")
    ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    ut += [f"<li><strong>{e}:</strong> {v}</li>" for e, v in SPEC[pid]]
    ut.append("</ul>")

    # ☠️ RUBRIKEN MÅSTE HETA "Användning och skötsel" — ORDAGRANT.
    ut.append("<h2>Användning och skötsel</h2>")
    ut.append(f"<p>{SKOTSEL[pid]}</p>")

    ut.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        ut.append(f"<p><strong>{f}</strong></p><p>{s}</p>")
    return "".join(ut)


if __name__ == "__main__":
    import json
    import re

    def _text(html):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()

    d = {}
    for pid in NAMN:
        html = bygg(pid)
        t = _text(html)
        d[pid] = {"namn": NAMN[pid], "slug": SLUG[pid], "titel": TITEL[pid],
                  "meta": META[pid], "sokord": SOKORD[pid], "sku": SKU[pid],
                  "html": html, "ord": len(t.split()),
                  "synliga_tecken": len(t), "ordsumma": sum(ord(c) for c in t)}
    json.dump(d, open("skrivning.json", "w"), ensure_ascii=False, indent=1)
    for pid, v in d.items():
        print(f"{pid}  {v['ord']:4d} ord  {v['synliga_tecken']:5d} tecken  "
              f"titel {len(v['titel']):3d}  meta {len(v['meta']):3d}  "
              f"namn {len(v['namn']):3d}")
