# Runda B8 — gokartar, tågbanor, ett keyboard och skumklossar ur den äldsta änden

Åttonde rundan från den ÄLDSTA änden av poleringskön. Sju av åtta är tyska
feed-utkast från 2026-08-27 kl. 20:57–21:00. Den vita elgokarten kom in i
en senare import, men är färgsyskon till en gokart från samma kväll.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| cc56eab4 | Pedalgokart för barn – röd, ställbar sits, handbroms och EVA-hjul, 3–8 år | FP-pedalgokart-barn-rod | 1 599 kr | 73 |
| 857ff5d0 | Elbil för barn 12 V – grön UTV med flak, fjärrkontroll och fjädring, 3–8 år | FP-elbil-barn-utv-gron | 2 139 kr | 9 |
| 49494b1a | Elgokart för barn 24 V med bakhjulsdrift – vit, 6–18 km/h, 60 minuter, 6–12 år | FP-elgokart-barn-vit-drift | 3 949 kr | 104 |
| a8130281 | Pianokeyboard för barn med pall och mikrofon – rosa, 37 tangenter, 3–6 år | FP-pianokeyboard-barn-rosa | 959 kr | 74 |
| 0d8d0d2d | Tågbana i trä 100 delar – batteritåg, magnetkran och bro, från 36 månader | FP-tagbana-tra-magnetkran | 979 kr | 15 |
| c8db0a3d | Tågbana i trä med gruvtema – 79 delar i fyra plan, hiss, kran och helikopter | FP-tagbana-tra-gruvtema | 1 059 kr | 170 |
| 8df88104 | Skumklossar 12 kuber för 1–3 år – 20 cm, konstläder i sex färger | FP-skumklossar-12-kuber | 949 kr | 197 |
| 0d5eaa06 | Skumklossar 6 delar för 1–3 år – trappa, våg, slänt och mattor, 150 × 100 cm | FP-skumklossar-6-delar-vag | 1 649 kr | 183 |

**Inget pris är rört.**

## Så valdes de åtta

B7:s andra svep räckte in i nästa lager av äldsta utkast, och ett tredje
svep skärmade positionerna 150–215 i skapandeordning. Samma skärm som
förut: måttripplar mot hela katalogen, märkesnamn i texten, saldo och sedan
bilder i färg.

- **Sparkcyklarna** `28d7dfd9` (ljusblå) och `aef9a8d9` (grön) är samma
  modell som tre publicerade, i rosa, svart och ljusrosa. De hålls.
- **En färg per familj**, den med störst saldo: den röda pedalgokarten (73;
  blå 72, rosa 50), den vita elgokarten (104; röd 57, blå 31), det rosa
  keyboardet (74; svart 52) och skumkuberna i klara grundfärger (197;
  pastell 58 och en tredje färgställning 173).
- **Skumklossarna** är en stor familj med många publicerade set. De två som
  poleras här är andra set än de publicerade: tolv lika kuber, och en
  modulär klätterbana med vågformad ramp och kvartsrunda mattor. Tio andra
  skumset delar mått med publicerade sidor och hålls.
- **Saldo 0–7** hoppas över: lekmattan `1adef24e` (0), klätterklossarna
  `29d7e497` (0) och `dbd5252f` (7).

Fullständig lista i `FLAGGADE.md`.

## Bilder före text

Kontaktarken lästes före texten. Elva bilder ströks (`bilder-bort.tsv`),
och 29 står kvar:

- åtta med tysk text inbränd: tre måttbilder med *Empfohlenes Alter* och
  *Gewichtsgrenze*, och fem rubrikbilder (*EIN WUNDERBARES GESCHENK FÜR
  KINDER*, *FAHRE IM RHYTHMUS*, *SPASS-HELIKOPTER* med flera)
- två med läsbar engelsk text på rekvisitan: affischen *BE KIND* och
  tavlan *NEW YORK* bakom skumklossarna
- ☠️ **en med kinesisk vattenstämpel**: bild 2 av tågbanan `0d8d0d2d` bär
  *AI生成* (”AI-genererad”) inbränt uppe till vänster. Den syns knappt i
  kontaktarket och hittades först vid inzoomning. Bild 4 och 5 i samma
  serie är också AI-genererade men utan stämpel, och boktiteln på bild 5 är
  påhittad och oläslig. De står kvar.

⚠️ UTV:n (`857ff5d0`) står därmed med två bilder.

Märkningar tryckta på själva produkterna står kvar men nämns inte i
texten: *PERHOUR* på pedalgokarten, *KART* på elgokarten, *HEAVY DUTY* på
UTV:n och *HIGH SPEED/LOW SPEED* och *Forward/Stop/Back* på elgokartens
panel.

## Där källan och bilden inte sa samma sak

- Keyboardet (`a8130281`) är rosa i specen och på bilderna, men källan
  säger *klassisch in schwarz* i en punkt som är kopierad från den svarta
  varianten. Sidan säger rosa.
- Elgokartens (`49494b1a`) strukna måttbild visar ett barn på 130 cm, medan
  specen säger *Empfohlene Körpergröße: 120 cm*. Sidan säger omkring
  120 cm. Panelen på bild 5 har reglage för hög och låg hastighet och för
  framåt och bakåt. Det nämns i texten utan några tal.
- UTV:n (`857ff5d0`) har *Sitzhöhe: 16 cm*, vilket inte går ihop med en
  sits som bilden visar högre upp. Sitthöjden står inte på sidan. Källans
  *elektrischer Kofferraum* sägs inte heller, eftersom det inte framgår
  vad som är elektriskt. Sidan säger flak bak.
- Pedalgokarten (`cc56eab4`) utlovar *Bremse und Kupplung* och
  *Gangschaltung*. Bara handbromsen syns på bilderna, och sidan nämner
  bara den.
- Den modulära skumsatsen (`0d5eaa06`) listar *Sektor* en gång, men
  leveransen är sex delar och bilderna visar två kvartsrunda mattor. Raden
  står i `foto-tal.txt`, liksom de sex färgerna på skumkuberna.

## Grindar

☠️ **Siffergrinden fällde "3" i båda tågbanorna.** Källan säger *36M+*,
alltså 36 månader, och "från 3 år" var en omräkning som grinden inte kan
se. Sidorna, namnet och SEO-texten säger nu 36 månader. En omräkning är
ett påstående som inte står i källan, och grinden hade rätt att fälla det.

Sedan alla rena: `gate.py` (0 fynd, 0 varningar), `gate-alt.py` (29
alt-texter), `gate-seo.py`, `gate-sku.py` (längsta SKU 26 av 40 tecken),
`gate-lager.py` (lägsta saldo 9), `gate-axel.py` (0 axelfel),
`gate-superlativ.py` och `gate-lankar.py`. Formsvepet med båda formerna
ur `lib/polish/skrivplan.ts` gav 0 träffar. Slugen för tågbanan med 100
delar skrevs från början utan talet, eftersom *100-delar* har den breda
artikelnummerformen. Hela `lib/polish` gick grönt (132 test).

Ingen av de åtta slugarna fanns i butiken (filtret provat mot en känd slug
från B7, som det hittade).

## Wix, i den ordning det skrevs

SKRIV-PLATSHÅLLARE

## Live

LIVE-PLATSHÅLLARE

## Kategorier

Alla åtta under Barn & Familj och Leksaker & Spel. UTV:n och elgokarten
också under Elbilar för barn, och skumklossarna, för 1–3 år, under Baby &
Småbarn. Pedalgokarten har inget elfordon i sig och står bara under
Leksaker & Spel.

## Inga egna kort

Samma praxis som B1–B7 och N40–N56.
