import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @Optional()
    @InjectQueue('sync-queue')
    private readonly syncQueue?: Queue,
  ) {}

  async addSyncJob(name: string, data: unknown) {
    if (!this.syncQueue) {
      this.logger.warn(
        `Queue is disabled. Job ${name} skipped. Context: ${JSON.stringify(data)}`,
      );
      return null;
    }
    return this.syncQueue.add(name, data);
  }
}
