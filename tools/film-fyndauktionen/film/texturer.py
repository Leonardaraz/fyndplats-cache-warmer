"""Bygger textkorten som sitter pa foremal i 3D-scenerna: prisskylten i trappan, plaketterna pa
visningsrummets piedestaler och glasskivans rader.

Priserna ar butikens ordinarie pris vid inspelningen (assets/products/varor.json, fran film.varudata), och
skylten och plaketterna sager "Exempel": filmen anvands aret runt, och da ska den vara arlig aven nar
varan har salts eller priset andrats.
"""
from __future__ import annotations

import json
import subprocess

from .common import PRODUKTER, ROT, UT

MORK = "#211A14"
GULDBRUN = "#8C6A1E"
KRAM = "#FBF6EC"
GULD = "#E3B55A"

GLASRADER = ["Startar alltid på<br>ordinarie pris.", "Fri frakt över 499 kr.", "30 dagars öppet köp."]


def varor() -> dict[str, dict]:
    return json.loads((PRODUKTER / "varor.json").read_text(encoding="utf-8"))


def val() -> dict:
    return json.loads((PRODUKTER / "val.json").read_text(encoding="utf-8"))


def pris_text(p: dict) -> str:
    """Butikens prisskrivning, t.ex. '1 139 kr' (fast mellanrum som tusentalsavgransare)."""
    kr = int(round(float(p["pris"])))
    return f"{kr:,}".replace(",", " ") + " kr"


def _pris_html(p: dict, px: int) -> str:
    tal = pris_text(p).replace("kr", "").strip()
    return (f'<div class="serif" style="font-weight:640;font-size:{px}px;line-height:1;letter-spacing:-.03em;color:{MORK};white-space:nowrap">'
            f'{tal}<span style="font-size:.42em;letter-spacing:0;margin-left:.16em">kr</span></div>')


def spec() -> list[dict]:
    alla, v = varor(), val()
    hjalte = alla[v["trappa"]]
    kort = [{
        "id": "prisskylt", "w": 1160, "h": 670, "bakgrund": "#ffffff",
        "html": f"""
          <div style="font:600 40px Geist;letter-spacing:.3em;color:{GULDBRUN};opacity:.72;text-transform:uppercase;margin-right:-.3em">Exempel</div>
          <div style="font:650 74px Geist;letter-spacing:.16em;color:{GULDBRUN};text-transform:uppercase;margin:14px -.16em 0 0">Startpris kl 07</div>
          <div style="width:150px;height:6px;background:{GULDBRUN};opacity:.5;margin:30px 0 20px"></div>
          {_pris_html(hjalte, 236)}
        """,
    }]
    # plaketterna pa piedestalerna i visningsrummet: "Exempel · Startpris kl 07" och priset
    for n, h in enumerate(v["hall"]):
        p = alla[h]
        kort.append({
            "id": f"kort{n}", "w": 1320, "h": 400, "bakgrund": "#ffffff",
            "html": f"""
              <div style="display:flex;align-items:center;justify-content:center;gap:58px;height:400px">
                <div style="text-align:right">
                  <div style="font:600 32px Geist;letter-spacing:.28em;color:{GULDBRUN};opacity:.72;text-transform:uppercase;margin-right:-.28em">Exempel</div>
                  <div style="font:600 46px Geist;letter-spacing:.18em;color:{GULDBRUN};text-transform:uppercase;line-height:1.22;margin-top:10px;margin-right:-.18em">Startpris<br>kl 07</div>
                </div>
                {_pris_html(p, 214)}
              </div>
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
