import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { IngestAuthGuard } from './guards/ingest-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RedisStreamsService, StreamName } from '../../services/redis-streams.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IngestLogsSchema,
  IngestLogsDto,
  IngestMetricsSchema,
  IngestMetricsDto,
  IngestTracesSchema,
  IngestTracesDto,
  IngestRUMSchema,
  IngestRUMDto,
  IngestResponse,
} from './dto/ingest.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ingestion Controller
 * 
 * Public-facing endpoints for ingesting observability data.
 * 
 * Security:
 * - HMAC signature verification (IngestAuthGuard)
 * - Rate limiting (RateLimitGuard)
 * - Idempotency key support
 * - Org-level isolation
 * 
 * Flow:
 * 1. Validate HMAC signature
 * 2. Check rate limits
 * 3. Validate payload schema
 * 4. Check idempotency
 * 5. Push to Redis Streams
 * 6. Return success
 */
@ApiTags('Ingestion (v1)')
@Controller('v1')
@UseGuards(IngestAuthGuard, RateLimitGuard)
export class IngestController {
  constructor(
    private redisStreams: RedisStreamsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Ingest logs
   * POST /v1/logs
   */
  @Post('logs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest logs',
    description: 'Batch ingest log entries. Accepts up to 1000 logs per request.',
  })
  @ApiHeader({
    name: 'x-org-key',
    description: 'Organization API key prefix',
    required: true,
  })
  @ApiHeader({
    name: 'x-signature',
    description: 'HMAC-SHA256 signature of request body (format: sha256=<hex>)',
    required: true,
  })
  @ApiHeader({
    name: 'x-idempotency-key',
    description: 'Idempotency key (UUID) to prevent duplicate processing',
    required: false,
  })
  @ApiHeader({
    name: 'x-timestamp',
    description: 'Request timestamp (Unix milliseconds) for replay protection',
    required: false,
  })
  @ApiResponse({ status: 202, description: 'Logs accepted for processing' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Invalid authentication' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @UsePipes(new ZodValidationPipe(IngestLogsSchema))
  async ingestLogs(
    @Body() body: IngestLogsDto,
    @Req() req: Request,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<IngestResponse> {
    const org = (req as any).org;

    // Check idempotency
    if (idempotencyKey) {
      const cached = await this.checkIdempotency(org.id, idempotencyKey);
      if (cached) {
        return cached;
      }
    }

    // Add to Redis Streams
    const ingestId = uuidv4();
    await this.redisStreams.add(StreamName.LOGS_RAW, {
      org_id: org.id,
      ingest_id: ingestId,
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(body),
    });

    const response: IngestResponse = {
      success: true,
      accepted: body.logs.length,
      message: 'Logs accepted for processing',
    };

    // Cache idempotency response
    if (idempotencyKey) {
      await this.cacheIdempotency(org.id, idempotencyKey, response);
    }

    return response;
  }

  /**
   * Ingest metrics
   * POST /v1/metrics
   */
  @Post('metrics')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest metrics',
    description: 'Batch ingest metric data points. Accepts up to 5000 metrics per request.',
  })
  @ApiHeader({ name: 'x-org-key', required: true })
  @ApiHeader({ name: 'x-signature', required: true })
  @ApiHeader({ name: 'x-idempotency-key', required: false })
  @ApiResponse({ status: 202, description: 'Metrics accepted for processing' })
  @UsePipes(new ZodValidationPipe(IngestMetricsSchema))
  async ingestMetrics(
    @Body() body: IngestMetricsDto,
    @Req() req: Request,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<IngestResponse> {
    const org = (req as any).org;

    if (idempotencyKey) {
      const cached = await this.checkIdempotency(org.id, idempotencyKey);
      if (cached) return cached;
    }

    const ingestId = uuidv4();
    await this.redisStreams.add(StreamName.METRICS_RAW, {
      org_id: org.id,
      ingest_id: ingestId,
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(body),
    });

    const response: IngestResponse = {
      success: true,
      accepted: body.metrics.length,
      message: 'Metrics accepted for processing',
    };

    if (idempotencyKey) {
      await this.cacheIdempotency(org.id, idempotencyKey, response);
    }

    return response;
  }

  /**
   * Ingest traces (OpenTelemetry-like)
   * POST /v1/traces
   */
  @Post('traces')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest traces',
    description: 'Batch ingest distributed trace spans. Accepts up to 500 spans per request.',
  })
  @ApiHeader({ name: 'x-org-key', required: true })
  @ApiHeader({ name: 'x-signature', required: true })
  @ApiHeader({ name: 'x-idempotency-key', required: false })
  @ApiResponse({ status: 202, description: 'Traces accepted for processing' })
  @UsePipes(new ZodValidationPipe(IngestTracesSchema))
  async ingestTraces(
    @Body() body: IngestTracesDto,
    @Req() req: Request,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<IngestResponse> {
    const org = (req as any).org;

    if (idempotencyKey) {
      const cached = await this.checkIdempotency(org.id, idempotencyKey);
      if (cached) return cached;
    }

    const ingestId = uuidv4();
    await this.redisStreams.add(StreamName.TRACES_RAW, {
      org_id: org.id,
      ingest_id: ingestId,
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(body),
    });

    const response: IngestResponse = {
      success: true,
      accepted: body.traces.length,
      message: 'Traces accepted for processing',
    };

    if (idempotencyKey) {
      await this.cacheIdempotency(org.id, idempotencyKey, response);
    }

    return response;
  }

  /**
   * Ingest RUM (Real User Monitoring) events
   * POST /v1/rum
   */
  @Post('rum')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest RUM events',
    description:
      'Batch ingest Real User Monitoring events (pageviews, clicks, errors, performance). Accepts up to 1000 events per request.',
  })
  @ApiHeader({ name: 'x-org-key', required: true })
  @ApiHeader({ name: 'x-signature', required: true })
  @ApiHeader({ name: 'x-idempotency-key', required: false })
  @ApiResponse({ status: 202, description: 'RUM events accepted for processing' })
  @UsePipes(new ZodValidationPipe(IngestRUMSchema))
  async ingestRUM(
    @Body() body: IngestRUMDto,
    @Req() req: Request,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<IngestResponse> {
    const org = (req as any).org;

    if (idempotencyKey) {
      const cached = await this.checkIdempotency(org.id, idempotencyKey);
      if (cached) return cached;
    }

    const ingestId = uuidv4();
    await this.redisStreams.add(StreamName.RUM_RAW, {
      org_id: org.id,
      ingest_id: ingestId,
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(body),
    });

    const response: IngestResponse = {
      success: true,
      accepted: body.events.length,
      message: 'RUM events accepted for processing',
    };

    if (idempotencyKey) {
      await this.cacheIdempotency(org.id, idempotencyKey, response);
    }

    return response;
  }

  /**
   * Check if request has been processed already (idempotency)
   */
  private async checkIdempotency(
    orgId: string,
    key: string,
  ): Promise<IngestResponse | null> {
    const cached = await this.prisma.ingestIdempotency.findUnique({
      where: {
        orgId_idempotencyKey: {
          orgId,
          idempotencyKey: key,
        },
      },
    });

    if (cached && cached.expiresAt > new Date()) {
      return cached.response as IngestResponse;
    }

    return null;
  }

  /**
   * Cache idempotency response (24-hour TTL)
   */
  private async cacheIdempotency(
    orgId: string,
    key: string,
    response: IngestResponse,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.ingestIdempotency.upsert({
      where: {
        orgId_idempotencyKey: {
          orgId,
          idempotencyKey: key,
        },
      },
      create: {
        orgId,
        idempotencyKey: key,
        response: response as any,
        expiresAt,
      },
      update: {
        response: response as any,
        expiresAt,
      },
    });
  }
}





