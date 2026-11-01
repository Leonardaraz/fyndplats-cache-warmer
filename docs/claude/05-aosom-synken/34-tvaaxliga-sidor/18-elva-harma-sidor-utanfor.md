#### De elva Härma-sidorna som låg utanför: minimal ägarplan (2026-10-28)

Leonard 2026-10-28: *"Ja prio att fixa."* om de elva tvåaxliga sidorna som den första rundan lämnade. Analysen (butikens sidodata mot Aosoms galleri per kombination) gav
**30 foton på elva sidor** som visas under en kombination Aosom inte visar dem under, och inget som saknas där Aosom visar det. Sju sidor är rättade (`0136e7d9`, `01ac2f63`,
`4a2ab58e`, `6d35a04f`, `8901f76d`, `926ec7a2`, `c3d1fa41`: 17 foton under fel kombination borta, 194 → 177 foton i vyerna, **25 av 25 kombinationer rätt i en riktig webbläsare**,
första bilden och varukorgens bild oförändrade på alla 25, minst fyra foton överallt). Fyra lämnades vid Wix tak (`1d4eb6b1`, `4d9ba658`, `543b9076`, `aafbf543`): Leonard 2026-10-28, *Vi gör som du rekommenderar*, så deras närbilder ligger kvar, utom spännet `435f39`
på verktygslådan, som är borttaget (punkt 3). Planer, tabell och före-läge ligger i `tools/polish-assets/runda-bilder-harma-exakt-2/`, och FLAGGADE har lärdom 251–253 och 260.

Fyra egenskaper som inte ska tas bort:

1. **Bara de felplacerade fotona ändras** (`tools/polish-gates/bygg-harma-minimal.py`, med självprov). Den fulla byggaren ger varje äldre foto den exakta rektangeln, och det ger 3–14
   ändringar per sida, fler länkar än Wix tar på sidor som redan ligger på taket och en ny första bild på de kombinationer där packshoten inte är feedens. Är första bilden redan rätt
   är den minimala planen det som räcker.
2. ☠️ **Torrkörningens `forsta` och `varukorg` jämförs mot före-läget, rad för rad.** Ett foto som går från en länk till två slår ett med färre som kombinationens första bild (lika
   antal: det som står först i färgens lista), och då byter Vits första foto, alltså varukorgens, kassans och orderns bild. Det hände på två av sju sidor och syntes varken i antal eller
   i vy. Lagat med en andra länk på packshoten (`["Vit", "85 tum"]`) och `ordning` som lägger kombinationernas nuvarande första foton först i färgens lista.
3. ☠️ **En sida på Wix tak (15 länkade bilder per val) lämnas, och ingenting tas bort utan Leonards ja.** Fyra sidor låg på 15 i båda storlekarna, och exakt ägare kostar en länk till
   per foto. De felplacerade fotona är närbilder av samma färg utan nästan identisk tvilling i galleriet, så en borttagning tar bort fotot också där det är rätt. Enda tydliga felet
   var spännet `435f39` på verktygslådan. ✅ Avgjort 2026-10-28 (Leonard: *Vi gör som du rekommenderar*): närbilderna ligger kvar och spännet togs bort. Det var ett olänkat foto på plats 14 av 31
   och togs bort med `bilder-bort.yml` (torr, sedan skarp med planens sha): galleriet 31 → 30, varje kombination 10, 9, 9 och 8 → 9, 8, 8 och 7 foton, och första bilden, varukorgens bild,
   länkar, SKU, pris, kostnad och lager oförändrade. Läst tillbaka i en separat läsning i Wix och mätt i en riktig webbläsare, en kombination i taget.
4. ☠️ **Skriv en sida först när kostnadsjobbet passerat den eller inte nått den, aldrig samtidigt.** Jobbet går i id-ordning och tar bara produkter som saknar kostnad på någon variant, så
   en sida med kostnad på alla varianter rörs aldrig, och en som jobbet inte nått får sin kostnad efteråt ur en färsk läsning. Skrivarna här bär kostnaden tillbaka och jämför den före och
   efter (`avvikelser: []` på alla sju).
