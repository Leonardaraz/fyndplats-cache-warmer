"""Cache-warmer for fyndplats.se via the Wix sitemap.

Fetches the sitemap, recursively expands any nested sitemap indexes, then
pings every page URL to keep it warm in the edge cache (Fastly).

All HTTP — including the sub-sitemap fetches — goes through ONE shared
semaphore with 429/timeout backoff. This is the important fix vs. the old
version, which fired every sub-sitemap fetch concurrently; once the site's
sitemap fanned out into hundreds of sub-sitemaps that burst got rate-limited
and returned 0 URLs, so the warmer silently warmed nothing.

The script now also exits non-zero when it can't collect any URLs from the
sitemap, so a future breakage turns the GitHub Action red instead of green.
"""

import asyncio
import re
import sys
import time

import aiohttp

SITEMAP_INDEX = "https://www.fyndplats.se/sitemap.xml"
# Landing pages worth keeping warm even if absent from the sitemap.
SEED_URLS = ["https://www.fyndplats.se/"]
CONCURRENCY = 3
REQUEST_TIMEOUT = 20
MIN_INTERVAL = 0.15
MAX_RETRIES = 3
MAX_SITEMAP_DEPTH = 5
USER_AGENT = "FyndplatsCacheWarmer/1.0"

LOC_RE = re.compile(r"<loc>\s*([^<]+?)\s*</loc>", re.I)


async def http_get_text(session, url, sem):
    """Throttled GET that returns (status, text|None). Retries on 429/timeout."""
    async with sem:
        for attempt in range(MAX_RETRIES):
            try:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
                    allow_redirects=True,
                ) as r:
                    if r.status == 429 and attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(2 ** (attempt + 1))
                        continue
                    text = await r.text() if r.status == 200 else None
                    await asyncio.sleep(MIN_INTERVAL)
                    return r.status, text
            except asyncio.TimeoutError:
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(2)
                    continue
                return "TIMEOUT", None
            except Exception as e:
                return "ERR:" + type(e).__name__, None
        return "MAX_RETRIES", None


async def collect_page_urls(session, sem):
    """Walk the sitemap tree (breadth-first, throttled) and return page URLs."""
    pages = set()
    seen = set()
    queue = [(SITEMAP_INDEX, 0)]
    sitemaps_fetched = 0
    sitemaps_failed = 0
    while queue:
        level = [(u, d) for (u, d) in queue if u not in seen]
        queue = []
        for u, _ in level:
            seen.add(u)
        results = await asyncio.gather(*[http_get_text(session, u, sem) for (u, _) in level])
        for (u, depth), (status, text) in zip(level, results):
            sitemaps_fetched += 1
            if not text:
                sitemaps_failed += 1
                print(f"  ! sitemap fetch [{status}]: {u}", file=sys.stderr)
                continue
            locs = LOC_RE.findall(text)
            if "<sitemapindex" in text.lower() and depth < MAX_SITEMAP_DEPTH:
                # A sitemap index -> its <loc>s are more sitemaps; recurse.
                for loc in locs:
                    if loc not in seen:
                        queue.append((loc, depth + 1))
            else:
                # A urlset (or depth cap reached) -> these are page URLs.
                pages.update(locs)
    print(f"Sitemaps fetched: {sitemaps_fetched} (failed: {sitemaps_failed})")
    return pages


async def ping_url(session, url, sem):
    async with sem:
        start = time.monotonic()
        for attempt in range(MAX_RETRIES):
            try:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
                    allow_redirects=True,
                ) as r:
                    await r.content.read(1024)
                    if r.status == 429 and attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(2 ** (attempt + 1))
                        continue
                    await asyncio.sleep(MIN_INTERVAL)
                    return (url, r.status, time.monotonic() - start, r.headers.get("x-cache", "?"))
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
        sem = asyncio.Semaphore(CONCURRENCY)
        print("Fetching sitemap:", SITEMAP_INDEX)
        from_sitemap = await collect_page_urls(session, sem)
        print("URLs found in sitemap:", len(from_sitemap))

        if not from_sitemap:
            print("\n=== SUMMARY ===")
            print("ERROR: collected 0 URLs from the sitemap — nothing to warm.")
            print("The sitemap is unreachable or its structure changed; check SITEMAP_INDEX.")
            return 1

        urls = from_sitemap | set(SEED_URLS)
        url_list = sorted(urls)
        print("Total URLs to warm:", len(url_list))

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
            for url, status, t, _ in failed[:20]:
                print(f"  [{status}] {url}")

        # Turn the Action red if essentially nothing succeeded (was silently green before).
        if ok == 0:
            print("\nERROR: 0 URLs returned 200 — warming failed.")
            return 1
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
