import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import IORedis from 'ioredis';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  async health() {
    const db = await this.prisma.$queryRawUnsafe('SELECT 1 as ok').then(() => true).catch(() => false);
    let redisOk = false;
    try {
      const client = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
      await client.ping();
      redisOk = true;
      await client.quit();
    } catch {
      redisOk = false;
    }
    return { db, redis: redisOk };
  }

  @Get('stats/dashboard')
  @UseGuards(AuthGuard)
  async dashboardStats() {
    try {
      // For MVP, return mock stats
      // In production, this would query actual data from ClickHouse, TimescaleDB, etc.
      return {
        logs_24h: 0,
        metrics_24h: 0,
        traces_24h: 0,
        active_monitors: 0,
        slo_count: 0,
      };
    } catch (error: any) {
      console.error('Dashboard stats error:', error.message);
      return {
        logs_24h: 0,
        metrics_24h: 0,
        traces_24h: 0,
        active_monitors: 0,
        slo_count: 0,
      };
    }
  }
}
