# -*- coding: utf-8 -*-
"""Runda 116 — de sju hundvagnarnas texter.

☠️ INGA TAL SOM INTE STÅR I matt.py. Varje siffra härleds ur tabellerna där,
   och grind.py fäller på ett tal som inte finns i produktens egen uppsättning.

☠️ TALET 4 KG FÅR INTE STÅ I GRUPP B. Leverantörens brödtext kallar den
   vagnen "leicht (4 kg)" medan spec-kolumnen säger 5,9 kg — och 4 kg är
   samtidigt grupp A:s HUNDVIKT. Se STEG2-5.md punkt 1.

☠️ CYKELN NÄMNS BARA NEGERAT. Ingen av vagnarna har cykelfäste. En tillkopplad
   cykelkärra har ett svenskt utrustningskrav (reflex eller baklykta bakåt), så
   ett antytt cykelbruk vore både fel och en regelfråga vi inte kan uppfylla.
"""
import matt as M

BAS = "https://www.fyndplats.se/produkt/"

SLUG = {
    "40f46441": "hundvagn-4-kg-rod",
    "adc81917": "hundvagn-4-kg-gra",
    "cbb38884": "hundvagn-4-kg-bla",
    "eb02039b": "hundvagn-med-korg-rod",
    "3b0aca0a": "hundvagn-med-korg-bla",
    "1f311250": "hundvagn-med-korg-dammrosa",
    "0fdf9aba": "hundvagn-med-korg-ljusgra",
}
NAMN = {
    "40f46441": "Hundvagn upp till 4 kg, röd – fyra hjul, sufflett och korg",
    "adc81917": "Hundvagn upp till 4 kg, grå – fyra hjul, sufflett och korg",
    "cbb38884": "Hundvagn upp till 4 kg, blå – fyra hjul, sufflett och korg",
    "eb02039b": "Hundvagn med korg upp till 10 kg, röd – tre hjul och kudde",
    "3b0aca0a": "Hundvagn med korg upp till 10 kg, blå – tre hjul och kudde",
    "1f311250": "Hundvagn med korg upp till 10 kg, dammrosa – tre hjul",
    "0fdf9aba": "Hundvagn med korg upp till 10 kg, ljusgrå – tre hjul",
}
TITEL = {
    "40f46441": "Hundvagn 4 kg, röd – hopfällbar med korg",
    "adc81917": "Hundvagn 4 kg, grå – hopfällbar med korg",
    "cbb38884": "Hundvagn 4 kg, blå – hopfällbar med korg",
    "eb02039b": "Hundvagn med korg 10 kg, röd – tre hjul",
    "3b0aca0a": "Hundvagn med korg 10 kg, blå – tre hjul",
    "1f311250": "Hundvagn med korg 10 kg, dammrosa – tre hjul",
    "0fdf9aba": "Hundvagn med korg 10 kg, ljusgrå – tre hjul",
}

# ── Korslänkar ─────────────────────────────────────────────────────────────
# ☠️ GRUPP A LÄNKAR TILL EN LEVANDE SIDA, INTE TILL ETT SYSKON I RUNDAN.
#    `hundvagn-hopfallbar-liten-hund-sufflett-broms` är SAMMA chassi i svart,
#    publicerad sedan tidigare — samma sex tal på dess eget faktakort. Att
#    länka runt inom rundan och låta den fjärde färgen ligga osynlig hade varit
#    att dölja för kunden att färgen finns.
UTANFOR = {"__svart": ("hundvagn-hopfallbar-liten-hund-sufflett-broms",
                       "samma vagn i svart")}

SYSKON = {
    "40f46441": ("adc81917", "samma vagn i grått"),
    "adc81917": ("cbb38884", "samma vagn i blått"),
    "cbb38884": ("__svart", "samma vagn i svart"),
    "eb02039b": ("3b0aca0a", "samma vagn i blått"),
    "3b0aca0a": ("1f311250", "samma vagn i dammrosa"),
    "1f311250": ("0fdf9aba", "samma vagn i ljusgrått"),
    "0fdf9aba": ("eb02039b", "samma vagn i rött"),
}


def g(k):
    return M.GRUPP[k]


def m(k, falt):
    return M.MATT[g(k)][falt]


def P(t):
    return f"<p>{t}</p>"


def H(t):
    return f"<h3>{t}</h3>"


