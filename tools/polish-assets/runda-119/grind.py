# -*- coding: utf-8 -*-
"""Runda 119 textgrind — körs på FILEN, före varje API-anrop.

Ordningen är mätt, inte vald: batch 64 skrev fem produkter inline och tre via
fil + grind. De fem gav NIO fel som nådde Wix, de tre gav noll.

Maskineriet delas med runda 115–118 via `grindar.py`. Det som är NYTT här:

  1. ☠️ **HOMOGLYFGRINDEN.** Rundans ingress bar ett KYRILLISKT `а` i ordet
     "degа" — ett tecken som ser ut som ett svenskt a, renderas som ett a och
     är osynligt för varje grind som letar efter ORD. Det hittades av en
     teckenkodssvep, inte av ögat. En sådan text går inte att söka i, matchar
     inte kundens sökning och ser i alla verktyg helt korrekt ut.
  2. Fyra grindar mot rundans egna risker: utomhus, utfällbar skiva, soft close
     och femte hjulet — egenskaper som bara vissa av de nio har.
"""
import re
import sys
import unicodedata

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import matt as M             # noqa: E402
import texter as T           # noqa: E402

# Leveransomfattning. Tyskans `Lieferumfang` säger för samtliga nio
# "1 x vagn/köksö + 1 x anvisning" — inget tillbehör, ingen bricka utöver de
# som sitter fast, inga glas och inga flaskor.
INGAR = ["vagn", "köksö", "bruksanvisning", "monteringsanvisning"]

FORBJUDET = [
    (re.compile(r"\b(homcom|outsunny|pawhut|aiyaplay|vinsetto|aosom)\b", re.I),
     "HUSMÄRKE"),
    (G.ARTNR, "ARTIKELNUMMER"),
    (re.compile(r"\b(tyskland|kina|polen|spanien|eu-lager|skickas\s+från)\b", re.I),
     "LEVERANSLAND"),
    (re.compile(r"\bleverantör\w*\b", re.I), "ATTRIBUTION — mot kunden är VI leverantören"),
    (re.compile(r"\brundan?\b", re.I), "INTERN JARGONG"),
    (re.compile(r"<br\s*/?>", re.I), "WIX STRIPPAR <br>"),
    (re.compile(r'href="(?!https://www\.fyndplats\.se/)', re.I),
     "RELATIV LÄNK — Wix skriver om den till https:/ med ETT snedstreck"),
    (re.compile(r"\b(küchenwagen|kücheninsel|servierwagen|rollwagen|schublade|"
                r"schrank|regal|tablett|arbeitsplatte|weiß|schwarz|eiche|bambus|"
                r"kautschukholz|kiefernholz|spanplatte)\b", re.I), "TYSKT ORD"),
]

TONGRINDAR = [
    (re.compile(r"\b(marknadens|världens|bäst[ae]|överlägsen|oslagbar|"
                r"perfekt|revolutioner\w*)\b", re.I), "OGRUNDAD SUPERLATIV"),
    (re.compile(r"\b(mät|väg|kontrollera)\s+(din|ditt|dina)\b", re.I),
     "BER KUNDEN MÄTA"),
    (re.compile(r"\b(certifierad|ce-märkt|godkänd\s+enligt)\b", re.I),
     "OGRUNDAD CERTIFIERING"),
    # ⚠️ `5d1696db` har en glasyta som leverantören INTE anger som härdad.
    (re.compile(r"\bhärdat?\s+glas\b", re.I), "OGRUNDAD HÄRDNING"),
]

NEGERANDE_GRINDAR = [
    # ☠️ Ett mönster som SJÄLVT bär en negation måste sökas direkt. `loftestraff`
    #    ursäktar en träff som är negerad i sin egen mening, så ett mönster som
    #    `\bvi vet inte\b` blir alltid urskuldat och kan ALDRIG fyra (runda 117).
    (re.compile(r"\b(vi\s+vet\s+inte|uppges\s+inte|anges\s+inte|"
                r"inga\s+uppgifter|framgår\s+inte)\b", re.I),
     "SKRIVER ATT VI INTE VET"),
]

