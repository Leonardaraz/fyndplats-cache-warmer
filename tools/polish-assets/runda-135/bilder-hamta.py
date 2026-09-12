# -*- coding: utf-8 -*-
"""Steg 4: hämta rundans 40 bilder och lägg dem i kontaktark, ett per produkt.

☠️ TITTA PÅ BILDERNA FÖRE ALLT ANNAT. Leverantörens NAMN är ingen källa
   (uppgift #462) och i den här rundan motsäger tre av åtta namn sina egna
   mått. Det är bilden som avgör vad varan ÄR.
"""
import concurrent.futures as cf
import io
import os
import urllib.request

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "raw")
os.makedirs(RAW, exist_ok=True)

BAS = "https://static.wixstatic.com/media/"
PRODUKTER = {
    "0696efce": ["b379ce_e75f84136b0b47a680db2928a53237be~mv2.jpg",
                 "b379ce_8717f5f2ecd5424eabba8aabb2edb6ec~mv2.jpg",
                 "b379ce_2859681a018247009df46909020c5578~mv2.jpg",
                 "b379ce_66836bf5b40a47b09985084d0c798837~mv2.jpg",
                 "b379ce_1075b731e95b427ea6d234ca73952622~mv2.jpg"],
    "bdc7e768": ["b379ce_f0df97a04f9d41d88df463a28f5d24ce~mv2.jpg",
                 "b379ce_2b18b60bb914484f81a412c966565505~mv2.jpg",
                 "b379ce_be4d01a63def44a59f0431ccd9bebef9~mv2.jpg",
                 "b379ce_11cbb274b3c64e9b98f5e365fa26f072~mv2.jpg",
                 "b379ce_e0ad186c52be418e80dfaf34de040611~mv2.jpg"],
    "5d64f423": ["b379ce_3f54fa80039843e6991cd225788a6a3a~mv2.jpg",
                 "b379ce_c96000daafe44a2c9714d6d2bc8015ac~mv2.jpg",
                 "b379ce_c1b334ad3a0f45b8b24732047cd7a30b~mv2.jpg",
                 "b379ce_9b38eb7875c146119151b8d082f5c33c~mv2.jpg",
                 "b379ce_988d7868bc6a431ca890bca4ec7cd9f4~mv2.jpg"],
    "82efeeaf": ["b379ce_d4ec0c03f6c34597ae9cd4c151f45eab~mv2.jpg",
                 "b379ce_c3fdb5a0c97140e085558d8116161400~mv2.jpg",
                 "b379ce_4a27602629e54616867c5525a4d1cf0f~mv2.jpg",
                 "b379ce_3a613c683f164554991244320cfb7adb~mv2.jpg",
                 "b379ce_a8d12985d91f4924abe18928bebb5ee8~mv2.jpg"],
    "7564dcfb": ["b379ce_75e3fc44354d419abe9205345190ddb9~mv2.jpg",
                 "b379ce_a6fa16c7f6334f7c9c106ce11bcc6f6b~mv2.jpg",
                 "b379ce_358c04fa602e4de5b36826eaa4b1c213~mv2.jpg",
                 "b379ce_088dc931a0764102a437b61cb78c33b3~mv2.jpg",
                 "b379ce_00e440b136e6466bb155ba2168c4a66e~mv2.jpg"],
    "e2c8b0f3": ["b379ce_878baffa654741dcaa865a4eba2409e1~mv2.jpg",
                 "b379ce_7f6d54231ed54f40bacc285964c685d7~mv2.jpg",
                 "b379ce_d05fd2b388c445b89f1dc196ca07d2f4~mv2.jpg",
                 "b379ce_cb648ad9e9b147a8bd8f9cf46f82a385~mv2.jpg",
                 "b379ce_d35bb1a0e8fb4ce998a69a6d4a78457b~mv2.jpg"],
    "cc5da788": ["b379ce_e67f15727bf64eb39c2e8fc6c0b7d41b~mv2.jpg",
                 "b379ce_d741f7e7b2e3441c96109df913c30290~mv2.jpg",
                 "b379ce_2b128f3f38824dfe9c0b1e8d30f5f504~mv2.jpg",
                 "b379ce_c351d5b5fe5f4c80a169ca6e5d2c73ee~mv2.jpg",
                 "b379ce_c624f1ace5dd440494faf6d07ce51b63~mv2.jpg"],
    "741c5723": ["b379ce_7445cde5d6a3451a9336b78c27ab7ae6~mv2.jpg",
                 "b379ce_121ad4a30f1743eca719c35682c7f4b3~mv2.jpg",
                 "b379ce_588ef9b93bcc43458c4d2c91dc5d97e6~mv2.jpg",
                 "b379ce_27da599b46934d9bb0b26bc92acc84e8~mv2.jpg",
                 "b379ce_0969c250207f48cd9b25e85a1f7c8ca9~mv2.jpg"],
}

RUTA = 520


def hamta(arg):
    pid, nr, fil = arg
    vag = os.path.join(RAW, "%s-%d.jpg" % (pid, nr))
    if os.path.exists(vag):
        return vag
    u = BAS + fil
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
    for i in range(3):
        try:
            with urllib.request.urlopen(r, timeout=60) as s:
                data = s.read()
            with open(vag, "wb") as f:
                f.write(data)
            return vag
        except Exception:                                        # noqa: BLE001,S110
            pass
    raise SystemExit("kunde inte hämta %s" % u)


jobb = [(pid, i + 1, fil)
        for pid, filer in PRODUKTER.items()
        for i, fil in enumerate(filer)]
with cf.ThreadPoolExecutor(max_workers=8) as ex:
    list(ex.map(hamta, jobb))

for pid, filer in PRODUKTER.items():
    ark = Image.new("RGB", (RUTA * 5, RUTA + 26), "white")
    rit = ImageDraw.Draw(ark)
    for i in range(5):
        b = Image.open(os.path.join(RAW, "%s-%d.jpg" % (pid, i + 1))).convert("RGB")
        b.thumbnail((RUTA, RUTA), Image.LANCZOS)
        ark.paste(b, (i * RUTA + (RUTA - b.width) // 2, 26 + (RUTA - b.height) // 2))
        rit.text((i * RUTA + 8, 6), "%s  bild %d" % (pid, i + 1), fill="black")
    ark.save(os.path.join(HAR, "ark-%s.jpg" % pid), quality=88)
    print("ark-%s.jpg" % pid)
