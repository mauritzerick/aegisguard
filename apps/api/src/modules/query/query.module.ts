import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [QueryController],
  providers: [PrismaService],
})
export class QueryModule {}





