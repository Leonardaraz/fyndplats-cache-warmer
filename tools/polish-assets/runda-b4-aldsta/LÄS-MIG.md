# Runda B4 — åtta barnleksaker ur den äldsta änden

Fjärde rundan från den ÄLDSTA änden av poleringskön. Alla åtta är tyska
feed-utkast från 2026-08-27: ett sminkbord, två åkhästar, två
lekställningar med rutschkana, en klätterbåge, ett klätterset och ett
lekset. De togs i importordning efter B3, och måttskärmen mot hela
katalogen hittade inga dubbletter bland dem.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 88a841f1 | Sminkbord för barn med LED-spegel och pall – rosa, två lådor, för 3–8 år | FP-sminkbord-led-spegel-rosa | 1 219 kr | 197 |
| 2e7a68fd | Elektrisk åkhäst för barn i brun plysch – fotpedal, 2,5 km/h, musik, 1,5–5 år | FP-elektrisk-akhast-plysch | 1 129 kr | 49 |
| 02b1aec1 | Åkhäst på hjul i ljusbrun plysch – utan batterier, handtag att styra, 3–5 år | FP-akhast-hjul-utan-batterier | 1 519 kr | 65 |
| 4daf2de1 | Rutschkana 7-i-1 som slott – bro, tunnel, ratt och basketkorg, för 1–3 år | FP-rutschkana-slott-7-i-1 | 2 829 kr | 82 |
| 9b6aea55 | Klätterbåge i furu med dyna – blir gungbräda och lekbord, 18–48 månader | FP-klatterbage-furu-dyna | 1 069 kr | 197 |
| de6b2640 | Klätterset 4-i-1 i furu – båge, ramp med två sidor och dyna, 18–48 månader | FP-klatterset-furu-ramp-dyna | 1 199 kr | 16 |
| 0103d4a7 | Lekset 4-i-1 för småbarn – gunga, rutschkana, klätterdel och basketkorg, grått | FP-lekset-gunga-rutschkana | 1 399 kr | 72 |
| 184e281e | Rutschkana 7-i-1 med grodor – kikare, ritbräda och basketkorg, för 1–3 år | FP-rutschkana-grodor-7-i-1 | 2 699 kr | 96 |

**Inget pris är rört.**

## Bilder före text

Kontaktarken lästes före texten. Sju bilder ströks (`bilder-bort.tsv`),
och 33 står kvar:

- fyra måttbilder med tysk text inbränd (*Empfohlenes Alter*,
  *Gewichtsgrenze*): sminkbordet, båda åkhästarna och grodställningen
- två bilder med tyska rubriker: *Geeignet für glatte und harte Straßen*
  och *ÜBERALL UND JEDERZEIT SPIELEN*
- en bild på den elektriska åkhästen med italiensk text (*MORBIDO*)

## Där källan och bilden inte sa samma sak

- Leksetets källa (`0103d4a7`) ger två åldrar: 1,5–3 år i inledningen och
  18–48 månader i specen. Sidan följer specen.
- Grodställningens källa (`184e281e`) nämner en gungsits, men varken
  leveransinnehållet eller bilderna har någon gunga. Sidan nämner ingen.
- Klätterbågen och klättersetet beskrevs först med *upp och ned*, vilket
  inte säger vilket läge som menas. Texterna säger nu *med bågen uppåt*
  för klätterläget och *vänd med dynan i* för gungan, som bilderna visar.
- SEO-titeln på klätterbågen (`9b6aea55`) säger *3-i-1*. SEO-grinden
  kräver att titelns tal står på sidan, så egenskapslistan börjar nu med
  *3-i-1*, som i källans *3-in-1 Kletterbogen*.
- Tal som lästes eller räknades på bilderna, eller som källan bara skriver
  inne i ett sammansatt ord, har en rad i `foto-tal.txt`: sminkbordets två
  lådor, åkhästens fyra hjul, leksetets fyra delar (*vierteilige*) och
  rampens två sidor (*doppelseitige*).

## Grindar

Alla rena efter rättningarna: `gate.py` (0 fynd, 0 varningar),
`gate-alt.py` (33 alt-texter), `gate-seo.py`, `gate-sku.py` (längsta SKU
29 av 40 tecken), `gate-lager.py` (lägsta saldo 16), `gate-axel.py`
(0 axelfel), `gate-superlativ.py` och `gate-lankar.py`. Formsvepet för
artikelnummer gav 0 träffar i 22 filer, och hela `lib/polish` gick grönt
(132 test).

⚠️ `gate-axel.py` rapporterar en axelkonflikt i klättersetets källa
(`de6b2640`). Den tyska och den svenska måttraden är identiska, *168L x
49,5B x 39,5H cm*, så konflikten kommer från decimalkommat och inte från
källan. Facit följer den tyska raden.

## Wix, i den ordning det skrevs

Workflowen "Polering — skriv en runda till Wix" mot grenen, plan
`fa97c20b…`:

| steg | utfall |
|---|---|
| torr (körning 36283313672) | text, media och SKU 8 av 8 lästa, kategorier 23 av 23 rader planerade |
| text, namn, slug, SEO och synlighet | 8 av 8 skrivna (körning 36283385804) |
| media | 8 av 8 skrivna, 33 bilder |
| kategorier | 23 av 23 rader kopplade |
| SKU, sist och ensam | 8 av 8 skrivna, sista skrivningen 00:44:47 UTC |
| separat återläsning efter 90 s | 8 av 8 helt verifierade |
| stämpel | 8 av 8 stämplade, 0 stämpelfel |

Pushen med planen (`2a0178cb`) rörde bara `tools/`, och Vercel hoppade
över bygget i båda projekten (`CANCELED`).

## Live

`hamta-live.sh 130`: alla 8 gav HTTP 200. Grodställningen svarade
`HTTP 000` första gången och 200 vid omförsöket fem sekunder senare. Sex
sidor hade `age` 139–140 s vid den skarpa hämtningen omkring 00:56 UTC,
åkhästen utan batterier (`02b1aec1`) 460 s, alltså renderad 00:48:39,
och grodställningen 175 s.
Alla åtta renderingar är gjorda efter den sista skrivningen 00:44:47.

`livegrind.py`: orddiff 0 på alla 8. `livekoll.py`: 8 av 8 OK med
brödsmula i rundans kategori, och 33 av 33 alt-texter står på sidorna. En
separat kontroll av JSON-LD gav `InStock` och samma pris som i `ids.tsv`
på alla åtta.

## Kategorier

Alla åtta under Barn & Familj. Sminkbordet under Barnmöbler, de övriga
under Leksaker & Spel. Åkhästarna har dessutom Gunghästar & gungdjur och
de fem lekställningarna Baby & Småbarn.

## Färgsyskon som väntar

Klätterställningen `c75c7b95` är regnbågsvarianten av publicerade
`7e414be8` i natur. Den väntar som färgsyskon (rad i `FLAGGADE.md`).

## Inga egna kort

Samma praxis som B1–B3 och N40–N56.
