import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required: string[] | undefined = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.sub || req.user?.id;
    if (!userId) throw new ForbiddenException('Missing user context');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { permissions: true } } } });
    const userPerms = new Set(user?.role.permissions.map(p => p.code) || []);
    const hasAll = required.every(code => userPerms.has(code));
    if (!hasAll) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}

