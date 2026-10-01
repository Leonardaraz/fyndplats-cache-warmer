// lib/wix-crop.ts
// Beskärning plus skalning i en och samma Wix-adress, och hur den globala
// bildloadern skalar en sådan adress. Rena funktioner utan JSON-import, så de
// kan testas i node:test (se wix-media-key.ts för varför).
//
// VARFÖR KEDJAN. Wix CDN tar /v1/crop/…/fill/…: först klipps rektangeln ur
// originalet, sedan skalas den till utdatastorleken. Utan fill-delen blev
// utdata lika stor som rektangeln, så en 38 px miniatyr hämtade en 1512 px
// webp på ~300 KB. Med fill-delen blir samma miniatyr ~6 KB (uppmätt
// 2026-10-01 på b379ce_f18ccf61…).

export type CropRekt = { x: number; y: number; w: number; h: number };

/** Klipp `r` ur originalet och skala resultatet till `bredd × hojd`. */
export function cropFillUrl(nyckel: string, r: CropRekt, bredd: number, hojd: number, kvalitet = 72): string {
  return (
    `https://static.wixstatic.com/media/${nyckel}` +
    `/v1/crop/x_${r.x},y_${r.y},w_${r.w},h_${r.h}` +
    `/fill/w_${bredd},h_${hojd},al_c,q_${kvalitet}/file.webp`
  );
}

/**
 * Transformdelen av en Wix-adress (allt från "/v1/") skalad till `bredd`, med
 * höjden i samma proportion. Returnerar null när adressen ska lämnas orörd.
 *
 * - fill/fit: första w_/h_ skalas.
 * - crop följt av fill: bara fill-delen skalas. Crop-delens w_/h_ är en
 *   rektangel i originalpixlar, inte en utdatastorlek, och får aldrig röras.
 * - crop utan fill: orörd (äldre form; rektangeln är hela utdatan).
 */
export function skalaWixSvans(svans: string, bredd: number): string | null {
  if (svans.startsWith("/v1/crop/")) {
    const i = svans.indexOf("/fill/");
    if (i === -1) return null;
    const skalad = skalaForsta(svans.slice(i), bredd);
    return skalad === null ? null : svans.slice(0, i) + skalad;
  }
  return skalaForsta(svans, bredd);
}

function skalaForsta(del: string, bredd: number): string | null {
  const wm = del.match(/w_(\d+)/);
  const hm = del.match(/h_(\d+)/);
  if (!wm || !hm) return null;
  const ow = Number(wm[1]);
  const oh = Number(hm[1]);
  const nyH = ow > 0 ? Math.round((bredd * oh) / ow) : bredd;
  return del.replace(/w_\d+/, `w_${bredd}`).replace(/h_\d+/, `h_${nyH}`);
}
