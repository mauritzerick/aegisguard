import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ClickHouseService } from '../../services/clickhouse.service';
import { TimescaleService } from '../../services/timescale.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LogsSearchSchema,
  LogsSearchDto,
  LogsSearchResponse,
  MetricsQuerySchema,
  MetricsQueryDto,
  MetricsQueryResponse,
  TracesSearchSchema,
  TracesSearchDto,
  TracesSearchResponse,
  TraceDetailResponse,
  RUMSearchSchema,
  RUMSearchDto,
  RUMSearchResponse,
  UsageResponse,
} from './dto/query.dto';

/**
 * Query Controller
 * 
 * Provides search/query endpoints for:
 * - Logs (LogQL-lite)
 * - Metrics (PromQL-lite)
 * - Traces (search & waterfall)
 * 
 * Security:
 * - JWT authentication
 * - RBAC permissions
 * - Org-level isolation (user's first organization)
 */
@ApiTags('Query')
@Controller('query')
@UseGuards(AuthGuard, RbacGuard)
@ApiBearerAuth()
export class QueryController {
  constructor(
    private clickhouse: ClickHouseService,
    private timescale: TimescaleService,
    private prisma: PrismaService,
  ) {}

  /**
   * Search logs (LogQL-lite)
   * POST /query/logs/search
   */
  @Post('logs/search')
  @Permissions('logs:read')
  @ApiOperation({
    summary: 'Search logs',
    description: 'Search logs using LogQL-lite query language with time range and filters.',
  })
  @ApiResponse({ status: 200, description: 'Logs search results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UsePipes(new ZodValidationPipe(LogsSearchSchema))
  async searchLogs(
    @Body() body: LogsSearchDto,
    @Req() req: Request,
  ): Promise<LogsSearchResponse> {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    const start = new Date(body.start);
    const end = new Date(body.end);

    try {
      const results = await this.clickhouse.searchLogs({
        org_id: orgId,
        start,
        end,
        service: body.service,
        level: body.level,
        search: body.search,
        limit: body.limit || 100,
      });

      return {
        logs: results.map((log: any) => ({
          ts: log.ts,
          service: log.service,
          level: log.level,
          message: log.message,
          attrs: log.attrs ? JSON.parse(log.attrs) : undefined,
          trace_id: log.trace_id || undefined,
          span_id: log.span_id || undefined,
          host: log.host || undefined,
        })),
        total: results.length,
        start: body.start,
        end: body.end,
      };
    } catch (error: any) {
      // If ClickHouse is not available, return empty results instead of crashing
      console.error('ClickHouse query error:', error.message);
      return {
        logs: [],
        total: 0,
        start: body.start,
        end: body.end,
      };
    }
  }

  /**
   * Query metrics (PromQL-lite)
   * POST /query/metrics
   */
  @Post('metrics')
  @Permissions('metrics:read')
  @ApiOperation({
    summary: 'Query metrics',
    description: 'Query metrics using PromQL-lite syntax (simplified).',
  })
  @ApiResponse({ status: 200, description: 'Metrics query results' })
  @UsePipes(new ZodValidationPipe(MetricsQuerySchema))
  async queryMetrics(
    @Body() body: MetricsQueryDto,
    @Req() req: Request,
  ): Promise<MetricsQueryResponse> {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    // Simple PromQL parser (for MVP, just support basic queries)
    const parsed = this.parsePromQL(body.query);

    const start = new Date(body.start);
    const end = new Date(body.end);

    // Check if we have data for this org
    const orgMetricsCount = await this.timescale.query(`
      SELECT COUNT(*) as count FROM metrics WHERE org_id = $1 AND metric = $2 AND ts >= $3 AND ts <= $4
    `, [orgId, parsed.metric, start, end]);
    
    console.log('Query metrics:', {
      orgId,
      parsed,
      start: start.toISOString(),
      end: end.toISOString(),
      step: body.step,
      availableMetricsCount: orgMetricsCount[0]?.count || 0,
    });

    try {
      const results = await this.timescale.queryMetrics({
        org_id: orgId,
        metric: parsed.metric,
        start,
        end,
        interval: body.step,
        aggregation: parsed.aggregation,
        labels: parsed.labels,
        service: parsed.service,
      });

      console.log('Query results count:', results.length);

      return {
        metric: parsed.metric,
        results: results.map((r: any) => ({
          timestamp: r.bucket.toISOString(),
          value: parseFloat(r.value) || 0,
        })),
      };
    } catch (error: any) {
      // If TimescaleDB is not available, return empty results instead of crashing
      console.error('TimescaleDB query error:', error.message);
      return {
        metric: parsed.metric,
        results: [],
      };
    }
  }

  /**
   * Get metric catalog
   * GET /query/metrics/catalog
   */
  @Get('metrics/catalog')
  @Permissions('metrics:read')
  @ApiOperation({
    summary: 'Get metric catalog',
    description: 'List available metrics for the organization.',
  })
  @ApiResponse({ status: 200, description: 'Metric catalog' })
  async getMetricCatalog(@Req() req: Request) {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    try {
      const catalog = await this.timescale.getMetricCatalog(orgId);

      return {
        metrics: catalog.map((item) => ({
          metric: item.metric,
          last_seen: item.last_seen.toISOString(),
          sample_count: item.sample_count,
        })),
      };
    } catch (error: any) {
      // If TimescaleDB is not available, return empty catalog instead of crashing
      console.error('TimescaleDB catalog error:', error.message);
      return {
        metrics: [],
      };
    }
  }

  /**
   * Search traces
   * POST /query/traces/search
   */
  @Post('traces/search')
  @Permissions('traces:read')
  @ApiOperation({
    summary: 'Search traces',
    description: 'Search distributed traces with filters.',
  })
  @ApiResponse({ status: 200, description: 'Trace search results' })
  @UsePipes(new ZodValidationPipe(TracesSearchSchema))
  async searchTraces(
    @Body() body: TracesSearchDto,
    @Req() req: Request,
  ): Promise<TracesSearchResponse> {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    const start = new Date(body.start);
    const end = new Date(body.end);

    try {
      const results = await this.clickhouse.searchTraces({
        org_id: orgId,
        start,
        end,
        service: body.service,
        min_duration_ms: body.min_duration_ms,
        status: body.status,
        limit: body.limit || 20,
      });

      return {
        traces: results.map((trace: any) => ({
          trace_id: trace.trace_id,
          start_time: trace.start_time,
          duration_ms: trace.total_duration_ms,
          span_count: trace.span_count,
          services: Array.isArray(trace.services) ? trace.services : [],
          error_count: trace.error_count || 0,
        })),
        total: results.length,
      };
    } catch (error: any) {
      console.error('ClickHouse traces search error:', error.message);
      return {
        traces: [],
        total: 0,
      };
    }
  }

  /**
   * Get trace detail (waterfall view)
   * GET /query/traces/:traceId
   */
  @Get('traces/:traceId')
  @Permissions('traces:read')
  @ApiOperation({
    summary: 'Get trace detail',
    description: 'Get all spans for a specific trace (waterfall view).',
  })
  @ApiResponse({ status: 200, description: 'Trace detail with all spans' })
  @ApiResponse({ status: 404, description: 'Trace not found' })
  async getTrace(
    @Param('traceId') traceId: string,
    @Req() req: Request,
  ): Promise<TraceDetailResponse> {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    try {
      const spans = await this.clickhouse.getTrace(orgId, traceId);

      if (spans.length === 0) {
        throw new Error('Trace not found');
      }

      // Calculate trace-level stats
      const startTimes = spans.map((s: any) => new Date(s.ts).getTime());
      const durations = spans.map((s: any) => s.duration_ms);
      const minStart = Math.min(...startTimes);
      const maxEnd = Math.max(...startTimes.map((t, i) => t + durations[i]));

      return {
        trace_id: traceId,
        start_time: new Date(minStart).toISOString(),
        end_time: new Date(maxEnd).toISOString(),
        duration_ms: maxEnd - minStart,
        spans: spans.map((span: any) => ({
          span_id: span.span_id,
          parent_span_id: span.parent_span_id || undefined,
          service: span.service,
          operation: span.operation,
          kind: span.kind,
          status: span.status,
          start_time: span.ts,
          duration_ms: span.duration_ms,
          attrs: span.attrs ? JSON.parse(span.attrs) : undefined,
          events: span.events ? JSON.parse(span.events) : undefined,
        })),
      };
    } catch (error: any) {
      console.error('ClickHouse getTrace error:', error.message);
      throw new Error('Trace not found');
    }
  }

  /**
   * Search RUM events
   * POST /query/rum/search
   */
  @Post('rum/search')
  @Permissions('rum:read')
  @ApiOperation({
    summary: 'Search RUM events',
    description: 'Search Real User Monitoring events.',
  })
  @ApiResponse({ status: 200, description: 'RUM search results' })
  @UsePipes(new ZodValidationPipe(RUMSearchSchema))
  async searchRUM(
    @Body() body: RUMSearchDto,
    @Req() req: Request,
  ): Promise<RUMSearchResponse> {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    const start = new Date(body.start);
    const end = new Date(body.end);

    try {
      const results = await this.clickhouse.searchRUMEvents({
        org_id: orgId,
        start,
        end,
        event_type: body.event_type,
        limit: body.limit || 100,
      });

      return {
        events: results.map((event: any) => ({
          ts: event.ts,
          session_id: event.session_id,
          user_id: event.user_id || undefined,
          event_type: event.event_type,
          page_url: event.page_url,
          referrer: event.referrer || undefined,
          user_agent: event.user_agent || undefined,
          ip: event.ip || undefined,
          geo_country: event.geo_country || undefined,
          geo_city: event.geo_city || undefined,
          custom_attrs: event.custom_attrs ? JSON.parse(event.custom_attrs) : undefined,
        })),
        total: results.length,
      };
    } catch (error: any) {
      console.error('ClickHouse RUM search error:', error.message);
      return {
        events: [],
        total: 0,
      };
    }
  }

  /**
   * Get usage metrics
   * GET /query/usage?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  @Get('usage')
  @Permissions('usage:read')
  @ApiOperation({
    summary: 'Get usage metrics',
    description: 'Get usage metrics for the organization.',
  })
  @ApiResponse({ status: 200, description: 'Usage metrics' })
  async getUsage(
    @Req() req: Request,
  ): Promise<UsageResponse> {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);

    try {
      // For MVP, return mock usage data
      // In production, this would query actual usage tables
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

      // Return empty usage for now - can be implemented later
      return {
        usage: [],
        totals: {
          logs_count: 0,
          logs_bytes: 0,
          metrics_count: 0,
          traces_count: 0,
          rum_events: 0,
        },
      };
    } catch (error: any) {
      console.error('Usage query error:', error.message);
      return {
        usage: [],
        totals: {
          logs_count: 0,
          logs_bytes: 0,
          metrics_count: 0,
          traces_count: 0,
          rum_events: 0,
        },
      };
    }
  }

  /**
   * Get user's organization ID
   * (For MVP, just get their first org membership, or create default org)
   */
  private async getUserOrgId(userId: string): Promise<string> {
    // Try to find existing org membership
    const orgUser = await this.prisma.organizationUser.findFirst({
      where: { userId },
      select: { orgId: true },
    });

    if (orgUser) {
      return orgUser.orgId;
    }

    // For MVP: Find or create a default organization
    let defaultOrg = await this.prisma.organization.findFirst({
      where: { slug: 'default' },
    });

    if (!defaultOrg) {
      // Create default organization
      const crypto = require('crypto');
      const apiKeyPrefix = 'obs_' + crypto.randomBytes(8).toString('hex').substring(0, 16);
      const apiKeyHash = crypto.createHash('sha256').update(apiKeyPrefix + '_secret').digest('hex');
      const secretHash = crypto.createHash('sha256').update('default-secret-key').digest('hex');

      defaultOrg = await this.prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          apiKeyPrefix,
          apiKeyHash,
          secretHash,
        },
      });
    }

