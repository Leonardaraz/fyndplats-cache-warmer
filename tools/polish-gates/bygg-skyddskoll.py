#!/usr/bin/env python3
"""Bygger ExecuteWixAPI-kod som kontrollerar att skrivna färgbilder är skyddade mot bildstädningen.

Användning:
    bygg-skyddskoll.py <ut-katalog> [plan.json …]

Utan planer läses alla tools/polish-assets/fargtillagg-<N>/tillagg.json och
fargtillagg-cowork-<N>/tillagg.json (ett annat katalognamn avbryter) och
givarrundan (farger-fler-bilder-2026-10-21/aosom-givare-1.json, bilder med
"struken" hoppas över). Skriver skyddskoll-1.js, skyddskoll-2.js, … i
<ut-katalog>: en fil per högst 110 sidor. Klistra in varje fils innehåll som
`code` i ExecuteWixAPI (hasMutations=false, siteId = butikens sajt). Funktionen
bara LÄSER.

Vad varje anrop kontrollerar, per skriven fil:
  1. filen sitter i produktens galleri;
  2. bildstädningens EGEN tolkning av produkten (samma urval som
     produktensMedianycklar i lib/wix/produkt-media.ts: huvudbild, galleri och
     valens linkedMedia) ser filen, alltså kan städningen inte kalla den
     oanvänd;
  3. Media Manager har filen kvar (get-files: state OK, operationStatus READY).
Den räknar också filerna per klass (leverantor, wix-kopia, wix-utsnitt, …) så
att man ser vilka som nattens städning RADERAR om de skulle bli oanvända.

☠️ Den inbäddade datan har en FNV-1a-kontrollsumma som funktionen räknar om
före allt annat. Koden förs över till ExecuteWixAPI för hand, och ett avskriftsfel
i ett fil-id hade annars sett ut som en fil som saknas i galleriet.

Svaret bär bara Wix-id och räknare, aldrig sourceUrl (den bär Aosoms artikelnummer).
Verifierat 2026-10-22: 329 sidor, 862 av 862 filer OK (se CLAUDE.md,
"Bildstädningen och färgbilderna").
"""
import glob
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SIDOR_PER_ANROP = 110

FIL_RE = re.compile(r"b379ce_([0-9a-f]{32})~mv2\.(jpg|jpeg|png|webp)")


def fnv(s: str) -> str:
    m = 0xFFFFFFFFFFFFFFFF
    h = 0xCBF29CE484222325
    for b in s.encode():
        h ^= b
        h = (h * 0x100000001B3) & m
    return format(h, "016x")


def hex_av(fil: str) -> str:
    m = FIL_RE.fullmatch(fil)
    if not m:
        raise SystemExit(f"Oväntat fil-id: {fil}")
    return m.group(1)[:12]


def las_planer(vagar):
    """pid -> [hex12, …] i filordning, utan dubbletter."""
    per = {}
    for v in vagar:
        j = json.load(open(v))
        for s in j["sidor"]:
            for b in s["bilder"]:
                if b.get("struken"):
                    continue
                lista = per.setdefault(s["id"], [])
                h = hex_av(b["fil"])
                if h not in lista:
                    lista.append(h)
    return per


