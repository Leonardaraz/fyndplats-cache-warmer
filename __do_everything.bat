@echo off
REM ============================================================================
REM __do_everything.bat
REM
REM EN slutgiltig knapp - kor:
REM   1) HEADLESS:  push tight-crop-rolloutten (image-crops cache + route + cron)
REM   2) CACHE-WARMER: push auto-trigger (worker + import-route + headless helper)
REM   3) VERCEL:   satt env vars HEADLESS_BASE_URL + ADMIN_SECRET pa
REM                cache-warmer-projektet (best effort - kraver vercel CLI login)
REM
REM Om Vercel CLI inte ar inloggad, hoppas det steget over och steget pekas
REM ut i slutmeddelandet sa du kan satta env vars manuellt via dashboard.
REM ============================================================================

setlocal EnableDelayedExpansion

set "HEADLESS_DIR=C:\Users\leona\fyndplats-headless"
set "WARMER_DIR=C:\Users\leona\fyndplats-cache-warmer"

set "FAIL_HEADLESS=0"
set "FAIL_WARMER=0"
set "FAIL_VERCEL=0"

REM ----------------------------------------------------------------------------
REM STEG 1: HEADLESS push
REM ----------------------------------------------------------------------------
echo.
echo ============================================================================
echo  STEG 1/3: PUSHA HEADLESS (tight-crop cache + route + cron)
echo ============================================================================
echo.
cd /d "%HEADLESS_DIR%"
if errorlevel 1 (
  echo FEL: Kan inte cd till %HEADLESS_DIR%
  set "FAIL_HEADLESS=1"
  goto :step2
)

echo [0/3] Rensar stale git locks i headless...
if exist ".git\index.lock"        del /f /q ".git\index.lock"        2>nul
if exist ".git\HEAD.lock"         del /f /q ".git\HEAD.lock"         2>nul
if exist ".git\packed-refs.lock"  del /f /q ".git\packed-refs.lock"  2>nul
if exist ".git\ORIG_HEAD.lock"    del /f /q ".git\ORIG_HEAD.lock"    2>nul

echo [1/3] Kontrollerar branch...
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set "H_BRANCH=%%B"
echo Current branch: !H_BRANCH!

echo [2/3] git add + commit av tight-crop-filer...
git add app\api\admin\detect-image-crops\route.ts data\image-crops.json scripts\fill-image-crops.mjs .github\workflows\refresh-image-crops.yml __fill_crops.bat __push_crops.bat outputs\fill-image-crops-report.json
if errorlevel 1 (
  echo FEL: git add misslyckades i headless.
  set "FAIL_HEADLESS=1"
  goto :step2
)

git diff --cached --quiet
if "%ERRORLEVEL%"=="0" (
  echo Inga foerandringar att committa i headless - hoppar over commit.
  goto :headless_push
)

git commit -m "feat(images): finish tight-crop rollout - fill cache + auto-refresh" -m "data/image-crops.json: 53 -> 384 entries (50.3%% av 763 unika Wix media-keys), 331 nya bbox per shardad 16-batch GET-koer mot /api/admin/detect-image-crops. 382 bilder klassade som already-tight eller margin-too-large - de behover ingen crop-entry per design." -m "Route-tillagg (skipCached=1, urls=..., POST {urls:[...]} stoed): kortar framtida re-scan; bypassar produkts-katalogen sa cache-warmers auto-trigger kan skicka URLer direkt." -m "GH Actions cron .github/workflows/refresh-image-crops.yml: var 6:e timma kor routen med skipCached=1, mergar in nya entries, commitar och pushar till headless-site." -m "Co-Authored-By: Claude <noreply@anthropic.com>"
if errorlevel 1 (
  echo FEL: git commit misslyckades i headless.
  set "FAIL_HEADLESS=1"
  goto :step2
)

:headless_push
echo [3/3] Pushar headless...
git push origin !H_BRANCH!
if errorlevel 1 (
  echo FEL: git push misslyckades i headless. Kolla GitHub creds.
  set "FAIL_HEADLESS=1"
) else (
  echo OK - headless pushad.
)

REM ----------------------------------------------------------------------------
REM STEG 2: CACHE-WARMER push
REM ----------------------------------------------------------------------------
:step2
echo.
echo ============================================================================
echo  STEG 2/3: PUSHA CACHE-WARMER (auto-trigger + manifest 0.1.13)
echo ============================================================================
echo.
cd /d "%WARMER_DIR%"
if errorlevel 1 (
  echo FEL: Kan inte cd till %WARMER_DIR%
  set "FAIL_WARMER=1"
  goto :step3
)

echo [0/3] Rensar stale git locks i cache-warmer...
if exist ".git\index.lock"        del /f /q ".git\index.lock"        2>nul
if exist ".git\HEAD.lock"         del /f /q ".git\HEAD.lock"         2>nul
if exist ".git\packed-refs.lock"  del /f /q ".git\packed-refs.lock"  2>nul
if exist ".git\ORIG_HEAD.lock"    del /f /q ".git\ORIG_HEAD.lock"    2>nul

