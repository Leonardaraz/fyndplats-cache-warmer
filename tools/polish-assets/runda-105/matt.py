# -*- coding: utf-8 -*-
"""Runda 105 — sköldpaddshusen. Rådata läst ur Wix V3 2026-09-08."""

# id8 -> (fullt id, namn, slug, pris, i_lager, bilder, sku, variantId)
UTKAST = {
 "acbb7bad": ("acbb7bad-7ce3-4c71-9938-a1639709bd7d", "Schildkrötenhaus, Kleintiergehege, 2 Räume, 2 Stockwerke, Fenster", "schildkrotenhaus-kleintiergehege-2-raume-2-stockwerke-fenster", 2059, True, 5, "FP-schildkrotenhaus", "45096066-3c9b-4bea-9ac1-9246c8e5ac75"),
 "0b927ed9": ("0b927ed9-40d4-4554-9338-8fca5a4f3036", "Schildkrötenhaus, 2-Ebenen-Gehege, Lampenhalter, Kleintierkäfig", "schildkrotenhaus-2-ebenen-gehege-lampenhalter-kleintierkafig", 1949, True, 5, "FP-schildkrotenhaus-2", "b4482770-9db7-4ac3-b29f-8347eaa89ac7"),
 "7480b509": ("7480b509-9150-47eb-8558-a15e570625b4", "childkrötenhaus aus Holz Schildkrötengehege mit Zwei Haupthäusern", "childkrotenhaus-aus-holz-schildkrotengehege-mit-zwei-haupthausern", 2199, True, 5, "FP-childkrotenhaus-aus-holz", "fd170d38-742f-400e-9bb7-46a8c01e3c83"),
 "f55d9635": ("f55d9635-7fa8-453b-8c02-c841c9a94efd", "Schildkrötenhaus aus Holz Schildkrötengehege mit Haupthaus", "schildkrotenhaus-aus-holz-schildkrotengehege-mit-haupthaus-2", 1459, True, 5, "FP-schildkrotenhaus-aus", "bc857d62-5d48-480a-b3ee-2d32acf2cfa2"),
 "1f9fe2c2": ("1f9fe2c2-c8e9-4e32-ba92-bc887a1562a0", "Schildkrötenhaus aus Holz Schildkrötengehege mit Haupthaus", "schildkrotenhaus-aus-holz-schildkrotengehege-mit-haupthaus", 1629, False, 5, "FP-schildkrotenhaus-aus", "ab8a2045-769c-4728-a926-3a42b7a34c99"),
 "f8d0f2b6": ("f8d0f2b6-7765-4acc-a715-dfe4a4f4c5db", "Schildkrötenbox, Outdoor Schildkrötengehege, bodenloses Design", "schildkrotenbox-outdoor-schildkrotengehege-bodenloses-design-2", 1469, True, 5, "FP-schildkrotenbox-outdoor", "dafacaf7-f241-457a-bc71-74c841237f73"),
 "c08fd055": ("c08fd055-9337-4aa1-8871-76398b895924", "Schildkrötenbox, Outdoor Schildkrötengehege, bodenloses Design", "schildkrotenbox-outdoor-schildkrotengehege-bodenloses-design", 1599, True, 5, "FP-schildkrotenbox-outdoor", "ad695efb-b3e6-4cac-b112-9c853cf87ef1"),
 "1f6de209": ("1f6de209-737f-49f4-ae8b-20881ab04f3e", "Schildkrötenhaus mit leicht zu öffnender Oberseite", "schildkrotenhaus-mit-leicht-zu-offnender-oberseite", 1619, True, 5, "FP-schildkrotenhaus-mit", "0b2f3054-301b-4e33-b4a4-a2063d4cc592"),
 "609bec0f": ("609bec0f-ede6-4485-a10c-4ded83894e7a", "Schildkrötenhaus, Reptilienbox mit 2 Räumen, Deckel", "schildkrotenhaus-reptilienbox-mit-2-raumen-deckel", 1099, True, 5, "FP-schildkrotenhaus", "bae832d7-7f15-429b-87ce-4ea115c6e445"),
 "d4787641": ("d4787641-4a6d-4138-b981-a166745539cb", "Schildkrötenhaus aus Holz, Schildkrötengehege mit Haupthäusern", "schildkrotenhaus-aus-holz-schildkrotengehege-mit-haupthausern-4", 1019, False, 5, "FP-schildkrotenhaus-aus", "764815bd-2096-47df-85b9-2fb0ce7b064e"),
 "a0bb5be8": ("a0bb5be8-1492-4b82-a7fb-c394db4556ad", "Schildkrötenhaus aus Holz Schildkrötengehege mit Haupthäusern", "schildkrotenhaus-aus-holz-schildkrotengehege-mit-haupthausern-3", 1059, True, 5, "FP-schildkrotenhaus-aus", "8c99f650-578e-48f4-9886-4f54e119d284"),
 "4b089c02": ("4b089c02-7036-40bd-be95-c3d19a6c5b94", "Schildkrötenhaus aus Holz Schildkrötengehege mit Haupthäusern", "schildkrotenhaus-aus-holz-schildkrotengehege-mit-haupthausern-2", 1059, True, 5, "FP-schildkrotenhaus-aus", "3f0e5013-b514-4c13-ac8b-ea908028d170"),
 "27aa4c23": ("27aa4c23-1a6f-468f-b065-41f629aa11ec", "Schildkrötenhaus aus Holz Schildkrötengehege mit Haupthäusern", "schildkrotenhaus-aus-holz-schildkrotengehege-mit-haupthausern", 979, True, 3, "FP-schildkrotenhaus-aus", "52c4aa1d-e643-486d-841a-d11bc6ccb0b8"),
}

