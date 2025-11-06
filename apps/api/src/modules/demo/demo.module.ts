import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { WsModule } from '../ws/ws.module';
import { ObservabilityModule } from '../../services/observability.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [WsModule, ObservabilityModule],
  controllers: [DemoController],
  providers: [PrismaService],
})
export class DemoModule {}

