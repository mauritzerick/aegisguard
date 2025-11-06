import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { AuditService } from '../audit/audit.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const eventQueue = new Queue('event-analyze', { connection });

export function startEventWorker(audit: AuditService) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const worker = new Worker('event-analyze', async (job: Job) => {
    const { eventId, severity } = job.data as { eventId: string; severity: string };
    await audit.log({ action: 'event.analyzed', resource: eventId, ip: '', userAgent: '', meta: { severity } });
  }, { connection });
}

