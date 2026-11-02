### Så körs den för hand

Schemalagd i Vercel (se avsnittets början), men workflowen **"Aosom — synka lager och
priser"** (`workflow_dispatch`, lägena `torr` · `skarp` · `lager`) kör den på
begäran — samma nyckel-lösa upplägg som importen och prisreparationen.

Den fanns inte fram till 2026-09-02, och det var en verklig lucka: `CRON_SECRET`
är märkt Sensitive i Vercel och går inte att läsa tillbaka ens för ägaren, så
att verifiera en ändring i synken krävde att man väntade på nästa schemalagda
körning och sedan gissade av en 200:a vad den gjort. Rutten loggar dessutom en
summeringsrad sedan samma dag — Vercel visade annars bara `GET … 200`.

Svepet loopar markören som importen gör, men sparar den INTE i grenen. Det
startar från början och går hela katalogen; de schemalagda körningarnas
sparade markör rörs inte (den följer bara `?rotation=` i skarpt läge).
Massfel fäller jobbet (minst 10 misslyckade och 2 % av skrivningarna), en
enstaka miss varnar — se *Massfel fäller svepet* ovan.