def LI(a, b):
    return f"<li><p><strong>{a}:</strong> {b}</p></li>"


def lank(k):
    mal, txt = SYSKON[k]
    slug = UTANFOR[mal][0] if mal in UTANFOR else SLUG[mal]
    return P(f'Finns också som <a href="{BAS}{slug}">{txt}</a>.')


INGRESS = {
    "40f46441": "En röd hundvagn för den lilla hunden som inte orkar hela "
                "promenaden längre. Fyra hjul, sufflett som går att ställa i "
                "fyra lägen och en korg under sitsen för det som ska med.",
    "adc81917": "En grå hundvagn för den lilla hunden som inte orkar hela "
                "promenaden längre. Fyra hjul, sufflett i fyra lägen och en "
                "korg under sitsen — diskret i färgen och lätt att skjuta.",
    "cbb38884": "En blå hundvagn för den lilla hunden som behöver vila mitt i "
                "promenaden. Fyra hjul, sufflett i fyra lägen och en korg "
                "under sitsen för koppel, vattenflaska och godispåse.",
    "eb02039b": "En röd hundvagn med tre hjul, vadderad liggdel och en stor "
                "korg under. Byggd för hundar upp till 10 kg, med reflexband "
                "på sidorna och en bakdörr som öppnas med dragkedja.",
    "3b0aca0a": "En blå hundvagn med tre hjul, vadderad liggdel och en stor "
                "korg under. För hundar upp till 10 kg, med reflexband på "
                "sidorna och en bakdörr som hunden kan gå in genom själv.",
    "1f311250": "En dammrosa hundvagn med tre hjul, vadderad liggdel och en "
                "stor korg under. För hundar upp till 10 kg, med reflexband "
                "på sidorna och bakdörr med dragkedja.",
    "0fdf9aba": "En ljusgrå hundvagn med tre hjul, vadderad liggdel och en "
                "stor korg under. För hundar upp till 10 kg, med reflexband "
                "på sidorna och bakdörr med dragkedja.",
}

META = {
    "40f46441": "Röd hundvagn för hund upp till 4 kg, 67 × 45 × 96 cm. Fyra "
                "hjul med broms bak, sufflett i fyra lägen, korg och två "
                "säkerhetskopplingar. Viks ihop med ett handgrepp.",
    "adc81917": "Grå hundvagn för hund upp till 4 kg, 67 × 45 × 96 cm. Fyra "
                "hjul med broms bak, sufflett i fyra lägen, korg och två "
                "säkerhetskopplingar. Viks ihop med ett handgrepp.",
    "cbb38884": "Blå hundvagn för hund upp till 4 kg, 67 × 45 × 96 cm. Fyra "
                "hjul med broms bak, sufflett i fyra lägen, korg och två "
                "säkerhetskopplingar. Viks ihop med ett handgrepp.",
    "eb02039b": "Röd hundvagn med korg för hund upp till 10 kg, 77 × 44 × "
                "102 cm. Tre hjul, vadderad liggdel 55 × 35 cm, reflexband "
                "och bakdörr med dragkedja.",
    "3b0aca0a": "Blå hundvagn med korg för hund upp till 10 kg, 77 × 44 × "
                "102 cm. Tre hjul, vadderad liggdel 55 × 35 cm, reflexband "
                "och bakdörr med dragkedja.",
    "1f311250": "Dammrosa hundvagn med korg för hund upp till 10 kg, 77 × 44 "
                "× 102 cm. Tre hjul, vadderad liggdel 55 × 35 cm, reflexband "
                "och bakdörr med dragkedja.",
    "0fdf9aba": "Ljusgrå hundvagn med korg för hund upp till 10 kg, 77 × 44 "
                "× 102 cm. Tre hjul, vadderad liggdel 55 × 35 cm, reflexband "
                "och bakdörr med dragkedja.",
}


