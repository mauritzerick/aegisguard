import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisStreamsService, StreamName, StreamMessage } from '../../services/redis-streams.service';
import { ClickHouseService, LogEntry, SpanEntry, RUMEvent } from '../../services/clickhouse.service';
import { TimescaleService, MetricPoint } from '../../services/timescale.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PIIScrubberService } from './pii-scrubber.service';
import { EnrichmentService } from './enrichment.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Normalizer Worker
 * 
 * Background worker that processes raw telemetry data from Redis Streams:
 * 1. Reads messages from streams (logs:raw, metrics:raw, traces:raw, rum:raw)
 * 2. Validates and normalizes data
 * 3. Scrubs PII
 * 4. Enriches with geo/UA data
 * 5. Writes to ClickHouse/Timescale
 * 6. Updates usage metrics
 * 7. Acknowledges messages
 * 
 * Runs continuously, processing batches of messages.
 */
@Injectable()
export class NormalizerWorker implements OnModuleInit {
  private isRunning = false;
  private consumerId: string;

  constructor(
    private redisStreams: RedisStreamsService,
    private clickhouse: ClickHouseService,
    private timescale: TimescaleService,
    private prisma: PrismaService,
    private piiScrubber: PIIScrubberService,
    private enrichment: EnrichmentService,
    private configService: ConfigService,
  ) {
    this.consumerId = `normalizer-${uuidv4()}`;
  }

  async onModuleInit() {
    // Don't start worker on Vercel (serverless functions don't support background workers)
    if (process.env.VERCEL) {
      console.log('⏸️  Normalizer Worker disabled on Vercel (serverless)');
      return;
    }
    
    // Start worker if enabled
    const enabled = this.configService.get('NORMALIZER_ENABLED', 'true') === 'true';
    if (enabled) {
      console.log(`🚀 Starting Normalizer Worker (ID: ${this.consumerId})`);
      this.start();
    } else {
      console.log('⏸️  Normalizer Worker disabled');
    }
  }

  /**
   * Start the worker loop
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Normalizer Worker already running');
      return;
    }

    this.isRunning = true;

    // Start processing each stream type
    this.processLogsStream();
    this.processMetricsStream();
    this.processTracesStream();
    this.processRUMStream();

    console.log('✅ Normalizer Worker started');
  }

  /**
   * Stop the worker
   */
  async stop() {
    this.isRunning = false;
    console.log('🛑 Normalizer Worker stopped');
  }

