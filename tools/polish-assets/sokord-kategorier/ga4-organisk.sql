-- Organisk trafik ur GA4-exporten i BigQuery (projekt fyndplats).
-- Kör med execute_sql_readonly, projectId "fyndplats". Hela exporten är några
-- tiotal MB, så en körning kostar i praktiken ingenting.
--
-- "Organisk" = kanalen Organic Search, PLUS besök utan samtycke som kommer från
-- en sökmotor utan annonsparametrar. Sedan vecka 37 (2026-09-07) exporteras
-- även besök utan samtycke, och de saknar kanal: ett Google-besök syns då bara
-- som page_referrer google.com. Före vecka 37 finns bara besök med samtycke,
-- så serien har ett brott där. Jämför därför veckosnitt, och helst perioder
-- som båda ligger efter vecka 37.

-- 1. Per vecka och typ av landningssida. "kategori" är måttet för sökordsrundorna.
WITH s AS (
  SELECT
    PARSE_DATE('%Y%m%d', event_date) AS d,
    privacy_info.analytics_storage AS samtycke,
    session_traffic_source_last_click.cross_channel_campaign.default_channel_group AS kanal,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS url,
    NET.REG_DOMAIN((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer')) AS ref
  FROM `fyndplats.analytics_361016118.events_*`
  WHERE event_name = 'session_start'
),
k AS (
  SELECT *,
    (kanal = 'Organic Search'
      OR (kanal IS NULL AND samtycke = 'No'
          AND ref IN ('google.com', 'google.se', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'ecosia.org')
          AND NOT REGEXP_CONTAINS(IFNULL(url, ''), r'[?&](gclid|gad_source|gbraid|wbraid|dclid)='))) AS organisk,
    CASE
      WHEN REGEXP_CONTAINS(url, r'^https?://[^/]+/kategori/') THEN 'kategori'
      WHEN REGEXP_CONTAINS(url, r'^https?://[^/]+/produkt/') THEN 'produkt'
      WHEN REGEXP_CONTAINS(url, r'^https?://[^/]+/(blogg|basta-i-test|kopguider)') THEN 'guide'
      WHEN REGEXP_CONTAINS(url, r'^https?://[^/]+/?([?#].*)?$') THEN 'start'
      ELSE 'annat' END AS sidtyp
  FROM s
)
SELECT
  FORMAT_DATE('%G-W%V', d) AS vecka,
  COUNT(DISTINCT d) AS dagar,
  COUNTIF(kanal = 'Organic Search') AS ga4_kanal,
  COUNTIF(organisk AND kanal IS NULL) AS utan_samtycke,
  COUNTIF(organisk) AS organisk_total,
  COUNTIF(organisk AND sidtyp = 'kategori') AS kategori,
  COUNTIF(organisk AND sidtyp = 'produkt') AS produkt,
  COUNTIF(organisk AND sidtyp = 'guide') AS guide,
  COUNTIF(organisk AND sidtyp = 'start') AS start,
  COUNTIF(organisk AND sidtyp = 'annat') AS annat,
  COUNTIF(kanal = 'AI Assistant') AS ai_assistent
FROM k
GROUP BY vecka
ORDER BY vecka;

-- 2. Organiska landningar per kategorisida, före och efter #647 (live 2026-09-25).
--    Jämför per vecka: dela med antalet veckor i respektive period.
WITH s AS (
  SELECT
    event_date,
    privacy_info.analytics_storage AS samtycke,
    session_traffic_source_last_click.cross_channel_campaign.default_channel_group AS kanal,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS url,
    NET.REG_DOMAIN((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer')) AS ref
  FROM `fyndplats.analytics_361016118.events_*`
  WHERE event_name = 'session_start'
)
SELECT
  REGEXP_EXTRACT(url, r'/kategori/([^/?#]+)') AS kategori,
  COUNTIF(event_date <= '20260924') AS fore,
  COUNTIF(event_date >= '20260925') AS efter
FROM s
WHERE REGEXP_CONTAINS(url, r'^https?://[^/]+/kategori/')
  AND (kanal = 'Organic Search'
       OR (kanal IS NULL AND samtycke = 'No'
           AND ref IN ('google.com', 'google.se', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'ecosia.org')
           AND NOT REGEXP_CONTAINS(IFNULL(url, ''), r'[?&](gclid|gad_source|gbraid|wbraid|dclid)=')))
GROUP BY kategori
ORDER BY efter DESC, fore DESC;
