import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WsGateway } from '../ws/ws.gateway';
import { ClickHouseService } from '../../services/clickhouse.service';
import { TimescaleService } from '../../services/timescale.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

interface SeedLogsDto {
  count: number;
  pattern?: 'auth' | 'db' | 'latency' | 'mixed';
}

@ApiTags('Demo & Playground')
@Controller('playground')
@UseGuards(AuthGuard)
export class DemoController {
  constructor(
    private readonly wsGateway: WsGateway,
    private readonly clickhouse: ClickHouseService,
    private readonly timescale: TimescaleService,
    private readonly prisma: PrismaService,
  ) {}

  private async getUserOrgId(userId: string): Promise<string> {
    const orgUser = await this.prisma.organizationUser.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    if (orgUser) return orgUser.orgId;

    let defaultOrg = await this.prisma.organization.findFirst({
      where: { slug: 'default' },
    });
    if (!defaultOrg) {
      const crypto = require('crypto');
      const apiKeyPrefix = 'obs_' + crypto.randomBytes(8).toString('hex').substring(0, 16);
      const apiKeyHash = crypto.createHash('sha256').update(apiKeyPrefix + '_secret').digest('hex');
      const secretHash = crypto.createHash('sha256').update('default-secret-key').digest('hex');
      defaultOrg = await this.prisma.organization.create({
        data: { name: 'Default Organization', slug: 'default', apiKeyPrefix, apiKeyHash, secretHash },
      });
    }
    const existingMembership = await this.prisma.organizationUser.findUnique({
      where: { orgId_userId: { orgId: defaultOrg.id, userId } },
    });
    if (!existingMembership) {
      await this.prisma.organizationUser.create({
        data: { orgId: defaultOrg.id, userId, role: 'owner' },
      });
    }
    return defaultOrg.id;
  }

  @Get('config')
  @ApiOperation({ summary: 'Get demo configuration (redacted)' })
  async getConfig() {
    return {
      features: {
        liveWebSocket: true,
        webhookPlayground: true,
        syntheticChecks: true,
        sessionReplay: true,
        serviceMap: true,
        insights: true,
      },
      limits: {
        maxLogsPerSeed: 50000,
        maxBurstSize: 1000,
        wsMaxClients: 100,
      },
      demo_secrets: {
        webhook_secret: '***REDACTED***',
        signing_key: '***REDACTED***',
      },
    };
  }

  @Post('seed/logs')
  @ApiOperation({ summary: 'Generate synthetic logs for demo' })
  async seedLogs(@Body() dto: SeedLogsDto, @Req() req: Request) {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);
    
    const { count, pattern = 'mixed' } = dto;
    const maxCount = 50000;
    const actualCount = Math.min(count, maxCount);

    const logs = [];
    const services = ['api', 'worker', 'db', 'auth', 'web'];
    const levels = ['debug', 'info', 'warn', 'error'];

    const patterns = {
      auth: [
        'User login successful',
        'Authentication failed - invalid credentials',
        'JWT token generated',
        'Session expired',
        'MFA verification required',
      ],
      db: [
        'Query executed successfully',
        'Connection pool exhausted',
        'Slow query detected (>1s)',
        'Transaction rolled back',
        'Database connection timeout',
      ],
      latency: [
        'Request processed in 50ms',
        'High latency warning - 2.5s',
        'Timeout after 5s',
        'Response time degraded',
        'Cache hit - instant response',
      ],
      mixed: [
        'API request received',
        'Processing completed',
        'Error occurred during execution',
        'Warning: resource usage high',
        'Debug: checkpoint reached',
      ],
    };

    const selectedPatterns = patterns[pattern];
    const startTime = Date.now() - actualCount * 100; // Spread over time

    for (let i = 0; i < actualCount; i++) {
      const timestamp = new Date(startTime + i * 100).toISOString();
      const service = services[Math.floor(Math.random() * services.length)];
      const level = this.selectLevel(pattern);
      const message = selectedPatterns[Math.floor(Math.random() * selectedPatterns.length)];

      logs.push({
        ts: timestamp,
        org_id: orgId,
        service,
        level,
        message,
        attrs: {
          request_id: `req_${i}_${Math.random().toString(36).substr(2, 9)}`,
          duration_ms: Math.floor(Math.random() * 500),
          user_id: Math.floor(Math.random() * 100),
        },
        trace_id: undefined,
        span_id: undefined,
        host: 'demo-host',
        ip: '127.0.0.1',
        ua: 'Demo-Generator/1.0',
        pii_masked: false,
        ingest_id: `seed_${Date.now()}_${i}`,
      });
    }

