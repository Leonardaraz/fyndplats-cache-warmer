# Fyndplats Cache Warmer

Håller alla 240+ sidor på fyndplats.se varma i Wix's edge-cache (Fastly) genom att pinga sitemapen var 10:e minut via GitHub Actions. Kostar 0 kr.

## Setup-guide (~15 min)

### Steg 1 — Skapa GitHub-konto

1. Gå till https://github.com och skapa ett konto om du inte har ett. Använd `info@fyndplats.com`.

### Steg 2 — Skapa nytt repo

1. När du är inloggad, klicka på `+` uppe till höger → **New repository**.
2. Fyll i:
   - Repository name: `fyndplats-cache-warmer`
   - Visibility: **Public** (viktigt — gratis Actions-minuter är obegränsade på publika repon)
   - Initialize: lämna allt **avklickat** (vi laddar upp filer i nästa steg)
3. Klicka **Create repository**.

### Steg 3 — Ladda upp filerna

På den tomma repo-sidan ser du texten "Quick setup". Under den finns en länk **uploading an existing file**.

1. Klicka **uploading an existing file**.
2. Dra in **ping_sitemap.py** från denna mapp.
3. Scrolla ner, lägg till commit-meddelande: `Initial cache warmer`.
4. Klicka **Commit changes**.

### Steg 4 — Lägg till workflow-filen

GitHub Actions kräver att workflow-filer ligger i `.github/workflows/`. Eftersom du inte kan skapa mappar direkt i upload, gör så här:

1. Klicka **Add file** → **Create new file**.
2. I namnfältet skriv exakt: `.github/workflows/cache-warm.yml` (GitHub skapar mapparna automatiskt när du skriver `/`).
3. Öppna filen `cache-warm.yml` från din lokala mapp (finns i `.github/workflows/cache-warm.yml`), kopiera hela innehållet, klistra in i GitHub-fältet.
4. Klicka **Commit changes**.

### Steg 5 — Aktivera Actions

1. Klicka fliken **Actions** uppe på repo-sidan.
2. Du ser **"Cache Warm Fyndplats"** i listan.
3. Klicka på workflow-namnet → klicka **"Run workflow"** (grön knapp till höger) → **Run workflow** igen.
4. Vänta ~60 sekunder. Refresha sidan. Du ska se en grön bock = framgång.

Klicka in på körningen och expandera **"Warm cache"** för att se loggen:

```
Fetching sitemap index: https://www.fyndplats.se/sitemap.xml
Found 3 sub-sitemaps
Total URLs to warm: 240
=== SUMMARY ===
Run time: 75.3s | URLs: 240 | OK: 240 | HITs: 230 | Avg TTFB: 0.22s
```

### Steg 6 — Klart, det körs automatiskt nu

Cron är satt till `*/10 * * * *` = var 10:e minut, dygnet runt, för alltid.

Du behöver inte göra något mer.

## Tekniska detaljer

**Vad scriptet gör:**
1. Hämtar `https://www.fyndplats.se/sitemap.xml` (sitemap-index)
2. Läser ut tre sub-sitemaps (products, blog, pages)
3. Samlar alla URL:er till en lista (för närvarande ~240 st)
4. Pingar dem med 3 parallella requests och 150ms paus mellan = ungefär 60-90s för full körning
5. Hanterar Wix's rate-limiting (429) med exponentiell backoff
6. Rapporterar OK/HIT/MISS/FAIL i loggen

**Vad GitHub Actions kostar:**
- Gratis-tier på publika repon: **obegränsat**
- En körning ~90 sekunder × 144 körningar/dag × 30 dagar = ca 6500 minuter/månad
- Helt inom gratis-tier

**Pausa/stoppa scriptet:**
- Gå till Actions-fliken → Cache Warm Fyndplats → klicka `…` → **Disable workflow**.

**Felsökning:**
- Om körningar börjar misslyckas (röda kryss): klicka in på körningen, expandera loggen, kopiera felmeddelandet och pinga mig.
- Vanligt fel: Wix svarar med 429 (rate-limited). Lösning: minska CONCURRENCY från 3 till 2 i `ping_sitemap.py`.

## Synergi med UptimeRobot

Båda kan köra samtidigt. UptimeRobot pingar dina topp 46 URL:er från flera geografiska platser var 5:e minut. Detta script pingar **alla** 240+ URL:er var 10:e minut från en plats. Tillsammans håller de hela sajten varm dygnet runt.
