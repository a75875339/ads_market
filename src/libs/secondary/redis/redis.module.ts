import {Module} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import type {IRedisModuleOptions} from '../../redis/index.js'
import {getRedisUrl} from '../../redis/index.js'
import {RedisManagerModule} from '../../redis/modules/index.js'
import {RedisStorageService} from './redis.service.js'

@Module({
  imports: [
    RedisManagerModule.register({
      injectLogger: [PinoLogger],
      useLogger: (logger) => logger,
      useConfig(): IRedisModuleOptions {
        return {
          cache_url: getRedisUrl(config.cache_redis),
        }
      },
    }),
  ],
  providers: [RedisStorageService],
  exports: [RedisManagerModule, RedisStorageService],
})
export class RedisModule {}
