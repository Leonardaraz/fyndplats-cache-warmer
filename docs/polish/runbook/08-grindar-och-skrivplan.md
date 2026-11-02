## 8. Grindar och skrivplan

Kör från rundans katalog. Lägg först familjens tyska huvudord i `gatelib.TYSKA_ORD` om de
saknas; ord får bara läggas till, aldrig tas bort.

```bash
G=../../polish-gates
python3 $G/hasha.py             # facit för återläsningen -> vantat-hash.tsv
python3 $G/bygg-skrivplan.py    # kör alla grindar och bygg-media.py, skriver skrivplan.json och plan_sha256
```

Bygget kör grindarna i tur och ordning och vägrar skriva planen vid ett enda fynd:

| grind | kontrollerar |
|---|---|
| `gate.py` | tal mot källan, tyska rester, husmärken, artikelnummer, fraktland, leverantörs- och arbetsord, stavning, osynliga tecken, fraktvikt, länkar och flikar |
| `gate-alt.py` | samma mönster i `alt.tsv`, antalet bilder och att en struken position saknar rad |
| `gate-seo.py` | `seo.tsv`, `namn.tsv` och `slugs.txt`: längder, suffix, tal mot källan, samma mönster, husmärke i sluggen |
| `gate-sku.py` | längd, form, husmärke, dubbletter och att alla produkter har en rad |
| `gate-form.py` | artikelnummerformen i alla fält, tecken för tecken som rutten (sedan 2026-10-15) |
| `gate-lager.py` | slutsålt och tunt |
| `gate-superlativ.py` | superlativ om sortimentet; `superlativ.txt` kvitterar bara en träff som inte rankar |
| `bygg-axelfacit.py`, `gate-axel.py` | bredd, djup och höjd mot källans totalmått |
| `bygg-media.py` | bygger `nyttolast-media.json` på nytt ur `bilder.tsv`, `bilder-bort.tsv` och `alt.tsv` |

Rätta fynden i filerna, aldrig i grinden. Går ett fynd inte att laga i filerna, till exempel
när källan saknar totalmått, kvitterar du det i `grind-undantag.txt` (`<skript> <skäl>`);
grinden körs och skrivs ut ändå. Varningar stoppar inte bygget, men gå igenom dem en och en:
`UTSKRIVNA RÄKNEORD UTAN TÄCKNING` betyder att "tre fack" inte har något belägg. Ändrar du en
fil efter `hasha.py` kör du båda kommandona igen.

`gate-form.py` och workflowen vägrar ord med formen tre tecken, bindestreck och tre till,
som `360-graders`, `100-pack` och `E27-sockel`. Skriv `360 grader` och `100 st`.

**Rundor där en värd får en färg ur ett utkast** har en grind till som inte ingår i bygget,
eftersom den behöver sammanslagningsfilen: `python3 tools/polish-gates/gate-vardalt-farg.py
<värdrundans katalog> merge_<prefix>.json`. Den fäller en värdbild vars alt-text nämner
givarens färg (`en grå katt` på en beige tunna). Sammanslagningen länkar då inte bilden till
värdens färg, och butiken visar den bara under givarens (N314, 2026-10-25, lärdom 224).
Den fäller också ett nytt värdnamn (`namn.tsv`) som bär värdens eller givarens färg som hela ord:
sammanslagningens plan vägrar då med `namnet_bar_farg`, och plan-förkontrollen kan inte se det nya
namnet, eftersom den läser namnet som det står i Wix före värdrundan (T104, 2026-10-29, matbordet
`9053bc1a`).
Efter sammanslagningen läser `tools/polish-kedja/mkgalleri.py` värdens galleri och val i ett
anrop och räknar vyn per val.