    // Assign user to default organization (use findUnique with composite key, then create if needed)
    const existingMembership = await this.prisma.organizationUser.findUnique({
      where: {
        orgId_userId: {
          orgId: defaultOrg.id,
          userId,
        },
      },
    });

    if (!existingMembership) {
      await this.prisma.organizationUser.create({
        data: {
          orgId: defaultOrg.id,
          userId,
          role: 'owner',
        },
      });
    }

    return defaultOrg.id;
  }

  /**
   * Simple PromQL parser (MVP implementation)
   * Supports: avg(metric_name{label="value"})
   */
  private parsePromQL(query: string): {
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
    metric: string;
    labels?: Record<string, string>;
    service?: string;
  } {
    // Match: function(metric_name{labels})
    const match = query.match(/^(\w+)\(([^{]+)(?:\{([^}]+)\})?\)$/);

    if (!match) {
      // Simple metric name without function
      return {
        aggregation: 'avg',
        metric: query.trim(),
      };
    }

    const [, func, metric, labelsStr] = match;
    const aggregation = func.toLowerCase() as any;

    const labels: Record<string, string> = {};
    let service: string | undefined;

    if (labelsStr) {
      // Parse labels: key="value", key2="value2"
      const labelPairs = labelsStr.split(',');
      for (const pair of labelPairs) {
        const [key, value] = pair.split('=').map((s) => s.trim().replace(/"/g, ''));
        if (key === 'service') {
          service = value;
        } else {
          labels[key] = value;
        }
      }
    }

    return {
      aggregation: ['avg', 'sum', 'min', 'max', 'count'].includes(aggregation)
        ? aggregation
        : 'avg',
      metric: metric.trim(),
      labels: Object.keys(labels).length > 0 ? labels : undefined,
      service,
    };
  }
}



