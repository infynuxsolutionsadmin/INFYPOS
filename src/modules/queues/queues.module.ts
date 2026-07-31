import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SyncProcessor } from './processors/sync.processor';
import { QueuesService } from './queues.service';

@Module({})
export class QueuesModule {
  static register(): DynamicModule {
    const isQueueEnabled = process.env.ENABLE_QUEUE === 'true';

    if (!isQueueEnabled) {
      return {
        module: QueuesModule,
        providers: [QueuesService],
        exports: [QueuesService],
      };
    }

    return {
      module: QueuesModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            connection: {
              host: configService.get<string>('redis.host') || 'localhost',
              port: configService.get<number>('redis.port') || 6379,
              password: configService.get<string>('redis.password'),
            },
          }),
          inject: [ConfigService],
        }),
        BullModule.registerQueue({
          name: 'sync-queue',
        }),
      ],
      providers: [QueuesService, SyncProcessor],
      exports: [QueuesService],
    };
  }
}