echo [1/3] Kontrollerar branch...
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set "W_BRANCH=%%B"
echo Current branch: !W_BRANCH!

echo [2/3] git add + commit av trigger-andringar + manifest...
git add lib\headless\trigger-crop-detection.ts lib\bulk-import\worker.ts app\api\import\route.ts extension\manifest.json __push_crop_trigger.bat __do_everything.bat
if errorlevel 1 (
  echo FEL: git add misslyckades i cache-warmer.
  set "FAIL_WARMER=1"
  goto :step3
)

git diff --cached --quiet
if "%ERRORLEVEL%"=="0" (
  echo Inga foerandringar att committa i cache-warmer - hoppar over commit.
  goto :warmer_push
)

git commit -m "feat(images): fire-and-forget tight-crop detection + manifest 0.1.13" -m "Nya produkter behover tight-crop bbox i fyndplats-headless data/image-crops.json fore listing-korten renderar via /v1/crop. Helper lib/headless/trigger-crop-detection.ts skickar POST till /api/admin/detect-image-crops?skipCached=1 efter varje lyckad import." -m "Trigger ar fire-and-forget med 5 s timeout. Saknad ADMIN_SECRET -> no-op. GH Actions cron i headless ar backstop var 6:e timma." -m "extension/manifest.json bumpad till 0.1.13 efter NUL-byte-korruption pa disk - omskriven fran grunden." -m "Co-Authored-By: Claude <noreply@anthropic.com>"
if errorlevel 1 (
  echo FEL: git commit misslyckades i cache-warmer.
  set "FAIL_WARMER=1"
  goto :step3
)

:warmer_push
echo [3/3] Pushar cache-warmer...
git push origin !W_BRANCH!
if errorlevel 1 (
  echo FEL: git push misslyckades i cache-warmer. Kolla GitHub creds.
  set "FAIL_WARMER=1"
) else (
  echo OK - cache-warmer pushad.
)

REM ----------------------------------------------------------------------------
REM STEG 3: VERCEL env vars (best effort)
REM ----------------------------------------------------------------------------
:step3
echo.
echo ============================================================================
echo  STEG 3/3: VERCEL ENV VARS (best effort - kraver vercel CLI login)
echo ============================================================================
echo.
cd /d "%WARMER_DIR%"

where vercel >nul 2>&1
if errorlevel 1 (
  echo Vercel CLI hittades inte i PATH.
  echo Hoppar over - satt env vars manuellt:
  echo   https://vercel.com/leonardarazs-projects/fyndplats-cache-warmer/settings/environment-variables
  set "FAIL_VERCEL=1"
  goto :summary
)

echo Kontrollerar vercel-login...
vercel whoami >nul 2>&1
if errorlevel 1 (
  echo Vercel CLI ar inte inloggad. Kor 'vercel login' forst.
  echo Eller satt env vars manuellt via dashboard.
  set "FAIL_VERCEL=1"
  goto :summary
)

echo Satter HEADLESS_BASE_URL=https://www.fyndplats.se ^(production^)...
echo https://www.fyndplats.se | vercel env add HEADLESS_BASE_URL production
if errorlevel 1 (
  echo VARNING: HEADLESS_BASE_URL production add misslyckades ^(kanske redan satt^).
)

echo Satter HEADLESS_BASE_URL=https://www.fyndplats.se ^(preview^)...
echo https://www.fyndplats.se | vercel env add HEADLESS_BASE_URL preview
if errorlevel 1 (
  echo VARNING: HEADLESS_BASE_URL preview add misslyckades ^(kanske redan satt^).
)

echo.
echo OBS: ADMIN_SECRET kan inte sattas automatiskt - vardet maste matcha
echo det som finns i fyndplats-headless. Hamta det dar och satt manuellt:
echo   https://vercel.com/leonardarazs-projects/fyndplats-cache-warmer/settings/environment-variables
echo Och i GitHub:
echo   https://github.com/Leonardaraz/fyndplats-cache-warmer/settings/secrets/actions

:summary
echo.
echo ============================================================================
echo  RESULTAT
echo ============================================================================
if "%FAIL_HEADLESS%"=="0" ( echo   [OK]   Headless push ) else ( echo   [FEL]  Headless push - se output ovan )
if "%FAIL_WARMER%"=="0"   ( echo   [OK]   Cache-warmer push ) else ( echo   [FEL]  Cache-warmer push - se output ovan )
if "%FAIL_VERCEL%"=="0"   ( echo   [OK]   Vercel env vars ^(HEADLESS_BASE_URL^) ) else ( echo   [SKIP] Vercel env vars - satt manuellt via dashboard )
echo.
echo Vercel auto-deploy startar inom 30 s pa lyckade pushar.
echo Kolla:
echo   - https://vercel.com/leonardarazs-projects/fyndplats-headless
echo   - https://vercel.com/leonardarazs-projects/fyndplats-cache-warmer
echo.
echo ALLT KLART.
echo.
pause
endlocal
exit /b 0
