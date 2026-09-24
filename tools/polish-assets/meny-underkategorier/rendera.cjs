// Räknar /kategori/-länkar i den RENDERADE sidan, utan hovring eller klick —
// ungefär vad Googlebots renderare ser. Argument: bas-url och sökvägar.
const { chromium } = require("playwright");
(async () => {
const [bas, ...vagar] = process.argv.slice(2);
const avd = new Set(["hem-inredning","mobler","tradgard-utemobler","husdjur","sport-fritid","barn-familj","kok-husgerad","skonhet-halsa","elektronik-tillbehor","mode-accessoarer"]);
// Chromium har ingen flagga för en CA-fil. Proxyns CA litas på genom sin
// publika nyckel (samma CA som /root/.ccr/ca-bundle.crt), inget annat.
const spki = require("child_process").execSync(
  "openssl x509 -in /root/.ccr/agent-proxy-ca.crt -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64"
).toString().trim();
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  proxy: { server: process.env.HTTPS_PROXY },
  args: [`--ignore-certificate-errors-spki-list=${spki}`],
});
for (const [namn, vp] of [["mobil", { width: 412, height: 915 }], ["dator", { width: 1366, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp, userAgent: "Mozilla/5.0 (compatible; rendertest)" });
  const fel = [];
  page.on("console", (m) => { if (m.type() === "error") fel.push(m.text().slice(0, 160)); });
  for (const v of vagar) {
    await page.goto(bas + v, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1500);
    const hrefs = await page.$$eval("a[href^='/kategori/']", (as) => as.map((a) => a.getAttribute("href")));
    const unika = new Set(hrefs.map((h) => h.split("?")[0].slice("/kategori/".length)));
    const under = [...unika].filter((s) => !avd.has(s));
    console.log(`${namn} ${v}: ${hrefs.length} kategorilänkar, ${unika.size} unika, varav ${under.length} underkategorier${under.length && under.length < 8 ? " (" + under.join(", ") + ")" : ""}`);
  }
  if (fel.length) console.log(`  konsolfel (${namn}):`, fel.slice(0, 5));
  await page.close();
}
await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
