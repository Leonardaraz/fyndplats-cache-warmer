# Anmärkningar, grupp 7

21 sidor och 127 bilder. 7 bilder hade redan alt-text (status FINNS) och ligger orörda i `alt.tsv`. 120 nya alt-texter är skrivna.

## Text i bilden

Ingen bild har mycket inbränd text på ett annat språk än svenska: alla Fyndplats-kort är på svenska. Det som finns är främmande text på rekvisita i miljöbilder, plus en platshållartext som är ett fel i bilden. Ingen av dem är återgiven i någon alt-text.

- `fbddd5b6` bild 5: tyska platshållarord, "[Kein Text erkannt]" två gånger och några rader oläslig tysk brödtext, i tavlan på sängbordet. Ser ut som ett genereringsfel (se Bilder som borde bytas).
- `fbddd5b6` bild 4: bokryggar med tysk text, delvis förvanskad, på nattduksbordet, och en bok med spegelvänd text i hyllan till höger (rekvisita).
- `e8463eba` bild 2: bokryggar med tyska titlar på den öppna hyllan och burkar med engelsk text på skivan (rekvisita).
- `e47c35c6` bild 4: bokryggar med kyrilliska tecken på sidobordet (rekvisita).
- `ecfe0314` bild 2 och 3: inramad affisch med engelsk text, delvis skymd, i bakgrunden (rekvisita).
- `f35b5688` bild 4: delar av en text på en bokrygg nere till vänster, troligen engelska (rekvisita).
- `efc86836` bild 2 och 3: affisch med engelsk text (kartmotiv) och en neonskylt med stiliserad text i rummet (rekvisita).
- `fd11ee7b` bild 2: tv:n visar en klocka med "AM", alltså engelska.
- `e8138dc4` bild 2, 3 och 5: foderpåse med engelsk text på hyllan under buren, delvis läsbar (rekvisita).
- `fa508fd3` bild 3: kortets fotnot har "känger", troligen felstavat (kängor). Sidans inledning har samma stavning.

## Fel vara eller färg

- `e47c35c6` bild 4: förutom sideboarden syns flera byråer och ett sidobord i vitt med skiva i ekton. De är inte varan på sidan. Alt-texten nämner dem bara som "fler vita möbler".
- `ecfe0314`: sidan säger vit keramikfot, men foten ser ljust varmgrå eller benvit ut i flera bilder (tydligast bild 1, 4 och 5). Jag skrev "ljus".
- `f8ba0065`: sidans namn säger cremevit tyg, men stolarna ser ljusbeige ut (sand, linnelook) i alla bilder, tydligast bild 1 och 4. Jag skrev "ljusbeige".
- `ea56e470`: i den del av sidan jag fick se står ingen färg. Stolen är ljusgrå med varm ton, nästan gråvit. Jag skrev "ljusgrå".
- `e9b06d4c`: sidan säger konstläder, men klädseln ser matt och finstrukturerad ut, i bild 4 och 7 nästan som mocka eller tyg. Jag skrev "mjuk matt klädsel" och undvek materialordet.

## Osäkert

