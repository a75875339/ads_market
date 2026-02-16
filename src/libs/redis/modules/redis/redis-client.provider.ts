import {Inject, Injectable} from '@nestjs/common'
import type {ILogger} from '../../../logger/index.js'
import type {IRedisModuleOptions} from '../../core/index.js'
import {getRedisUrl} from '../../core/utils/index.js'
import {CONFIG_INJECTOR, LOGGER_INJECTOR} from './injectors.js'
import {RedisClient} from './redis-client.service.js'

@Injectable()
export class RedisClientProvider {
  constructor(
    @Inject(CONFIG_INJECTOR) private readonly config: IRedisModuleOptions,
    @Inject(LOGGER_INJECTOR) private readonly logger: ILogger,
  ) {}

  async getRedisConnection(): Promise<RedisClient> {
    const url = this.config.cache_url || getRedisUrl()
    const redisClient = new RedisClient(url)

    await new Promise<void>((resolve) => {
      redisClient.on('connect', () => {
        this.logger.info('Redis connected')

        if (this.config?.onClientCreated) {
          this.config.onClientCreated(redisClient)
        }

        resolve()
      })

      redisClient.on('error', (error) => {
        this.logger.error({err: error}, 'Redis error')
      })
    })

    redisClient.on('ready', () => {
      this.logger.info('Redis client is ready')
    })

    redisClient.on('error', (err) => {
      this.logger.error({err}, 'Redis client error')

      if (this.config?.onClientError) {
        this.config.onClientError(redisClient)
      }
    })

    redisClient.on('end', () => {
      this.logger.info('Redis disconnected')
    })

    redisClient.on('reconnecting', () => {
      this.logger.info('Redis reconnecting')
    })

    return redisClient
  }
}

@Injectable()
export class QueueRedisClientProvider {
  constructor(
    @Inject(CONFIG_INJECTOR) private readonly config: IRedisModuleOptions,
    @Inject(LOGGER_INJECTOR) private readonly logger: ILogger,
  ) {}

  async getRedisConnection(): Promise<RedisClient> {
    const url = this.config.queue_url || getRedisUrl()
    const redisClient = new RedisClient(url)

    await new Promise<void>((resolve) => {
      redisClient.on('connect', () => {
        this.logger.info('Redis queue connected')

        if (this.config?.onClientCreated) {
          this.config.onClientCreated(redisClient)
        }

        resolve()
      })

      redisClient.on('error', (error) => {
        this.logger.error({err: error}, 'Redis queue error')
      })
    })

    redisClient.on('ready', () => {
      this.logger.info('Redis queue client is ready')
    })

    redisClient.on('error', (err) => {
      this.logger.error({err}, 'Redis queue client error')

      if (this.config?.onClientError) {
        this.config.onClientError(redisClient)
      }
    })

    redisClient.on('end', () => {
      this.logger.info('Redis queue disconnected')
    })

    redisClient.on('reconnecting', () => {
      this.logger.info('Redis queue reconnecting')
    })

    return redisClient
  }
}
