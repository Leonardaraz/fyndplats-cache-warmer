"""Bygger textkorten som sitter pa foremal i 3D-scenerna (prisskylt, brickornas kort i hallen, glasskivans rader)."""
from __future__ import annotations

import json
import subprocess

from .common import PRODUKTER, ROT, UT
from .foton import forbered

MORK = "#211A14"
GULDBRUN = "#8C6A1E"
KRAM = "#FBF6EC"
GULD = "#E3B55A"

GLASRADER = ["Startar alltid på<br>ordinarie pris.", "Fri frakt över 499 kr.", "30 dagars öppet köp."]


def _fynd() -> dict[str, dict]:
    """Alla kanda varor: de som auktionssidan visar (fynd.json) och kandidater ur kon (kandidater.json)."""
    ut: dict[str, dict] = {}
    for fil in ("fynd.json", "kandidater.json"):
        f = PRODUKTER / fil
        if f.exists():
            for p in json.loads(f.read_text(encoding="utf-8")):
                ut[p["slug"]] = p
    return ut


def val() -> dict:
    return json.loads((PRODUKTER / "val.json").read_text(encoding="utf-8"))


def pris_text(p: dict) -> str:
    """Butikens prisskrivning, t.ex. '1 869 kr' (fast mellanrum som tusentalsavgransare)."""
    if p.get("pris_text"):
        return p["pris_text"].replace(" ", "\u00a0")
    kr = int(round(float(p["pris"])))
    return f"{kr:,}".replace(",", "\u00a0") + "\u00a0kr"


def _pris_html(p: dict, px: int) -> str:
    tal = pris_text(p).replace("kr", "").strip()
    return (f'<div class="serif" style="font-weight:640;font-size:{px}px;line-height:1;letter-spacing:-.03em;color:{MORK};white-space:nowrap">'
            f'{tal}<span style="font-size:.42em;letter-spacing:0;margin-left:.16em">kr</span></div>')


def spec() -> list[dict]:
    fynd, v = _fynd(), val()
    hjalte = fynd[v["trappa"]]
    kort = [{
        "id": "prisskylt", "w": 1160, "h": 670, "bakgrund": "#ffffff",
        "html": f"""
          <div style="font:650 80px Geist;letter-spacing:.16em;color:{GULDBRUN};text-transform:uppercase;margin-right:-.16em">Startpris kl 07</div>
          <div style="width:150px;height:6px;background:{GULDBRUN};opacity:.5;margin:38px 0 22px"></div>
          {_pris_html(hjalte, 262)}
        """,
    }]
    # brickornas kort i hallen: foto overst, namn och startpris under
    for n, h in enumerate(v["hall"]):
        p = fynd[h["slug"]]
        foto = forbered(h["slug"], kvot=1480 / 1180, hojd_px=1180, marginal=0.05, vitmaska=h.get("vitmaska"))
        kort.append({
            "id": f"kort{n}", "w": 1480, "h": 1840, "bakgrund": "#ffffff",
            "html": f"""
              <img src="file://{foto}" style="width:1480px;height:1180px;display:block;margin-top:40px">
              <div style="width:1200px;height:3px;background:{GULDBRUN};opacity:.35;margin:26px 0 44px"></div>
              <div style="font:600 82px Geist;letter-spacing:-.01em;color:{MORK};white-space:nowrap">{h["kort"]}</div>
              <div style="display:flex;align-items:baseline;gap:54px;margin-top:38px">
                <div style="font:600 46px Geist;letter-spacing:.18em;color:{GULDBRUN};text-transform:uppercase;line-height:1.25;text-align:right">Startpris<br>kl 07</div>
                {_pris_html(p, 236)}
              </div>
              <div style="height:70px"></div>
            """,
        })
    # glasskivans tre rader: ljus text med guldbock, genomskinlig bakgrund
    for n, rad in enumerate(GLASRADER):
        hojd = 520 if "<br>" in rad else 300
        kort.append({
            "id": f"rad{n}", "w": 1800, "h": hojd,
            "html": f"""
              <div style="display:flex;align-items:flex-start;gap:52px;width:100%;padding:0 30px;height:{hojd - 60}px">
                <svg width="132" height="132" viewBox="0 0 48 48" style="flex:none;margin-top:22px"><circle cx="24" cy="24" r="21.5" fill="none" stroke="{GULD}" stroke-width="2.4"/>
                  <path d="M14.5 24.6l6.4 6.3 12.8-13.4" fill="none" stroke="{GULD}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <div class="serif" style="font-weight:540;font-size:158px;line-height:1.12;letter-spacing:-.022em;color:{KRAM};white-space:nowrap">{rad}</div>
              </div>
            """,
        })
    return kort


def main() -> None:
    mal = UT / "tex"
    mal.mkdir(parents=True, exist_ok=True)
    fil = mal / "spec.json"
    fil.write_text(json.dumps(spec(), ensure_ascii=False), encoding="utf-8")
    subprocess.run(["node", str(ROT / "titles" / "tex.js"), str(fil), str(mal)], check=True)


if __name__ == "__main__":
    main()
