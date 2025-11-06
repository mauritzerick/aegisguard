import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestAuthGuard } from './guards/ingest-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [IngestController],
  providers: [IngestAuthGuard, RateLimitGuard, PrismaService],
})
export class IngestModule {}





