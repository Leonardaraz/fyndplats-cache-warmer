# Daglig AliExpress-sync — push & deploy

Leonard, du behöver pusha själv eftersom Claude inte kunde röra `.git/` (HEAD-/index-korruption — se NOTE nedan). Alla filer är skrivna direkt i working tree.

> **Innan commit: ta bort `tsconfig.isolated.json` i repo-roten** — Claude skapade den för att försöka köra typecheck från sandbox-miljön och kunde inte radera den därifrån. `Remove-Item .\tsconfig.isolated.json` räcker.

## Commit-meddelande (Conventional Commits)

```
feat(sync): daglig AliExpress-cron, alerts-vy och Resend-rapport
```

(Eller, om du vill ha lite mer kontext:)

```
feat(sync): daglig AliExpress-cron med alerts-UI och Resend-rapport

- /api/cron/aliexpress-sync kör 06:00 UTC och diffar pris/lager/listning per produkt
- Auto: dölj borttagna listningar, sätt slut-i-lager, återställ när tillbaka
- Flag: prishöjningar som hotar 20%-marginalen, titel-/bildändringar
- /admin/sync-alerts: svenska godkänn/behåll/ta-bort + bulk-approve
- migrations/003_aliexpress_sync.sql för framtida Postgres-flytt
- SYNC_DRY_RUN=true (default) → läsläge tills första körningen verifierats
```

## Git-recovery + push (PowerShell, kör från `C:\Users\leona\fyndplats-cache-warmer`)

`.git/` är trasig (HEAD har trailing-nullar, index har ogiltig SHA, refs/heads/main pekar på en commit som inte finns). Det är snabbast och säkrast att **återskapa `.git` från remote** istället för att försöka laga den — alla våra filändringar ligger i working tree och kommer återinkluderas.

```powershell
# === Steg 0: Backup ===
# Vi sparar dina nuvarande working-tree-ändringar i en sidesäkrad mapp.
$backup = "$env:USERPROFILE\fyndplats-cache-warmer-WT-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
robocopy . $backup /MIR /XD node_modules .git .next /NFL /NDL /NJH /NJS
Write-Host "Backup klar: $backup" -ForegroundColor Green

# === Steg 1: Spara nya filer i tempfolder så de inte rensas vid clone ===
$tmp = "$env:TEMP\fyndplats-sync-cron-new-$(Get-Random)"
New-Item -ItemType Directory -Path $tmp | Out-Null
$newFiles = @(
  "migrations\003_aliexpress_sync.sql",
  "lib\sync\sync-log.ts",
  "lib\sync\aliexpress-sync.ts",
  "lib\sync\aliexpress-sync.test.ts",
  "lib\email\resend.ts",
  "app\api\cron\aliexpress-sync\route.ts",
  "app\admin\sync-alerts\page.tsx",
  "app\admin\sync-alerts\actions.ts",
  "SYNC-CRON-NOTES.md"
)
$modifiedFiles = @(
  "vercel.json",
  "app\admin\page.tsx"
)
foreach ($f in $newFiles + $modifiedFiles) {
  if (Test-Path $f) {
    $dest = Join-Path $tmp $f
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Copy-Item $f $dest -Force
  }
}
Write-Host "Filer staged i: $tmp" -ForegroundColor Green

# === Steg 2: Återskapa .git från remote ===
# OBS: ersätter NUVARANDE .git med en fräsch klon. Working tree behålls.
Remove-Item -Recurse -Force .git
git init -b main
git remote add origin https://github.com/<DIN-USER>/fyndplats-cache-warmer.git   # <-- byt URL
git fetch origin main
git reset --soft origin/main    # behåller working tree; HEAD pekar nu på origin/main

# === Steg 3: Återställ våra nya/ändrade filer (de skrevs över av reset) ===
foreach ($f in $newFiles + $modifiedFiles) {
  $src = Join-Path $tmp $f
  if (Test-Path $src) {
    New-Item -ItemType Directory -Force -Path (Split-Path $f) | Out-Null
    Copy-Item $src $f -Force
  }
}

# === Steg 4: Kör typecheck + test innan commit ===
pnpm install   # ev. om node_modules saknar paket
pnpm typecheck
pnpm test

# === Steg 5: Commit + push ===
git add migrations/003_aliexpress_sync.sql `
        lib/sync/sync-log.ts `
        lib/sync/aliexpress-sync.ts `
        lib/sync/aliexpress-sync.test.ts `
        lib/email/resend.ts `
        app/api/cron/aliexpress-sync/route.ts `
        app/admin/sync-alerts/page.tsx `
        app/admin/sync-alerts/actions.ts `
        vercel.json `
        app/admin/page.tsx `
        SYNC-CRON-NOTES.md

git commit -m "feat(sync): daglig AliExpress-cron, alerts-vy och Resend-rapport"
git push origin main
```

