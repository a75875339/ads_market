import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {RedisClient} from '../redis/index.js'
import type {Inject} from '../redis/types/index.js'
import {RedisLruService} from './redis-lru.service.js'
import type {RegisterParams} from './types/index.js'

@Module({})
export class RedisLruModule {
  static register<Injects extends Inject>(
    options: RegisterParams<Injects>,
  ): DynamicModule {
    return {
      module: RedisLruModule,
      imports: options.imports || [],
      providers: [
        {
          provide: RedisLruService,
          useFactory: (redis: RedisClient): RedisLruService<Injects> => {
            return new RedisLruService(redis, options.config)
          },
          inject: [RedisClient],
        },
      ],
      exports: [RedisLruService],
    }
  }
}
