async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const PLAN = {"ea013fde": {"id": "ea013fde-ff23-4cad-8d8b-192221007be1", "namn": "Sparkcykel barn 135 cm, svart – 16 tum fram och 12 tum bak", "slug": "sparkcykel-barn-135-cm-16-tum-svart", "titel": "Sparkcykel barn 135 cm, svart – 16 tum och V-bromsar", "meta": "Svart sparkcykel 135 cm med luftdäck 16 tum fram och 12 tum bak, V-broms på båda hjulen och styre 92–100 cm. Maxlast 100 kg, 9,8 kg.", "sokord": ["sparkcykel barn", "sparkcykel barn 16 tum", "sparkcykel svart"], "sku": "FP-sparkcykel-135-cm-svart", "html": "<p>En sparkcykel för barn som har vuxit ur de små hjulen. Framhjulet är 16 tum, drygt 40 cm, och bakhjulet 12 tum — båda med luftdäck på ekerfälg i silver. Styret ställs mellan 92 och 100 cm, det sitter V-broms på båda hjulen, och ramen är svart med ett randband i guld och vitt.</p><p><strong>Egenskaper</strong></p><ul><li>Luftdäck på ekerfälg i silver: 16 tum fram, drygt 40 cm, och 12 tum bak</li><li>V-broms på både fram- och bakhjulet, båda med handtag på styret</li><li>Styret ställs mellan 92 och 100 cm och följer med när barnet växer</li><li>Stödben under ramen, så att den parkeras stående i stället för att läggas ner</li><li>Halkmönstrad fotplatta, 36 × 12 cm och 11 cm över marken</li><li>Stålram med kromat styre, byggd för upp till 100 kg</li><li>Väger 9,8 kg</li></ul><h2>Tekniska specifikationer</h2><ul><li><strong>Mått:</strong> 135 × 58 × 92–100 cm (L × B × styrhöjd)</li><li><strong>Hjul:</strong> 16 tum fram och 12 tum bak, luftdäck på ekerfälg i silver</li><li><strong>Bromsar:</strong> V-broms fram och bak, manövrerade från styret</li><li><strong>Fotplatta:</strong> 36 × 12 cm, 11 cm över marken</li><li><strong>Styrhöjd:</strong> 92–100 cm, justerbar</li><li><strong>Ram:</strong> stål, kromat styre</li><li><strong>Maxlast:</strong> 100 kg</li><li><strong>Rekommenderad ålder:</strong> från 5 år</li><li><strong>Vikt:</strong> 9,8 kg</li><li><strong>Paketmått:</strong> 98 × 16 × 52 cm</li><li><strong>Färg:</strong> svart ram med randband i guld och vitt</li><li><strong>Montering:</strong> krävs, och ska göras av en vuxen</li></ul><h2>Samma modell och närmaste släkting</h2><p>Samma sparkcykel finns i <a href=\"https://www.fyndplats.se/produkt/sparkcykel-barn-rosa-16-tum-luftdack\">rosa</a>. Vill ni ha en större modell med två lika stora 16-tumshjul finns <a href=\"https://www.fyndplats.se/produkt/sparkcykel-barn-143-cm-16-tum-svart\">143 cm-versionen i svart</a> — den är åtta centimeter längre, väger 10,6 kg och har samma styrhöjd.</p><h2>Användning och skötsel</h2><p>Däcken är luftfyllda och ska hållas hårda. Ett mjukt däck rullar trögt, styr vagt och riskerar att gå av fälgen i en sväng, så känn efter med tummen med jämna mellanrum och pumpa med en vanlig cykelpump.</p><p>Kläm på båda bromshandtagen före första turen och sedan då och då. Vajrar töjer sig de första veckorna, och den vajer som töjt sig märks först när bromsen behövs — justera med skruven vid handtaget.</p><p>Dra åt skruvarna i styrstammen och på fotplattan efter första veckans åkande och sedan någon gång per säsong. Det är vibrationerna från underlaget som lossar dem, inte slarv vid monteringen.</p><p>Torka av ramen efter regn och olja vajrarna någon gång per säsong. Stål rostar där lacken slagits av, och den skadan kommer oftast vid stödbenet. Ställ den inomhus över vintern.</p><p>Hjälm och skydd för knän, armbågar och handleder är ett gott råd på varje tur, och särskilt de första månaderna när barnet lär sig bromsa. På vått underlag tar bromsarna längre tid på sig.</p><h2>Vanliga frågor</h2><p><strong>Vad är en V-broms?</strong></p><p>Det är samma bromstyp som sitter på de flesta cyklar: två armar som klämmer på fälgen när du drar i handtaget. Här finns en på varje hjul, och båda sköts med handtag på styret — det är alltså ingen fotbroms att trampa på över bakhjulet.</p><p><strong>Varför är hjulen olika stora?</strong></p><p>Framhjulet på 16 tum rullar över kanter och gropar som ett litet hjul hakar upp sig i. Bakhjulet är 12 tum, och det är just därför fotplattan kan ligga så lågt som 11 cm över marken. Låg fot betyder kortare sparktag och mindre jobb för benet.</p><p><strong>Från vilken ålder passar den?</strong></p><p>Den är byggd från 5 år, men mät mot barnet i stället för mot åldern. Styret går inte lägre än 92 cm, så barnet ska nå det med lätt böjda armar när det står på fotplattan.</p><p><strong>Behöver däcken pumpas?</strong></p><p>Ja. Det är riktiga luftdäck på ekerfälg, precis som på en cykel, och de tappar tryck av att stå still. Kontrollera trycket inför säsongen och någon gång under den.</p><p><strong>Måste den monteras?</strong></p><p>Ja, och en vuxen ska göra det. Styre och framhjul sätts på och dras åt, och bromsarna justeras. Åk inte förrän allt sitter fast.</p>", "facitLangd": 3445, "facitHash": 346245487}};

  const P = 1000000007;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const hasha = (t) => { let h = 0; for (const ch of t) h = (h * 31 + ch.codePointAt(0)) % P; return h; };

  const ut = [];
  for (const [pid, p] of Object.entries(PLAN)) {
    // ☠️ GRINDEN: facit räknas på det som faktiskt ska skickas, INTE på det
    // som kommer tillbaka. Stämmer det inte skrivs ingenting för produkten.
    const s = synlig(p.html);
    if (s.length !== p.facitLangd || hasha(s) !== p.facitHash) {
      ut.push({ pid, skrivet: false, fel: "FACIT STÄMMER INTE",
                langd: s.length, vantad: p.facitLangd,
                hash: hasha(s), vantadHash: p.facitHash });
      continue;
    }

    // Färsk revision omedelbart före PATCH
    const g = await wix.request({ method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + p.id,
      siteId: SITE });
    const fore = (g.data || g).product || (g.data || g);

    const body = { product: {
      id: p.id,
      revision: fore.revision,
      name: p.namn,
      slug: p.slug,
      brand: null,
      plainDescription: p.html,
      seoData: {
        tags: [
          { type: "title", children: p.titel, custom: false, disabled: false },
          { type: "meta", props: { name: "description", content: p.meta },
            children: "", custom: true, disabled: false }
        ],
        settings: {
          preventAutoRedirect: false,
          keywords: p.sokord.map((t, i) => ({ term: t, isMain: i === 0, origin: "USER" }))
        }
      }
    } };

    const r = await wix.request({ method: "PATCH",
      url: "https://www.wixapis.com/stores/v3/products/" + p.id,
      siteId: SITE, body });
    const efter = (r.data || r).product || (r.data || r);
    ut.push({ pid, skrivet: true, revision: efter.revision,
              namn: efter.name, slug: efter.slug,
              namnLangd: (efter.name || "").length,
              synlig: fore.visible });
  }
  return ut;
}