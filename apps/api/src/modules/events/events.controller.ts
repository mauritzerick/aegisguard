import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { verifySignature } from './hmac.util';
import { eventQueue } from './events.queue';

@Controller('security-events')
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('ingest')
  async ingest(@Req() req: any, @Body() body: any) {
    const raw: Buffer = req.rawBody || Buffer.from(JSON.stringify(body));
    const ok = verifySignature(req.header('x-signature'), raw, process.env.WEBHOOK_SECRET || '');
    if (!ok) {
      return { ok: false };
    }

    const fingerprint = body.fingerprint || `${body.source}:${body.type}:${body.id || ''}`;
    const created = await this.prisma.securityEvent.upsert({
      where: { fingerprint },
      update: { payload: body, receivedAt: new Date() },
      create: { source: body.source || 'unknown', type: body.type || 'unknown', severity: body.severity || 'LOW', payload: body, fingerprint },
    });
    await eventQueue.add('analyze', { eventId: created.id, severity: created.severity });
    return { ok: true };
  }

  @Get()
  async list(@Query('type') type?: string, @Query('severity') severity?: string) {
    return this.prisma.securityEvent.findMany({
      where: { type: type || undefined, severity: severity || undefined },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });
  }
}