# ── Rundans fyra egna grindar ──────────────────────────────────────────────
ENSKILDA = [
    (re.compile(r"\b(utomhus|uteplats\w*|altan\w*|trädgård\w*|regn\w*|väder\w*|"
                r"grill\w*|ute\b)\b", re.I),
     {"36526a8d"}, "UTOMHUSBRUK"),
    (re.compile(r"\b(utfällbar\w*|klaffskiv\w*|klaffen|fälls?\s+ut|uppfälld\w*|"
                r"nedfälld\w*)\b", re.I),
     set(M.UTFALLBAR), "UTFÄLLBAR SKIVA"),
    (re.compile(r"\bsoft\s*close\b", re.I), set(M.SOFTCLOSE), "SOFT CLOSE"),
    (re.compile(r"\b(rotting|bambu)\b", re.I), {"5d1696db"}, "BAMBU OCH ROTTING"),
]

# ☠️ HJULANTALET. Två av de nio har FEM hjul, sju har fyra. Att skriva fel
#    antal är ett påstående kunden märker vid uppackning, och det är precis den
#    sortens fel som glider mellan nio nästan lika texter.
FEM_HJUL_RE = re.compile(r"\bfem\s+hjul\b", re.I)
FYRA_HJUL = re.compile(r"\bfyra\s+hjul\b", re.I)
BROMS = re.compile(r"\bbroms\w*\b", re.I)

# ☠️ INGEN av de nio får säga massivt trä. `Kautschukholz` gäller SKIVAN på
#    c86ff1a6 och `Kiefernholz` skivan på 6cf7cfcf och dac7a904 — stommen är
#    spånskiva eller MDF i båda fallen, och den svenska raden säger bara
#    `Holzwerkstoff`.
MASSIVT = re.compile(r"\bmassiv\w*\b", re.I)
FAR_SAGA_MASSIVT = set()

STAVFEL = ["dögn", "engangs", "ihopsatt", "för hard", "hopfälbar", "utdragskorg ",
           "handuk", "melamin belagd", "rotting flätad", "brömsade", "arbetsyt ",
           "utdragslåd ", "spjälhyll ", "vinstäl ", "kryddhyll ", "utdragsbrick "]

# ☠️ HOMOGLYFER. Ett kyrilliskt `а`, `е`, `о`, `с`, `р` eller ett grekiskt `ο`
#    ser ut som sin latinska tvilling, renderas likadant och passerar varje
#    ordbaserad grind. Rundans egen ingress bar ett; det hittades av ett svep
#    över teckenkoder, inte av ögat.
#
#    ⚠️ Grinden får INTE vara en svartlista över kända homoglyfer — den listan
#    är oändlig. Den är en VITLISTA: allt utanför latin-1 plus de skiljetecken
#    huset faktiskt använder fälls, och en ny tecken-önskan läggs till här med
#    flit i stället för att smyga in.
TILLATNA_TECKEN = set(
    "abcdefghijklmnopqrstuvwxyzåäöéü"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖÉÜ"
    "0123456789"
    " \t\n\r"
    ".,;:!?-–—()[]{}<>/\\\"'’”“…&%+=*#@_|~^$"
    "×Ø°"
)


def homoglyfer(text):
    """(tecken, position, sammanhang) för varje tecken utanför vitlistan."""
    ut = []
    for i, ch in enumerate(text):
        if ch in TILLATNA_TECKEN:
            continue
        ut.append((ch, unicodedata.name(ch, "?"), text[max(0, i - 25):i + 15]))
    return ut


def _tal(txt):
    return re.findall(r"\d+(?:,\d+)?", txt)


