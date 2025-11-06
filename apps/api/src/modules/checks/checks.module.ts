import { Module } from '@nestjs/common';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ChecksController],
  providers: [ChecksService, PrismaService],
  exports: [ChecksService],
})
export class ChecksModule {}