### Alternativ om du INTE vill röra .git

Om återklon känns drastisk: du kan stage filerna manuellt utan att laga `.git/`:

```powershell
# 1. Säkerhetskopia av working tree (samma som ovan)
# 2. Klona en fresh repo bredvid och kopiera in filerna:
cd ..
git clone https://github.com/<DIN-USER>/fyndplats-cache-warmer.git fyndplats-cache-warmer-fresh
cd fyndplats-cache-warmer-fresh

# Kopiera in våra nya/ändrade filer från den trasiga reponen:
$src = "C:\Users\leona\fyndplats-cache-warmer"
$files = @(
  "migrations\003_aliexpress_sync.sql",
  "lib\sync\sync-log.ts",
  "lib\sync\aliexpress-sync.ts",
  "lib\sync\aliexpress-sync.test.ts",
  "lib\email\resend.ts",
  "app\api\cron\aliexpress-sync\route.ts",
  "app\admin\sync-alerts\page.tsx",
  "app\admin\sync-alerts\actions.ts",
  "vercel.json",
  "app\admin\page.tsx",
  "SYNC-CRON-NOTES.md"
)
foreach ($f in $files) {
  $s = Join-Path $src $f
  $d = $f
  New-Item -ItemType Directory -Force -Path (Split-Path $d) | Out-Null
  Copy-Item $s $d -Force
}

pnpm install
pnpm typecheck
pnpm test
git add .
git commit -m "feat(sync): daglig AliExpress-cron, alerts-vy och Resend-rapport"
git push origin main
```

Då kan du efter pushen radera den trasiga `fyndplats-cache-warmer` och döpa om `fyndplats-cache-warmer-fresh` → `fyndplats-cache-warmer`.

## Vercel environment variables som måste sättas

Lägg till i Vercel → Project Settings → Environment Variables (Production + Preview):

| Variabel | Värde | Notering |
|---|---|---|
| `SYNC_DRY_RUN` | `true` | **Sätt till `true` första gången.** Cronen kör då utan Wix-skrivningar. Verifiera log + email-rapport en dag, byt sedan till `false`. |
| `SYNC_MAX_API_CALLS` | `100` | Rate-limit per körning. Höj försiktigt om du har många produkter och AliExpress klagar inte. |
| `SYNC_MARGIN_FLOOR_PERCENT` | `20` | Tröskel för pris-alert. Höjer marginal-golvet → fler alerts. |
| `CRON_SECRET` | (auto från Vercel Cron) | Vercel sätter `Authorization: Bearer <CRON_SECRET>` på Cron-triggers. Använd samma värde i Vercel Cron-konfig. |
| `OPS_ALERT_EMAIL` | `info@fyndplats.com` | Sammanfattnings-rapporten skickas hit. |
| `RESEND_API_KEY` | (din Resend-key) | Krävs för email-utskick. Saknas den → cronen kör vidare, mejlet hoppas över tyst. |
| `RESEND_FROM_ADDRESS` | `Fyndplats <noreply@fyndplats.se>` | Domänen måste vara verifierad i Resend. |
| `NEXT_PUBLIC_APP_URL` | `https://fyndplats-cache-warmer.vercel.app` | Används för länkar i mejlet. |
| `SYNC_EMAIL_DRY_RUN` | (lämna tom) | Sätt till `true` för att stoppa email-utskick utan att stänga av cronen. |

