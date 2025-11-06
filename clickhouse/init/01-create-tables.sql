-- ClickHouse Tables for Observability Platform
-- Database: observability

-- ======================
-- LOGS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS observability.logs (
    ts DateTime64(3) CODEC(Delta, ZSTD),
    org_id String CODEC(ZSTD),
    service LowCardinality(String),
    level LowCardinality(String),
    message String CODEC(ZSTD),
    attrs String CODEC(ZSTD),  -- JSON attributes
    trace_id String CODEC(ZSTD),
    span_id String CODEC(ZSTD),
    host LowCardinality(String),
    ip String CODEC(ZSTD),
    geo_country LowCardinality(String),
    geo_city LowCardinality(String),
    ua String CODEC(ZSTD),  -- User agent
    pii_masked Bool DEFAULT false,
    ingest_id String CODEC(ZSTD),  -- Deduplication
    ingested_at DateTime64(3) DEFAULT now64(3),
    
    INDEX idx_org_id org_id TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_service service TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_level level TYPE set(10) GRANULARITY 1,
    INDEX idx_trace trace_id TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_message message TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(ts)
ORDER BY (org_id, ts, service)
TTL ts + INTERVAL 90 DAY  -- 90-day retention
SETTINGS index_granularity = 8192;

-- ======================
-- TRACES/SPANS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS observability.spans (
    ts DateTime64(3) CODEC(Delta, ZSTD),
    org_id String CODEC(ZSTD),
    trace_id String CODEC(ZSTD),
    span_id String CODEC(ZSTD),
    parent_span_id String CODEC(ZSTD),
    service LowCardinality(String),
    operation String CODEC(ZSTD),
    kind LowCardinality(String),  -- client, server, producer, consumer, internal
    status LowCardinality(String),  -- ok, error, unset
    duration_ms UInt32 CODEC(Delta, ZSTD),
    attrs String CODEC(ZSTD),  -- JSON attributes
    resource String CODEC(ZSTD),  -- Resource attributes (service.name, etc.)
    events String CODEC(ZSTD),  -- Span events as JSON array
    links String CODEC(ZSTD),  -- Span links as JSON array
    ingested_at DateTime64(3) DEFAULT now64(3),
    
    INDEX idx_org_id org_id TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_trace trace_id TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_service service TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_operation operation TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(ts)
ORDER BY (org_id, trace_id, ts, span_id)
TTL ts + INTERVAL 30 DAY  -- 30-day retention for traces
SETTINGS index_granularity = 8192;

-- ======================
-- RUM (Real User Monitoring) EVENTS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS observability.rum_events (
    ts DateTime64(3) CODEC(Delta, ZSTD),
    org_id String CODEC(ZSTD),
    session_id String CODEC(ZSTD),
    user_id String CODEC(ZSTD),
    event_type LowCardinality(String),  -- pageview, click, error, performance
    page_url String CODEC(ZSTD),
    referrer String CODEC(ZSTD),
    user_agent String CODEC(ZSTD),
    ip String CODEC(ZSTD),
    geo_country LowCardinality(String),
    geo_city LowCardinality(String),
    device_type LowCardinality(String),  -- mobile, desktop, tablet
    browser LowCardinality(String),
    browser_version String CODEC(ZSTD),
    os LowCardinality(String),
    os_version String CODEC(ZSTD),
    performance_metrics String CODEC(ZSTD),  -- JSON: FCP, LCP, FID, CLS, etc.
    error_message String CODEC(ZSTD),
    error_stack String CODEC(ZSTD),
    custom_attrs String CODEC(ZSTD),  -- JSON
    ingested_at DateTime64(3) DEFAULT now64(3),
    
    INDEX idx_org_id org_id TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_session session_id TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_event_type event_type TYPE set(20) GRANULARITY 1,
    INDEX idx_page_url page_url TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(ts)
ORDER BY (org_id, ts, session_id)
TTL ts + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- ======================
-- MATERIALIZED VIEWS FOR AGGREGATIONS
-- ======================

-- Log counts by service/level (for dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS observability.logs_agg_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (org_id, hour, service, level)
AS SELECT
    toStartOfHour(ts) AS hour,
    org_id,
    service,
    level,
    count() AS log_count,
    sum(length(message)) AS total_bytes
FROM observability.logs
GROUP BY hour, org_id, service, level;

-- Trace statistics (p50, p95, p99 latencies)
CREATE MATERIALIZED VIEW IF NOT EXISTS observability.spans_agg_hourly
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (org_id, hour, service, operation)
AS SELECT
    toStartOfHour(ts) AS hour,
    org_id,
    service,
    operation,
    count() AS span_count,
    quantilesState(0.5, 0.95, 0.99)(duration_ms) AS latency_quantiles,
    sumIf(1, status = 'error') AS error_count
FROM observability.spans
GROUP BY hour, org_id, service, operation;

-- RUM page performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS observability.rum_performance_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (org_id, hour, page_url, device_type)
AS SELECT
    toStartOfHour(ts) AS hour,
    org_id,
    page_url,
    device_type,
    browser,
    count() AS pageview_count,
    countIf(event_type = 'error') AS error_count
FROM observability.rum_events
WHERE event_type IN ('pageview', 'error')
GROUP BY hour, org_id, page_url, device_type, browser;

-- ======================
-- HELPER FUNCTIONS
-- ======================

-- Create a dictionary for fast org_id lookups (optional, for later)
-- This can be populated from PostgreSQL for org metadata



