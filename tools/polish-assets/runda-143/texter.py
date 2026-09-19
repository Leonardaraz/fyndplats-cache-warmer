# -*- coding: utf-8 -*-
"""Runda 143 — namn, slug, SEO och SKU för sjutton boxställ, dockor och ett fäste.

☠️ TEXTEN SKRIVS I EN FIL FÖRST (batch 64: nio fel mot noll). En sträng som
skrivs direkt i ett JSON-anrop kan inte läsas av en grind innan den lämnar
chatten, och API-svaret ekar tillbaka exakt det man skrev.

☠️ SKU:n RÄKNAS ur husregeln (`grindar.sku_bas`), aldrig för hand (#483).
Sex av rundans sjutton utkast delar i dag TVÅ SKU:er — `FP-boxsackstander`
bärs av tre och `FP-boxstand-zwei-speedballs` av tre. Det är IMPORTEN som
skapar krocken (#272), inte poleringen, och sluggen är det som löser den.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"

# ---------------------------------------------------------------- slug ---
# Höjden är familjens befintliga skiljetecken: de fem publicerade säckarna
# heter redan …-135-cm-…, …-156-cm, …-160-230-cm och två …-155-205-cm.
SLUG = {
    # A — ställ utan säck
    "f8d974b3": "boxsacksstall-182-225-cm-hopfallbart",
    "d307632a": "boxsacksstall-175-220-cm-speedball",
    # B — ställ med säck
    "49d6d56f": "boxsacksstall-185-231-cm-med-sack",
    "6f603856": "boxsacksstall-220-cm-20-kg-sack",
    "c00988e3": "boxsacksstall-221-cm-sack-och-boll",
    # C — fristående säck
    "7eeb7497": "boxningssack-165-cm-traffytor",
    "1409d762": "boxningssack-170-cm-sugproppar",
    "0deb6901": "boxningssack-175-cm-slagdyna",
    "74602345": "boxningssack-180-cm-tre-fjadrar",
    "702c7795": "boxningssack-180-cm-20-sugproppar",
    "c5c228ab": "boxningssack-158-186-cm-konstlader",
    # D — boxdocka
    "9119599f": "boxdocka-178-207-cm-traffytor",
    # E — boxställ med speedball
    "86f2cb63": "boxstall-rott-140-205-cm",
    "57986794": "boxstall-blatt-140-205-cm",
    "438295ae": "boxstall-svart-140-205-cm",
    "87ec8a16": "boxstall-163-205-cm-reflexstang",
    # F — väggfäste
    "b6c4c619": "vaggfaste-boxsack-nio-vinklar",
}

# ☠️ RÄKNAD, inte skriven. Krockar löses genom att ändra SLUGGEN, aldrig
# genom att skriva SKU:n för hand — den skulle då sluta spegla produktionen.
SKU = {pid: "FP-" + G.sku_bas(s) for pid, s in SLUG.items()}

WIX_VARIANT = {
    "f8d974b3": "42eceb01-14ca-4fd8-873e-1835793a5010",
    "d307632a": "3b96f1d6-6927-4408-bed3-8d054eb05029",
    "49d6d56f": "5b9e9d4d-6506-43be-b8b0-47fe9092f1ad",
    "6f603856": "769514b1-3bd2-465c-bb13-1fe5d7e17298",
    "c00988e3": "4081b58b-488b-4b8f-9dcb-d1d3f698a7f0",
    "7eeb7497": "88ae3d73-d775-4204-bfe1-0520199507cb",
    "1409d762": "8a1267d8-d788-4e5a-9074-0f54180c6003",
    "0deb6901": "890c44eb-7f5e-4eaa-a281-9305b1face69",
    "74602345": "b63e158f-a9b5-430c-aa19-31de7c164aff",
    "702c7795": "06679e48-64b8-47b3-9b17-a17dd6bf7524",
    "c5c228ab": "edae71cb-8a2e-438a-917c-fd3718223450",
    "9119599f": "b9677018-771b-4a92-8205-84e4acac31cc",
    "86f2cb63": "7bef31d2-31c0-4324-b706-16c6917f2109",
    "57986794": "1b05becc-f54c-4f68-a65d-9a8b98aa3fac",
    "438295ae": "f8147fe8-ef6d-4a6d-96fe-e45b43574987",
    "87ec8a16": "f8c016b5-868c-4047-b7dc-fc8deb6a21c6",
    "b6c4c619": "84114c0a-32ee-4365-8b7c-09fbe7f1c649",
}

# ☠️ Priset EKAS tillbaka oförändrat i Steg 8:s variantsInfo-PATCH. Fältet
# är obligatoriskt och allt som inte skickas FÖRSVINNER. Talen är lästa ur
# Wix 2026-09-13, aldrig räknade.
PRIS = {
    "f8d974b3": "1479", "d307632a": "1899", "49d6d56f": "1659",
    "6f603856": "3449", "c00988e3": "2979", "7eeb7497": "2059",
    "1409d762": "2329", "0deb6901": "2619", "74602345": "2199",
    "702c7795": "3059", "c5c228ab": "2399", "9119599f": "2879",
    "86f2cb63": "1399", "57986794": "1479", "438295ae": "1479",
    "87ec8a16": "1859", "b6c4c619": "949",
}

# ---------------------------------------------------------------- namn ---
# ☠️ product.name TAR HÖGST 80 TECKEN. Grinden mäter, den gissar inte.
NAMN = {
    "f8d974b3": "Boxsäcksställ hopfällbart 182–225 cm med tio höjdlägen",
    "d307632a": "Boxsäcksställ 175–220 cm med speedball och sex strävor",
    "49d6d56f": "Boxsäcksställ 185–231 cm med säck i segelduk och viktstänger",
    "6f603856": "Boxsäcksställ 220 cm med 20 kg säck, gummirep och 360° kedja",
    "c00988e3": "Boxsäcksställ 221 cm med 20 kg säck och punchingboll i samma ram",
    "7eeb7497": "Boxningssäck 165 cm fristående med numrerade träffytor",
    "1409d762": "Boxningssäck 170 cm fristående med 12 sugproppar och fjäderfot",
    "0deb6901": "Boxningssäck 175 cm med höj- och sänkbar slagdyna",
    "74602345": "Boxningssäck 180 cm med tre stötdämpande fjädrar",
    "702c7795": "Boxningssäck 180 cm med 20 sugproppar och fot för 120 kg sand",
    "c5c228ab": "Boxningssäck 158–186 cm i konstläder, brun och svart",
    "9119599f": "Boxdocka 178–207 cm med färgmarkerade träffytor",
    "86f2cb63": "Boxställ 140–205 cm med två speedballs och kickdyna, rött",
    "57986794": "Boxställ 140–205 cm med två speedballs och kickdyna, blått",
    "438295ae": "Boxställ 140–205 cm med två speedballs och kickdyna, svart",
    "87ec8a16": "Boxställ 163–205 cm med reflexstång, slagdyna och speedball",
    "b6c4c619": "Väggfäste för boxsäck 80 cm med nio vinklar",
}

# --------------------------------------------------------------- titel ---
# Huvudord + kvalificerare i BÅDE namn, slug och titel — annars flaggar Wix
# SEO-assistenten dem rött.
TITEL = {
    "f8d974b3": "Boxsäcksställ hopfällbart 182–225 cm – bär 60 kg | Fyndplats",
    "d307632a": "Boxsäcksställ 175–220 cm med speedball – bär 60 kg | Fyndplats",
    "49d6d56f": "Boxsäcksställ 185–231 cm med boxsäck i segelduk | Fyndplats",
    "6f603856": "Boxsäcksställ 220 cm med 20 kg boxsäck – bär 120 kg | Fyndplats",
    "c00988e3": "Boxsäcksställ 221 cm med boxsäck och punchingboll | Fyndplats",
    "7eeb7497": "Boxningssäck 165 cm fristående med träffytor | Fyndplats",
    "1409d762": "Boxningssäck 170 cm fristående, 12 sugproppar | Fyndplats",
    "0deb6901": "Boxningssäck 175 cm med slagdyna 65–175 cm | Fyndplats",
    "74602345": "Boxningssäck 180 cm med tre fjädrar i foten | Fyndplats",
    "702c7795": "Boxningssäck 180 cm, 20 sugproppar och 120 kg sand | Fyndplats",
    "c5c228ab": "Boxningssäck 158–186 cm i konstläder, brun | Fyndplats",
    "9119599f": "Boxdocka 178–207 cm med färgmarkerade träffytor | Fyndplats",
    "86f2cb63": "Boxställ 140–205 cm, två speedballs, rött | Fyndplats",
    "57986794": "Boxställ 140–205 cm, två speedballs, blått | Fyndplats",
    "438295ae": "Boxställ 140–205 cm, två speedballs, svart | Fyndplats",
    "87ec8a16": "Boxställ 163–205 cm med reflexstång och slagdyna | Fyndplats",
    "b6c4c619": "Väggfäste boxsäck 80 cm, nio vinklar, 100 kg | Fyndplats",
}

# ---------------------------------------------------------------- meta ---
META = {
    "f8d974b3": "Hopfällbart boxsäcksställ, 170 × 90 cm och 182–225 cm högt i "
                "tio lägen. Bär en säck på 60 kg. Boxsäcken ingår inte.",
    "d307632a": "Boxsäcksställ 160 × 145 cm, 175–220 cm högt, med speedball "
                "25 × 25 cm och sex strävor. Bär en säck på 60 kg. Säck ingår inte.",
    "49d6d56f": "Boxsäcksställ 175 × 91 cm, 185–231 cm högt i 17 lägen. "
                "Säck i segelduk Ø29 × 97 cm ingår ofylld. Tre viktstänger.",
    "6f603856": "Boxsäcksställ 123 × 141 × 220 cm i Q195-stål. 20 kg boxsäck, "
                "gummirep och 360°-kedja ingår. Bär säck upp till 120 kg.",
    "c00988e3": "Boxsäcksställ 115 × 157 × 221 cm med 20 kg boxsäck och "
                "punchingboll i samma ram. Pump ingår. Bär säck på upp till 100 kg.",
    "7eeb7497": "Fristående boxningssäck 165 cm med numrerade träffytor. "
                "Säcken är Ø30 × 95 cm och foten fylls med sand eller vatten.",
    "1409d762": "Fristående boxningssäck 170 cm med 12 sugproppar och fjäder i "
                "foten. Säcken är Ø28 × 110 cm. Fyllningen ingår inte.",
    "0deb6901": "Fristående boxningssäck 175 cm med slagdyna som flyttas mellan "
                "65 och 175 cm. Foten tar 50 kg sand och vatten. Handlindor ingår.",
    "74602345": "Fristående boxningssäck 180 cm med tre stötdämpande fjädrar och "
                "tio sugproppar. Foten tar 60 kg sand. Fyllningen ingår inte.",
    "702c7795": "Fristående boxningssäck 180 cm med 20 sugproppar och en fot som "
                "tar 120 kg sand. Säcken är Ø32 × 115 cm i Q195-stål.",
    "c5c228ab": "Fristående boxningssäck 158–186 cm i konstläder, brun och svart. "
                "Slagytan är Ø36 × 80 cm och foten Ø55 × 60 cm.",
    "9119599f": "Boxdocka 178–207 cm med färgmarkerade träffytor. Kroppen är "
                "46 × 90 cm och foten tar 55 kg sand och vatten.",
    "86f2cb63": "Rött boxställ 140–205 cm med två speedballs, kickdyna Ø15 × 53 cm "
                "och boxstång. Luftpump ingår.",
    "57986794": "Blått boxställ 140–205 cm med två speedballs, kickdyna "
                "Ø15 × 53 cm och boxstång. Luftpump ingår.",
    "438295ae": "Svart boxställ 140–205 cm med två speedballs, kickdyna "
                "Ø15 × 53 cm och boxstång. Luftpump ingår.",
    "87ec8a16": "Boxställ 163–205 cm med reflexstång, slagdyna Ø18 cm och "
                "speedball. Foten tar 40 kg sand och vatten. Handlindor ingår.",
    "b6c4c619": "Väggfäste för boxsäck, 80 cm ut från väggen, nio vinklar och "
                "100 kg bärighet. Kräver betong, tegel eller massivt trä.",
}

# -------------------------------------------------------------- sökord ---
SOKORD = {
    "f8d974b3": ["boxsäcksställ", "hopfällbart boxsäcksställ", "boxsäckshållare",
                 "ställ för boxsäck", "boxställ hemma"],
    "d307632a": ["boxsäcksställ", "boxsäcksställ med speedball", "speedball",
                 "boxsäckshållare", "boxställ"],
    "49d6d56f": ["boxsäcksställ", "boxsäcksställ med säck", "boxsäck och ställ",
                 "höj- och sänkbart boxsäcksställ", "boxställ"],
    "6f603856": ["boxsäcksställ", "boxsäcksställ med säck", "boxsäck 20 kg",
                 "fristående boxsäcksställ", "boxställ"],
    "c00988e3": ["boxsäcksställ", "boxsäck och punchingboll", "boxstation",
                 "boxsäcksställ med boll", "boxställ"],
    "7eeb7497": ["boxningssäck", "fristående boxningssäck", "boxsäck golv",
                 "boxningssäck med träffytor", "golvboxsäck"],
    "1409d762": ["boxningssäck", "fristående boxningssäck", "boxsäck sugproppar",
                 "golvboxsäck", "kickboxsäck"],
    "0deb6901": ["boxningssäck", "boxningssäck med slagdyna", "slagdyna",
                 "fristående boxningssäck", "golvboxsäck"],
    "74602345": ["boxningssäck", "fristående boxningssäck", "boxsäck med fjädrar",
                 "golvboxsäck", "boxsäck 180 cm"],
    "702c7795": ["boxningssäck", "fristående boxningssäck", "boxsäck 180 cm",
                 "golvboxsäck", "kickboxsäck"],
    "c5c228ab": ["boxningssäck", "boxningssäck konstläder", "fristående boxningssäck",
                 "golvboxsäck", "boxsäck brun"],
    "9119599f": ["boxdocka", "boxningsdocka", "boxdummy", "träningsdocka",
                 "boxdocka med träffytor"],
    "86f2cb63": ["boxställ", "speedball", "boxställ med speedball",
                 "reflexträning boxning", "punchingball ställ"],
    "57986794": ["boxställ", "speedball", "boxställ med speedball",
                 "reflexträning boxning", "punchingball ställ"],
    "438295ae": ["boxställ", "speedball", "boxställ med speedball",
                 "reflexträning boxning", "punchingball ställ"],
    "87ec8a16": ["boxställ", "reflexstång", "boxställ med reflexstång",
                 "speedball", "reflexträning boxning"],
    "b6c4c619": ["väggfäste boxsäck", "boxsäckshållare vägg", "väggmontering boxsäck",
                 "boxsäcksfäste", "vikbart boxsäcksfäste"],
}

BATCH = list(SLUG.keys())


def granska():
    """Grinden på Steg 7:s egna fält. Körs FÖRE varje skrivning."""
    fel = []
    # 1. Namnlängden — Wix kapar vid 80 utan att säga till.
    for pid, n in NAMN.items():
        fel += ["%s: %s" % (pid, f) for f in G.granska_namn(n)]
    # 2. Sluggen unik inom batchen, SKU:n likaså.
    for namn, d in [("slug", SLUG), ("sku", SKU)]:
        sett = {}
        for pid, v in d.items():
            if v in sett:
                fel.append("%s KROCK: %s och %s delar %r" % (namn, sett[v], pid, v))
            sett[v] = pid
    # 3. Husmärke, artikelnummer, tyska och homoglyfer i VARJE fält (#441).
    for pid in BATCH:
        for falt, text in [("namn", NAMN[pid]), ("titel", TITEL[pid]),
                           ("meta", META[pid]), ("slug", SLUG[pid]),
                           ("sku", SKU[pid])]:
            for f in G.ARTNR.findall(text):
                fel.append("%s %s: ARTIKELNUMMER %r" % (pid, falt, f))
            for m in G.HUSMARKEN:
                if m in text.lower():
                    fel.append("%s %s: HUSMÄRKE %r" % (pid, falt, m))
            for o in G.LANDORD:
                if o in text.lower():
                    fel.append("%s %s: LANDORD %r" % (pid, falt, o))
            for h in G.homoglyfer(text):
                fel.append("%s %s: HOMOGLYF %s" % (pid, falt, h))
            for m in G.TREKONSONANT.finditer(text):
                fel.append("%s %s: TREKONSONANT %r" % (pid, falt, m.group(0)))
        # 4. Huvudordet ska stå i namn, titel OCH slug.
        huvud = SOKORD[pid][0].split()[0].lower()
        for falt, text in [("namn", NAMN[pid]), ("titel", TITEL[pid])]:
            if huvud not in text.lower():
                fel.append("%s %s: huvudordet %r saknas" % (pid, falt, huvud))
        if huvud.replace("ä", "a").replace("ö", "o").replace("å", "a") \
                not in SLUG[pid]:
            fel.append("%s slug: huvudordet %r saknas" % (pid, huvud))
        # 5. Metan ska rymmas i ett utdrag.
        if len(META[pid]) > 165:
            fel.append("%s meta: %d tecken (max 165)" % (pid, len(META[pid])))
    return fel


if __name__ == "__main__":
    f = granska()
    print("produkter:", len(BATCH))
    for pid in BATCH:
        print("  %-9s %-36s %s" % (pid, SKU[pid], NAMN[pid][:46]))
    print("\nGRIND:", "GRÖN" if not f else "%d FEL" % len(f))
    for x in f:
        print("  ✗", x)