def granska(pid):
    fel = []
    namn, slug, titel, meta, sokord, html = T.bygg(pid)
    syn = G.synlig_meningstext(html)
    d = M.M[pid]

    # ☠️ SIDANS EGNA PÅSTÅENDEN ÄR INTE HELA SIDANS TEXT. En korshänvisning bär
    #    GRANNENS egenskaper — "köksö med klaffskiva" är sant om d8bbbdde och
    #    står i dac7a904:s text som en länk. Produktegna grindar körs på `egna`.
    egna_rader, kors = G.dela_pa_ankare(html)
    egna = " ".join(egna_rader)

    # 1. Längder och identitet
    if len(namn) > 80:
        fel.append(f"NAMNET är {len(namn)} tecken (max 80)")
    if len(titel) > 60:
        fel.append(f"TITELN är {len(titel)} tecken (max 60)")
    if len(meta) > 155:
        fel.append(f"METAN är {len(meta)} tecken (max 155)")
    if titel.strip() == namn.strip():
        fel.append("TITEL = NAMN → butiken renderar mallen '{name} | Fyndplats'")
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        fel.append(f"SLUGGEN är inte ren ASCII-gemener: {slug!r}")

    # 2. Huvudordet i namn, titel och slug
    huvud = sokord[0].split()[0].lower()
    hslug = huvud.replace("ä", "a").replace("å", "a").replace("ö", "o")
    if huvud not in namn.lower():
        fel.append(f"HUVUDORDET {huvud!r} saknas i namnet")
    if huvud not in titel.lower():
        fel.append(f"HUVUDORDET {huvud!r} saknas i titeln")
    if hslug not in slug:
        fel.append(f"HUVUDORDET {hslug!r} saknas i sluggen")

    # 3. ☠️ HOMOGLYFER i allt som når kunden.
    for falt, text in (("namn", namn), ("titel", titel), ("meta", meta),
                       ("brödtext", syn), ("sökord", " ".join(sokord))):
        for ch, kodnamn, sammanhang in homoglyfer(text):
            fel.append(f"FRÄMMANDE TECKEN i {falt}: {ch!r} ({kodnamn}) "
                       f"— …{sammanhang.strip()}…")

    # 4. Förbjudet och ton
    for monster, etikett in FORBJUDET:
        m = monster.search(html)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")
    for monster, etikett in TONGRINDAR:
        m = G.loftestraff(monster, syn)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(syn, m.start()).strip()[:110]}…")
    for monster, etikett in NEGERANDE_GRINDAR:
        m = monster.search(syn)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(syn, m.start()).strip()[:110]}…")

    # 5. Egenskaper som bara vissa har — på sidans EGNA meningar
    for monster, agare, etikett in ENSKILDA:
        m = monster.search(egna)
        if m and pid not in agare:
            fel.append(f"{etikett} på en produkt som inte har det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:110]}…")
    # …och länkmeningarna mot MÅLETS facit.
    for mal, mening in kors:
        malpids = {p for p in M.ALLA if T.SLUG[p] in mal}
        for monster, agare, etikett in ENSKILDA:
            if monster.search(mening) and malpids and not (malpids & agare):
                fel.append(f"KORSLÄNK påstår {etikett} om {sorted(malpids)}: "
                           f"…{mening.strip()[:110]}…")

    # 6. Hjulantalet
    if pid in M.FEM_HJUL:
        if FYRA_HJUL.search(egna):
            fel.append("FYRA HJUL på en produkt med FEM")
    else:
        if FEM_HJUL_RE.search(egna):
            fel.append("FEM HJUL på en produkt med FYRA")
    if "broms" in d["hjul"] and not BROMS.search(egna):
        fel.append("BROMSEN nämns inte — två av hjulen har broms")

    # 7. Materialet
    m = MASSIVT.search(egna)
    if m and pid not in FAR_SAGA_MASSIVT:
        fel.append(f"MASSIVT TRÄ: …{G.mening_kring(egna, m.start()).strip()[:110]}… "
                   f"— materialet är {d['material']}")

    # 8. ☠️ Färgade DELAR. Runda 89–91 skrev fel färg tre rundor i rad.
    for del_, tillatna in M.DEL_OK[pid].items():
        for m in re.finditer(rf"(\w+)\s+{del_}\w*", egna, re.I):
            ordet = m.group(1).lower()
            if ordet in G.FARGORD and ordet not in [t.lower() for t in tillatna]:
                fel.append(f"FÄRG PÅ {del_.upper()}: {ordet!r} — uppmätt är "
                           f"{'/'.join(tillatna)}")

    # 9. Leveranslöften
    fel += G.leveransloften(egna, INGAR, pid)

    # 10. Svensk sifferstil
    if re.search(r"\d+\.\d", syn):
        fel.append("DECIMALPUNKT i stället för komma")
    if re.search(r"\d+\s*x\s*\d+", syn):
        fel.append("'x' som multiplikationstecken i stället för '×'")

    # 11. Talgrinden: varje tal måste gå att spåra till matt.py
    kallor = " ".join(str(v) for v in d.values()) + " " + " ".join(M.HARLEDDA)
    tillatna = set(_tal(kallor))
    for t in _tal(egna):
        if t not in tillatna:
            fel.append(f"OSPÅRAT TAL {t!r} — står inte i matt.py['{pid}']")

    # 12. ☠️ DUBBLERAD ENHET (runda 118): `matt.py` bär enheten, mallen får
    #     inte lägga på en till.
    m = re.search(r"(Ø|cm|kg|mm|×)\s+\1\b", syn)
    if m:
        fel.append(f"DUBBLERAD ENHET: {m.group(0)!r} — datan bär den redan")

    # 12b. ☠️ DUBBLERAT ORD. Samma familj som DUBBLERAD ENHET, men med ORD:
    #      `matt.py['yta']` bar "skiva i gummiträ" och mallen skriver
    #      "Skiva i {yta}" — resultatet blev "Skiva i skiva i gummiträ" på TRE
    #      produkter, i ingressen, i punktlistan och i FAQ:n. Talgrinden var
    #      blind (inga tal), ordgrindarna var blinda (varje ord är korrekt),
    #      och det hittades först när den renderade texten LÄSTES.
    m = re.search(r"\b(\w{4,})\b(?:\s+(?:i|på|med|av|och|som|den|det)\b)+\s+\1\b",
                  syn, re.I)
    if m:
        fel.append(f"DUBBLERAT ORD: {m.group(0)!r} — fältet bär redan ordet mallen "
                   f"lägger till")

    # 13. ☠️ EN DEL FÅR INTE BÄRA HELA MÖBELNS YTTERMÅTT (runda 118). Båda
    #     talen står i matt.py, så talgrinden är blind för förväxlingen.
    fotavtryck = rf"{re.escape(d['bredd'])}\s*×\s*{re.escape(d['djup'])}"
    delord = (r"skiv\w*|låd\w*|fack\w*|hyll\w*|bricka|brickor|skåp\w*|"
              r"arbetsyt\w*|yta|ytan|glasyt\w*")
    m = re.search(rf"\b({delord})\s+(?:på|om|är)\s+{fotavtryck}", egna, re.I)
    if m:
        fel.append(f"DELEN BÄR MÖBELNS YTTERMÅTT: …{m.group(0)}… — "
                   f"{d['bredd']} × {d['djup']} är hela möbeln")

    # 14. FAQ-formen: fråga och svar som TVÅ <p>
    if re.search(r"<strong>[^<]*\?</strong>(?!</p>)", html):
        fel.append("FAQ-FRÅGA sitter ihop med svaret — skriv två <p>")

    # 15. ☠️ KORTETS RUBRIK ÄR OGRANSKAD om den bor i texter.py utan grind.
    kicker, rubrik = T.KORT[pid]
    korttext = f"{kicker}. {rubrik}."
    for monster, etikett in FORBJUDET + TONGRINDAR:
        m = monster.search(korttext)
        if m:
            fel.append(f"KORTET, {etikett}: {m.group(0)!r}")
    for monster, agare, etikett in ENSKILDA:
        if monster.search(korttext) and pid not in agare:
            fel.append(f"KORTET, {etikett} på en produkt som inte har det: {korttext!r}")
    for ch, kodnamn, _ in homoglyfer(korttext):
        fel.append(f"KORTET, FRÄMMANDE TECKEN {ch!r} ({kodnamn})")
    for t_ in _tal(korttext):
        if t_ not in tillatna:
            fel.append(f"KORTET, OSPÅRAT TAL {t_!r}")

    # 16. Stavfel
    for ord_ in STAVFEL:
        if ord_ in syn.lower():
            fel.append(f"STAVFEL {ord_!r}")

    # 17. Korslänkarnas mål måste finnas — en död länk är värre än ingen.
    for s, _text in T.SYSKON.get(pid, []):
        if s == slug:
            fel.append(f"KORSLÄNK till SIG SJÄLV: {s!r}")
    return fel


