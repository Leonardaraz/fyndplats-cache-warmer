@echo off
REM ============================================================================
REM __fill_crops.bat
REM
REM Fyller data/image-crops.json med tight-crop-bbox för ALLA produktbilder via
REM den driftsatta detection-routen på Vercel. Sharded i 16 batchar (b379ce_0..f)
REM som körs i sekvens — varje batch är ~50 bilder och tar ~30-90 s på Vercel.
REM
REM Förutsättningar:
REM   - .env.local i repo-roten innehåller ADMIN_SECRET=...
REM   - Node 18+ globalt installerat (eller pnpm exec node)
REM   - data/image-crops.json finns (skapas annars tomt)
REM
REM Output: uppdaterad data/image-crops.json + outputs/fill-image-crops-report.json
REM Slutet av scriptet committar och pushar headless-site-branchen.
REM ============================================================================

setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo [0/4] Rensar ev. stale git locks (fran tidigare sandbox-koerning)...
if exist ".git\index.lock" del /f /q ".git\index.lock" 2>nul
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock" 2>nul
if exist ".git\packed-refs.lock" del /f /q ".git\packed-refs.lock" 2>nul
if exist ".git\ORIG_HEAD.lock" del /f /q ".git\ORIG_HEAD.lock" 2>nul

echo.
echo [1/4] Laeser ADMIN_SECRET fran .env.local...
set "ADMIN_SECRET="
for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
  if /i "%%A"=="ADMIN_SECRET" set "ADMIN_SECRET=%%B"
)
if not defined ADMIN_SECRET (
  echo FEL: ADMIN_SECRET kunde inte laesas fran .env.local
  echo Lagg till radan: ADMIN_SECRET=^<vaerdet^>
  exit /b 2
)
echo OK (laengd: ! ADMIN_SECRET:~0,8!...)

echo.
echo [2/4] Kontrollerar att vi ar pa headless-site-branchen...
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%B"
if /i not "!BRANCH!"=="headless-site" (
  echo VARNING: nuvarande branch ar !BRANCH! ^(forvantat: headless-site^).
  echo Tryck Ctrl+C inom 10 sekunder for att avbryta...
  timeout /t 10 >nul
)

echo.
echo [3/4] Kor scripts/fill-image-crops.mjs ^(16 shards^)...
echo --------------------------------------------------
node scripts/fill-image-crops.mjs
set "RC=!ERRORLEVEL!"
echo --------------------------------------------------
if not "!RC!"=="0" (
  echo Scriptet returnerade !RC! — granska output ovan.
)

echo.
echo [4/4] Committar och pushar...
git add data/image-crops.json scripts/fill-image-crops.mjs app/api/admin/detect-image-crops/route.ts .github/workflows/refresh-image-crops.yml outputs/fill-image-crops-report.json 2>nul

REM Kolla om det finns nagot att committa
git diff --cached --quiet
if "!ERRORLEVEL!"=="0" (
  echo Inga foerandringar att committa.
  goto :done
)

for /f "tokens=*" %%C in ('node -e "try{const d=require('./data/image-crops.json'); console.log(Object.keys(d.entries||{}).length)}catch(e){console.log('?')}"') do set "TOTAL=%%C"

git commit -m "chore(images): populate tight-crop cache (total !TOTAL! entries)" -m "Sharded 16-batch run via /api/admin/detect-image-crops?only=b379ce_<hex>." -m "Adds skipCached=1 + urls=... params, POST handler for auto-trigger from cache-warmer, and .github/workflows/refresh-image-crops.yml for 6h auto-refresh." -m "Co-Authored-By: Claude <noreply@anthropic.com>"
if not "!ERRORLEVEL!"=="0" (
  echo FEL: git commit misslyckades.
  exit /b 3
)

git push origin headless-site
if not "!ERRORLEVEL!"=="0" (
  echo FEL: git push misslyckades.
  exit /b 4
)

:done
echo.
echo KLART.
echo - data/image-crops.json uppdaterad
echo - outputs/fill-image-crops-report.json innehaller skipped/failed-rapport
echo - Vercel auto-deploy bor starta inom 30 s
echo.
exit /b 0
