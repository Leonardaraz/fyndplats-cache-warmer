@echo off
REM ============================================================================
REM __push_crops.bat
REM
REM Committar och pushar tight-crop-cachen som har fyllts i av en tidigare
REM koerning (eller direkt fran sandbox). Ingen detection koerning sker har —
REM filerna ar redan paa disk:
REM
REM   data/image-crops.json                          (53 -> 384 entries)
REM   app/api/admin/detect-image-crops/route.ts      (skipCached + POST + urls)
REM   scripts/fill-image-crops.mjs                   (batch-driver fora framtiden)
REM   .github/workflows/refresh-image-crops.yml      (6h auto-refresh)
REM   __fill_crops.bat                               (manual re-run)
REM   outputs/fill-image-crops-report.json           (skipped/processed-rapport)
REM
REM Anv:  __push_crops.bat
REM ============================================================================

setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo [0/3] Rensar stale git locks...
if exist ".git\index.lock"        del /f /q ".git\index.lock"        2>nul
if exist ".git\HEAD.lock"         del /f /q ".git\HEAD.lock"         2>nul
if exist ".git\packed-refs.lock"  del /f /q ".git\packed-refs.lock"  2>nul
if exist ".git\ORIG_HEAD.lock"    del /f /q ".git\ORIG_HEAD.lock"    2>nul

echo.
echo [1/3] Kontrollerar branch och git-state...
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%B"
echo Current branch: %BRANCH%
if /i not "%BRANCH%"=="headless-site" (
  echo VARNING: branchen ar inte headless-site. Tryck Ctrl+C inom 10 s for att avbryta.
  timeout /t 10 >nul
)

echo.
echo [2/3] Lagg till vara filer...
git add app\api\admin\detect-image-crops\route.ts data\image-crops.json scripts\fill-image-crops.mjs .github\workflows\refresh-image-crops.yml __fill_crops.bat __push_crops.bat outputs\fill-image-crops-report.json
if not "%ERRORLEVEL%"=="0" (
  echo FEL: git add misslyckades.
  exit /b 2
)

git diff --cached --quiet
if "%ERRORLEVEL%"=="0" (
  echo Inga foerandringar att committa.
  exit /b 0
)

git commit -m "feat(images): finish tight-crop rollout — fill cache + auto-refresh" -m "data/image-crops.json: 53 -> 384 entries (50.3%% av 763 unika Wix media-keys), 331 nya bbox per shardad 16-batch GET-koer mot /api/admin/detect-image-crops. 382 bilder klassade som already-tight (~minst margin) eller margin-too-large (~likely dark-bg) - de behover ingen crop-entry per design." -m "Route-tillagg (skipCached=1, urls=..., POST {urls:[...]} stoed): kortar framtida re-scan; bypassar produkts-katalogen sa cache-warmers auto-trigger kan skicka URLer direkt." -m "GH Actions cron .github/workflows/refresh-image-crops.yml: var 6:e timma kor routen med skipCached=1, mergar in nya entries, commitar och pushar till headless-site. Backstop nar cache-warmer-triggern missar." -m "Co-Authored-By: Claude <noreply@anthropic.com>"
if not "%ERRORLEVEL%"=="0" (
  echo FEL: git commit misslyckades.
  exit /b 3
)

echo.
echo [3/3] Pushar...
git push origin %BRANCH%
if not "%ERRORLEVEL%"=="0" (
  echo FEL: git push misslyckades.
  echo Tips: kolla att du har GitHub-creds i Windows credential manager.
  exit /b 4
)

echo.
echo KLART. Vercel auto-deploy bor starta inom 30 s.
echo Verifiera live efter deploy:
echo   1. curl https://www.fyndplats.se/produkt/elektrisk-mjolkskummare ^| findstr /c:"v1/crop"
echo   2. Loggin pa Vercel dashboard - kolla deployment som READY
exit /b 0
