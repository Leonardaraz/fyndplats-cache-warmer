### ☠️ Wix importerade om VARJE bild — halva lagringen var kopior (2026-08-28)

Det här förklarar två problem som såg orelaterade ut: att lagringen tog slut,
och att bildfixen kunde rapportera fem lyckade uppladdningar på en produkt som
sedan hade fyra bilder.

V3:s dokumentation om produktmedia är entydig. Ett media-item tar ANTINGEN
`id` (en fil som redan ligger i Media Manager) ELLER `url` — och `url` betyder
ordagrant *"an external media URL"*. Vi skickade wixstatic-adresser, alltså
bilder som redan låg i Media Manager, och **Wix importerade om varenda en till
en ny fil**.

Uppmätt på 1 200 filer: **591 av 595 wixstatic-filer var kopior av bilder vi
själva laddat upp**, spårbara via sin `sourceUrl`. Media Manager hade **58 160
filer** där hälften räckt.

Omimporten är dessutom ASYNKRON. Det är mekanismen bakom "524 lagade, 214
saknade ändå bilder": produkten bar aldrig våra filer, den bar Wix kopior — och
när en kopia inte hunnit bli klar visade produkten fyra av fem. Den var alltså
aldrig oförklarad, bara felsökt på fel lager.

`importMediaByUrl` returnerade `id` hela tiden. Ingen använde det.

Lagat i `lib/wix/client.ts` (`createProduct` + `setProductMedia`), `pipeline.ts`
och `image-repair.ts`: id:t följer med hela vägen, och `url` skickas bara när
adressen faktiskt är extern. `media.main` skickas inte längre alls — den är
read-only i V3 och gav en extra omimport av huvudbilden. Tre tester i
`client-media.test.ts` låser det.

☠️ Regeln: **skicka aldrig en wixstatic-adress till Wix som om den vore extern.**