BILDER = {
 "acbb7bad": ["b379ce_3bdbc4d9213b4040930fbb2a4a33aafa~mv2.jpg","b379ce_a17588efe54f4ada868a9258d81f14f4~mv2.jpg","b379ce_2398ca5384da461690ff57ef497ab332~mv2.jpg","b379ce_88cc19fafe7f4fbca39f3f7a6c9421fb~mv2.jpg","b379ce_ef458839df8942cc9639f181d7ee3e88~mv2.jpg"],
 "0b927ed9": ["b379ce_cd7ba62c4144463ea41ce1912be4b814~mv2.jpg","b379ce_4416015b3012400b826e5b7f30f49ae0~mv2.jpg","b379ce_9dde19a1e8d84e459f1ac665b7e77974~mv2.jpg","b379ce_4a9a14447a0d49d68c688a31a5f77c6f~mv2.jpg","b379ce_430c511c2778486e9af835de9d726461~mv2.jpg"],
 "7480b509": ["b379ce_2296c967f8714fe58d44a8dc5477d61a~mv2.jpg","b379ce_b343eebd24e74694afd338a5aacdd025~mv2.jpg","b379ce_6e651b7b3a4a45a482083ba1d372f181~mv2.jpg","b379ce_fa6c6b2b0fd4411dac6ea458573b9d47~mv2.jpg","b379ce_8393cbb5c709466ea0b379dc9ee1c961~mv2.jpg"],
 "f55d9635": ["b379ce_d8cad8a0d120467bbd92b4075f993743~mv2.jpg","b379ce_fab24ddb34734b65875108188235916a~mv2.jpg","b379ce_ed9b78cac95a4c9ab0415515f65c45a0~mv2.jpg","b379ce_f1ce8ed1cf3d452cadd1fb726bacb4f0~mv2.jpg","b379ce_051252e205f74ab9bf505c8d70e01ee5~mv2.jpg"],
 "1f9fe2c2": ["b379ce_f8f6aa6c9a394609927ad67d2ab5ced6~mv2.jpg","b379ce_620545fdb54244c0951c593f053590cb~mv2.jpg","b379ce_4b2dce66b0314099a11104e5dd4d3a2d~mv2.jpg","b379ce_934ca5e9bc5f4754ba9eabc63377b304~mv2.jpg","b379ce_0e4bb31ab64c4a70a13ddcc7c9c64166~mv2.jpg"],
 "f8d0f2b6": ["b379ce_b5c29f95741346cfb78f35e072351a20~mv2.jpg","b379ce_852eace8b2ea4c788417b0339176fdc2~mv2.jpg","b379ce_fb9596b447f441c7b632b09206bf67ad~mv2.jpg","b379ce_054ab8f5785e463a8fb0fdfda14046be~mv2.jpg","b379ce_bfe306e732de4a8c9e61dc06f5c08703~mv2.jpg"],
 "c08fd055": ["b379ce_4064a7d9a7f14cd5bc00971fdf5675c5~mv2.jpg","b379ce_0dbecd239e4c4f46adaa0d64e1fe23a2~mv2.jpg","b379ce_0b0ce1983aeb4d6584ad7620a06f91ec~mv2.jpg","b379ce_cdc816cf8c3c4263a09851d632ebaef0~mv2.jpg","b379ce_35adf06c8f2c4c3ab4ab284a97552988~mv2.jpg"],
 "1f6de209": ["b379ce_5e8e4166df29488f862b50f8a74b3e4d~mv2.jpg","b379ce_f024f6c9e8584255af23124bda5a7032~mv2.jpg","b379ce_40b3c23ce858425aaa7ca5643d47dc82~mv2.jpg","b379ce_770dda44f4ea496a90f5ac7268109d8f~mv2.jpg","b379ce_b1dd36b146884c4dafe78a3f81c82511~mv2.jpg"],
 "609bec0f": ["b379ce_3fe0d4a4981844399a21ba2464a65b46~mv2.jpg","b379ce_fb601734d589437bb9016a9928402d81~mv2.jpg","b379ce_6f2e64e6957d482eb261adcc125cbaec~mv2.jpg","b379ce_ae69eadd55e9451698fa2e6d33ad15ec~mv2.jpg","b379ce_9ffbb520a1f149bf9bff82ad1896f53e~mv2.jpg"],
 "d4787641": ["b379ce_5236533fd08f469bab522042d21f44cb~mv2.jpg","b379ce_566efc4aa0d34501b32d4f3735480d1b~mv2.jpg","b379ce_370a2ef49cb8489685bb8506bcc4b09d~mv2.jpg","b379ce_3a3da1187e404cfb82dd6865de6ac1cb~mv2.jpg","b379ce_c27d44ac10f749ddaeddbe0877ab2dbc~mv2.jpg"],
 "a0bb5be8": ["b379ce_22e44493019845d293ca5c81d6adfcb4~mv2.jpg","b379ce_2a3690b477bd4bc28388a4a35683cd22~mv2.jpg","b379ce_866fe762486f4d9593680271315de118~mv2.jpg","b379ce_94d89214713a477abd8bd6bfc83d7704~mv2.jpg","b379ce_3d7582757d394869ba4f2e077af820da~mv2.jpg"],
 "4b089c02": ["b379ce_592b972856804ccf8a36755c0b26a207~mv2.jpg","b379ce_fe380f7e6aeb442ca8365fdc5123ff68~mv2.jpg","b379ce_830b51f656be4fa399280081de450d90~mv2.jpg","b379ce_8be6510c6afb48e1ad14dffdac91ef94~mv2.jpg","b379ce_db918a4b8f8746ddb0fe83cfa9664309~mv2.jpg"],
 "27aa4c23": ["b379ce_d591542d1e2a4c5e82921cd3c420edef~mv2.jpg","b379ce_3e8bfdb66dda4bf38ba7d58a30859b70~mv2.jpg","b379ce_0150dbcb3d3744408ea84d2c8db60e7f~mv2.jpg"],
}

