import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(AuthGuard, RbacGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('audit:read')
  async list(@Query('actor') actor?: string, @Query('action') action?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const pageNum = page ? Math.max(1, parseInt(String(page), 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(String(limit), 10))) : 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (actor) where.actorUserId = actor;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Get user emails for actorUserIds
    const userIds: string[] = logs.map(log => log.actorUserId).filter((v): v is string => v != null);
    const uniqueUserIds = [...new Set(userIds)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.email]));

    return {
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        userId: log.actorUserId,
        userEmail: log.actorUserId ? (userMap.get(log.actorUserId) || 'Unknown') : 'System',
        metadata: log.meta || {},
        ipAddress: log.ip,
        timestamp: log.createdAt.toISOString(),
      })),
      total,
      page: pageNum,
      limit: limitNum,
    };
  }
}



