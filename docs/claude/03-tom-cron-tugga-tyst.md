## En tom cron-tugga ska vara TYST (2026-09-04)

`bulk-import-worker` går **varje minut, dygnet runt** — 1 440 körningar per
dygn, och nästan alla har ingenting att göra. Varje sådan skrev ändå en
`[bulk-import] trigger=cron path=…`-rad, och tillsammans med `health-check`
(var femte minut) stod de två för **~91 % av all loggvolym**.

Det är inte en kostnadsfråga utan en **läsbarhetsfråga**, och huset har redan
skrivit ned regeln två gånger: en logg som till nio tiondelar är brus är en
logg ingen läser — och då är även det äkta felet borta. Samma argument som mot
att varna vid 48 h på token-förnyelsen, och som mot ett rött synk-jobb vid varje
svep.

`runBulkImportWorker` returnerar nu tyst på en tom kö. Två saker att inte röra:

1. **Kollen ligger FÖRE routingbeslutet.** Båda vägarna (realtid och Batch API)
   läser samma kö ur samma store och gör exakt samma tidiga återvändning på en
   tom lista. Tystnad i bara den ena hade varit en tvilling som glider isär.
2. **Cadensen är oförändrad.** Att glesa ut cronen hade varit den uppenbara
   fixen och den fel: varje tick processar tio köposter, så fem minuter mellan
   ticksen gör ett hundraposters jobb fem gånger långsammare.

⚠️ **HALVERAT, INTE BORTA — och den första versionen av det här avsnittet
påstod fel.** Den skrev att fixen tar bort "en routing-rad i Vercel-loggen".
Det gör den inte: routing-raden är VERCELS egen, en per anrop, och den går
inte att tysta från applikationskod. Uppmätt i drift 2026-09-04, samma cron
före och efter deployen:

```
före  (dpl_8FCXMC…, 11:16–11:18)   GET /api/cron/bulk-import-worker 200
                                   [bulk-import] trigger=cron path=batch …
efter (dpl_3jhXDR…, 11:35–11:40)   GET /api/cron/bulk-import-worker 200
```

En tom tugga kostar alltså **en loggrad i stället för två**. Vår rad är borta;
Vercels står kvar och är 1 440 per dygn oavsett vad koden gör.

Vill man åt den återstående raden finns bara två spakar, och ingen av dem är
kod i det här repot: **glesa ut cronen** (avvisat ovan — det gör bulk-importer
flera gånger långsammare) eller **filtrera i Vercels observability/log drain**,
vilket är en inställning i dashboarden. Samma sak gäller `health-check`.
