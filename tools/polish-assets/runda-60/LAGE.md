# Runda 60 — läge när Wix-anslutningen föll

Rundan är gjord till och med Steg 9:s förarbete. Det som återstår kräver
skrivningar mot Wix, och MCP-anslutningen dit låg nere när arbetet stannade.

## Klart och verifierat

| steg | vad | kvitto |
|---|---|---|
| 1 | urval + dubblettgrind | fullt svep, 55 sidor, `cursor === null` |
| 2/5 | laglighets- och påståendegrind | se uppgift #271 |
| 3 | produkterna lästa | tysk brödtext + spec per produkt |
| 4 | bildgenomgång | fyra kontaktark, 40 bilder granskade |
| 7 | texterna skrivna | `lint.py` → 8/8 rena |
| — | grindarna bevisade | `mutationstest.py` → 16/16 |
| 8 | SKU:erna framräknade | `skugrind.py` → 8 distinkta |
| 9 | korten renderade + exporterade | 11 kort, alla under 215 kB vid q >= 84 |
| 9 | galleriplanen + alt-texter | `bildplan.py` — proveniens per bild, spärr mot de 13 tyska |
| 12 | live-grinden | `live.py` körd mot skarpa sajten: 8 × 404, alltså rätt svar för utkast |

⚠️ `bildplan.py` och `live.py` läser båda `uppladdat.txt` (kort-id → wixfil).
Den filen skrivs först vid uppladdningen, och tills dess FÄLLER bildplanen
med "kortet är inte uppladdat än" — vilket är rätt beteende, inte ett fel.

## Kvar att göra

1. **Kontrollera SKU:erna mot HELA katalogen.** Runda 58 hittade två
   publicerade produkter som redan bar samma SKU. Grinden här är bara
   intern — den kan inte se katalogen utan Wix.
2. Steg 7-PATCH: `name`, `slug`, `seoData`, `plainDescription` per produkt.
3. Ladda upp de elva korten, verifiera attributionen visuellt.
4. Steg 9: galleriet + svenska alt-texter. Rena bilder per produkt:
   `4ac902ed` 01,02,03,05 · `0ceeb412` 06,07,08,10 · `d8c2dec6` 11–15 ·
   `1121b59a` 16,17 · `b330de9c` 21–25 · `106eafc5` 26,27 ·
   `70b6bfe2` 31,32,35 · `6edbe425` 36,37.
   Övriga bär tysk text inbränd och ska INTE med.
5. Steg 10: koppla till `dd650fed` (Kök & Husgeråd) + `ed3d8796`
   (Köksmaskiner & Apparater).
6. Steg 8+13: publicera med `visible:true` på BÅDE produkt och variant,
   sätt SKU:erna, stämpla via `polish-mapping.yml`.
7. Live-kontroll och runbokspost.

⚠️ Prisgrinden är redan körd och grön 8/8 (körningarna 1014–1021). Den
behöver inte köras om.

## Kvar till runda 61

Sju vattenkokar/brödrost-set som inte fick plats:
`f523b18d` · `83d2db1a` · `e7f69e8a` · `375bb3c8` · `7805b8bc` ·
`2f2c1c88` · `0ab3483a`
