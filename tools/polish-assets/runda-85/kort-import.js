async () => {
  const PLAN = [{"kort": "17fb1869", "url": "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/5b7246af26f763980c4c5025a48aff2b41e1859f/tools/polish-assets/runda-85/kort/17fb1869.jpg", "namn": "fyndplats-kort-17fb1869.jpg", "byte": 200773}, {"kort": "b10b80ee", "url": "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/5b7246af26f763980c4c5025a48aff2b41e1859f/tools/polish-assets/runda-85/kort/b10b80ee.jpg", "namn": "fyndplats-kort-b10b80ee.jpg", "byte": 205499}, {"kort": "10c47f8e", "url": "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/5b7246af26f763980c4c5025a48aff2b41e1859f/tools/polish-assets/runda-85/kort/10c47f8e.jpg", "namn": "fyndplats-kort-10c47f8e.jpg", "byte": 191424}, {"kort": "213be879", "url": "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/5b7246af26f763980c4c5025a48aff2b41e1859f/tools/polish-assets/runda-85/kort/213be879.jpg", "namn": "fyndplats-kort-213be879.jpg", "byte": 182291}, {"kort": "a00882ed", "url": "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/5b7246af26f763980c4c5025a48aff2b41e1859f/tools/polish-assets/runda-85/kort/a00882ed.jpg", "namn": "fyndplats-kort-a00882ed.jpg", "byte": 178502}, {"kort": "ec672f4d", "url": "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/5b7246af26f763980c4c5025a48aff2b41e1859f/tools/polish-assets/runda-85/kort/ec672f4d.jpg", "namn": "fyndplats-kort-ec672f4d.jpg", "byte": 197680}];
  const ut = {};
  for (const p of PLAN) {
    const r = await wix.request({ scope: "site", method: "POST",
      url: "https://www.wixapis.com/site-media/v1/files/import",
      body: { url: p.url, displayName: p.namn,
              mimeType: "image/jpeg", mediaType: "IMAGE" } });
    const f = r.data.file;
    // ☠️ sizeInBytes ar kvittot: samma tal som filen i grenen = Wix har HAMTAT den,
    //    inte bara tagit emot uppdraget. Ett svar utan fel ar inget kvitto.
    ut[p.kort] = { id: f.id, byte: f.sizeInBytes, vantat: p.byte,
                   stammer: Number(f.sizeInBytes) === p.byte,
                   url: f.url };
  }
  return ut;
}