// Menyn i en riktig webbläsare: dolda paneler vid laddning, rätt panel vid
// hovring, ingen animering vid byte, stängning, konsolfel och skärmbilder.
// Argument: <bas-url> <prefix för skärmbilder>.
const { chromium } = require("playwright");
(async () => {
  const [bas, prefix] = process.argv.slice(2);
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
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const fel = [];
  page.on("console", (m) => { if (m.type() === "error" || /hydrat/i.test(m.text())) fel.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => fel.push("pageerror: " + String(e).slice(0, 200)));
  for (const v of ["/", "/produkt/agilityset-hund-3-delar"]) {
    await page.goto(bas + v, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(1500);
    const synliga = async () => page.$$eval(".meganav-panel", (ps) => ps.filter((p) => p.offsetParent !== null || getComputedStyle(p).display !== "none").map((p) => p.getAttribute("aria-label")));
    const antal = await page.$$eval(".meganav-panel", (ps) => ps.length);
    const subs = await page.$$eval(".meganav-panel a.meganav-sub", (as) => as.length);
    console.log(`${v}: ${antal} paneler, ${subs} underkategorilänkar i DOM, synliga vid laddning: ${JSON.stringify(await synliga())}`);
    const lankar = await page.$$(".meganav-link");
    await lankar[1].hover(); await page.waitForTimeout(350);
    const a1 = await synliga();
    const anim1 = await page.$eval(".meganav-panel:not([hidden])", (p) => getComputedStyle(p).animationName);
    const subsSynliga = await page.$$eval(".meganav-panel:not([hidden]) a.meganav-sub", (as) => as.filter((a) => a.getBoundingClientRect().height > 0).length);
    if (v === "/") await page.screenshot({ path: `${prefix}-hover-mobler.png`, clip: { x: 0, y: 0, width: 1366, height: 560 } });
    await lankar[0].hover(); await page.waitForTimeout(350);
    const a2 = await synliga();
    const navKlass = await page.$eval("nav.meganav", (n) => n.className);
    const anim2 = await page.$eval(".meganav-panel:not([hidden])", (p) => getComputedStyle(p).animationName);
    await page.mouse.move(683, 880); await page.waitForTimeout(500);
    const a3 = await synliga();
    await lankar[2].hover(); await page.waitForTimeout(350);
    const anim3 = await page.$eval(".meganav-panel:not([hidden])", (p) => getComputedStyle(p).animationName);
    await page.mouse.move(683, 880); await page.waitForTimeout(500);
    console.log(`  hovra Möbler: ${JSON.stringify(a1)} (animation ${anim1}, ${subsSynliga} synliga underkategorier)`);
    console.log(`  byt till Hem: ${JSON.stringify(a2)} (nav "${navKlass}", animation ${anim2})`);
    console.log(`  musen bort:   ${JSON.stringify(a3)}`);
    console.log(`  öppna igen:   animation ${anim3}`);
  }
  await page.screenshot({ path: `${prefix}-stangd.png`, clip: { x: 0, y: 0, width: 1366, height: 300 } });
  const mobil = await browser.newPage({ viewport: { width: 412, height: 915 } });
  await mobil.goto(bas + "/", { waitUntil: "networkidle", timeout: 120000 });
  await mobil.waitForTimeout(1000);
  const navSynlig = await mobil.$eval("nav.meganav", (n) => getComputedStyle(n).display);
  await mobil.screenshot({ path: `${prefix}-mobil.png`, clip: { x: 0, y: 0, width: 412, height: 700 } });
  console.log(`mobil: nav.meganav display=${navSynlig}`);
  console.log(fel.length ? `KONSOLFEL (${fel.length}): ${JSON.stringify(fel.slice(0, 6), null, 1)}` : "konsolfel: 0");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
