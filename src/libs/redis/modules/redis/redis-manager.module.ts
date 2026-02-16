import type {DynamicModule, Provider} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {DiscoveryModule} from '@nestjs/core'
import type {ILogger} from '../../../logger/index.js'
import type {IRedisModuleOptions} from '../../core/index.js'
import {
  CONFIG_INJECTOR,
  LOGGER_INJECTOR,
  QUEUE_REIDIS_CLIENT_INJECTOR,
} from './injectors.js'
import {
  QueueRedisClientProvider,
  RedisClientProvider,
} from './redis-client.provider.js'
import {RedisClient} from './redis-client.service.js'
import {RedisManagerService} from './redis-manager.service.js'
import type {ArrayOfInstances, Inject, RegisterParams} from './types/index.js'

@Module({})
export class RedisManagerModule {
  static register<Injects extends Inject>(
    options: RegisterParams<Injects>,
  ): DynamicModule {
    const providers: Provider[] = [
      {
        provide: LOGGER_INJECTOR,
        useFactory: async (
          ...args: ArrayOfInstances<Injects>
        ): Promise<ILogger> => {
          return options.useLogger(...args)
        },
        inject: options.injectLogger,
      },
      {
        provide: CONFIG_INJECTOR,
        useFactory: async (
          ...args: ArrayOfInstances<Injects>
        ): Promise<IRedisModuleOptions> => {
          return options.useConfig(...args)
        },
        inject: options.inject,
      },
      {
        provide: RedisClient,
        useFactory: async (
          clientProvider: RedisClientProvider,
        ): Promise<RedisClient> => {
          return clientProvider.getRedisConnection()
        },
        inject: [RedisClientProvider],
      },
      RedisClientProvider,
      RedisManagerService,
      {
        provide: QUEUE_REIDIS_CLIENT_INJECTOR,
        useFactory: async (
          config: IRedisModuleOptions,
          clientProvider: QueueRedisClientProvider,
        ): Promise<RedisClient | null> => {
          if (!config.queue_url) {
            return null
          }
          return clientProvider.getRedisConnection()
        },
        inject: [CONFIG_INJECTOR, QueueRedisClientProvider],
      },
      QueueRedisClientProvider,
    ]

    return {
      module: RedisManagerModule,
      providers: providers,
      imports: [DiscoveryModule].concat(options.imports || []),
      exports: [RedisManagerService, RedisClient, QUEUE_REIDIS_CLIENT_INJECTOR],
    }
  }
}
