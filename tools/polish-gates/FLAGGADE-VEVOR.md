# Flaggade VEVOR-utkast — rör INTE dessa utan Leonards beslut

VEVOR-chattens egen flaggfil (Leonard 2026-10-31: en chatt för VEVOR och en för
Aosom). Samma regler som `FLAGGADE.md`: läs filen FÖRE urvalet, lämna varje rad
orörd, lägg till en rad när en runda hittar ett skäl att hålla tillbaka ett
utkast, och stryk en rad med ett kort resultat när Leonard har beslutat. Raden
tas aldrig bort.

Filen finns för att de två chattarna arbetar på var sin gren. Skrev båda i
`FLAGGADE.md` hade grenarna krockat i samma fil vid varje merge. En lärdom som
gäller båda leverantörerna skrivs i `FLAGGADE.md`.

☠️ Repot är publikt: inga artikelnummer, modellnummer, adresser eller priser.
Ett utkast anges med sitt Wix-id.

## Flaggade utkast

| Wix-id | skäl | runda | beslut |
|---|---|---|---|
| 552380c0 | Specifikationen har `Effekt: Hög` utan siffra. 2000 W står bara i utkastets maskinöversatta namn, och fjärrkontrollens knappar (800 och 1200 W) är avlästa på fotot. Texten säger 2000 W. Skyddsklassen IP34 finns i tabellen och är inte frågan. Leonard kan kontrollera effekten mot VEVOR:s sida. | vevor-1 | väntar |
| (kategorin Terrassvärmare & Infravärmare) | Kategorisidans text säger "fem elektriska värmare" och "två IP65". Länkas fler VEVOR-värmare dit blir båda påståendena falska. Sidorna länkades därför inte dit, bara till de nya underkategorierna. | vevor-1 | väntar |

## Lärdomar

**Runda vevor-1 (2026-11-01): sex infraröda värmare.**

(a) ☠️ **`gate.py` fällde varje VEVOR-sida på FRAKTVIKT.** Grinden tog specifikationens `Vikt` för Aosoms viktrad med förpackning. Hos VEVOR är raden varans egen vikt. Lagat i `gatelib.fraktvikt_fel` (tidig retur på markören `=== vevor-källa`), och `tools/polish-kedja/vevor_kalla.py` lägger markören i rundans `kallor.json`. Två tester i `lib/polish/grindluckor.test.ts`: REN med markören och FÄLLER utan den.

(b) **Namnet är en källa.** Utkastets namn bär ofta effekten ("2000W") som specifikationen saknar, och siffergrinden läser bara `kallor.json`. `vevor_kalla.py` lägger namnet dit som eget block. Bildernas alt-text tas inte med: den är maskinöversatt och bär anspråk specifikationen inte har (WiFi, IP55).

(c) **Specifikationen vinner över namnet.** Utkastets namn är maskinöversatt och bär anspråk tabellen saknar: 43943aac heter "med WiFi-kontroll" medan tabellen bara har fjärrkontroll och mekanisk brytare, och 552380c0 har `Effekt: Hög` medan namnet säger 2000 W. WiFi finns inte i texten. 2000 W gör det, och är flaggat ovan.

(d) **Bilder med AI-märkning eller app-skärmar stryks** (`bilder-bort.tsv`): 9bb0043a position 2 och 43943aac position 3.

(e) **Märket sätts av skrivsteget**, inte av namnet eller SEO-titeln. GPSR-raden kommer från motorns standardrad.

(f) **Nya underkategorier är dolda** tills tio varor är publicerade (cronen `kategorier-synlighet`). `KATEGORI SAKNAS` i livekollen är därför väntat för Värme, ventilation & AC. Varje ny runda i den kategorin för den närmare.

(g) **`ghw.py write` tar `<runda> <sha> <läge>`**, inte ett workflow-namn. Kör aldrig flera `ghw`-processer samtidigt mot samma workflow, låset är per process.

(h) **En parallell läsning av mappningsloggen gav samma körning sex gånger** (fem av sex filer visade samma wix-id). Läs en i taget och kontrollera `wixProductId` i svaret.

