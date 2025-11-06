import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

export interface MetricPoint {
  ts: Date | string;
  org_id: string;
  metric: string;
  value: number;
  labels?: Record<string, any>;
  service?: string;
  host?: string;
}

export interface MetricQueryResult {
  bucket: Date;
  value: number;
}

@Injectable()
export class TimescaleService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get('TIMESCALE_HOST', 'localhost'),
      port: this.configService.get('TIMESCALE_PORT', 5433),
      database: this.configService.get('TIMESCALE_DATABASE', 'metrics'),
      user: this.configService.get('TIMESCALE_USER', 'aegis'),
      password: this.configService.get('TIMESCALE_PASSWORD', 'aegis_ts_pass'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ TimescaleDB connected successfully');
    } catch (error: any) {
      console.error('❌ TimescaleDB connection failed:', (error instanceof Error) ? error.message : String(error));
    }
  }

  async onModuleDestroy() {
    try {
      if (this.pool) {
        await this.pool.end();
      }
    } catch (error: any) {
      // Ignore disconnect errors
    }
  }

  /**
   * Insert metrics into Timescale
   */
  async insertMetrics(metrics: MetricPoint[]): Promise<void> {
    if (metrics.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert metrics with proper error handling
      const query = `
        INSERT INTO metrics (ts, org_id, metric, value, labels, service, host)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      `;

      for (const metric of metrics) {
        try {
          await client.query(query, [
            metric.ts,
            String(metric.org_id), // Ensure org_id is a string
            metric.metric,
            metric.value,
            JSON.stringify(metric.labels || {}),
            metric.service || null,
            metric.host || null,
          ]);
        } catch (rowError: any) {
          console.error(`Failed to insert metric row:`, rowError.message);
          console.error('Metric data:', JSON.stringify(metric, null, 2));
          throw rowError;
        }
      }

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('TimescaleDB insertMetrics error:', error.message);
      console.error('Error stack:', error.stack);
      if (metrics.length > 0) {
        console.error('First metric sample:', JSON.stringify(metrics[0], null, 2));
        console.error('Metric org_id type:', typeof metrics[0].org_id);
        console.error('Metric org_id value:', metrics[0].org_id);
      }
      throw new Error(`Failed to insert metrics: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Query metrics with aggregation
   */
  async queryMetrics(params: {
    org_id: string;
    metric: string;
    start: Date;
    end: Date;
    interval?: string; // '1m', '5m', '1h'
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
    labels?: Record<string, string>;
    service?: string;
  }): Promise<MetricQueryResult[]> {
    const {
      org_id,
      metric,
      start,
      end,
      interval = '1m',
      aggregation = 'avg',
      labels,
      service,
    } = params;

    // For now, always use the base metrics table to avoid continuous aggregate refresh issues
    // TODO: Once continuous aggregates are auto-refreshed, we can use selectOptimalTable
    const { table, bucketInterval } = { table: 'metrics', bucketInterval: interval };
    // const { table, bucketInterval } = this.selectOptimalTable(interval);

    let whereConditions = ['org_id = $1', 'metric = $2', 'ts >= $3', 'ts <= $4'];
    const queryParams: any[] = [org_id, metric, start, end];
    let paramIndex = 5;

    if (service) {
      whereConditions.push(`service = $${paramIndex++}`);
      queryParams.push(service);
    }

    if (labels) {
      whereConditions.push(`labels @> $${paramIndex++}::jsonb`);
      queryParams.push(JSON.stringify(labels));
    }

    const aggColumn = table === 'metrics' ? 'value' : `${aggregation}_value`;
    
    // For continuous aggregates (metrics_1m, metrics_5m, metrics_1h), the bucket column already exists
    // and ts is replaced by bucket. We need to use bucket instead of ts in WHERE clauses.
    const isContinuousAggregate = table !== 'metrics';
    const timeColumn = isContinuousAggregate ? 'bucket' : 'ts';

    // Convert interval string to PostgreSQL INTERVAL format
    // e.g., "1m" -> "1 minute", "5m" -> "5 minutes", "1h" -> "1 hour"
    const intervalStr = this.convertIntervalToPostgres(bucketInterval);

    // Update WHERE conditions to use bucket for continuous aggregates
    const finalWhereConditions = whereConditions.map(cond => {
      if (isContinuousAggregate) {
        // Replace ts >= $X with bucket >= $X, ts <= $Y with bucket <= $Y
        return cond.replace(/ts >= \$(\d+)/g, `${timeColumn} >= $${1}`).replace(/ts <= \$(\d+)/g, `${timeColumn} <= $${1}`);
      }
      return cond;
    });

    // Build query - for continuous aggregates, bucket is already the time column
    // For base metrics table, we need to time_bucket the ts column
    let query: string;
    if (isContinuousAggregate) {
      query = `
        SELECT 
          ${timeColumn} AS bucket,
          ${aggregation}(${aggColumn}) AS value
        FROM ${table}
        WHERE ${finalWhereConditions.join(' AND ')}
        ORDER BY bucket ASC
      `;
      // Don't push intervalStr for continuous aggregates
    } else {
      query = `
        SELECT 
          time_bucket($${paramIndex}::INTERVAL, ${timeColumn}) AS bucket,
          ${aggregation}(${aggColumn}) AS value
        FROM ${table}
        WHERE ${finalWhereConditions.join(' AND ')}
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      queryParams.push(intervalStr);
    }

    console.log('Executing TimescaleDB query:', {
      query: query.substring(0, 200) + '...',
      params: queryParams.slice(0, 5), // First 5 params for debugging
      paramCount: queryParams.length,
    });

    const result = await this.pool.query(query, queryParams);
    
    console.log('TimescaleDB query returned', result.rows.length, 'rows');
    if (result.rows.length > 0) {
      console.log('First result sample:', result.rows[0]);
    } else {
      console.log('No rows returned. Query params:', {
        org_id: queryParams[0],
        metric: queryParams[1],
        start: queryParams[2],
        end: queryParams[3],
      });
    }
    
    return result.rows;
  }

  /**
   * Calculate rate of change (PromQL-like rate function)
   */
  async rate(params: {
    org_id: string;
    metric: string;
    start: Date;
    end: Date;
    interval?: string;
    labels?: Record<string, string>;
  }): Promise<MetricQueryResult[]> {
    const { org_id, metric, start, end, interval = '1m', labels } = params;

    let whereConditions = ['org_id = $1', 'metric = $2', 'ts >= $3', 'ts <= $4'];
    const queryParams: any[] = [org_id, metric, start, end];
    let paramIndex = 5;

    if (labels) {
      whereConditions.push(`labels @> $${paramIndex++}::jsonb`);
      queryParams.push(JSON.stringify(labels));
    }

    const query = `
      SELECT 
        time_bucket($${paramIndex}, ts) AS bucket,
        (MAX(value) - MIN(value)) / EXTRACT(EPOCH FROM $${paramIndex}::INTERVAL) AS value
      FROM metrics
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY bucket
      HAVING MAX(value) - MIN(value) >= 0
      ORDER BY bucket ASC
    `;

    queryParams.push(interval, interval);

    const result = await this.pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Calculate increase (PromQL-like increase function)
   */
  async increase(params: {
    org_id: string;
    metric: string;
    start: Date;
    end: Date;
    interval?: string;
    labels?: Record<string, string>;
  }): Promise<MetricQueryResult[]> {
    const { org_id, metric, start, end, interval = '1m', labels } = params;

    let whereConditions = ['org_id = $1', 'metric = $2', 'ts >= $3', 'ts <= $4'];
    const queryParams: any[] = [org_id, metric, start, end];
    let paramIndex = 5;

    if (labels) {
      whereConditions.push(`labels @> $${paramIndex++}::jsonb`);
      queryParams.push(JSON.stringify(labels));
    }

    const query = `
      SELECT 
        time_bucket($${paramIndex}, ts) AS bucket,
        MAX(value) - MIN(value) AS value
      FROM metrics
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY bucket
      HAVING MAX(value) - MIN(value) >= 0
      ORDER BY bucket ASC
    `;

    queryParams.push(interval);

    const result = await this.pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Get latest metric value
   */
  async getLatest(params: {
    org_id: string;
    metric: string;
    labels?: Record<string, string>;
    service?: string;
  }): Promise<MetricPoint | null> {
    const { org_id, metric, labels, service } = params;

    let whereConditions = ['org_id = $1', 'metric = $2'];
    const queryParams: any[] = [org_id, metric];
    let paramIndex = 3;

    if (service) {
      whereConditions.push(`service = $${paramIndex++}`);
      queryParams.push(service);
    }

    if (labels) {
      whereConditions.push(`labels @> $${paramIndex++}::jsonb`);
      queryParams.push(JSON.stringify(labels));
    }

    const query = `
      SELECT *
      FROM metrics
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ts DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, queryParams);
    return result.rows[0] || null;
  }

  /**
   * Get metric catalog (all unique metrics for an org)
   */
  async getMetricCatalog(org_id: string): Promise<{ metric: string; last_seen: Date; sample_count: number }[]> {
    const query = `
      SELECT 
        metric,
        MAX(ts) as last_seen,
        COUNT(*) as sample_count
      FROM metrics
      WHERE org_id = $1
      GROUP BY metric
      ORDER BY last_seen DESC
    `;

    const result = await this.pool.query(query, [org_id]);
    return result.rows;
  }

  /**
   * Get active series count (unique label combinations)
   */
  async getActiveSeriesCount(org_id: string, metric?: string): Promise<number> {
    let whereConditions = ['org_id = $1', 'ts >= NOW() - INTERVAL \'1 hour\''];
    const queryParams: any[] = [org_id];

    if (metric) {
      whereConditions.push('metric = $2');
      queryParams.push(metric);
    }

    const query = `
      SELECT COUNT(DISTINCT (metric, labels)) as series_count
      FROM metrics
      WHERE ${whereConditions.join(' AND ')}
    `;

    const result = await this.pool.query(query, queryParams);
    return parseInt(result.rows[0]?.series_count || '0', 10);
  }

  /**
   * Select optimal table based on query interval
   */
  private selectOptimalTable(interval: string): { table: string; bucketInterval: string } {
    // Parse interval (e.g., "1m", "5m", "1h")
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) {
      return { table: 'metrics', bucketInterval: '1 minute' };
    }

    const [, value, unit] = match;
    const minutes = this.intervalToMinutes(parseInt(value), unit);

    // Use pre-aggregated views for better performance
    if (minutes >= 60) {
      return { table: 'metrics_1h', bucketInterval: interval };
    } else if (minutes >= 5) {
      return { table: 'metrics_5m', bucketInterval: interval };
    } else if (minutes >= 1) {
      return { table: 'metrics_1m', bucketInterval: interval };
    } else {
      return { table: 'metrics', bucketInterval: interval };
    }
  }

  /**
   * Convert interval to minutes
   */
  private intervalToMinutes(value: number, unit: string): number {
    switch (unit) {
      case 's':
        return value / 60;
      case 'm':
        return value;
      case 'h':
        return value * 60;
      case 'd':
        return value * 60 * 24;
      default:
        return value;
    }
  }

  /**
   * Convert interval string to PostgreSQL INTERVAL format
   * e.g., "1m" -> "1 minute", "5m" -> "5 minutes", "1h" -> "1 hour"
   */
  private convertIntervalToPostgres(interval: string): string {
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) {
      return '1 minute'; // default
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num === 1 ? '1 second' : `${num} seconds`;
      case 'm':
        return num === 1 ? '1 minute' : `${num} minutes`;
      case 'h':
        return num === 1 ? '1 hour' : `${num} hours`;
      case 'd':
        return num === 1 ? '1 day' : `${num} days`;
      default:
        return '1 minute';
    }
  }

  /**
   * Execute raw query (for advanced use cases)
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }
}