def kropp(k):
    grp, d = g(k), []
    d.append(P(INGRESS[k]))

    # ── Hjulen: det som skiljer de två konstruktionerna åt ──────────────────
    if grp == "A":
        d.append(H("Fyra hjul, broms på de bakre"))
        d.append(P(
            "Vagnen står på " + M.HJULBILD[grp] + ". Framhjulen vrider sig "
            "efter riktningen du skjuter åt, och bromsen på de bakre håller "
            "vagnen still när du stannar. Hjulen är "
            f"{m(k, 'hjul')} och rullar bäst på asfalt, plattor och "
            "hårdpackat grus."))
    else:
        d.append(H("Tre hjul — ett fram som svänger"))
        d.append(P(
            "Vagnen står på " + M.HJULBILD[grp] + ". Ett enda framhjul gör "
            "vändningen kortare än på en fyrhjulig vagn, vilket märks i "
            "trånga passager och när du ska vända på en trottoar. Hjulen är "
            f"{m(k, 'hjul')} i diameter."))

    # ── Liggdelen ───────────────────────────────────────────────────────────
    d.append(H(f"Hunden ligger på {m(k, 'liggdel')}"))
    if grp == "A":
        d.append(P(
            f"Liggytan mäter {m(k, 'liggdel')} och höjden inuti är "
            f"{m(k, 'invandigt')}. Vagnen är avsedd för hundar upp till "
            f"{m(k, 'maxvikt_hund')} med en kroppslängd på högst "
            f"{m(k, 'kroppslangd')} — mät gärna hunden från bringa till "
            "svansrot innan du beställer."))
    else:
        d.append(P(
            f"Liggytan mäter {m(k, 'liggdel')} och är vadderad. Höjden inuti "
            f"är {m(k, 'invandigt')}. Konstruktionen bär hundar upp till "
            f"{m(k, 'maxvikt_hund')}."))
        d.append(H("Bakdörr med dragkedja"))
        d.append(P(
            f"Öppningen bak är {m(k, 'bakdorr')} och dras upp med en "
            "dragkedja. En hund som kan gå själv går in bakvägen i stället "
            "för att lyftas över kanten — det är skillnaden som gör vagnen "
            "användbar för en hund med ont i ryggen eller höfterna."))

    # ── Luft och sikt ───────────────────────────────────────────────────────
    d.append(H("Nätfönster fram och bak"))
    d.append(P(
        f"Fönstren i nät mäter {m(k, 'natfonster')}. De släpper in luft och "
        "låter hunden se ut åt båda hållen, vilket gör de flesta hundar "
        "lugnare än en helt sluten väska."))

    # ── Korgen ──────────────────────────────────────────────────────────────
    d.append(H(f"Korg på {m(k, 'korg')} under sitsen"))
    d.append(P(
        f"Under liggdelen sitter en korg på {m(k, 'korg')}. Där får koppel, "
        "vattenflaska, godispåse och en hopvikt filt plats. På handtaget "
        "finns en mugghållare."))

    # ── Säkerhet ────────────────────────────────────────────────────────────
    d.append(H("Två säkerhetskopplingar"))
    sak = ("Inuti vagnen sitter två kopplingar att fästa i hundens sele. De "
           "hindrar hunden från att hoppa ur medan du skjuter.")
    if grp == "B":
        sak += (" På sidorna finns reflexband som syns i strålkastarljus när "
                "du går ute i mörker.")
    d.append(P(sak))

    # ── Hopfällning ─────────────────────────────────────────────────────────
    d.append(H(f"Viks ihop till {m(k, 'hopfalld')}"))
    d.append(P(
        f"Uppfälld är vagnen {m(k, 'yttermatt')} och hopfälld "
        f"{m(k, 'hopfalld')}. Handtaget fälls ned och sticker ut förbi korgen, "
        "vilket är varför den hopfällda längden är större än den uppfällda. "
        f"Hela vagnen väger {m(k, 'vikt')}, så den går att lyfta in i en "
        "bagagelucka med en hand." if grp == "A" else
        f"Uppfälld är vagnen {m(k, 'yttermatt')} och hopfälld "
        f"{m(k, 'hopfalld')}. Handtaget fälls ned och sticker ut förbi korgen, "
        "vilket är varför den hopfällda längden är större än den uppfällda. "
        f"Vagnen väger {m(k, 'vikt')}."))

    # ── Montering ───────────────────────────────────────────────────────────
    if M.MONTERING[grp]:
        d.append(H("Montering krävs"))
        d.append(P(
            "Vagnen levereras isärtagen och sätts ihop hemma. Räkna med "
            "hjulen, handtaget och suffletten. Anvisningen följer med."))

    d.append(lank(k))
    return "".join(d)


