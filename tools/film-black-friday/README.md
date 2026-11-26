# Black Friday-filmen "Pristrappan" (25 s, 1080 × 1920)

Reklamfilmen för Fyndauktionen på Black Friday 2026: en vara kliver ner för en guldtrappa,
ett steg i timmen, tills stämpeln SÅLD slår ner. Sedan tänds hundra brickor i en hall, fyra
av fredagens fynd vänder sig mot kameran, och Fyndplats-kuben landar som slutbild.

Allt görs i kod och renderas utan konton:

| Del | Fil | Verktyg |
| :-- | :-- | :-- |
| 3D-scenerna (trappan, hallen, kuben) | `film/trappa.py`, `film/hall.py`, `film/b3d.py` | Blender som Python-modul (`bpy`), Cycles |
| Rendering till EXR | `film/render.py`, `kor.sh` | Cycles på processorn, strålföljning |
| Texturer med text (prisskylt, kort, glasrader) | `film/texturer.py`, `titles/tex.js` | Chromium via Playwright |
| Filmens texter | `titles/titlar.html`, `titles/rendera.js` | Chromium via Playwright |
| Guldstoft | `film/stoft.py` | numpy |
| Sammansättning (dis, glöd, ton, texter, korn) | `film/comp.py` | numpy, OpenCV, ffmpeg |
| Ljud | `film/audio.py`, `film/ljudkoll.py` | numpy, scipy |
| Omslagsbilder (torsdag och fredag) | `film/omslag.py` | Chromium, numpy |
| Leverans och kontroll av den färdiga filmen | `leverans.sh`, `film/koll.py` | ffmpeg |

## Det filmen påstår ska gå att belägga

- Varje vara i filmen är ett av fredagens fynd, med butikens ordinarie pris som startpris.
  Priset hämtas från butiken (`film/fetch_fynd.py`, `film/hamta_kandidater.py`), aldrig för hand.
- Inga lägre priser visas. Trappan visar bara timmarna 07 till 18. Stegen och golvet läses aldrig.
- Leverantörens varumärken och artikelnummer förekommer inte, varken i bild, text eller filnamn.
- Antalet fynd ("100") är en inställning till texterna och stäms av mot listan före publicering.

## Så körs den

```bash
cd tools/film-black-friday
./installera.sh                         # Blender (bpy), biblioteken och typsnitten, en gång per molnsession
PY=/opt/render-venv/bin/python

$PY -m film.fetch_fynd                  # fynden som auktionssidan visar just nu (namn, pris, bild)
$PY -m film.hamta_kandidater <slug> …   # eller: varor ur kön, hämtade från sina produktsidor
# assets/products/val.json säger vilken vara som står i trappan och vilka fyra som visas i hallen
$PY -m film.texturer                    # prisskylt, kort och glasrader
./kor.sh final A B C D E                # alla tagningar (går att avbryta och fortsätta)
./kor_del.sh final C 360 449 bada       # eller en del i taget: ett bakgrundsjobb stoppas efter 2 h
./leverans.sh 100                       # texter, ljud, fyra filmer och två omslag i leverans/
$PY -m film.koll leverans/fyndplats-black-friday-torsdag.mp4
```

`leverans.sh` gör filmen med och utan ljud i två versioner: torsdag (slutbild "fredag kl 07–19")
och fredag (slutbild "i dag till kl 19"). Argumentet är antalet fynd som texterna visar.
Under renderingen går en provfilm att göra med `--kvalitet final,skiss`: varje bildruta tas från
den bästa rendering som finns.

Kvalitetsnivåer i `film/render.py`: `skiss` (rörelseprov, ca 1 s per ruta), `utkast`, `prov` och
`final` (ca 15–50 s per ruta på fyra kärnor; hela filmen ca 4,5 timmar).

`assets/products/val.json` (checkas inte in):

```json
{
  "trappa": "<slug>",
  "hall": [{ "slug": "<slug>", "kort": "Kort namn på kortet" }, …fyra stycken]
}
```

## Tidslinjen

| Tid | Scen | Tagning |
| :-- | :-- | :-- |
| 0,0–2,5 s | Ljuset tänds, brickan i ljuskäglan | A |
| 2,5–8,5 s | Kameran lyfter, brickan kliver från 07 till 15 | A |
| 8,5–12,0 s | Närbild, "Vågar du vänta?", SÅLD | B |
| 12,0–18,0 s | Lamprader, 100 fynd, fyra varor | C |
| 18,0–21,0 s | Glasskivan med tre löften | D |
| 21,0–25,0 s | Kuben sätts ihop och landar | E |

Takten är 120 slag i minuten: varje steg, lampa och vara landar på ett slag (`film/common.py`).

