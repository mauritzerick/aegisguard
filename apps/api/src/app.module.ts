import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { AuditController } from './modules/audit/audit.controller';
import { AuditService } from './modules/audit/audit.service';
import { UsersController } from './modules/users/users.controller';
import { ApiKeysController } from './modules/apikeys/apikeys.controller';
import { EventsController } from './modules/events/events.controller';
import { IpAllowController } from './modules/ipallow/ipallow.controller';
import { RolesController } from './modules/roles/roles.controller';
import { HealthController } from './modules/health/health.controller';
import { ObservabilityModule } from './services/observability.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { NormalizerModule } from './workers/normalizer/normalizer.module';
import { QueryModule } from './modules/query/query.module';
import { WsModule } from './modules/ws/ws.module';
import { DemoModule } from './modules/demo/demo.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { InsightsModule } from './modules/insights/insights.module';
import { ChecksModule } from './modules/checks/checks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '5m' },
      }),
    }),
    AuthModule,
    ObservabilityModule,
    IngestModule,
    NormalizerModule,
    QueryModule,
    WsModule,
    DemoModule,
    WebhookModule,
    InsightsModule,
    ChecksModule,
  ],
  controllers: [
    AuditController,
    UsersController,
    ApiKeysController,
    EventsController,
    IpAllowController,
    RolesController,
    HealthController,
  ],
  providers: [PrismaService, AuditService],
})
export class AppModule {}