  /**
   * Process logs stream
   */
  private async processLogsStream() {
    while (this.isRunning) {
      try {
        const messages = await this.redisStreams.read(
          StreamName.LOGS_RAW,
          this.consumerId,
          10, // Batch size
          5000, // Block 5s
        );

        if (messages.length > 0) {
          await this.processLogsBatch(messages);
        }
      } catch (error: any) {
        console.error('❌ Error processing logs stream:', error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s on error
      }
    }
  }

  /**
   * Process metrics stream
   */
  private async processMetricsStream() {
    while (this.isRunning) {
      try {
        const messages = await this.redisStreams.read(
          StreamName.METRICS_RAW,
          this.consumerId,
          50, // Larger batch for metrics
          5000,
        );

        if (messages.length > 0) {
          await this.processMetricsBatch(messages);
        }
      } catch (error: any) {
        console.error('❌ Error processing metrics stream:', error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process traces stream
   */
  private async processTracesStream() {
    while (this.isRunning) {
      try {
        const messages = await this.redisStreams.read(
          StreamName.TRACES_RAW,
          this.consumerId,
          20,
          5000,
        );

        if (messages.length > 0) {
          await this.processTracesBatch(messages);
        }
      } catch (error: any) {
        console.error('❌ Error processing traces stream:', error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process RUM stream
   */
  private async processRUMStream() {
    while (this.isRunning) {
      try {
        const messages = await this.redisStreams.read(
          StreamName.RUM_RAW,
          this.consumerId,
          20,
          5000,
        );

        if (messages.length > 0) {
          await this.processRUMBatch(messages);
        }
      } catch (error: any) {
        console.error('❌ Error processing RUM stream:', error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process batch of log messages
   */
  private async processLogsBatch(messages: StreamMessage[]) {
    const logs: LogEntry[] = [];
    const messageIds: string[] = [];

    for (const msg of messages) {
      try {
        const { org_id, ingest_id, payload } = msg.data;
        const parsed = JSON.parse(payload);

        for (const log of parsed.logs) {
          // Scrub PII
          const message = this.piiScrubber.scrubString(log.message);
          const attrs = log.attributes
            ? this.piiScrubber.scrubObject(log.attributes)
            : {};

          // Normalize timestamp
          const ts = this.enrichment.normalizeTimestamp(log.timestamp);

          // Extract service name
          const service = this.enrichment.extractServiceName(parsed.resource) || log.service;

          logs.push({
            ts,
            org_id,
            service,
            level: log.level || 'info',
            message,
            attrs,
            trace_id: log.trace_id,
            span_id: log.span_id,
            host: parsed.resource?.host,
            ingest_id,
            pii_masked: this.piiScrubber.containsPII(log.message),
          });
        }

        messageIds.push(msg.id);
      } catch (error: any) {
        console.error('❌ Failed to process log message:', error.message);
        // Still acknowledge to avoid reprocessing
        messageIds.push(msg.id);
      }
    }

    if (logs.length > 0) {
      try {
        // Write to ClickHouse
        await this.clickhouse.insertLogs(logs);

        // Update usage metrics
        const byOrg = this.groupByOrg(logs);
        for (const [orgId, orgLogs] of Object.entries(byOrg)) {
          await this.updateUsage(orgId, {
            logsCount: orgLogs.length,
            logsBytes: JSON.stringify(orgLogs).length,
          });
        }

        console.log(`✅ Processed ${logs.length} logs`);
      } catch (error: any) {
        console.error('❌ Failed to write logs to ClickHouse:', error.message);
        // Don't acknowledge on write failure - retry later
        return;
      }
    }

    // Acknowledge messages
    if (messageIds.length > 0) {
      await this.redisStreams.ack(StreamName.LOGS_RAW, ...messageIds);
    }
  }

  /**
   * Process batch of metric messages
   */
  private async processMetricsBatch(messages: StreamMessage[]) {
    const metrics: MetricPoint[] = [];
    const messageIds: string[] = [];

    for (const msg of messages) {
      try {
        const { org_id, payload } = msg.data;
        const parsed = JSON.parse(payload);

        for (const metric of parsed.metrics) {
          const ts = this.enrichment.normalizeTimestamp(metric.timestamp);
          const service = this.enrichment.extractServiceName(parsed.resource);

          metrics.push({
            ts,
            org_id,
            metric: metric.name,
            value: metric.value,
            labels: metric.labels || {},
            service,
            host: parsed.resource?.host,
          });
        }

        messageIds.push(msg.id);
      } catch (error: any) {
        console.error('❌ Failed to process metric message:', error.message);
        messageIds.push(msg.id);
      }
    }

    if (metrics.length > 0) {
      try {
        await this.timescale.insertMetrics(metrics);

        const byOrg = this.groupByOrg(metrics);
        for (const [orgId, orgMetrics] of Object.entries(byOrg)) {
          await this.updateUsage(orgId, {
            metricsCount: orgMetrics.length,
          });
        }

        console.log(`✅ Processed ${metrics.length} metrics`);
      } catch (error: any) {
        console.error('❌ Failed to write metrics to Timescale:', error.message);
        return;
      }
    }

    if (messageIds.length > 0) {
      await this.redisStreams.ack(StreamName.METRICS_RAW, ...messageIds);
    }
  }

  /**
   * Process batch of trace messages
   */
  private async processTracesBatch(messages: StreamMessage[]) {
    const spans: SpanEntry[] = [];
    const messageIds: string[] = [];

    for (const msg of messages) {
      try {
        const { org_id, payload } = msg.data;
        const parsed = JSON.parse(payload);

        for (const trace of parsed.traces) {
          const startTime = new Date(trace.start_time);
          const endTime = new Date(trace.end_time);
          const durationMs = endTime.getTime() - startTime.getTime();

          const service = this.enrichment.extractServiceName(parsed.resource);

          spans.push({
            ts: startTime,
            org_id,
            trace_id: trace.trace_id,
            span_id: trace.span_id,
            parent_span_id: trace.parent_span_id,
            service,
            operation: trace.name,
            kind: trace.kind || 'internal',
            status: trace.status || 'unset',
            duration_ms: Math.max(0, durationMs),
            attrs: trace.attributes,
            resource: parsed.resource,
            events: trace.events,
            links: trace.links,
          });
        }

        messageIds.push(msg.id);
      } catch (error: any) {
        console.error('❌ Failed to process trace message:', error.message);
        messageIds.push(msg.id);
      }
    }

    if (spans.length > 0) {
      try {
        await this.clickhouse.insertSpans(spans);

        const byOrg = this.groupByOrg(spans);
        for (const [orgId, orgSpans] of Object.entries(byOrg)) {
          await this.updateUsage(orgId, {
            spansCount: orgSpans.length,
          });
        }

        console.log(`✅ Processed ${spans.length} spans`);
      } catch (error: any) {
        console.error('❌ Failed to write spans to ClickHouse:', error.message);
        return;
      }
    }

    if (messageIds.length > 0) {
      await this.redisStreams.ack(StreamName.TRACES_RAW, ...messageIds);
    }
  }

  /**
   * Process batch of RUM messages
   */
  private async processRUMBatch(messages: StreamMessage[]) {
    const events: RUMEvent[] = [];
    const messageIds: string[] = [];

    for (const msg of messages) {
      try {
        const { org_id, payload } = msg.data;
        const parsed = JSON.parse(payload);

        for (const event of parsed.events) {
          const ts = this.enrichment.normalizeTimestamp(event.timestamp);

          // Enrich with geo/UA data (RUM often includes user_agent in event)
          const enriched = this.enrichment.enrichRUMEvent(
            event,
            event.ip,
            event.user_agent,
          );

          events.push({
            ts,
            org_id,
            session_id: event.session_id,
            user_id: event.user_id,
            event_type: event.event_type,
            page_url: event.page_url,
            referrer: event.referrer,
            user_agent: event.user_agent,
            ip: event.ip,
            geo_country: enriched.geo_country,
            geo_city: enriched.geo_city,
            device_type: enriched.device_type,
            browser: enriched.browser,
            browser_version: enriched.browser_version,
            os: enriched.os,
            os_version: enriched.os_version,
            performance_metrics: event.performance,
            error_message: event.error?.message,
            error_stack: event.error?.stack,
            custom_attrs: event.custom_attributes,
          });
        }

        messageIds.push(msg.id);
      } catch (error: any) {
        console.error('❌ Failed to process RUM message:', error.message);
        messageIds.push(msg.id);
      }
    }

    if (events.length > 0) {
      try {
        await this.clickhouse.insertRUMEvents(events);

        const byOrg = this.groupByOrg(events);
        for (const [orgId, orgEvents] of Object.entries(byOrg)) {
          await this.updateUsage(orgId, {
            rumEvents: orgEvents.length,
          });
        }

        console.log(`✅ Processed ${events.length} RUM events`);
      } catch (error: any) {
        console.error('❌ Failed to write RUM events to ClickHouse:', error.message);
        return;
      }
    }

    if (messageIds.length > 0) {
      await this.redisStreams.ack(StreamName.RUM_RAW, ...messageIds);
    }
  }

  /**
   * Group items by org_id
   */
  private groupByOrg<T extends { org_id: string }>(items: T[]): Record<string, T[]> {
    return items.reduce((acc, item) => {
      if (!acc[item.org_id]) {
        acc[item.org_id] = [];
      }
      acc[item.org_id].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  /**
   * Update usage metrics (daily aggregates)
   */
  private async updateUsage(
    orgId: string,
    counts: {
      logsCount?: number;
      logsBytes?: number;
      metricsCount?: number;
      spansCount?: number;
      rumEvents?: number;
    },
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await this.prisma.usageDaily.upsert({
        where: {
          date_orgId: {
            date: today,
            orgId,
          },
        },
        create: {
          date: today,
          orgId,
          logsCount: BigInt(counts.logsCount || 0),
          logsBytes: BigInt(counts.logsBytes || 0),
          metricsCount: BigInt(counts.metricsCount || 0),
          spansCount: BigInt(counts.spansCount || 0),
          rumEvents: BigInt(counts.rumEvents || 0),
        },
        update: {
          logsCount: {
            increment: BigInt(counts.logsCount || 0),
          },
          logsBytes: {
            increment: BigInt(counts.logsBytes || 0),
          },
          metricsCount: {
            increment: BigInt(counts.metricsCount || 0),
          },
          spansCount: {
            increment: BigInt(counts.spansCount || 0),
          },
          rumEvents: {
            increment: BigInt(counts.rumEvents || 0),
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Failed to update usage metrics:', error.message);
    }
  }
}