# Modellgrupper — avgjorda på leverantörens EGNA innermått, inte på namnen.
MODELLER = {
 "A": dict(ids=["d4787641","a0bb5be8","4b089c02","27aa4c23"], ytter="91 × 60,5 × 32",
           delar=[("skyddsdel", 57, 29, 28), ("öppen del", 57, 56, 28)], farger="gul / brun / blå / grå"),
 "B": dict(ids=["0b927ed9","7480b509"], ytter="116 × 70,5 × 69,5",
           delar=[("bottenplan", 108, 61, 24), ("hus, övre plan", 61, 34, 37.5)], farger="orange / grå"),
 "C": dict(ids=["f55d9635","1f9fe2c2"], ytter="104 × 53 × 82",
           delar=[("bo", 36, 49, 33), ("aktivitetsdel", 58, 49, 33)], farger="orange / grå"),
 "D": dict(ids=["f8d0f2b6","c08fd055"], ytter="120 × 55 × 20/50",
           # ⚠️ KONSERVATIVT: taket lutar 20 -> 50 cm över djupet, och hela ytan
           #    räknas här på den LÄGSTA höjden. En riktig beräkning på lutningen
           #    ger 0,48 m² över 25 cm (klarar 11-15) men bara 0,37 m² över 30 cm
           #    (klarar inte 16-20) — samma verdikt, men modellen är inte polerad
           #    i runda 105 och siffran ska räknas om innan den blir kundtext.
           delar=[("huvuddel", 37.5, 51, 20), ("soldel", 76.5, 51, 20)], farger="vit / natur"),
 "E": dict(ids=["acbb7bad"], ytter="128 × 63 × 96",
           delar=[("bottenplan", 119, 53.5, 16.5), ("höger hus", 53.4, 32, 30), ("vänster hus", 32.5, 26, 26)], farger="gul"),
 "F": dict(ids=["1f6de209"], ytter="120 × 50 × 40",
           # ⚠️ 40 cm är YTTERhöjden. Måttritningen (bild 3, zoomad) märker
           #    31 cm invändigt — det är den siffran som gäller mot L80.
           #    Verdiktet ändras inte: 0,53 m² och 31 cm klarar 16-20-facket.
           delar=[("öppen mittdel", 116, 46, 31)], farger="grå"),
 "G": dict(ids=["609bec0f"], ytter="81 × 48 × 31,5",
           delar=[("huvuddel", 30, 44, 28), ("löpdel", 44.5, 44, 28)], farger="grå"),
}

# SJVFS 2019:15 bilaga 1:7 tabell 1 — landsköldpaddor (ordagrant ur föreskriften)
# (max skallängd cm, minsta tillåtna yta m², yta per djur vid grupphållning m², minsta höjd m)
L80 = [(10, 0.12, 0.04, 0.20), (15, 0.30, 0.10, 0.25), (20, 0.50, 0.16, 0.30),
       (30, 1.10, 0.36, 0.40), (40, 2.00, 0.66, 0.50), (50, 4.00, 1.33, 0.60),
       (999, 8.00, 2.60, 0.80)]
