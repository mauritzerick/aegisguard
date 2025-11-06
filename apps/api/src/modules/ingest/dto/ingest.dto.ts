import { z } from 'zod';

// ======================
// LOGS DTOs
// ======================

export const IngestLogsSchema = z.object({
  logs: z.array(
    z.object({
      timestamp: z.string().optional(), // ISO 8601
      service: z.string().min(1).max(100),
      level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
      message: z.string().max(10000),
      attributes: z.record(z.unknown()).optional(),
      trace_id: z.string().optional(),
      span_id: z.string().optional(),
    }),
  ).min(1).max(1000), // Max 1000 logs per batch
  resource: z
    .object({
      service_name: z.string().optional(),
      host: z.string().optional(),
      environment: z.string().optional(),
    })
    .optional(),
});

export type IngestLogsDto = z.infer<typeof IngestLogsSchema>;

// ======================
// METRICS DTOs
// ======================

export const IngestMetricsSchema = z.object({
  metrics: z.array(
    z.object({
      timestamp: z.string().optional(), // ISO 8601
      name: z.string().min(1).max(200),
      value: z.number(),
      type: z.enum(['counter', 'gauge', 'histogram', 'summary']).optional(),
      labels: z.record(z.string()).optional(),
      unit: z.string().optional(),
    }),
  ).min(1).max(5000), // Max 5000 metrics per batch
  resource: z
    .object({
      service_name: z.string().optional(),
      host: z.string().optional(),
    })
    .optional(),
});

export type IngestMetricsDto = z.infer<typeof IngestMetricsSchema>;

// ======================
// TRACES DTOs (OpenTelemetry-like)
// ======================

export const IngestTracesSchema = z.object({
  traces: z.array(
    z.object({
      trace_id: z.string().min(1),
      span_id: z.string().min(1),
      parent_span_id: z.string().optional(),
      name: z.string().min(1).max(200),
      kind: z.enum(['client', 'server', 'producer', 'consumer', 'internal']).optional(),
      start_time: z.string(), // ISO 8601
      end_time: z.string(), // ISO 8601
      status: z.enum(['ok', 'error', 'unset']).optional(),
      attributes: z.record(z.unknown()).optional(),
      events: z
        .array(
          z.object({
            timestamp: z.string(),
            name: z.string(),
            attributes: z.record(z.unknown()).optional(),
          }),
        )
        .optional(),
      links: z
        .array(
          z.object({
            trace_id: z.string(),
            span_id: z.string(),
            attributes: z.record(z.unknown()).optional(),
          }),
        )
        .optional(),
    }),
  ).min(1).max(500), // Max 500 spans per batch
  resource: z
    .object({
      service_name: z.string(),
      host: z.string().optional(),
    })
    .optional(),
});

export type IngestTracesDto = z.infer<typeof IngestTracesSchema>;

// ======================
// RUM (Real User Monitoring) DTOs
// ======================

export const IngestRUMSchema = z.object({
  events: z.array(
    z.object({
      timestamp: z.string().optional(), // ISO 8601
      session_id: z.string().min(1),
      user_id: z.string().optional(),
      event_type: z.enum(['pageview', 'click', 'error', 'performance', 'custom']),
      page_url: z.string().url(),
      referrer: z.string().url().optional(),
      performance: z
        .object({
          fcp: z.number().optional(), // First Contentful Paint
          lcp: z.number().optional(), // Largest Contentful Paint
          fid: z.number().optional(), // First Input Delay
          cls: z.number().optional(), // Cumulative Layout Shift
          ttfb: z.number().optional(), // Time to First Byte
          dom_load: z.number().optional(),
          window_load: z.number().optional(),
        })
        .optional(),
      error: z
        .object({
          message: z.string(),
          stack: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
      custom_attributes: z.record(z.unknown()).optional(),
    }),
  ).min(1).max(1000), // Max 1000 RUM events per batch
});

export type IngestRUMDto = z.infer<typeof IngestRUMSchema>;

// ======================
// Response DTOs
// ======================

export interface IngestResponse {
  success: boolean;
  accepted: number;
  rejected?: number;
  errors?: Array<{
    index: number;
    reason: string;
  }>;
  message?: string;
}





