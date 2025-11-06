import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { AuditService } from '../audit/audit.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import argon2 from 'argon2';

const CreateSchema = z.object({ name: z.string().min(1), scopes: z.array(z.string()).default([]) });

function generateApiKey() {
  const prefix = randomBytes(4).toString('hex');
  const secret = randomBytes(24).toString('hex');
  const full = `ak_${prefix}_${secret}`;
  return { prefix, secret, full };
}

@Controller('api-keys')
@UseGuards(AuthGuard)
export class ApiKeysController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Post()
  @UseGuards(CsrfGuard)
  async create(@Req() req: any, @Body(new ZodValidationPipe(CreateSchema)) body: any) {
    const userId: string = req.user.sub;
    const { prefix, secret, full } = generateApiKey();
    const hash = await argon2.hash(secret, { type: argon2.argon2id });
    const lastFour = secret.slice(-4);
    const created = await this.prisma.apiKey.create({ data: { userId, name: body.name, prefix, hash, scopes: body.scopes, lastFour } });
    await this.audit.log({ action: 'apikey.create', resource: created.id, ip: req.ip || '', userAgent: req.get('user-agent') || '', actorUserId: userId });
    return { key: full, prefix, lastFour };
  }

  @Get()
  async list(@Req() req: any) {
    const userId: string = req.user.sub;
    return this.prisma.apiKey.findMany({ where: { userId }, select: { id: true, name: true, prefix: true, lastFour: true, scopes: true, revokedAt: true, createdAt: true } });
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async revoke(@Req() req: any, @Param('id') id: string) {
    const userId: string = req.user.sub;
    await this.prisma.apiKey.updateMany({ where: { id, userId }, data: { revokedAt: new Date() } });
    await this.audit.log({ action: 'apikey.revoke', resource: id, ip: req.ip || '', userAgent: req.get('user-agent') || '', actorUserId: userId });
    return { ok: true };
  }
}
