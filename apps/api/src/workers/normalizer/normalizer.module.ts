import { Module } from '@nestjs/common';
import { NormalizerWorker } from './normalizer.worker';
import { PIIScrubberService } from './pii-scrubber.service';
import { EnrichmentService } from './enrichment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [
    NormalizerWorker,
    PIIScrubberService,
    EnrichmentService,
    PrismaService,
  ],
  exports: [NormalizerWorker],
})
export class NormalizerModule {}





