-- TimescaleDB Tables for Metrics
-- Database: metrics

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ======================
-- METRICS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS metrics (
    ts TIMESTAMPTZ NOT NULL,
    org_id TEXT NOT NULL,
    metric TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    labels JSONB DEFAULT '{}',
    service TEXT,
    host TEXT,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable (time-series optimized)
SELECT create_hypertable('metrics', 'ts', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_metrics_org_ts ON metrics (org_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_metric ON metrics (metric, ts DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_service ON metrics (service, ts DESC) WHERE service IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_labels ON metrics USING GIN (labels);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_metrics_org_metric_ts ON metrics (org_id, metric, ts DESC);

-- ======================
-- CONTINUOUS AGGREGATES (Pre-computed rollups)
-- ======================

-- 1-minute rollups
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_1m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', ts) AS bucket,
    org_id,
    metric,
    labels,
    service,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS sample_count,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99
FROM metrics
GROUP BY bucket, org_id, metric, labels, service
WITH NO DATA;

-- 5-minute rollups
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_5m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('5 minutes', ts) AS bucket,
    org_id,
    metric,
    labels,
    service,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS sample_count,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99
FROM metrics
GROUP BY bucket, org_id, metric, labels, service
WITH NO DATA;

-- 1-hour rollups
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_1h
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', ts) AS bucket,
    org_id,
    metric,
    labels,
    service,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS sample_count,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99
FROM metrics
GROUP BY bucket, org_id, metric, labels, service
WITH NO DATA;

-- ======================
-- REFRESH POLICIES
-- ======================

-- Refresh 1m aggregates every 30 seconds
SELECT add_continuous_aggregate_policy('metrics_1m',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '10 seconds',
    schedule_interval => INTERVAL '30 seconds',
    if_not_exists => TRUE
);

-- Refresh 5m aggregates every 2 minutes
SELECT add_continuous_aggregate_policy('metrics_5m',
    start_offset => INTERVAL '6 hours',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '2 minutes',
    if_not_exists => TRUE
);

-- Refresh 1h aggregates every 10 minutes
SELECT add_continuous_aggregate_policy('metrics_1h',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '10 minutes',
    if_not_exists => TRUE
);

-- ======================
-- RETENTION POLICIES
-- ======================

-- Keep raw metrics for 30 days
SELECT add_retention_policy('metrics', INTERVAL '30 days', if_not_exists => TRUE);

-- Keep 1m rollups for 7 days
SELECT add_retention_policy('metrics_1m', INTERVAL '7 days', if_not_exists => TRUE);

-- Keep 5m rollups for 30 days
SELECT add_retention_policy('metrics_5m', INTERVAL '30 days', if_not_exists => TRUE);

-- Keep 1h rollups for 1 year
SELECT add_retention_policy('metrics_1h', INTERVAL '365 days', if_not_exists => TRUE);

-- ======================
-- COMPRESSION POLICIES
-- ======================

-- Compress chunks older than 7 days
SELECT add_compression_policy('metrics', INTERVAL '7 days', if_not_exists => TRUE);

-- Enable compression on the hypertable
ALTER TABLE metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'org_id, metric, service',
    timescaledb.compress_orderby = 'ts DESC'
);

-- ======================
-- HELPER VIEWS
-- ======================

-- Latest metric values (useful for dashboards)
CREATE OR REPLACE VIEW metrics_latest AS
SELECT DISTINCT ON (org_id, metric, labels, service)
    ts,
    org_id,
    metric,
    value,
    labels,
    service,
    host
FROM metrics
ORDER BY org_id, metric, labels, service, ts DESC;

-- Metric catalog (all unique metrics per org)
CREATE OR REPLACE VIEW metrics_catalog AS
SELECT DISTINCT
    org_id,
    metric,
    service,
    COUNT(*) OVER (PARTITION BY org_id, metric) AS sample_count,
    MAX(ts) OVER (PARTITION BY org_id, metric) AS last_seen
FROM metrics;

-- ======================
-- FUNCTIONS
-- ======================

-- Function to get rate of change
CREATE OR REPLACE FUNCTION rate(
    p_org_id TEXT,
    p_metric TEXT,
    p_start TIMESTAMPTZ,
    p_end TIMESTAMPTZ,
    p_interval INTERVAL DEFAULT '1 minute'
)
RETURNS TABLE (
    bucket TIMESTAMPTZ,
    rate DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        time_bucket(p_interval, ts) AS bucket,
        (MAX(value) - MIN(value)) / EXTRACT(EPOCH FROM p_interval) AS rate
    FROM metrics
    WHERE org_id = p_org_id
        AND metric = p_metric
        AND ts >= p_start
        AND ts <= p_end
    GROUP BY bucket
    ORDER BY bucket;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate increase
CREATE OR REPLACE FUNCTION increase(
    p_org_id TEXT,
    p_metric TEXT,
    p_start TIMESTAMPTZ,
    p_end TIMESTAMPTZ,
    p_interval INTERVAL DEFAULT '1 minute'
)
RETURNS TABLE (
    bucket TIMESTAMPTZ,
    increase DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        time_bucket(p_interval, ts) AS bucket,
        MAX(value) - MIN(value) AS increase
    FROM metrics
    WHERE org_id = p_org_id
        AND metric = p_metric
        AND ts >= p_start
        AND ts <= p_end
    GROUP BY bucket
    ORDER BY bucket;
END;
$$ LANGUAGE plpgsql;

-- ======================
-- GRANTS (Optional - for read-only users)
-- ======================

-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
-- GRANT SELECT ON metrics, metrics_1m, metrics_5m, metrics_1h TO readonly_user;





