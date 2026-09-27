# Runda B5 — åtta barnleksaker till ur den äldsta änden

Femte rundan från den ÄLDSTA änden av poleringskön. Alla åtta är tyska
feed-utkast från 2026-08-27: två lekställningar med rutschkana, en
hopfällbar rutschkana, två klätterställningar, en aktivitetstavla för
väggen, en krypunnel och ett leksakskök. Alla är inomhusleksaker eller tål
både inne och ute, och alla passar som julklappar.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| b464a034 | Lekset 9-i-1 med två rutschkanor och gunga – basketkorg och kikare, för 1–3 år | FP-lekset-9-i-1-tva-rutschkanor | 2 839 kr | 69 |
| f04fbf51 | Klätterset i trä med prinsesskronor – triangel, båge och ramp, 18–48 månader | FP-klatterset-tra-prinsesskronor | 1 499 kr | 92 |
| 2485b8a5 | Klätterställning 6-i-1 i trä för inomhus – nät, ringar och rutschkana, 3–6 år | FP-klatterstallning-6-i-1-tra | 2 019 kr | 123 |
| 51ad9485 | Rutschkana 7-i-1 med lekstuga – whiteboard, kikare och basketkorg, för 1–4 år | FP-rutschkana-lekstuga-7-i-1 | 3 069 kr | 47 |
| c387e649 | Hopfällbar rutschkana 5-i-1 för småbarn – klätterdel och basketkorg, 1–3 år | FP-rutschkana-hopfallbar-5-i-1 | 1 099 kr | 145 |
| 0c3eae51 | Aktivitetstavla med dinosaurie för väggen – xylofon, labyrint, spegel, från 2 år | FP-aktivitetstavla-dinosaurie | 899 kr | 197 |
| 55587d19 | Krypunnel formad som en krokodil – rak, i kurva eller S-form, för 3–6 år | FP-krypunnel-krokodil | 2 659 kr | 18 |
| 2ff713c1 | Leksakskök i ljusblått och vitt – spis, ugn, mikro, diskho och kokset, från 3 år | FP-leksakskok-ljusbla-vit | 999 kr | 40 |

**Inget pris är rört.**

## Så valdes de åtta

De 100 äldsta osynliga utkasten lästes sorterade på skapandedatum och
jämfördes mot `FLAGGADE.md`: 54 var redan flaggade, 8 var B4:s och 38 var
fria. Därefter sållades de i tur och ordning:

- **Utomhus, fel säsong:** sandlådor, gungställningar, lekstugor och
  hoppborgar hoppades över i slutet av september, enligt husets
  säsongsregel. De ligger kvar som utkast.
- **Måttskärmen mot hela katalogen** (6 153 rader, `utanText` 0) och en
  pixelkontroll på bilderna avgjorde resten. Se nästa avsnitt.
- **Balansbalken `24597637`** hade saldo 5 och byttes mot nästa i tur,
  leksaksköket `2ff713c1` (saldo 40).

## Dubbletter och färgsyskon

- ☠️ **Sminkbordet `23e31398` var en äkta dubblett** av publicerade
  `e8f7eaed` (*Sminkbord barn 2-i-1*): samma färg, tre gemensamma
  måttripplar och tre byte-identiska bilder. Enligt husregeln är sidan
  ommappad från AliExpress till Aosom och utkastet pensionerat (`plan`,
  sedan `byt`, verifierat vid återläsning). Kundpriset 1 479 kr är orört;
  utkastet stod på 1 199 kr, och Aosom-synken räknar om priset inom sex
  timmar. Vill Leonard behålla 1 479 kr är prislåset vägen.
- ☠️ **Gråskalejämförelsen var färgblind.** Gymnastikställningen
  `a3dfcd1e` fick medelavvikelse 0,3 mot publicerade `68c9cfe0` på
  huvudbilden, alltså "samma bild". Men den ena är rosa och den andra lila,
  och de två färgerna har nästan samma ljushet i gråskala. Det var ögat på
  bilderna som avgjorde: färgsyskon, inte dubblett.
- Färgsyskon som väntar: förvaringstornet `97a2c2c2` (`0136e7d9`),
  gymnastikställningen `a3dfcd1e` (`68c9cfe0`), leksaksköket `6fafe249`
  (`a57587a8`), och köksparet `962fc483` och `321f878a`, där ingen är
  publicerad än.
