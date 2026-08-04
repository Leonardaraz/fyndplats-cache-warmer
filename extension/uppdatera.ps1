# Uppdaterar Fyndplats Import-tillagget till senaste versionen fran GitHub.
# Kors via uppdatera.bat (dubbelklick). Efterat: chrome://extensions -> klicka
# pa uppdatera-pilen pa "Fyndplats Import" -> versionen i rutan ska stiga.
#
# Skriptet klarar bada satten mappen kan ha hamtats pa:
#   1. Git-klon (mappen eller foraldern har .git)  -> git pull --ff-only
#   2. Nedladdad zip (ingen .git)                  -> hamtar main-zippen fran
#      GitHub och skriver over filerna i DENNA mapp (repo:t ar publikt, ingen
#      inloggning behovs).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
try {
  $parentGit = Join-Path $PSScriptRoot '..\.git'
  $ownGit = Join-Path $PSScriptRoot '.git'
  if ((Test-Path $parentGit) -or (Test-Path $ownGit)) {
    Write-Host 'Hamtar senaste versionen via git...'
    if (Test-Path $parentGit) { git -C (Join-Path $PSScriptRoot '..') pull --ff-only }
    else { git pull --ff-only }
  } else {
    Write-Host 'Laddar ner senaste versionen fran GitHub...'
    $zip = Join-Path $env:TEMP 'fyndplats-ext.zip'
    $tmp = Join-Path $env:TEMP 'fyndplats-ext'
    Invoke-WebRequest 'https://codeload.github.com/Leonardaraz/fyndplats-cache-warmer/zip/refs/heads/main' -OutFile $zip
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
    Expand-Archive $zip $tmp
    Copy-Item (Join-Path $tmp 'fyndplats-cache-warmer-main\extension\*') $PSScriptRoot -Recurse -Force
    Remove-Item $zip -Force
    Remove-Item $tmp -Recurse -Force
  }
  $v = (Get-Content (Join-Path $PSScriptRoot 'manifest.json') -Raw | ConvertFrom-Json).version
  Write-Host ''
  Write-Host ("===== KLART! Tillagget ar nu version {0} =====" -f $v) -ForegroundColor Green
  Write-Host 'Oppna chrome://extensions och klicka pa uppdatera-pilen pa "Fyndplats Import".'
  Write-Host 'Ladda sedan om AliExpress-fliken (F5) sa nya koden borjar galla.'
} catch {
  Write-Host ("Nagot gick fel: {0}" -f $_) -ForegroundColor Red
  Write-Host 'Prova igen om en stund, eller sag till Claude.'
}
Read-Host 'Tryck Enter for att stanga'