MALL = r"""async function () {
  const T0 = Date.now();
  const E = __E__;
  const SUM = "__SUM__";
  function fnv(s) {
    const b = new TextEncoder().encode(s);
    let h = 0xcbf29ce484222325n;
    const M = 0xFFFFFFFFFFFFFFFFn;
    for (const c of b) {
      h ^= BigInt(c);
      h = (h * 0x100000001b3n) & M;
    }
    return h.toString(16).padStart(16, "0");
  }
  const sum = fnv(JSON.stringify(E));
  if (sum !== SUM) {
    return { AVBRUTET: "inbäddad data skiljer från facit (avskriftsfel)", sum: sum, vantat: SUM };
  }
  const nyckel = function (s) {
    return ((s || "").split("?")[0].split("/").pop() || "").toLowerCase();
  };
  const lagg = function (ut, m) {
    if (!m) return;
    const img = (m.image && typeof m.image === "object") ? m.image : null;
    const url = (img && img.url != null) ? img.url : m.url;
    if (url) ut.add(nyckel(url));
    const id = (img && img.id != null) ? img.id : m.id;
    if (id) ut.add(nyckel(id));
  };
  const plannerNycklar = function (p) {
    const ut = new Set();
    lagg(ut, p.media && p.media.main);
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    for (const it of items) lagg(ut, it);
    for (const o of (p.options || [])) {
      for (const c of ((o.choicesSettings && o.choicesSettings.choices) || [])) {
        for (const m of (c.linkedMedia || [])) lagg(ut, m);
      }
    }
    return ut;
  };
  const RE = /[0-9a-f]{6}_[0-9a-f]{32}(?:~mv2)?(?:_[a-z0-9_]+)?\.[a-z0-9]{2,5}/gi;
  const regexNycklar = function (p) {
    const lankade = (p.options || []).map(function (o) {
      return ((o.choicesSettings && o.choicesSettings.choices) || []).map(function (c) { return c.linkedMedia || []; });
    });
    const txt = JSON.stringify([p.media || null, lankade]).replace(/%7e/gi, "~");
    const ut = new Set();
    for (const m of (txt.match(RE) || [])) ut.add(m.toLowerCase());
    return ut;
  };
  const pids = E.map(function (x) { return x[0]; });
  const prod = {};
  for (let i = 0; i < pids.length; i += 50) {
    const chunk = pids.slice(i, i + 50);
    const r = await wix.request({
      method: "POST",
      url: "https://www.wixapis.com/stores/v3/products/search",
      body: { search: { filter: { id: { $in: chunk } }, cursorPaging: { limit: 100 } }, fields: ["MEDIA_ITEMS_INFO"] },
    });
    const ps = (r.data || r).products || [];
    for (const p of ps) prod[p.id] = p;
  }
  const saknasProdukt = [];
  const saknasIGalleri = [];
  const plannerMiss = [];
  const fullaIdn = [];
  let forvantade = 0;
  let igalleri = 0;
  let plannerOk = 0;
  let regexOk = 0;
  let maxGalleri = 0;
  for (const par of E) {
    const pid = par[0];
    const hexer = par[1];
    const p = prod[pid];
    if (!p) { saknasProdukt.push(pid.slice(0, 8)); continue; }
    const items = (p.media && p.media.itemsInfo && p.media.itemsInfo.items) || [];
    if (items.length > maxGalleri) maxGalleri = items.length;
    const pkLista = Array.from(plannerNycklar(p));
    const rkLista = Array.from(regexNycklar(p));
    const galleriText = items.map(function (it) { return JSON.stringify(it).toLowerCase(); });
    for (const h of hexer) {
      forvantade++;
      const pref = "b379ce_" + h;
      const f1 = pkLista.find(function (k) { return k.indexOf(pref) === 0; });
      const f2 = rkLista.find(function (k) { return k.indexOf(pref) === 0; });
      if (f1) { plannerOk++; fullaIdn.push(f1); } else { plannerMiss.push([pid.slice(0, 8), h]); }
      if (f2) regexOk++;
      const iG = galleriText.some(function (t) { return t.indexOf(pref) >= 0; });
      if (iG) igalleri++; else saknasIGalleri.push([pid.slice(0, 8), h]);
    }
  }
  const state = {};
  const opstat = {};
  const klass = {};
  const saknasFil = [];
  let svar = 0;
  let minD = null;
  let maxD = null;
  const agare = function (id) {
    const m = /^([0-9a-f]{6})_/i.exec(id || "");
    return m ? m[1].toLowerCase() : "";
  };
  const uniq = Array.from(new Set(fullaIdn));
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50);
    const r = await wix.request({
      method: "POST",
      url: "https://www.wixapis.com/site-media/v1/files/get-files",
      body: { fileIds: chunk },
    });
    const files = (r.data || r).files || [];
    const sedda = new Set();
    for (const f of files) {
      svar++;
      sedda.add(String(f.id || "").toLowerCase());
      const st = f.state || "OK";
      state[st] = (state[st] || 0) + 1;
      const os = f.operationStatus || "-";
      opstat[os] = (opstat[os] || 0) + 1;
      let kl = "ingen-kalla";
      const src = f.sourceUrl || "";
      if (src) {
        const m = /^https?:\/\/([^\/?#]+)(\/[^?#]*)?/i.exec(src);
        const host = m ? m[1].toLowerCase() : "?";
        const path = m && m[2] ? m[2] : "";
        if (host === "img.aosomcdn.com" || host.endsWith(".aosomcdn.com") || host.endsWith("alicdn.com") || host.endsWith("aliexpress-media.com")) {
          kl = "leverantor";
        } else if (host === "static.wixstatic.com") {
          const kalla = nyckel(src);
          if (kalla === String(f.displayName || "").toLowerCase() && agare(kalla) !== "" && agare(kalla) === agare(f.id)) kl = "wix-kopia";
          else if (path.indexOf("/v1/crop/") >= 0) kl = "wix-utsnitt";
          else kl = "wix-annan";
        } else {
          kl = "annan-kalla";
        }
      }
      klass[kl] = (klass[kl] || 0) + 1;
      const cd = f.createdDate || "";
      if (cd) {
        if (!minD || cd < minD) minD = cd;
        if (!maxD || cd > maxD) maxD = cd;
      }
    }
    for (const id of chunk) {
      if (!sedda.has(id)) saknasFil.push(id.slice(7, 19));
    }
  }
  return {
    chunk: SUM,
    sidor: E.length,
    produkterHittade: Object.keys(prod).length,
    saknasProdukt: saknasProdukt,
    forvantadeFiler: forvantade,
    iGalleriet: igalleri,
    saknasIGalleriet: saknasIGalleri.slice(0, 30),
    plannerOk: plannerOk,
    plannerMiss: plannerMiss.slice(0, 30),
    regexOk: regexOk,
    maxGalleri: maxGalleri,
    getFiles: {
      fraga: uniq.length,
      svar: svar,
      saknas: saknasFil.slice(0, 30),
      state: state,
      operationStatus: opstat,
      klass: klass,
      skapadMin: minD,
      skapadMax: maxD
    },
    sek: Math.round((Date.now() - T0) / 100) / 10
  };
}
"""


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    ut = sys.argv[1]
    planer = sys.argv[2:]
    if not planer:
        # fargtillagg-<N> (omgång 1–22) och fargtillagg-cowork-<N> (Cowork-rundan); en katalog med annat namn är ett fel,
        # inte något att hoppa över, eftersom en hoppad plan lämnar filer utan skyddskoll
        def ordning(s):
            m = re.search(r"fargtillagg-(cowork-)?(\d+)", s)
            if not m:
                raise SystemExit(f"Okänt katalognamn: {s} (väntar fargtillagg-<N> eller fargtillagg-cowork-<N>)")
            return (1 if m.group(1) else 0, int(m.group(2)))

        planer = sorted(glob.glob(os.path.join(REPO, "tools/polish-assets/fargtillagg-*/tillagg.json")), key=ordning)
        planer.append(os.path.join(REPO, "tools/polish-assets/farger-fler-bilder-2026-10-21/aosom-givare-1.json"))
    per = las_planer(planer)
    sidor = [[pid, hs] for pid, hs in per.items()]
    # hex12 måste vara unikt, annars kan två filer förväxlas vid prefixmatchningen
    alla = [h for _, hs in sidor for h in hs]
    if len(set(alla)) != len(alla):
        raise SystemExit("hex12-krock eller samma fil på två sidor: dela upp planerna")
    os.makedirs(ut, exist_ok=True)
    n = (len(sidor) + SIDOR_PER_ANROP - 1) // SIDOR_PER_ANROP
    k = (len(sidor) + n - 1) // n
    for i in range(n):
        bit = sidor[i * k:(i + 1) * k]
        js = json.dumps(bit, separators=(",", ":"))
        kod = MALL.replace("__E__", js).replace("__SUM__", fnv(js))
        sokvag = os.path.join(ut, f"skyddskoll-{i + 1}.js")
        open(sokvag, "w").write(kod)
        print(f"{sokvag}: {len(bit)} sidor, {sum(len(h) for _, h in bit)} filer, {len(js)} tecken, fnv {fnv(js)}")
    print(f"Totalt {len(sidor)} sidor, {len(alla)} filer. Klistra in varje fil som `code` i ExecuteWixAPI (hasMutations=false).")


if __name__ == "__main__":
    main()