def spec(k):
    grp = g(k)
    r = [LI("Yttermått", f"{m(k, 'yttermatt')} (L × B × H)"),
         LI("Hopfälld", m(k, "hopfalld")),
         LI("Liggyta", m(k, "liggdel")),
         LI("Invändig höjd", m(k, "invandigt")),
         LI("Nätfönster", m(k, "natfonster"))]
    if grp == "B":
        r.append(LI("Bakdörr", m(k, "bakdorr")))
    r += [LI("Korg", m(k, "korg")),
          LI("Hjul", m(k, "hjul")),
          LI("Hjulbild", M.HJULBILD[grp]),
          LI("Största hund", m(k, "maxvikt_hund")
             + (f", kroppslängd upp till {m(k, 'kroppslangd')}"
                if grp == "A" else ""))]
    r += [LI("Material", M.MATERIAL[grp]),
          LI("Färg", M.FARG[k]),
          LI("Vagnens vikt", m(k, "vikt")),
          LI("Montering", "krävs" if M.MONTERING[grp] else "ingen"),
          LI("I lådan", ", ".join(M.INGAR[k])),
          LI("Paketmått", M.PAKET[k])]
    return "<h2>Tekniska specifikationer</h2><ul>" + "".join(r) + "</ul>"


def skotsel(k):
    t = ("Klädseln torkas av med en fuktig trasa och mild såpa; låt den torka "
         "helt innan vagnen viks ihop, annars luktar tyget instängt. Skölj av "
         "hjulen efter en tur i vägsalt eller sand och låt dem torka — grus i "
         "lagren är det som gör en vagn tungrullad. Kontrollera att bromsen "
         "griper innan varje tur, och dra åt skruvarna en gång per säsong. "
         "Ställ vagnen inomhus när den inte används.")
    if g(k) == "B":
        t += (" Reflexbanden tvättas inte med lösningsmedel — de tappar då sin "
              "återspegling.")
    return "<h2>Användning och skötsel</h2>" + P(t)


def faq(k):
    grp = g(k)
    q = [(f"Hur stor hund passar i den?",
          f"Vagnen är byggd för hundar upp till {m(k, 'maxvikt_hund')}. "
          + (f"Liggytan är {m(k, 'liggdel')} och kroppslängden bör vara högst "
             f"{m(k, 'kroppslangd')} — mät hunden från bringa till svansrot."
             if grp == "A" else
             f"Liggytan är {m(k, 'liggdel')}, så hunden ska kunna ligga ner "
             "på den utan att pressa mot sidorna.")),
         ("Går den att koppla efter en cykel?",
          "Nej. Det här är en skjutvagn utan cykelfäste, och den ska inte "
          "kopplas efter en cykel."),
         ("Hur liten blir den hopfälld?",
          f"{m(k, 'hopfalld')}. Handtaget fälls ned och sticker ut förbi "
          f"korgen, så längden ökar medan höjden faller. Vagnen väger "
          f"{m(k, 'vikt')}."),
         ("Kan hunden sitta kvar när jag lämnar vagnen?",
          "Nej. Vagnen är till för transport medan du är med — lämna aldrig "
          "hunden ensam i den, och dra alltid åt bromsen när du stannar.")]
    if grp == "B":
        q.append(("Kommer den färdigmonterad?",
                  "Nej, den sätts ihop hemma. Anvisningen följer med."))
    else:
        q.append(("Kommer den färdigmonterad?",
                  "Ja, vagnen fälls bara upp. Ingen skruvning behövs."))
    q.append(("Vad ingår?",
              f"{', '.join(M.INGAR[k]).capitalize()}. Inget regnskydd och "
              "ingen extra kudde utöver den som sitter i."))
    return "<h2>Vanliga frågor</h2>" + "".join(
        f"<p><strong>{a}</strong></p><p>{b}</p>" for a, b in q)


def bygg(k):
    return kropp(k) + spec(k) + skotsel(k) + faq(k)


def seo(k):
    return {"tags": [
        {"type": "title", "children": TITEL[k]},
        {"type": "meta", "props": {"name": "description", "content": META[k]}},
    ]}


if __name__ == "__main__":
    M.kontroll()
    for k in M.ALLA:
        t = bygg(k)
        print(f"{k}  {SLUG[k]:<28} namn {len(NAMN[k]):>2} tecken, "
              f"titel {len(TITEL[k]):>2}, meta {len(META[k]):>3}, "
              f"text {len(t):>4}")
