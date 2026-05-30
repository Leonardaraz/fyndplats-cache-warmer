# Google Search Console-verifiering – instruktioner

SEO-verifieringstaggarna är nu **env-drivna**. Inga platshållare läcker längre ut i produktion.
Sajten visar `google-site-verification`-taggen **endast om** miljövariabeln `GOOGLE_SEARCH_CONSOLE_TOKEN` är satt på Vercel.

---

## 1. Hämta din GSC-token

1. Gå till https://search.google.com/search-console/welcome
2. Välj **URL-prefix** (inte Domän)
3. Ange: `https://www.fyndplats.se/`
4. Klicka **Fortsätt**
5. Välj verifieringsmetoden **HTML-tagg**
6. Du får en rad i stil med:
   ```html
   <meta name="google-site-verification" content="DIN_TOKEN_HÄR" />
   ```
7. Kopiera **endast** värdet i `content="..."` (alltså `DIN_TOKEN_HÄR`) – inte hela taggen.

---

## 2. Lägg in token på Vercel

1. Öppna https://vercel.com/ → projektet `fyndplats-headless`
2. **Settings** → **Environment Variables**
3. Klicka **Add New**
4. Fyll i:
   - **Key:** `GOOGLE_SEARCH_CONSOLE_TOKEN`
   - **Value:** klistra in token från steg 1
   - **Environments:** kryssa i **alla tre** (Production, Preview, Development)
   - **Sensitive:** lämna **avbockad** (token är publik – syns ändå i HTML-headern)
5. Klicka **Save**

---

## 3. Trigga redeploy

Vercel använder env vars först vid nästa build. Antingen:

- **Enklast:** Gå till **Deployments** → senaste prod-deploy → tre prickar → **Redeploy**
- **Eller:** Pusha en commit till `headless-site`/`main`

---

## 4. Verifiera i GSC

1. När redeployen är klar (vänta 1–2 min), gå tillbaka till GSC-fliken
2. Klicka **Verifiera**
3. GSC hämtar `https://www.fyndplats.se/` och letar upp `<meta name="google-site-verification" content="...">` i `<head>`
4. Klart – du får tillgång till sökstatistik, indexstatus, sitemap-status, m.m.

---

## 5. Sanity-check (valfritt)

För att bekräfta att taggen renderas innan du klickar Verifiera:

```bash
curl -s https://www.fyndplats.se/ | grep "google-site-verification"
```

Skall returnera en rad med `<meta name="google-site-verification" content="DIN_TOKEN" />`.

---

## Bing – hoppas över

Bing Webmaster Tools är **inte konfigurerat** enligt ditt beslut (låg trafikvolym från Bing i Sverige).

Om du någon gång ångrar dig:
1. Skaffa token från https://www.bing.com/webmasters/
2. Lägg in env var `BING_VERIFICATION_TOKEN` på Vercel (samma flöde som ovan)
3. Redeploy

Koden i `app/layout.tsx` är redan förberedd – ingen kodändring behövs.
