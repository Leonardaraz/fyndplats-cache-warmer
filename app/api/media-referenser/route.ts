import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { byggManifest, HOPPA_OVER, KALLOR, LASBARA, underGolv } from "../../../lib/media-referenser";

// GET /api/media-referenser
//
// Varje Wix-mediafil som butiken pekar på utanför produkterna: blogginläggen,
// adresserna i koden (sidornas delningsbild m.m.), reservkatalogen och data/.
// Motorns bildstädning läser listan och raderar aldrig en fil som står i den.
// Se lib/media-referenser.ts för varför.
//
// BYGGS VID BYGGET (force-static). Källfilerna finns i bygget men inte i en
// serverlös funktion, så en uträkning vid anrop hade blivit tom. Ligger listan
// under golvet svarar rutten 503, och motorn avbryter då städningen i stället
// för att lita på en halv lista.
export const dynamic = "force-static";

const ROT = process.cwd();

async function lasRekursivt(vag: string, ut: string[]): Promise<void> {
  const full = join(ROT, vag);
  const info = await stat(full).catch(() => null);
  if (!info) return;
  if (info.isFile()) {
    if (LASBARA.test(vag) && !HOPPA_OVER.test(vag)) ut.push(vag);
    return;
  }
  if (HOPPA_OVER.test(`${vag}/`)) return;
  for (const namn of await readdir(full)) await lasRekursivt(`${vag}/${namn}`, ut);
}

export async function GET() {
  const lasta: { kalla: string; text: string }[] = [];
  for (const { namn, vag } of KALLOR) {
    const filer: string[] = [];
    await lasRekursivt(vag, filer);
    for (const f of filer) lasta.push({ kalla: namn, text: await readFile(join(ROT, f), "utf8") });
  }
  const manifest = byggManifest(lasta);
  const fel = underGolv(manifest);
  if (fel) {
    return NextResponse.json({ error: `listan är ofullständig: ${fel}`, perKalla: manifest.perKalla }, { status: 503 });
  }
  return NextResponse.json(manifest);
}
