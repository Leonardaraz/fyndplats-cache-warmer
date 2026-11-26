# VEVOR-rundans verktyg

Skripten här byggdes om 2026-11-17 efter att en miljöåterställning tog scratchpad med de gamla. De ligger i repot så att nästa runda inte börjar om. Regler och skäl står i
`docs/polish/vevor.md` och runbookens steg (`docs/seo-polish-runbook.md`); det här är bara vilken fil som gör vad. ☠️ Inget artikelnummer, ingen bildadress och
inget modellnummer skrivs i en fil här: adresserna bär artikelnumret och hämtas bara till scratchpad.

| Steg | Verktyg | Gör |
|---|---|---|
| 1. Urval | `pool.js` (ExecuteWixAPI, läsning) → `parse_ut.py` → `pool.py` | Läser avläsningarna först (status i lager, saldo) och mappningsraderna med `supplierProductId $in` i grupper om hundra (en läsning av alla rader tar över 60 s och faller). `pool.py` sållar bort id8 som redan står i en rundas `ids.tsv` eller i `FLAGGADE-VEVOR.md`. |
| 1. Syskon | `syskon.js` | Substantivsökning i registret (`seoTitle $contains`, skiftlägesokänsligt). Sök även över Aosom- och AliExpress-rader. |
| 1. Tvillingfoton | `syskon_foton.js` → `syskon_twin.py` | ☠️ Körs FÖRE bildgranskningen *(runda 525)*. `syskon_foton.js` hämtar alla syskonrader per sökord (sidor om 100, utan tak) med de sex första bild-id:na och P eller D för publicerad eller utkast; `syskon_twin.py <arb> <svarsfil> <id8,…> <bilddir>` laddar ned syskonens bilder till scratchpad och skriver de fem närmaste syskonen per kandidat (dHash, rakt och spegelvänt). Högst 5 steg av 256 är samma foto: kandidaten väljs bort, eller frågan går till Leonard när sidan redan är publicerad. Den gamla syskonlistan stannade på cirka hundra rader och missade i runda 524 att kanalslangen `dfcd07b2` delar alla fem foton med `5826436c`. |
| 2. Källa | `hamta_vevor.js` (i `tools/polish-kedja/`) → `ingest.py` | Hämtar utkasten och avläsningen (högst sex per anrop) och bygger `cand/<id8>/` med bilder, kontaktark (`sheet_d_*.jpg`, `sheet_v_*.jpg`) och `data.json`/`ut.json`. |
| 3. Bilder | `horn.py`, `bildkoll_fore.py`, `dup.py`, `twin.py` | Hörnremsor för AI-märket; `bildkoll_fore.py` räknar OLIKA foton per utkast och mellan utkasten med samma mått som `gate-bilddubblett.py` (kör den direkt efter `ingest.py`, före texten: runda 383 hade två kajakställ med bara tre olika foton, och texterna var skrivna när grinden fällde dem); dHash-dubbletter inom sidan (rak och spegelvänd) och tvillingkontroll mot publicerade sidor (samma foto ger högst 5 av 256). |
| 5–8. Bygge | `bygg_runda.py` | Skriver `ids.tsv`, `lager.tsv`, `variant.tsv`, `bilder.tsv`, `kategori.tsv`, `sku.tsv`, `namn.tsv`, `seo.tsv`, `slugs.txt`, `alt.tsv`, `bilder-bort.tsv`, `foto-tal.txt`, `grind-undantag.txt` och `kallor.json` ur en kompakt spec. Texterna (`<id8>.html`) skrivs för hand. Därefter `hasha.py`, `leak.py`, `nyaord.py`, `gate-bilddubblett.py` och `gate-bildspegel.py` (med `/usr/bin/python3`) och `bygg-skrivplan.py`. |
| 9. Återläsning | `../bygg_aterlas.py` + `jfr_aterlas.py` | Bygger ExecuteWixAPI-koden för den fulla återläsningen och jämför svaret (sparat i en fil av verktyget) med rundans filer: text, namn, adress, SEO, bildordning och alt, SKU, pris, synlighet och kategorier. Extra importkategorier skrivs som EXTRA (de tas bort med `kategori-bort`). |
| 10. Live | `../live_rund.sh`, `rec_live.py` | ISR-medveten hämtning, livegrind och livekoll; `rec_live.py` letar upp de översatta omdömena på sidorna. |

**Körs workflowerna härifrån?** `gh` är inte inloggad i molnsessionen (ogiltig `GH_TOKEN`). Starta workflowerna med GitHub-verktygen (`actions_run_trigger`) och följ körningarna
med `actions_list`/`actions_get`/`get_job_logs`, eller med `curl` mot `api.github.com/repos/Leonardaraz/fyndplats-cache-warmer/actions/runs/<id>` (publikt, ingen inloggning).
`polish-write.yml`, `kategori-bort.yml` och Aosom-chattens körningar delar kö (`polish-write`): kontrollera att din körning går från `pending` till `in_progress` och inte avbryts.