- Antal: jag har bara skrivit antal som sidan själv anger (fyra tippfack, tre luckor, fem hyllplan, två luckor, två lampor och så vidare) och inte räknat själv i bilderna. Det gäller bland annat skärmarna på `efc86836`, sensorknapparna på `f77e7ac6` och sängskisserna i `f463194c` bild 4.
- `f65c4435` bild 1 och 2: grinden står uppställd med fyra paneler synliga och en hopvikt bakom. Jag skrev "flera paneler" och inget antal. Bild 3, 4 och 5 visar fem, som sidan säger.
- `fa508fd3` bild 1: "fem hyllplan" är sidans uppgift. I frilägget går det att räkna fem nivåer om botten räknas med.
- Lastsymbolerna i `fd11ee7b` bild 4 (80 kg) och `fa508fd3` bild 5 (60 kg): bilden säger inte vad talet gäller. Jag skrev "lastsymbol med" talet och påstod ingen bärförmåga för hela möbeln. Kortet i `fd11ee7b` bild 3 anger 50 kg på skivan.
- `f77e7ac6` bild 3: kortets rubrik rankar modellen mot resten av serien. Jag återgav inte rankningen utan skrev att rubriken handlar om ljusflödet.
- `ea1f5eba`: ytan är grå, mönstrad och nött, som en skinnlook. Jag skrev "skinnlook" och inte sidans handelsnamn för materialet, som också står i en av kortens fotnoter.
- `ea56e470` bild 1: "konstläder" är sidans ord och ytan ser slät ut med sömmar, så jag behöll det där. Övriga bilder på sidan har jag inte lagt materialord på.
- Måttbilderna (en per sida: `e47c35c6` 6, `e8138dc4` 6, `e839cf6f` 5, `e8463eba` 5, `e9b06d4c` 5, `ea1f5eba` 5, `ea56e470` 5, `ec9ba819` 4, `ecfe0314` 4, `efc86836` 6, `f35b5688` 6, `f4608364` 7, `f463194c` 4, `f594905f` 5, `f65c4435` 4, `f77e7ac6` 5, `f8ba0065` 4, `fa508fd3` 5, `fab492d8` 5, `fbddd5b6` 3, `fd11ee7b` 4) har alt-texter som inte börjar med Måttbild, Måttskiss eller Måttritning, enligt instruktionen. Ingen av dem flyttas alltså sist i galleriet. Går `alt.tsv` genom `bygg-media.py` med bildnumren 1 och uppåt gäller dock regeln källposition 3 sist (runbook 03, avsnittet Galleriet), eftersom ingen alt-text börjar på de orden. Det kan flytta bilden på plats 3 på alla 21 sidor. Runbooken säger att en texträttelse på en publicerad sida då ska numrera bilderna 101, 102 och så vidare i `bilder.tsv` och `alt.tsv`. Jag har inte ändrat numreringen: `bilder.tsv` får inte röras.
- De sex bilder som har en identisk kopia (se nedan) har fått olika texter genom att jag lyfter fram andra detaljer i samma bild.

## Fynd i befintliga alt-texter

Inga fynd: `gate-alt.py` och `kontroll.py` är rena med de sju befintliga raderna kvar oförändrade (bild 2 på `e8138dc4`, `e9b06d4c`, `ea1f5eba`, `ea56e470`, `f4608364`, `f594905f` och `fab492d8`). Notering: de består bara av sidans namn plus "i en miljöbild" och säger ingenting om vad som syns. På sex av sidorna ligger samma bildfil dessutom på en annan plats i galleriet.

## Bilder som borde bytas

- Samma bildfil två gånger i galleriet, identisk byte för byte: `e8138dc4` bild 2 och 3, `e9b06d4c` bild 2 och 4, `ea1f5eba` bild 2 och 4, `ea56e470` bild 2 och 3, `f4608364` bild 2 och 3, `f594905f` bild 2 och 4. Ta bort ena kopian eller byt den mot en ny vinkel.
- `fbddd5b6` bild 5: tavlan på sängbordet bär tysk platshållartext ("[Kein Text erkannt]"). Bilden ser genererad ut och bör bytas eller retuscheras.
- `efc86836` bild 5: kortets fotnot lyder "mått enligt leverantörens ritning". Ordet leverantör ska inte nå kunden, så kortet bör göras om utan den raden.
- `e9b06d4c` bild 5 och 6: måttbilden anger sitthöjd 51 till 59 cm, kortet anger 45 till 53 cm. Jag skrev inget av talen i alt-texten. Rätta den som inte stämmer mot sidans text.
- `fa508fd3` bild 3: "känger" i fotnoten, troligen kängor.
- `f4608364` bild 1, 2 och 3: en liten vävd etikett på sockelns kant som kan bära ett märkesnamn. Den är för liten för att läsas i bilden, så den bör kontrolleras med OCR.
- Jag har inte kunnat söka igenom de 127 bilderna efter små logotyper och märkestexter: det finns ingen OCR i miljön och kontaktarken är för grova. Kör `tools/polish-gates/ocr-forgranska.py` över gruppens bilder innan de publiceras.

## Sammanfattning

21 sidor, 120 nya alt-texter (127 rader i `alt.tsv`, 7 befintliga orörda). `gate-alt.py`: REN, 0 fynd. `kontroll.py`: REN, 0 fynd.
