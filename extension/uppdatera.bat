@echo off
REM Dubbelklicka pa denna fil for att uppdatera Fyndplats Import-tillagget.
REM Nar den ar klar: chrome://extensions -> uppdatera-pilen pa tillagget.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uppdatera.ps1"