## Läsbarhet i apparna

- Rubriken syns redan i första bildrutan, så att kroken syns i flödet och när filmen börjar om.
- All text ligger mellan y 290 och y 1300, alltså utanför de delar av bilden som Instagram och
  TikTok täcker med knappar och bildtext.
- Omslagets text ligger inom 4:5-utsnittet (y 285–1635), som profilens rutnät visar.

## Ny film från mallen

Kopiera mappen till `tools/film-<namn>/` och låt Pristrappan stå kvar orörd som mall. Skillen
`film-3d` (`.claude/skills/film-3d/SKILL.md`) beskriver arbetsgången.

- **Följer med som de är:**
  - `film/b3d.py`: material, former, ljus, kamera och `baka()`.
  - Kontroll och priser: `film/koll.py` och `film/prisvakt.py`.
  - Varor, bilder och typsnitt: `film/foton.py`, `film/fetch_fynd.py`, `film/hamta_kandidater.py` och `film/typsnitt.py`.
  - Texternas renderare: `titles/tex.js` och `titles/rendera.js`.
  - Installationen: `installera.sh`.
- **Justeras:**
  - `kor_del.sh`: renderingsinställningarna per tagning.
  - `film/render.py`: vilken scen och kamera varje tagning bygger, i `bygg()`.
  - `film/comp.py`: graderingen per tagning, i `GRAD`.
  - `film/stoft.py`: stoftskurarnas tider och platser.
  - `film/audio.py`: instrumenten följer med, men ljudens tider skrivs om.
  - `film/omslag.py` och `leverans.sh`.
- **Skrivs om:**
  - Tider och tagningar i `film/common.py`.
  - Scenerna `film/trappa.py` och `film/hall.py`.
  - Skyltar och kort i `film/texturer.py`.
  - Texterna och deras tider i `titles/titlar.html`.

## Lärdomar från Pristrappan (2026-11-26)

- **Ett bakgrundsjobb stoppas efter två timmar.** Hela filmen tar 4,5–7 timmar i slutkvalitet.
  Rendera i delar med `kor_del.sh`. Färdiga rutor hoppas över, så en del som stoppas fortsätter
  där den slutade.
- **Ett byte mellan två föremål blir en spökbild i rörelseoskärpan.** Slutaren är öppen
  f−0,25 till f+0,25. Kubens ytor göms när den hela kuben tar över. Förut hoppade de tillbaka
  till sin startpunkt, och oskärpan drog ut hoppet till en orange strimma över ruta 659. Lägg
  bytet mitt mellan två rutor med `baka(..., extra=...)` (se `KUB_BYTE_NYCKLAR` i
  `film/hall.py`), och låt det som göms stanna där det är.
- **Diset renderas i ett eget pass med bara de valda lamporna** (`volymljus`). Annars gör det
  hela bilden grå.
- **AgX förvränger orange och produktfoton.** Tonmappningen är PBR Neutral med en filmkurva
  (`film/comp.py`). Då behåller kuben loggans färg och varorna sina egna färger.
- **Typsnitten laddas bara om sidan öppnas som fil** (`file://`) i Chromium, inte med
  `setContent`.
- **Granska i slutkvalitet, inte bara i skiss.** Tre fel syntes först där:
  - prisskylten steg upp i rubriken under kranåkningen
  - räknaren visade en kort stund "189 fynd"
  - en lampramp gled bakom "100 fynd".

  Gör därför stillbilder av nyckelrutorna innan den långa renderingen.
- **En räknare ska räkna på riktigt, med en fast plats per siffra.** Rullande siffror tonade in
  hundratalets etta medan de andra siffrorna rullade.
- **Ljus som passerar bakom en text:** mörka överkanten i takt med att lamporna dämpas i 3D, i
  stället för att flytta texten.
- **`film.koll` flaggar ljushopp, inte fel.** Stämpeln, klippen och kamerans svängar ger
  flaggor som ska vara där. Titta på varje flaggad ruta och förklara den.
- **Kodningen:** H.264 High med tak på 16 Mbit/s ger cirka 50 MB för 25 s. Det är under TikToks
  gräns på 72 MB i Android-appen. Versionen utan ljud är samma videoström utan ljudspår
  (`-an -c:v copy`).
- **Ljudet är mätt, inte lyssnat på** (cirka −13 LUFS). Be Leonard lyssna innan han publicerar.
- **Tider på fyra kärnor:**
  - skiss: cirka 1 s per ruta
  - slutkvalitet: 15–50 s per ruta (kubens tagning 28 s)
  - sammansättning: cirka 6 minuter per version.

## Typsnitt

Newsreader och Geist (SIL Open Font License, se `assets/fonts/OFL-*.txt`), samma som butiken.
