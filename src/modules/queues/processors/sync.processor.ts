import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('sync-queue')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  async process(job: Job<unknown, unknown, string>): Promise<unknown> {
    this.logger.log(`Processing queue job ${job.id} of type ${job.name}`);
    await Promise.resolve();
    return { status: 'completed' };
  }
}
