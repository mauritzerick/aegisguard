import { Module, Global } from '@nestjs/common';
import { ClickHouseService } from './clickhouse.service';
import { TimescaleService } from './timescale.service';
import { RedisStreamsService } from './redis-streams.service';

@Global()
@Module({
  providers: [ClickHouseService, TimescaleService, RedisStreamsService],
  exports: [ClickHouseService, TimescaleService, RedisStreamsService],
})
export class ObservabilityModule {}





