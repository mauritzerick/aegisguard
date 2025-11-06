import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected successfully');
    } catch (error: any) {
      console.error('❌ Prisma connection failed:', (error instanceof Error) ? error.message : String(error));
      // Don't throw - allow app to start even if DB is unavailable
      // The app can still serve static endpoints or health checks
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error: any) {
      // Ignore disconnect errors
    }
  }
}





