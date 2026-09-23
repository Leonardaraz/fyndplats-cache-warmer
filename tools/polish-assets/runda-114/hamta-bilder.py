# -*- coding: utf-8 -*-
"""Hämtar rundans råbilder i full upplösning till `rawbilder/`."""
import os
import urllib.request

import matt

BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_2000,h_2000,al_c,q_95/f.jpg"
HAR = os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    os.makedirs(os.path.join(HAR, "rawbilder"), exist_ok=True)
    for k, filer in matt.BILDER.items():
        for i, f in enumerate(filer, 1):
            mal = os.path.join(HAR, "rawbilder", "%s-%d.jpg" % (k, i))
            if os.path.exists(mal):
                continue
            req = urllib.request.Request(BAS % f, headers={"User-Agent": "Mozilla/5.0"})
            open(mal, "wb").write(urllib.request.urlopen(req, timeout=120).read())
        print("%s  %d bilder" % (k, len(filer)))
