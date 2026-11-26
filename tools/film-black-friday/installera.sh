#!/bin/bash
# Installerar det filmen behöver i en ny molnsession: Blender som Python-modul (bpy) och biblioteken,
# i samma versioner som Black Friday-filmen gjordes med (2026-11-26). Chromium, Playwright, Node och
# ffmpeg finns redan i molnmiljön. Tar några minuter och behövs en gång per session, eftersom
# molnmaskinen är tillfällig.
#
#     ./installera.sh
#
# Blender hämtas från PyPI som paketet bpy; själva Blender-programmet behövs inte.
set -euo pipefail
cd "$(dirname "$0")"
VENV="${VENV:-/opt/render-venv}"   # kor.sh, kor_del.sh och leverans.sh använder /opt/render-venv
PYTHON=python3.13         # bpy 5.2.5 finns bara för Python 3.13
for prog in "$PYTHON" ffmpeg node; do
  command -v "$prog" >/dev/null || { echo "STOPP: $prog saknas"; exit 1; }
done
[ -x "$VENV/bin/python" ] || "$PYTHON" -m venv "$VENV"
"$VENV/bin/pip" install --quiet --disable-pip-version-check \
  bpy==5.2.5 numpy==2.5.5 pillow==13.0.0 fonttools==4.69.1 \
  opencv-python-headless==5.1.0.95 OpenEXR==3.5.5 scipy==1.18.1
"$VENV/bin/python" -c "import bpy; print('Blender', bpy.app.version_string)"
"$VENV/bin/python" -m film.typsnitt        # fasta typsnittsskärningar ur de variabla filerna
node -e "require('playwright'); console.log('Playwright finns')"
echo "Klart. Kör modulerna med $VENV/bin/python -m film.<modul> från $(pwd)"
