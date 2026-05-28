# Patch för /sparning HTML Embed-widget

Sidans kod är **i grunden bra** — backenden är det enda som saknas. Det är
faktiskt mycket bättre att låta backenden returnera precis det shape sidan
förväntar sig, än att ändra HTML-koden.

Med det sagt — om du **vill** stänga de små säkerhets-/robusthetshålen,
gör dessa fyra mikropatchar i HTML-koden inne i Wix Editor → HTML Embed →
Edit Code:

## Patch 1 — Origin-check på postMessage (säkerhet)

**Hitta:**
```js
window.addEventListener("message",e=>{
    const d=e&&e.data;
    if(d&&typeof d==="object"&&d.type==="fyndplats:tn") autoTrack(d.tn);
  });
```

**Ersätt med:**
```js
window.addEventListener("message",e=>{
    // Bara meddelanden från fyndplats.se accepteras.
    if (!/^https?:\/\/([a-z0-9-]+\.)?fyndplats\.(se|com)$/i.test(e.origin)) return;
    const d=e&&e.data;
    if(d&&typeof d==="object"&&d.type==="fyndplats:tn") autoTrack(d.tn);
  });
```

## Patch 2 — Utvidga svenska städer (mindre risk för "Under transport" på inhemska scans)

**Hitta:**
```js
const NORDIC = /sverige|sweden|stockholm|göteborg|...
```

**Lägg till dessa städer i regex:en** (i samma alternation):
```
|norrtälje|norrtalje|luleå|lulea|östersund|ostersund|kristianstad|visby|kalmar|karlskrona|skövde|skovde|varberg|trollhättan|trollhattan|kiruna|piteå|pitea|landskrona|nyköping|nykoping|motala|tumba|järfälla|jarfalla|sollentuna|haninge|huddinge|täby|taby|nacka|solna|sundbyberg
```

## Patch 3 — Använd `statusCode` från backenden (mer tillförlitlig)

**Hitta** funktionen `normalize(raw)`:
```js
const delivered = !!raw.delivered || /levererad|delivered/i.test(events[events.length-1]?.s||"");
const stage = computeStage(events, delivered);
```

**Ersätt med:**
```js
const delivered = !!raw.delivered || raw.statusCode === 40 || /levererad|delivered/i.test(events[events.length-1]?.s||"");
// Använd backendens stage-mapping om den finns, annars heuristik på event-text.
const stage = raw.statusCode
  ? ({40:4, 30:3, 35:3, 10:3, 20:2, 0:1}[raw.statusCode] ?? computeStage(events, delivered))
  : computeStage(events, delivered);
```

## Patch 4 — Säkrare datum-parsing (om 17TRACK skickar `"YYYY-MM-DD HH:mm:ss"`)

**Hitta:**
```js
function formatTime(t){
  if(!t) return "";
  const d=new Date(t);
```

**Ersätt med:**
```js
function formatTime(t){
  if(!t) return "";
  // ISO 8601 med T (inte mellanslag) är säkrast cross-browser.
  const safe = typeof t === "string" ? t.replace(/^(\d{4}-\d{2}-\d{2}) /, "$1T") : t;
  const d=new Date(safe);
```

---

Bara patch 1 är viktig (säkerhet). Patch 2–4 är "trevligt att ha" — sidan fungerar
fint utan dem.
