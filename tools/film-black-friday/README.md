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

## Det filmen påstår ska gå att belägga

- Varje vara i filmen är ett av fredagens fynd, med butikens ordinarie pris som startpris.
  Priset hämtas från butiken (`film/fetch_fynd.py`, `film/hamta_kandidater.py`), aldrig för hand.
- Inga lägre priser visas. Trappan visar bara timmarna 07 till 18. Stegen och golvet läses aldrig.
- Leverantörens varumärken och artikelnummer förekommer inte, varken i bild, text eller filnamn.
- Antalet fynd ("100") är en inställning till texterna och stäms av mot listan före publicering.

## Så körs den

```bash
python3 -m venv /opt/render-venv
/opt/render-venv/bin/pip install bpy==5.2.5 numpy pillow fonttools opencv-python-headless OpenEXR scipy
cd tools/film-black-friday
PY=/opt/render-venv/bin/python

$PY -m film.typsnitt                    # fasta typsnittsskärningar ur de variabla filerna
$PY -m film.fetch_fynd                  # fynden som auktionssidan visar just nu (namn, pris, bild)
$PY -m film.hamta_kandidater <slug> …   # eller: varor ur kön, hämtade från sina produktsidor
# assets/products/val.json säger vilken vara som står i trappan och vilka fyra som visas i hallen
$PY -m film.texturer                    # prisskylt, kort och glasrader
./kor.sh final A B C D E                # alla tagningar (går att avbryta och fortsätta)
node titles/rendera.js out/titlar/torsdag torsdag 100
$PY -m film.audio
$PY -m film.comp film --kvalitet final --titlar out/titlar/torsdag --ljud out/ljud.wav --ut out/pristrappan.mp4
```

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

## Typsnitt

Newsreader och Geist (SIL Open Font License, se `assets/fonts/OFL-*.txt`), samma som butiken.