# ── Självtest: varje grind ska gå att utlösa ───────────────────────────────
def byggartest():
    """☠️ Prövar NORMALISERINGEN, inte utfallet.

    Runda 118 lärde huset att en grind mot något `bygg()` redan normaliserar
    bort är omöjlig att utlösa — den ser riktig ut i källkoden och tiger för
    alltid. Punktlistan versaliseras, så en `<li>`-grind mot gemen kan aldrig
    fyra. Det som DÄREMOT går att pröva är att normaliseringen finns.
    """
    fel = []
    for pid in M.ALLA:
        _, _, _, _, _, html = T.bygg(pid)
        for m in re.finditer(r"<li>(.)", html):
            if m.group(1).isalpha() and not m.group(1).isupper():
                fel.append(f"{pid}: punkt börjar med gemen {m.group(1)!r}")
        for m in re.finditer(r"</strong></p><p>(.)", html):
            if m.group(1).isalpha() and not m.group(1).isupper():
                fel.append(f"{pid}: FAQ-svar börjar med gemen {m.group(1)!r}")
    return fel


FALL = [
    ("husmärke", "ad390a36", lambda h: h + "<p>Tillverkad av HOMCOM.</p>", "HUSMÄRKE"),
    ("leveransland", "ad390a36", lambda h: h + "<p>Skickas från Tyskland.</p>", "LEVERANSLAND"),
    ("attribution", "ad390a36", lambda h: h + "<p>Leverantören anger 30 kg.</p>", "ATTRIBUTION"),
    ("tyskt ord", "ad390a36", lambda h: h + "<p>En Küchenwagen.</p>", "TYSKT ORD"),
    ("superlativ", "ad390a36", lambda h: h + "<p>Marknadens bästa vagn.</p>", "SUPERLATIV"),
    ("härdat glas", "5d1696db", lambda h: h + "<p>Skivan är i härdat glas.</p>", "HÄRDNING"),
    ("massivt trä", "6cf7cfcf", lambda h: h + "<p>Skivan är massivt furu.</p>", "MASSIVT TRÄ"),
    ("utomhus på fel produkt", "ad390a36",
     lambda h: h + "<p>Vagnen tål att stå utomhus.</p>", "UTOMHUSBRUK"),
    ("utfällbar på fel produkt", "ad390a36",
     lambda h: h + "<p>Skivan fälls ut vid behov.</p>", "UTFÄLLBAR SKIVA"),
    ("soft close på fel produkt", "ad390a36",
     lambda h: h + "<p>Dörren har soft close.</p>", "SOFT CLOSE"),
    ("bambu på fel produkt", "ad390a36", lambda h: h + "<p>Ramen är bambu.</p>",
     "BAMBU OCH ROTTING"),
    ("fem hjul på fyrhjuling", "ad390a36", lambda h: h + "<p>Den har fem hjul.</p>",
     "FEM HJUL"),
    ("fyra hjul på femhjuling", "9e5e788c", lambda h: h + "<p>Den har fyra hjul.</p>",
     "FYRA HJUL"),
    ("ospårat tal", "ad390a36", lambda h: h + "<p>Den väger 77 kg.</p>", "OSPÅRAT TAL"),
    ("decimalpunkt", "ad390a36", lambda h: h + "<p>Skivan är 1.5 cm tjock.</p>",
     "DECIMALPUNKT"),
    ("x i stället för ×", "ad390a36", lambda h: h + "<p>Måttet är 53 x 37.</p>", "'x' som"),
    ("dubblerad enhet", "ad390a36", lambda h: h + "<p>Ytan är 53 cm cm bred.</p>",
     "DUBBLERAD ENHET"),
    ("dubblerat ord", "ad390a36", lambda h: h + "<p>Skiva i skiva i furu.</p>",
     "DUBBLERAT ORD"),
    ("delen bär yttermåttet", "ad390a36",
     lambda h: h + "<p>Lådan på 53 × 37 cm rymmer mycket.</p>", "DELEN BÄR"),
    ("leveranslöfte", "ad390a36", lambda h: h + "<p>Fyra glas ingår i leveransen.</p>",
     "LEVERANSLÖFTE"),
    ("stavfel", "ad390a36", lambda h: h + "<p>Ett engangsjobb.</p>", "STAVFEL"),
    ("intern jargong", "ad390a36", lambda h: h + "<p>Den här rundan.</p>", "JARGONG"),
    ("relativ länk", "ad390a36", lambda h: h + '<a href="/produkt/x">X</a>', "RELATIV LÄNK"),
    ("br-tagg", "ad390a36", lambda h: h + "<p>En rad<br>en till.</p>", "WIX STRIPPAR"),
    # ☠️ Det fall som köpte homoglyfgrinden: ett kyrilliskt a mitt i ett ord.
    ("kyrilliskt a", "ad390a36", lambda h: h + "<p>Skivan är brа.</p>",
     "FRÄMMANDE TECKEN"),
    ("grekiskt o", "ad390a36", lambda h: h + "<p>Vagnen är stοr.</p>",
     "FRÄMMANDE TECKEN"),
    ("skriver att vi inte vet", "ad390a36",
     lambda h: h + "<p>Måttet anges inte.</p>", "SKRIVER ATT VI INTE VET"),
    # …och det fall som bevisar att korslänkarna inte bara TYSTAS:
    ("korslänk ljuger om grannen", "ad390a36",
     lambda h: h + '<p><a href="https://www.fyndplats.se/produkt/'
     'kokso-120-cm-klaffskiva-stort-skap">Köksö med soft close</a>.</p>',
     "KORSLÄNK påstår SOFT CLOSE"),
]


def sjalvtest():
    fel = []
    import texter
    original = texter.bygg
    for namn, pid, skada, vantat in FALL:
        def trasig(p, _s=skada, _o=original):
            n, sl, t, m, k, h = _o(p)
            return (n, sl, t, m, k, _s(h))
        texter.bygg = trasig
        try:
            ut = granska(pid)
        finally:
            texter.bygg = original
        if not any(vantat in x for x in ut):
            fel.append(f"{namn}: grinden SÅG DET INTE (fick {ut[:2]})")
    return fel


if __name__ == "__main__":
    tot = 0
    for pid in M.ALLA:
        f = granska(pid)
        tot += len(f)
        print(("FEL " if f else "OK  ") + pid + "  " + T.SLUG[pid])
        for x in f:
            print("      ✗", x)
    bt = byggartest()
    st = sjalvtest()
    print(f"\nbyggartest: {len(bt)} fel")
    for x in bt:
        print("  ☠️", x)
    print(f"självtest: {len(FALL)} fall, {len(st)} fel")
    for x in st:
        print("  ☠️", x)
    print(f"\n{len(M.ALLA)} produkter, {tot} fel")
    sys.exit(1 if (tot or st or bt) else 0)
