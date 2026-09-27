# Runda B3 — åtta barnmöbler till ur den äldsta änden

Tredje rundan från den ÄLDSTA änden av poleringskön. Alla åtta är tyska
feed-utkast från 2026-08-27 och hör till Barnmöbler: en bokhylla på hjul,
fyra bord med stolar eller pallar, två skrivbord och två sminkbord. De togs
i importordning ur B2:s reserver, som redan var skärmade mot publicerade
sidor.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 2b422e06 | Barnbokhylla på hjul med två fack – vit, molnformade gavlar, 56 cm hög, 3–8 år | FP-barnbokhylla-hjul-molnform | 969 kr | 34 |
| 65d84215 | Barnbord med två björnstolar – platta och förvaring i skivan, 60 × 60 cm, 3–6 år | FP-barnbord-bjornstolar-forvaring | 919 kr | 197 |
| 728ded00 | Barnskrivbord med stol – vitt med trädekor, tre fack överst, 60 cm, för 3–8 år | FP-barnskrivbord-stol-tre-fack | 1 019 kr | 197 |
| 6588ac81 | Barnskrivbord med björnstol – vitt med trädekor, stor låda, 80 cm, för 3–8 år | FP-barnskrivbord-bjornstol | 1 299 kr | 94 |
| 0e43328e | Barnbord i blomform med två stolar och två pallar – förvaring i mitten, 3–8 år | FP-barnbord-blomform-pallar | 1 199 kr | 70 |
| 565d0075 | Runt barnbord med två molnstolar – vitt, nätpåse för leksaker i mitten, 3–6 år | FP-barnbord-runt-molnstolar | 949 kr | 197 |
| c61c471d | Sminkbord för barn med björnspegel och stol – rosa och vitt, stor låda, 3–8 år | FP-sminkbord-bjornspegel-rosa | 1 139 kr | 11 |
| ab5f2a13 | Sminkbord för barn med oval spegel och pall – vitt, två lådor, för 3–8 år | FP-sminkbord-barn-oval-spegel | 949 kr | 15 |

**Inget pris är rört.**

Björnskrivbordet finns också i rosa (`db663f78`). Den här rundan tog det i
trä och vitt, det neutralare av de två, och det rosa väntar som färgsyskon
(rad i `FLAGGADE.md` från B2).

## Bilder före text

Kontaktarken lästes före texten. Fem bilder ströks (`bilder-bort.tsv`), och
35 står kvar:

- fyra med tysk text inbränd: skrivbordets *EIN LERNRAUM FÜR KINDER ZU
  HAUSE*, blombordets *GEEIGNET FÜR VERSCHIEDENE ORTE* och måttbilderna på
  båda sminkborden, där belastning och ålder står på tyska
- en med husmärket inbränt, som dessutom visar en annan produkt (en fåtölj)

Två sminkbord står därmed utan måttbild. Det vita (`ab5f2a13`) har tre
bilder kvar.

## Där källan och bilden inte sa samma sak

- ☠️ **Det rosa sminkbordets belastning.** Källan säger 20 kg på skivan och
  30 kg på stolen. Måttbilden säger tvärtom: 20 kg under stolen och 30 kg
  under bordet. Samma björnstol säljs med skrivbordet `6588ac81`, vars
  källa ger stolen 20 kg, så bilden är troligen rätt. Ingen av siffrorna
  står på sidan, bara lådans 10 kg, som ingen uppgift motsäger.
- Tre av produkterna är MDF med träfärgad yta. Namnen och texterna säger
  *trädekor*, inte *trä*, som B1:s skrivbord.
- Det runda barnbordets lock syns avlyft på en bild men nämns inte i
  källan. Texten beskriver öppningen och locket som bilderna visar dem.
- Tal som lästes eller räknades på bilderna har en rad i `foto-tal.txt`:
  björnbordets sitthöjd på 26 cm (från måttbilden), skrivbordets två små
  fack överst och blombordets fyra platser.

## Grindar

Alla rena: `gate.py` (0 fynd, 0 varningar), `gate-alt.py` (35 alt-texter),
`gate-seo.py`, `gate-sku.py` (längsta SKU 33 av 40 tecken),
`gate-lager.py` (lägsta saldo 11), `gate-axel.py` (0 axelfel),
`gate-superlativ.py` och `gate-lankar.py`. Formsvepet för artikelnummer
gav 0 träffar i 14 filer, och hela `lib/polish` gick grönt (132 test,
läcktestet inräknat).

⚠️ Sju av åtta har sina mått under *Tisch*, *Schreibtischgröße*,
*Tischabmessungen* eller *Schminktisch Abmessungen*, och axelgrinden
märker dem axellösa. Det är avsiktligt: generatorn vägrar läsa en
delmåttsrad som totalmått. Bredd, djup och höjd i de sju texterna är
därför kontrollerade för hand mot källan och måttbilden.

## Wix, i den ordning det skrevs

Workflowen "Polering — skriv en runda till Wix" mot grenen, plan
`76630bf2…`:

| steg | utfall |
|---|---|
| torr (körning 36282361999) | text, media och SKU 8 av 8 lästa, kategorier 16 av 16 rader planerade |
| text, namn, slug, SEO och synlighet | 8 av 8 skrivna (körning 36282415972) |
| media | 8 av 8 skrivna, 35 bilder |
| kategorier | 16 av 16 rader kopplade |
| SKU, sist och ensam | 8 av 8 skrivna, sista skrivningen 00:25:33 UTC |
| separat återläsning | 8 av 8 helt verifierade |
| stämpel | 8 av 8 stämplade, 0 stämpelfel |

Pushen med planen (`2e0f5ce7`) rörde bara `tools/`, och Vercel hoppade
över bygget i båda projekten (`CANCELED`).

## Live

`hamta-live.sh 130`: alla 8 gav HTTP 200. Sju sidor hade `age` 140 s vid
den skarpa hämtningen omkring 00:36:25 UTC, alltså renderade runt 00:34.
Björnskrivbordet `6588ac81` hade 488 s, en rendering från 00:28:16. Den
sista skrivningen gjordes 00:25:33, så alla åtta renderingar är gjorda
efter skrivningarna.

`livegrind.py`: orddiff 0 på alla 8. `livekoll.py`: 8 av 8 OK med
brödsmula i rundans kategori, och 35 av 35 alt-texter står på sidorna. En
separat kontroll av JSON-LD gav `InStock` och samma pris som i `ids.tsv`
på alla åtta.

## Kategorier

Alla åtta under Barn & Familj och Barnmöbler.

## Inga egna kort

Samma praxis som B1, B2 och N40–N56.
