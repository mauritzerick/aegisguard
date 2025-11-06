import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import IPCIDR from 'ip-cidr';

function getClientIp(req: any): string {
  return (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection?.remoteAddress || '').trim();
}

@Injectable()
export class IpAllowGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    if (!userId) return true; // If no user context, skip (e.g., public route). Attach earlier if needed.

    const rules = await this.prisma.ipAllow.findMany({ where: { userId } });
    if (rules.length === 0) return true;

    const ip = getClientIp(req);
    const allowed = rules.some(r => new IPCIDR(r.cidr).contains(ip));
    if (!allowed) throw new ForbiddenException('IP not allowed');
    return true;
  }
}





