import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * Token Bucket Rate Limiting Guard
 * 
 * Implements per-org and per-IP rate limiting using Redis.
 * 
 * Limits:
 * - Per-org: 10,000 requests/minute (default)
 * - Per-IP: 1,000 requests/minute (default)
 * 
 * Algorithm: Token Bucket
 * - Each bucket starts with max tokens
 * - Each request consumes 1 token
 * - Tokens refill at a constant rate
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;

  // Default limits (can be overridden via config)
  private readonly ORG_LIMIT = 10000; // requests per minute
  private readonly IP_LIMIT = 1000; // requests per minute
  private readonly WINDOW = 60; // seconds

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const org = (request as any).org; // Set by IngestAuthGuard
    const ip = this.getClientIp(request);

    // Check org-level rate limit
    if (org) {
      const orgAllowed = await this.checkRateLimit(
        `rate:org:${org.id}`,
        this.ORG_LIMIT,
      );

      if (!orgAllowed) {
        throw new HttpException(
          {
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Organization rate limit exceeded',
            retryAfter: this.WINDOW,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Check IP-level rate limit
    const ipAllowed = await this.checkRateLimit(`rate:ip:${ip}`, this.IP_LIMIT);

    if (!ipAllowed) {
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'IP rate limit exceeded',
          retryAfter: this.WINDOW,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Check rate limit using Redis
   * Returns true if request is allowed, false if limit exceeded
   */
  private async checkRateLimit(key: string, limit: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.WINDOW * 1000;

    // Use Redis sorted set to track requests in sliding window
    const pipeline = this.redis.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry
    pipeline.expire(key, this.WINDOW * 2);

    const results = await pipeline.exec();

    // Get count from zcard result
    const count = results[1][1] as number;

    return count < limit;
  }

  /**
   * Extract client IP from request
   * Handles X-Forwarded-For, X-Real-IP, etc.
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    if (forwarded) {
      // X-Forwarded-For can be a comma-separated list
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  /**
   * Get current rate limit status (for debugging/monitoring)
   */
  async getRateLimitStatus(orgId: string, ip: string) {
    const now = Date.now();
    const windowStart = now - this.WINDOW * 1000;

    const orgCount = await this.redis.zcount(`rate:org:${orgId}`, windowStart, now);
    const ipCount = await this.redis.zcount(`rate:ip:${ip}`, windowStart, now);

    return {
      org: {
        count: orgCount,
        limit: this.ORG_LIMIT,
        remaining: Math.max(0, this.ORG_LIMIT - orgCount),
      },
      ip: {
        count: ipCount,
        limit: this.IP_LIMIT,
        remaining: Math.max(0, this.IP_LIMIT - ipCount),
      },
    };
  }
}