- Hjullastaren `5b69e81c` delar en måttrippel med publicerade `3a305d61`,
  men den har släpvagn och är 167 cm lång mot 114. Det är en egen produkt
  och en kandidat till nästa runda.
- Gokartfamiljen `8691cbc0`, `8ab866bb` och `5f7b579e` hålls, som
  gokartklustret i N27–N31.

## Bilder före text

Kontaktarken lästes före texten. Sex bilder ströks (`bilder-bort.tsv`),
och 34 står kvar:

- tre måttbilder med *Empfohlenes Alter* inbränt: den stora
  lekställningen, lekställningen med lekstuga och den hopfällbara
  rutschkanan
- tre bilder med tyska rubriker: *SPIELEN SIE MIT GUTEM GEWISSEN*,
  *ÜBERALL UND JEDERZEIT SPIELEN* och *INDOOR- UND OUTDOOR-SPIEL*

⚠️ Den stora lekställningen (`b464a034`) står därmed med två bilder, och
lekställningen med lekstuga (`51ad9485`) med tre.

## Där källan och bilden inte sa samma sak

- ☠️ **Klätterställningens höjd** (`2485b8a5`). Källans spec säger *108 × 120 × 59
  cm*, men måttbilden visar 126 cm hög, och 59 cm stämmer inte med något
  på bilden. Sidan säger 126 cm, med en rad i `foto-tal.txt`.
- Klättersetets källa (`f04fbf51`) nämner inga mått för hela setet, bara
  för delarna, så sidan anger triangel, båge och ramp var för sig.
- Leksaksköket har *funktionaler Wasserhahn* i källan. Sidan säger bara
  att det finns en kran och en diskho, inte att det kommer vatten.
- Lekställningen med lekstuga listar bara ställningen och anvisningen i
  leveransinnehållet, så sidan nämner ingen boll eller pump.
- Tal som räknades på bilderna har en rad i `foto-tal.txt`:
  klätterställningens höjd och spisens två plattor.

## Grindar

Alla rena: `gate.py` (0 fynd, 0 varningar), `gate-alt.py` (34
alt-texter), `gate-seo.py`, `gate-sku.py` (längsta SKU 32 av 40 tecken),
`gate-lager.py` (lägsta saldo 18), `gate-axel.py` (0 axelfel),
`gate-superlativ.py` och `gate-lankar.py`. Formsvepet för artikelnummer
gav 0 träffar i 22 filer, och hela `lib/polish` gick grönt (132 test).
Ingen av de åtta nya slugarna fanns i butiken (slugfiltret provat mot en
känd slug, som det hittade), och kategorin Leksakskök finns.

## Wix, i den ordning det skrevs

Workflowen "Polering — skriv en runda till Wix" mot grenen, plan
`3598789c…`:

| steg | utfall |
|---|---|
| torr (körning 36284299047) | text, media och SKU 8 av 8 lästa, kategorier 22 av 22 rader planerade |
| text, namn, slug, SEO och synlighet | 8 av 8 skrivna (körning 36284349570) |
| media | 8 av 8 skrivna, 34 bilder |
| kategorier | 22 av 22 rader kopplade |
| SKU, sist och ensam | 8 av 8 skrivna, sista skrivningen 01:03:47 UTC |
| separat återläsning efter 90 s | 8 av 8 helt verifierade |
| stämpel | 8 av 8 stämplade, 0 stämpelfel |

Pushen med planen (`4a200979`) rörde bara `tools/`, och Vercel hoppade
över bygget i båda projekten (`CANCELED`).

## Live

`hamta-live.sh 130`: alla 8 gav HTTP 200. Alla åtta hade `age` 139–140 s
vid den skarpa hämtningen 01:15:20–01:15:29 UTC, alltså renderade omkring
01:13, efter den sista skrivningen 01:03:47.

`livegrind.py`: orddiff 0 på alla 8. `livekoll.py`: 8 av 8 OK med
brödsmula i rundans kategori, och 34 av 34 alt-texter står på sidorna. En
separat kontroll av JSON-LD gav `InStock` och samma pris som i `ids.tsv`
på alla åtta.

## Kategorier

Alla åtta under Barn & Familj och Leksaker & Spel. Fem av dem har dessutom
Baby & Småbarn, och leksaksköket Leksakskök. Klätterställningen och
krypunneln är för 3–6 år och har ingen tredje kategori.

## Inga egna kort

Samma praxis som B1–B4 och N40–N56.