(i) **Recensionerna är få.** Mätt med `polish-recensioner.yml` `las`: en av sex sidor (b46eb759) hade en väntande recension att besluta, och den översattes. f79f7c66 och 52528dd1 har tre dolda var och en rad vars artikel inte går att avgöra, och de övriga tre har inga alls.

(j) **Utfall runda vevor-1, mätt 2026-11-01 18:06 UTC** (ISR-medveten hämtning, `livegrind.py`, `livekoll.py`): 6 av 6 sidor svarar 200 och är OK, orddiffen mot rundans filer är 0 på alla sex (306–361 ord), och alt-texterna är 34 av 34. Skrivningen återlästes separat 6 av 6 LIKA före live-kontrollen. Brödsmulan visar bara `Trädgård & Utemöbler`: underkategorin Värme, ventilation & AC är dold tills tio varor är publicerade, och rundan har sex. Fyra till i samma kategori gör den synlig (kandidater: växthusvärmare, takfläktar, termostat).

(k) **Byggen för rundans sex pushar, mätt i Vercels deployment-lista** (motorns projekt, 2026-11-01 17:52–18:14 UTC): `1fb23cc0` READY (rörde `lib/` och `tools/`), `8af9387f` READY, och `25293744`, `cc42aea9`, `c698863d` och `f3c7a843` CANCELED med `#ignored-build-step`. Två byggen för sex pushar. `8af9387f` rörde bara `tools/` men pushades 48 sekunder efter kodpushen, före dess bygge hann bli READY, vilket är fallet *pusha inte två gånger inom samma byggfönster* i `CLAUDE.md`.

(l) ☠️ **Dubblettbilder: `gate-bilddubblett.py` fann en identisk bild i en runda som redan var publicerad** (2026-11-01 18:08 UTC). Grinden kommer från grenen `claude/vevor-polering-jul-1` (Leonard 2026-11-01, olivträdets position 3 och 4) och ligger inte på den här grenen än, så rundan skrevs utan den. Körd efteråt fann den `f79f7c66` position 1 och 6 identiska (avvikelse 0,000), och md5 på importens källfiler visade att VEVOR lagt samma fil två gånger i sitt eget galleri. Positionskopplingen position till Wix-fil stämde på alla sidor (md5 på varje bild mot sin källa). Min alt-text på position 6 ("snett från vänster, värmehuvudet vinklat åt sidan") beskrev en vy som inte fanns: ögat såg två lika bilder som två olika. Position 6 stryks i en egen liten bildrunda (`runda-vevor-1-bilddubblett`, `bygg-bildplan.py`, workflowen *Polering — skriv bara bilderna*): torr OK, skriv OK, galleriet läst tillbaka 5 bilder, huvudbilden orörd, alt-texterna lika med planen, namn, pris, SKU och synlighet oförändrade. Sidan har fem bilder kvar, så minimikravet håller. Det andra paret grinden flaggade, `52528dd1` position 3 och 6 (0,029), visar samma värmare påslagen respektive släckt och sedd bakifrån. Det kvitteras i `bilddubblett-ok.txt`. Kör grinden på en runda *före* skrivplanen, inte efter.

(m) **Två sessioner polerar VEVOR parallellt på varsin gren.** Grenen `claude/vevor-polering-jul-1` (en annan session) har två rundor med 16 utkast (girlanger, lyktor och konstväxter), och min gren har sex värmare. Ingen produkt förekommer i båda (0 gemensamma id). Båda grenarna ändrar `FLAGGADE-VEVOR.md`, så den som mergar sist får en konflikt i den filen, att lösa genom att behålla båda raderna och lärdomarna. Den andra grenen har inte fraktviktsundantaget i `gatelib.py` (lärdom a), och min har inte bilddubblettgrinden (lärdom l). Rundkatalogerna heter olika (`runda-vevor-1-infraroda-varmare` mot `runda-vevor-1`), så filerna krockar inte.
