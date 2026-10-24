// Mutationsprov av givarkontrollen i en återläsning som mkkompakt2.py byggt med --givarbilder.
// Användning: node mutationsprov-givare.mjs <ut.js från mkkompakt2.py>
// Den låtsas vara Wix (global `wix.request`), ger varje värd sina egna bilder följda av givarens, och
// ändrar sedan en sak i taget: en alt-text, ett fil-id, en tappad givarbild och bildernas ordning.
// Den oförändrade körningen ska inte ge någon givaravvikelse och varje ändring ska ge en. En kontroll
// som inte kan fälla räknas ändå som gjord, så prova om den fäller efter varje ändring av generatorn.
import fs from 'fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const EXP = JSON.parse(/const EXP = (\{.*?\});\n/s.exec(src)[1]);
const DON = JSON.parse(/const DON = (\{.*?\});\n/s.exec(src)[1]);

function bygg(mut) {
  // mut: {kort, vad}
  const prod = {};
  for (const k of Object.keys(EXP)) {
    const e = EXP[k];
    const d = DON[k];
    let ids = Array.from({ length: e.nb }, (_, i) => `v_${k}_${i}`).concat(d.ids.slice());
    let alts = Array.from({ length: e.nb }, (_, i) => `valt_${i}`).concat(d.alts.slice());
    if (mut && mut.kort === k) {
      if (mut.vad === 'alt') alts[e.nb + 1] = alts[e.nb + 1] + ' x';
      if (mut.vad === 'id') ids[e.nb] = 'b379ce_fel~mv2.jpg';
      if (mut.vad === 'tappad') { ids.pop(); alts.pop(); }
      if (mut.vad === 'ordning') { const t = ids[e.nb]; ids[e.nb] = ids[e.nb + 1]; ids[e.nb + 1] = t; }
    }
    prod[e.pid] = {
      name: 'x', slug: 'x', plainDescription: 'x', revision: 1, visible: true,
      media: { itemsInfo: { items: ids.map((id, i) => ({ id, altText: alts[i] })) } },
      variantsInfo: { variants: [] }, directCategoriesInfo: { categories: [] }, seoData: { tags: [] }, options: [],
    };
  }
  return prod;
}

async function kor(mut) {
  const prod = bygg(mut);
  globalThis.wix = {
    request: async ({ method, url }) => {
      if (url.includes('/categories/v1/categories/query')) return { data: { categories: [], pagingMetadata: { hasNext: false } } };
      const m = /products\/([0-9a-f-]{36})/.exec(url);
      if (m && prod[m[1]]) return { data: { product: prod[m[1]] } };
      return { data: { product: { visible: false, slug: 'givare' } } };
    },
  };
  const fn = eval('(' + src + ')');
  const r = await fn();
  const don = [];
  for (const a of r.avvik || []) for (const f of a.f) if (/givarens/.test(f)) don.push(a.kort + ': ' + f);
  return don;
}

const prov = [
  ['oförändrat', null],
  ['alt ändrad (bänken)', { kort: '7b818c3b', vad: 'alt' }],
  ['fil-id ändrat (matgruppen)', { kort: '591ee60d', vad: 'id' }],
  ['givarbild tappad (växthuset)', { kort: '0d29b1cb', vad: 'tappad' }],
  ['ordning bytt (bänken)', { kort: '7b818c3b', vad: 'ordning' }],
];
for (const [namn, mut] of prov) {
  const r = await kor(mut);
  console.log(namn.padEnd(34), r.length ? 'FÄLLER: ' + r.join(' | ') : 'ingen givaravvikelse');
}
