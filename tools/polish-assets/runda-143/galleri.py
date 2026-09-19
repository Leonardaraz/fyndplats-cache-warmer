# -*- coding: utf-8 -*-
"""Runda 143 — galleriet som det LIGGER i Wix 2026-09-13, fil-id i ordning.

Urlen ar deterministisk: https://static.wixstatic.com/media/<id>

☠️ Listan ar last med ?fields=MEDIA_ITEMS_INFO. Utan det faltet kommer
`itemsInfo.items` tillbaka TOM — inte som ett fel, bara som en tystare
projektion, och en tom lista ser i en grind exakt ut som raderade bilder.
"""

G = {
    "f8d974b3": [
        "b379ce_e80c2dda0f17407f928368f020d35d7e~mv2.jpg",
        "b379ce_0e7f4fd3ef2a49c789f3a9ed27f409c0~mv2.jpg",
        "b379ce_6f68122392694751a2da5c6a8d64e2ed~mv2.jpg",
        "b379ce_6eb5f666d1e04405868c35631d88e5a6~mv2.jpg",
        "b379ce_4519bfcd80c34e608736769478fb5f83~mv2.jpg",
    ],
    "d307632a": [
        "b379ce_05423d4f6d7c4bb7a8997bb9cc85cdaa~mv2.jpg",
        "b379ce_b441a03242714e57b1b773a483a24991~mv2.jpg",
        "b379ce_e9931e62656f40b4a1980c4dca3f4ccb~mv2.jpg",
        "b379ce_0324a6c4aa334071bfc4f1b7a551c03f~mv2.jpg",
        "b379ce_3dd7a9bcabfb4fbb833d919c9d9c5178~mv2.jpg",
    ],
    # ⚠️ FYRA bilder, inte fem. Importen tar hem positionerna 1, 2, 3, 8 och 9;
    # den har raden gav bara fyra. Kandidat for bildreparationen, och ett
    # faktum for Steg 9: galleriet kan inte anta fem.
    "49d6d56f": [
        "b379ce_f22b086ae1974f5fad565b1520d9202d~mv2.jpg",
        "b379ce_1389a87d965244d892452c8a49536b0b~mv2.jpg",
        "b379ce_0ad3bfe2f8694a6c887b697a040cf3ef~mv2.jpg",
        "b379ce_06e182705aad44caa5a83d5d4ed1f556~mv2.jpg",
    ],
    "6f603856": [
        "b379ce_37c8ae8a7f6141e89147e955dfcc010b~mv2.jpg",
        "b379ce_f061db004f3c443b9cec05f6e11db4c7~mv2.jpg",
        "b379ce_4a03593f9fc14ebf8933207a29108b70~mv2.jpg",
        "b379ce_cf666c85b6324bb19aaa08a12ab0b1ff~mv2.jpg",
        "b379ce_ca4d8abe3c71475a9da3ba1eb8e4e91f~mv2.jpg",
    ],
    "c00988e3": [
        "b379ce_f1307bf9e04f4244b7a7b681969e4ed1~mv2.jpg",
        "b379ce_a3aac7d7789543a28a5bbc9c0e2ac32c~mv2.jpg",
        "b379ce_5e52f45283f94796a3b1965f3603b740~mv2.jpg",
        "b379ce_2e98ff26bfc24ae28c9c8afc56bf99b1~mv2.jpg",
        "b379ce_7c2cd963c90d4750863f4c8e77d68039~mv2.jpg",
    ],
    "7eeb7497": [
        "b379ce_aa410f8fee0443668b485977f6d0161e~mv2.jpg",
        "b379ce_4a2ecaf3e6b1444d9a0f7edae667e7da~mv2.jpg",
        "b379ce_8ade44ebf3064456bf37194986533415~mv2.jpg",
        "b379ce_146252df0c1244fe80915f162b4e71be~mv2.jpg",
        "b379ce_ebaaa8cd04334e2c8c80ec2e9e269e42~mv2.jpg",
    ],
    "1409d762": [
        "b379ce_53ff2e8703c9491e8f4565562f51767f~mv2.jpg",
        "b379ce_42f445ec7eb3499ab729404cc6e88306~mv2.jpg",
        "b379ce_0435998246014589ba67b52f3ce8a3c8~mv2.jpg",
        "b379ce_a1ade68a05974c07ac5bedb3ff963fce~mv2.jpg",
        "b379ce_a68e90b65962439eb54f9477e3a1b6c6~mv2.jpg",
    ],
    "0deb6901": [
        "b379ce_afe7a051a4514435bd3865c988bf4d6b~mv2.jpg",
        "b379ce_8e635c9b52644968862a89f2699ee81d~mv2.jpg",
        "b379ce_0734e5f84fe54e6f929f1a754252b41d~mv2.jpg",
        "b379ce_687f977305eb43658a1623f2d4a4ef9e~mv2.jpg",
        "b379ce_26be385620bf4f4d9fe0194474bd4792~mv2.jpg",
    ],
    "74602345": [
        "b379ce_8f09c0cb97774b408c6fab3f625f70bb~mv2.jpg",
        "b379ce_328ca505ffdb4c5299ae5c39becb3e0e~mv2.jpg",
        "b379ce_24e8ecbea0da4df59f67ec92779b656a~mv2.jpg",
        "b379ce_b98f663f9fab4b418a1282f6f9cf8a51~mv2.jpg",
        "b379ce_a6ad431f0d0a4a09be5b5f4f129c5b3e~mv2.jpg",
    ],
    "702c7795": [
        "b379ce_b5d7f2f7b36e4b9ca364720509315ce3~mv2.jpg",
        "b379ce_0fde4fd8ab124878924e3648817ded5c~mv2.jpg",
        "b379ce_90ffc130a97346e18d9f04d410dd3b35~mv2.jpg",
        "b379ce_8e0b2fdb74854721be2fa44d19b61220~mv2.jpg",
        "b379ce_cca77a6378d74bd697607cfd4ccadbad~mv2.jpg",
    ],
    # ⚠️ Enda produkten i batchen UTAN alt-text alls (alla fem `null`).
    "c5c228ab": [
        "b379ce_8f76542d5b7f4f7ba12e4d96ae221c92~mv2.jpg",
        "b379ce_5d6774d4ceb74ebc819ae99af6b56375~mv2.jpg",
        "b379ce_e299220782134bf2abdec6af03408162~mv2.jpg",
        "b379ce_59ee21a8a07b44caa9fc2beafce62258~mv2.jpg",
        "b379ce_a953eb4ac7d94833ba7447bbffc9850b~mv2.jpg",
    ],
    "9119599f": [
        "b379ce_774e6f6e558647d6ac3dbcba1ac08f4a~mv2.jpg",
        "b379ce_1a0cecaa263e41528c9bc8030cd75ec3~mv2.jpg",
        "b379ce_ffcb6cbb8f664cd092765211ffa83ddd~mv2.jpg",
        "b379ce_8b53189a6bfa4592aab63cad57c5d5d3~mv2.jpg",
        "b379ce_397de97a10c2465e87ee2f10dbb19ca4~mv2.jpg",
    ],
    "86f2cb63": [
        "b379ce_51a2054ecf394df1b661d391438afd39~mv2.jpg",
        "b379ce_f7900a25643745758b0ab32703d9a72a~mv2.jpg",
        "b379ce_895fe60213a24110ac526bf2845be039~mv2.jpg",
        "b379ce_648b4363bc144cdfbb14850e777a2ff1~mv2.jpg",
        "b379ce_d729cfcea1b340d4a94c4dd381dba503~mv2.jpg",
    ],
    "57986794": [
        "b379ce_9dbfe66400284fe9bb1ac153b428cd22~mv2.jpg",
        "b379ce_a1b9ed4e8c004678a6d6517bb6d2db8a~mv2.jpg",
        "b379ce_9a9d615181454f8a987e36b4bdd89b40~mv2.jpg",
        "b379ce_f47c4266d2694006a3d9a027269c7874~mv2.jpg",
        "b379ce_9cfd1bb7d30e4ce8a1f1f7c8d624f547~mv2.jpg",
    ],
    "438295ae": [
        "b379ce_866c76d4079f45c89ca7cc26e7eea4b7~mv2.jpg",
        "b379ce_de5ba24c150f40599b4a985ab22d020c~mv2.jpg",
        "b379ce_5db619abdd41425c86888a913ce6fb0d~mv2.jpg",
        "b379ce_acc1980fb99842118bf3f0f8403a93a1~mv2.jpg",
        "b379ce_a6a74b7f2f8a4705b85635f2bc1d8542~mv2.jpg",
    ],
    "87ec8a16": [
        "b379ce_a09061b73bc04bb2b1980a2bff85226c~mv2.jpg",
        "b379ce_6bc08e7d3cd74cc390ef09c3ba960bcf~mv2.jpg",
        "b379ce_dba168236ad34a6eb6cfbea2c6ba910f~mv2.jpg",
        "b379ce_0b1bb1ac75494b3b995c28ea0c6429db~mv2.jpg",
        "b379ce_e9ce83446eff481f95d66e9ccba42b17~mv2.jpg",
    ],
    "b6c4c619": [
        "b379ce_22671b6a947e45f69ff31c2439dc089a~mv2.jpg",
        "b379ce_de95715b684f478abc3ecc09cd8008a8~mv2.jpg",
        "b379ce_122d87d8c49841e3878b768a9989ce24~mv2.jpg",
        "b379ce_9e3f1aa4c620498183c748d210f0d570~mv2.jpg",
        "b379ce_f7630854dc8a44e7b50906133db725b0~mv2.jpg",
    ],
}

# Revisionen vid lasningen. Anvands INTE som skrivrevision — den ska
# alltid lasas om precis fore varje PATCH.
REV_VID_LASNING = {
    "f8d974b3": 1, "d307632a": 2, "49d6d56f": 1, "6f603856": 3,
    "c00988e3": 2, "7eeb7497": 2, "1409d762": 1, "0deb6901": 1,
    "74602345": 2, "702c7795": 1, "c5c228ab": 3, "9119599f": 1,
    "86f2cb63": 2, "57986794": 1, "438295ae": 1, "87ec8a16": 1,
    "b6c4c619": 1,
}

BAS = "https://static.wixstatic.com/media/"


def url(fil):
    return BAS + fil


if __name__ == "__main__":
    tot = sum(len(v) for v in G.values())
    print("produkter:", len(G), "bilder:", tot)
    for k, v in G.items():
        if len(v) != 5:
            print("  ⚠️", k, "har", len(v), "bilder")
