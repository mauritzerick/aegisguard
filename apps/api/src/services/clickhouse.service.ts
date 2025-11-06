import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ConfigService } from '@nestjs/config';

export interface LogEntry {
  ts: Date | string;
  org_id: string;
  service: string;
  level: string;
  message: string;
  attrs?: Record<string, any>;
  trace_id?: string;
  span_id?: string;
  host?: string;
  ip?: string;
  geo_country?: string;
  geo_city?: string;
  ua?: string;
  pii_masked?: boolean;
  ingest_id: string;
}

export interface SpanEntry {
  ts: Date | string;
  org_id: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  service: string;
  operation: string;
  kind: string;
  status: string;
  duration_ms: number;
  attrs?: Record<string, any>;
  resource?: Record<string, any>;
  events?: any[];
  links?: any[];
}

export interface RUMEvent {
  ts: Date | string;
  org_id: string;
  session_id: string;
  user_id?: string;
  event_type: string;
  page_url: string;
  referrer?: string;
  user_agent?: string;
  ip?: string;
  geo_country?: string;
  geo_city?: string;
  device_type?: string;
  browser?: string;
  browser_version?: string;
  os?: string;
  os_version?: string;
  performance_metrics?: Record<string, any>;
  error_message?: string;
  error_stack?: string;
  custom_attrs?: Record<string, any>;
}

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private client!: ClickHouseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      host: this.configService.get('CLICKHOUSE_HOST', 'http://localhost:8123'),
      database: this.configService.get('CLICKHOUSE_DATABASE', 'observability'),
      username: this.configService.get('CLICKHOUSE_USER', 'aegis'),
      password: this.configService.get('CLICKHOUSE_PASSWORD', 'aegis_ch_pass'),
      clickhouse_settings: {
        date_time_input_format: 'best_effort',
      },
    });

    // Test connection
    try {
      await this.client.ping();
      console.log('✅ ClickHouse connected successfully');
    } catch (error: any) {
      console.error('❌ ClickHouse connection failed:', (error instanceof Error) ? error.message : String(error));
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  /**
   * Insert logs into ClickHouse
   */
  async insertLogs(logs: LogEntry[]): Promise<void> {
    if (logs.length === 0) return;

    const values = logs.map(log => ({
      ts: this.formatTimestamp(log.ts),
      org_id: log.org_id,
      service: log.service || 'unknown',
      level: log.level || 'info',
      message: log.message || '',
      attrs: log.attrs ? JSON.stringify(log.attrs) : '{}',
      trace_id: log.trace_id || '',
      span_id: log.span_id || '',
      host: log.host || '',
      ip: log.ip || '',
      geo_country: log.geo_country || '',
      geo_city: log.geo_city || '',
      ua: log.ua || '',
      pii_masked: log.pii_masked || false,
      ingest_id: log.ingest_id,
    }));

    await this.client.insert({
      table: 'logs',
      values,
      format: 'JSONEachRow',
    });
  }

  /**
   * Insert spans (traces) into ClickHouse
   */
  async insertSpans(spans: SpanEntry[]): Promise<void> {
    if (spans.length === 0) return;

    const values = spans.map(span => ({
      ts: this.formatTimestamp(span.ts),
      org_id: span.org_id,
      trace_id: span.trace_id,
      span_id: span.span_id,
      parent_span_id: span.parent_span_id || '',
      service: span.service,
      operation: span.operation,
      kind: span.kind,
      status: span.status,
      duration_ms: span.duration_ms,
      attrs: span.attrs ? JSON.stringify(span.attrs) : '{}',
      resource: span.resource ? JSON.stringify(span.resource) : '{}',
      events: span.events ? JSON.stringify(span.events) : '[]',
      links: span.links ? JSON.stringify(span.links) : '[]',
    }));

    await this.client.insert({
      table: 'spans',
      values,
      format: 'JSONEachRow',
    });
  }

  /**
   * Insert RUM events into ClickHouse
   */
  async insertRUMEvents(events: RUMEvent[]): Promise<void> {
    if (events.length === 0) return;

    const values = events.map(event => ({
      ts: this.formatTimestamp(event.ts),
      org_id: event.org_id,
      session_id: event.session_id,
      user_id: event.user_id || '',
      event_type: event.event_type,
      page_url: event.page_url,
      referrer: event.referrer || '',
      user_agent: event.user_agent || '',
      ip: event.ip || '',
      geo_country: event.geo_country || '',
      geo_city: event.geo_city || '',
      device_type: event.device_type || '',
      browser: event.browser || '',
      browser_version: event.browser_version || '',
      os: event.os || '',
      os_version: event.os_version || '',
      performance_metrics: event.performance_metrics ? JSON.stringify(event.performance_metrics) : '{}',
      error_message: event.error_message || '',
      error_stack: event.error_stack || '',
      custom_attrs: event.custom_attrs ? JSON.stringify(event.custom_attrs) : '{}',
    }));

    await this.client.insert({
      table: 'rum_events',
      values,
      format: 'JSONEachRow',
    });
  }

  /**
   * Search logs with org isolation
   */
  async searchLogs(params: {
    org_id: string;
    start: Date;
    end: Date;
    service?: string;
    level?: string;
    search?: string;
    limit?: number;
  }) {
    const {
      org_id,
      start,
      end,
      service,
      level,
      search,
      limit = 100,
    } = params;

    let whereConditions = [
      `org_id = {org_id:String}`,
      `ts >= {start:DateTime64(3)}`,
      `ts <= {end:DateTime64(3)}`,
    ];

    if (service) whereConditions.push(`service = {service:String}`);
    if (level) whereConditions.push(`level = {level:String}`);
    if (search) whereConditions.push(`positionCaseInsensitive(message, {search:String}) > 0`);

    const query = `
      SELECT 
        ts,
        org_id,
        service,
        level,
        message,
        attrs,
        trace_id,
        span_id,
        host,
        ip
      FROM logs
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ts DESC
      LIMIT {limit:UInt32}
    `;

    const resultSet = await this.client.query({
      query,
      query_params: {
        org_id,
        start: this.formatTimestamp(start),
        end: this.formatTimestamp(end),
        ...(service && { service }),
        ...(level && { level }),
        ...(search && { search }),
        limit,
      },
      format: 'JSONEachRow',
    });

    return await resultSet.json();
  }

  /**
   * Get trace by ID
   */
  async getTrace(org_id: string, trace_id: string) {
    const query = `
      SELECT *
      FROM spans
      WHERE org_id = {org_id:String}
        AND trace_id = {trace_id:String}
      ORDER BY ts ASC
    `;

    const resultSet = await this.client.query({
      query,
      query_params: { org_id, trace_id },
      format: 'JSONEachRow',
    });

    return await resultSet.json();
  }

  /**
   * Search traces
   */
  async searchTraces(params: {
    org_id: string;
    start: Date;
    end: Date;
    service?: string;
    min_duration_ms?: number;
    status?: string;
    limit?: number;
  }) {
    const {
      org_id,
      start,
      end,
      service,
      min_duration_ms,
      status,
      limit = 100,
    } = params;

    let whereConditions = [
      `org_id = {org_id:String}`,
      `ts >= {start:DateTime64(3)}`,
      `ts <= {end:DateTime64(3)}`,
    ];

    if (service) whereConditions.push(`service = {service:String}`);
    if (min_duration_ms) whereConditions.push(`duration_ms >= {min_duration_ms:UInt32}`);
    if (status) whereConditions.push(`status = {status:String}`);

    const query = `
      SELECT 
        trace_id,
        min(ts) as start_time,
        max(ts) as end_time,
        count() as span_count,
        sum(duration_ms) as total_duration_ms,
        groupArray(service) as services,
        countIf(status = 'error') as error_count
      FROM spans
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY trace_id
      ORDER BY start_time DESC
      LIMIT {limit:UInt32}
    `;

    const resultSet = await this.client.query({
      query,
      query_params: {
        org_id,
        start: this.formatTimestamp(start),
        end: this.formatTimestamp(end),
        ...(service && { service }),
        ...(min_duration_ms && { min_duration_ms }),
        ...(status && { status }),
        limit,
      },
      format: 'JSONEachRow',
    });

    return await resultSet.json();
  }

  /**
   * Search RUM events with org isolation
   */
  async searchRUMEvents(params: {
    org_id: string;
    start: Date;
    end: Date;
    event_type?: string;
    limit?: number;
  }) {
    const {
      org_id,
      start,
      end,
      event_type,
      limit = 100,
    } = params;

    let whereConditions = [
      `org_id = {org_id:String}`,
      `ts >= {start:DateTime64(3)}`,
      `ts <= {end:DateTime64(3)}`,
    ];

    if (event_type) whereConditions.push(`event_type = {event_type:String}`);

    const query = `
      SELECT 
        ts,
        org_id,
        session_id,
        user_id,
        event_type,
        page_url,
        referrer,
        user_agent,
        ip,
        geo_country,
        geo_city,
        custom_attrs
      FROM rum_events
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ts DESC
      LIMIT {limit:UInt32}
    `;

    try {
      const resultSet = await this.client.query({
        query,
        query_params: {
          org_id,
          start: this.formatTimestamp(start),
          end: this.formatTimestamp(end),
          ...(event_type && { event_type }),
          limit,
        },
        format: 'JSONEachRow',
      });

      return await resultSet.json();
    } catch (error: any) {
      // If table doesn't exist, return empty array
      console.error('ClickHouse RUM search error:', error.message);
      return [];
    }
  }

  /**
   * Format timestamp for ClickHouse
   */
  private formatTimestamp(ts: Date | string): string {
    if (typeof ts === 'string') {
      return ts;
    }
    // Format as YYYY-MM-DD HH:MM:SS.mmm
    return ts.toISOString().replace('T', ' ').replace('Z', '');
  }

  /**
   * Execute raw query (for advanced use cases)
   */
  async query(sql: string, params?: Record<string, any>) {
    const resultSet = await this.client.query({
      query: sql,
      query_params: params,
      format: 'JSONEachRow',
    });
    return await resultSet.json();
  }
}



