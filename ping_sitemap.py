"""Cache-warmer for fyndplats.se via Wix sitemap."""

import asyncio
import re
import sys
import time

import aiohttp

SITEMAP_INDEX = "https://www.fyndplats.se/sitemap.xml"
CONCURRENCY = 3
REQUEST_TIMEOUT = 20
MIN_INTERVAL = 0.15
MAX_RETRIES = 3
USER_AGENT = "FyndplatsCacheWarmer/1.0"


async def fetch_text(session, url):
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)) as r:
            if r.status == 200:
                return await r.text()
    except Exception as e:
        print(f"  ! Failed to fetch {url}: {e}", file=sys.stderr)
    return None


async def extract_urls(session, sitemap_url):
    text = await fetch_text(session, sitemap_url)
    if not text:
        return []
    return re.findall(r"<loc>([^<]+)</loc>", text)


async def ping_url(session, url, sem):
    async with sem:
        for attempt in range(MAX_RETRIES):
            start = time.monotonic()
            try:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT), allow_redirects=True) as r:
                    await r.content.read(1024)
                    elapsed = time.monotonic() - start
                    xc = r.headers.get("x-cache", "?")
                    if r.status == 429 and attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(2 ** (attempt + 1))
                        continue
                    await asyncio.sleep(MIN_INTERVAL)
                    return (url, r.status, elapsed, xc)
            except asyncio.TimeoutError:
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(2)
                    continue
                return (url, "TIMEOUT", time.monotonic() - start, "")
            except Exception as e:
                return (url, "ERR:" + type(e).__name__, time.monotonic() - start, "")
        return (url, "MAX_RETRIES", 0.0, "")


async def main():
    headers = {"User-Agent": USER_AGENT}
    connector = aiohttp.TCPConnector(limit=CONCURRENCY * 2, ttl_dns_cache=300)
    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        print("Fetching sitemap index:", SITEMAP_INDEX)
        sub_sitemaps = await extract_urls(session, SITEMAP_INDEX)
        print("Found", len(sub_sitemaps), "sub-sitemaps")

        urls = {"https://www.fyndplats.se/", "https://www.fyndplats.se/cart-page", "https://www.fyndplats.se/shop"}
        sub_results = await asyncio.gather(*[extract_urls(session, sm) for sm in sub_sitemaps])
        for sub in sub_results:
            urls.update(sub)

        url_list = sorted(urls)
        print("Total URLs to warm:", len(url_list))

        sem = asyncio.Semaphore(CONCURRENCY)
        start_run = time.monotonic()
        results = await asyncio.gather(*[ping_url(session, u, sem) for u in url_list])
        run_time = time.monotonic() - start_run

        ok = sum(1 for _, s, _, _ in results if s == 200)
        hits = sum(1 for _, _, _, xc in results if "HIT" in str(xc).upper())
        slow = [r for r in results if isinstance(r[1], int) and r[1] == 200 and r[2] > 1.5]
        failed = [r for r in results if r[1] != 200]
        avg_time = (sum(t for _, s, t, _ in results if s == 200) / ok) if ok else 0.0

        print()
        print("=== SUMMARY ===")
        print(f"Run time: {run_time:.1f}s | URLs: {len(url_list)} | OK: {ok} | HITs: {hits} | Avg TTFB: {avg_time:.2f}s")

        if slow:
            print(f"\nSlow (>1.5s): {len(slow)}")
            for url, status, t, xc in slow[:10]:
                print(f"  {t:.2f}s [{xc}] {url}")

        if failed:
            print(f"\nFailed: {len(failed)}")
            for url, status, t, _ in failed[:10]:
                print(f"  [{status}] {url}")
            return 1
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
