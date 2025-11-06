import { z } from 'zod';

// ======================
// LOGS SEARCH DTOs
// ======================

export const LogsSearchSchema = z.object({
  start: z.string(), // ISO 8601
  end: z.string(), // ISO 8601
  query: z.string().optional(), // LogQL-lite: service="api" AND level="error"
  service: z.string().optional(),
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  search: z.string().optional(), // Full-text search in message
  trace_id: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type LogsSearchDto = z.infer<typeof LogsSearchSchema>;

export interface LogsSearchResponse {
  logs: Array<{
    ts: string;
    service: string;
    level: string;
    message: string;
    attrs?: Record<string, any>;
    trace_id?: string;
    span_id?: string;
    host?: string;
  }>;
  total: number;
  start: string;
  end: string;
}

// ======================
// METRICS QUERY DTOs (PromQL-lite)
// ======================

export const MetricsQuerySchema = z.object({
  query: z.string(), // e.g., "avg(http_requests_total{service='api'})"
  start: z.string(), // ISO 8601
  end: z.string(), // ISO 8601
  step: z.string().optional().default('1m'), // Aggregation interval: 1m, 5m, 1h
});

export type MetricsQueryDto = z.infer<typeof MetricsQuerySchema>;

export interface MetricsQueryResponse {
  metric: string;
  results: Array<{
    timestamp: string;
    value: number;
  }>;
}

// ======================
// TRACES SEARCH DTOs
// ======================

export const TracesSearchSchema = z.object({
  start: z.string(),
  end: z.string(),
  service: z.string().optional(),
  min_duration_ms: z.number().int().min(0).optional(),
  status: z.enum(['ok', 'error', 'unset']).optional(),
  operation: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type TracesSearchDto = z.infer<typeof TracesSearchSchema>;

export interface TracesSearchResponse {
  traces: Array<{
    trace_id: string;
    start_time: string;
    duration_ms: number;
    span_count: number;
    services: string[];
    error_count: number;
  }>;
  total: number;
}

export interface TraceDetailResponse {
  trace_id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  spans: Array<{
    span_id: string;
    parent_span_id?: string;
    service: string;
    operation: string;
    kind: string;
    status: string;
    start_time: string;
    duration_ms: number;
    attrs?: Record<string, any>;
    events?: any[];
  }>;
}

// ======================
// RUM SEARCH DTOs
// ======================

export const RUMSearchSchema = z.object({
  start: z.string(),
  end: z.string(),
  event_type: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

export type RUMSearchDto = z.infer<typeof RUMSearchSchema>;

export interface RUMSearchResponse {
  events: Array<{
    ts: string;
    session_id: string;
    user_id?: string;
    event_type: string;
    page_url: string;
    referrer?: string;
    user_agent?: string;
    ip?: string;
    geo_country?: string;
    geo_city?: string;
    custom_attrs?: Record<string, any>;
  }>;
  total: number;
}

// ======================
// USAGE DTOs
// ======================

export interface UsageResponse {
  usage: Array<{
    date: string;
    logs_count: number;
    logs_bytes: number;
    metrics_count: number;
    traces_count: number;
    rum_events: number;
  }>;
  totals: {
    logs_count: number;
    logs_bytes: number;
    metrics_count: number;
    traces_count: number;
    rum_events: number;
  };
}



