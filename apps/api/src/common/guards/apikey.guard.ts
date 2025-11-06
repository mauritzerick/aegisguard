import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import argon2 from 'argon2';

function parseApiKey(key: string | undefined) {
  if (!key) return null;
  const parts = key.split('_');
  if (parts.length < 3) return null;
  const prefix = parts[1];
  const secret = parts.slice(2).join('_');
  return { prefix, secret };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const provided = req.header('x-api-key');
    const parsed = parseApiKey(provided);
    if (!parsed) throw new UnauthorizedException('Invalid API key');

    const apiKey = await this.prisma.apiKey.findFirst({ where: { prefix: parsed.prefix, revokedAt: null }, include: { user: true } });
    if (!apiKey) throw new UnauthorizedException('API key not found');

    const ok = await argon2.verify(apiKey.hash, parsed.secret);
    if (!ok) throw new UnauthorizedException('API key mismatch');

    req.apiKey = { id: apiKey.id, scopes: apiKey.scopes };
    req.user = { id: apiKey.user.id, roleId: apiKey.user.roleId };
    return true;
  }
}