Befintliga variabler du redan har som krävs: `STORE_BACKEND=wix-data`, `WIX_API_TOKEN`, `WIX_SITE_ID`, `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`, `USD_TO_SEK`, `VAT_RATE_PERCENT`, `MARKUP_MULTIPLIER`, `EXTENSION_API_TOKEN`.

## Wix Data-kollektioner att skapa

Cronen läser och skriver tre nya Wix Data-kollektioner. Skapa dem i Wix Editor → CMS → Add Collection (eller låt Wix auto-skapa dem vid första skrivningen, men då saknar de sortering/index):

| Collection ID | Innehåller | Permissions |
|---|---|---|
| `FyndplatsAliExpressSyncLog` | Append-only audit-rader per produkt-check | Admin-only |
| `FyndplatsAliExpressSyncState` | Senast observerad AliExpress-status per produkt | Admin-only |
| `FyndplatsAliExpressSyncAlerts` | Öppna alerts som visas i /admin/sync-alerts | Admin-only |

(IDs är defaultvärdena — du kan overrida med env-vars `WIX_DATA_COL_SYNC_LOG` / `_STATE` / `_ALERTS` om du vill ha andra namn.)

## Verifieringssteg efter deploy

1. **Bekräfta att cronen är registrerad.** Gå till Vercel → Project → Cron Jobs. Du ska se en rad: `/api/cron/aliexpress-sync · 0 6 * * *`.
2. **Trigga manuellt en gång.** Från terminal:
   ```powershell
   curl -X POST "https://fyndplats-cache-warmer.vercel.app/api/cron/aliexpress-sync" `
        -H "x-fyndplats-token: $env:EXTENSION_API_TOKEN"
   ```
   Förväntat svar: `{ "ok": true, "summary": { "total": N, "checked": …, "dryRun": true, … } }`.
3. **Kolla Wix Data → FyndplatsAliExpressSyncLog** — du ska se en rad per mappad produkt med `actionTaken="dry_run"` (eller `"none"` om inget ändrat sig).
4. **Öppna `/admin/sync-alerts`.** Den ska antingen vara tom (inget flaggat ännu) eller visa de produkter där cronen redan upptäckt ändringar — med svenska godkänn/behåll-/ta-bort-knappar.
5. **Email-rapport.** Om något flaggades får du ett mejl till `info@fyndplats.com` med ämnet `Fyndplats sync: …`. Om inget flaggades → inget mejl (det är meningen).
6. **Vänta 24 h, läs loggen igen.** När du är nöjd: sätt `SYNC_DRY_RUN=false` i Vercel, redeploya. Från och med nästa körning gör cronen faktiska Wix-skrivningar (hide / inventory).

## Designbeslut värda att veta

- **Auto-pris-höjning på Wix gör vi INTE.** Spec:en sa "Never auto-change a Wix price", och Wix V3 PATCH för variant-pris kräver en wrapper i `lib/wix/client.ts` som inte fanns. `approveNewPrice` markerar alerten som approved + loggar — det faktiska prisbytet sker via en framtida /admin/queue-bulk-update eller manuellt i Wix-admin. Om du vill att jag bygger den auto-update-pipen i nästa pass, säg till.
- **AliExpress source-IDs** ligger i `FyndplatsMappings.supplierProductId` (Wix Data, ej Postgres). Migration-filen är för en framtida Postgres-flytt — den körs inte automatiskt.
- **Wix-produkter inom granskningskön** (`draftStatus="pending_review"`) syncas också, så snart de publiceras börjar de få sync-checkar. Produkter med `draftStatus="rejected"` hoppas över.
- **Återställning från oos**: cronen sätter bara `Wix inventory > 0` igen om produktens `visible:true`. Vi vill inte oavsiktligt åter-publicera en produkt som Leonard manuellt dolt.
- **Rate-limit**: `SYNC_MAX_API_CALLS=100` per körning. Produkter sorteras på äldsta `lastCheckedAt` så vi roterar runt över flera dagar om mappnings-listan är längre än 100.
- **Email-spam-skydd**: rapporten skickas bara om något flaggades eller om ett fel uppstod. Tysta körningar → inget mejl.
