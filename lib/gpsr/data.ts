// lib/gpsr/data.ts
//
// Den incheckade säkerhetsdatan för Aosom-produkterna (aosom-data.json),
// nycklad på Aosoms artikelnummer. Se lib/gpsr/aosom.ts för varför den finns
// och scripts/gpsr-bygg.ts för hur den byggs.

import raw from "./aosom-data.json";
import type { GpsrDataFil, GpsrDataPost } from "./aosom";

const DATA = raw as GpsrDataFil;

export function gpsrForSku(sku: string): GpsrDataPost | null {
  return Object.prototype.hasOwnProperty.call(DATA.poster, sku) ? DATA.poster[sku] : null;
}

export function gpsrGenererad(): string {
  return DATA.genererad;
}
