import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorUserId?: string | null;
    actorApiKeyId?: string | null;
    action: string;
    resource: string;
    ip: string;
    userAgent: string;
    meta?: unknown;
  }) {
    const { actorUserId = null, actorApiKeyId = null, action, resource, ip, userAgent, meta = {} } = params;
    await this.prisma.auditLog.create({
      data: { actorUserId, actorApiKeyId, action, resource, ip, userAgent, meta: meta as any },
    });
  }
}