    // Insert into ClickHouse
    try {
      await this.clickhouse.insertLogs(logs);
    } catch (error) {
      // Silent fail for demo - ClickHouse might not be configured
      console.log('ClickHouse not available, skipping log insertion');
    }

    return {
      success: true,
      inserted: actualCount,
      pattern,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('seed/metrics')
  @ApiOperation({ summary: 'Generate synthetic metrics for demo' })
  async seedMetrics(@Body() body: { count: number; metric?: string }, @Req() req: Request) {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);
    
    const { count, metric } = body;
    const maxCount = 10000;
    const actualCount = Math.min(count, maxCount);

    const metrics = [];
    const services = ['api', 'worker', 'web'];
    // Generate metrics spread over the last 2 hours to ensure they're queryable with any time range
    const now = Date.now();
    const twoHoursAgo = now - (2 * 60 * 60 * 1000); // 2 hours ago
    const timeStep = (now - twoHoursAgo) / actualCount; // Spread evenly over 2 hours

    // If no metric specified, generate both http_requests_total and cpu_usage_max
    const metricsToGenerate = metric ? [metric] : ['http_requests_total', 'cpu_usage_max'];
    const metricsPerType = Math.floor(actualCount / metricsToGenerate.length);

    for (const metricName of metricsToGenerate) {
      for (let i = 0; i < metricsPerType; i++) {
        const timestamp = new Date(twoHoursAgo + (i * timeStep + metricsToGenerate.indexOf(metricName) * (timeStep / metricsToGenerate.length)));
        const service = services[Math.floor(Math.random() * services.length)];

        // Generate different value ranges based on metric type
        let value: number;
        let labels: Record<string, any>;

        if (metricName === 'cpu_usage_max' || metricName.includes('cpu')) {
          // CPU usage: 0-100%, with some spikes
          value = Math.random() > 0.9 ? Math.random() * 30 + 70 : Math.random() * 60 + 10; // 10-70% normal, occasional 70-100% spikes
          labels = {
            service,
            host: `host-${Math.floor(Math.random() * 5) + 1}`,
            cpu_core: Math.floor(Math.random() * 8).toString(), // 0-7 cores
          };
        } else {
          // HTTP requests: 0-100
          value = Math.random() * 100;
          labels = {
            service,
            method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
            status: [200, 201, 400, 404, 500][Math.floor(Math.random() * 5)],
          };
        }

        metrics.push({
          ts: timestamp,
          org_id: orgId,
          metric: metricName,
          value: value,
          labels: labels,
          service: service,
          host: 'demo-host',
        });
      }
    }

    // If we didn't generate exactly the requested count (due to rounding), fill the rest
    if (metrics.length < actualCount) {
      const remaining = actualCount - metrics.length;
      const defaultMetric = metricsToGenerate[0];
      for (let i = 0; i < remaining; i++) {
        const timestamp: Date = new Date(twoHoursAgo + ((metrics.length + i) * timeStep));
        const service = services[Math.floor(Math.random() * services.length)];
        
        let value: number;
        let labels: Record<string, any>;
        
        if (defaultMetric === 'cpu_usage_max' || defaultMetric.includes('cpu')) {
          value = Math.random() > 0.9 ? Math.random() * 30 + 70 : Math.random() * 60 + 10;
          labels = {
            service,
            host: `host-${Math.floor(Math.random() * 5) + 1}`,
            cpu_core: Math.floor(Math.random() * 8).toString(),
          };
        } else {
          value = Math.random() * 100;
          labels = {
            service,
            method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
            status: [200, 201, 400, 404, 500][Math.floor(Math.random() * 5)],
          };
        }

        metrics.push({
          ts: timestamp,
          org_id: orgId,
          metric: defaultMetric,
          value: value,
          labels: labels,
          service: service,
          host: 'demo-host',
        });
      }
    }

    // Insert into TimescaleDB
    try {
      await this.timescale.insertMetrics(metrics);
      const metricNames = metricsToGenerate.join(', ');
      console.log(`✅ Inserted ${metrics.length} metrics for org ${orgId}, metrics: ${metricNames}`);
    } catch (error: any) {
      console.error('❌ TimescaleDB metric insertion failed:', error.message);
      console.error('Error details:', error);
      throw error; // Re-throw so frontend gets the error
    }

    return {
      success: true,
      inserted: metrics.length,
      metrics: metricsToGenerate,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('seed/traces')
  @ApiOperation({ summary: 'Generate synthetic traces for demo' })
  async seedTraces(@Body() body: { count: number }, @Req() req: Request) {
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const orgId = await this.getUserOrgId(userId);
    
    const { count } = body;
    const maxCount = 1000;
    const actualCount = Math.min(count, maxCount);

    const spans = [];
    const services = ['api', 'worker', 'db', 'cache', 'web'];
    const operations = ['GET', 'POST', 'PUT', 'DELETE', 'QUERY', 'CACHE_GET', 'CACHE_SET'];
    const startTime = Date.now() - actualCount * 1000;

    for (let i = 0; i < actualCount; i++) {
      const traceId = `trace_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      const service = services[Math.floor(Math.random() * services.length)];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      const timestamp = new Date(startTime + i * 1000);
      const duration = Math.floor(Math.random() * 500) + 10; // 10-510ms
      const status = Math.random() > 0.95 ? 'error' : 'ok';

      // Create root span
      spans.push({
        ts: timestamp,
        org_id: orgId,
        trace_id: traceId,
        span_id: `span_${i}_root`,
        parent_span_id: undefined,
        service,
        operation,
        kind: 'server',
        status,
        duration_ms: duration,
        attrs: {
          http_method: operation,
          http_status: status === 'error' ? 500 : 200,
          component: service,
        },
        resource: {
          service_name: service,
          host: 'demo-host',
        },
        events: [],
        links: [],
      });

      // Create child span 30% of the time
      if (Math.random() < 0.3) {
        const childDuration = Math.floor(duration * 0.5);
        spans.push({
          ts: new Date(timestamp.getTime() + 10),
          org_id: orgId,
          trace_id: traceId,
          span_id: `span_${i}_child`,
          parent_span_id: `span_${i}_root`,
          service: services[Math.floor(Math.random() * services.length)],
          operation: operations[Math.floor(Math.random() * operations.length)],
          kind: 'client',
          status: Math.random() > 0.9 ? 'error' : 'ok',
          duration_ms: childDuration,
          attrs: {
            component: 'database',
          },
          resource: {
            host: 'demo-host',
          },
          events: [],
          links: [],
        });
      }
    }

    // Insert into ClickHouse
    try {
      await this.clickhouse.insertSpans(spans);
    } catch (error) {
      console.log('ClickHouse not available, skipping trace insertion');
    }

    return {
      success: true,
      inserted: spans.length,
      traces: actualCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/spike/:type')
  @ApiOperation({ summary: 'Trigger error/latency spike for demo' })
  async triggerSpike(@Param('type') type: 'error' | 'latency' | 'auth') {
    if (type === 'error') {
      this.wsGateway.triggerBurst(100, 'error');
      return { success: true, type, count: 100, message: 'Triggered error burst' };
    } else if (type === 'latency') {
      this.wsGateway.triggerBurst(50, 'warn');
      return { success: true, type, count: 50, message: 'Triggered latency warnings' };
    } else if (type === 'auth') {
      this.wsGateway.triggerBurst(75, 'error');
      return { success: true, type, count: 75, message: 'Triggered auth failures' };
    }

    return { success: false, message: 'Unknown spike type' };
  }

  private selectLevel(pattern: string): string {
    if (pattern === 'auth') {
      const rand = Math.random();
      if (rand < 0.7) return 'info';
      if (rand < 0.9) return 'warn';
      return 'error';
    } else if (pattern === 'db') {
      const rand = Math.random();
      if (rand < 0.5) return 'debug';
      if (rand < 0.8) return 'info';
      if (rand < 0.95) return 'warn';
      return 'error';
    } else if (pattern === 'latency') {
      const rand = Math.random();
      if (rand < 0.6) return 'info';
      if (rand < 0.9) return 'warn';
      return 'error';
    } else {
      // mixed
      const rand = Math.random();
      if (rand < 0.3) return 'debug';
      if (rand < 0.7) return 'info';
      if (rand < 0.9) return 'warn';
      return 'error';
    }
  }
}

