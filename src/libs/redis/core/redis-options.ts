import type {RedisOptions} from 'ioredis'
import {Redis} from 'ioredis'
import {Duration} from '../../../libs/domain/index.js'

export interface IRedisModuleOptions
  extends Omit<RedisOptions, 'commandTimeout'> {
  /**
   * URI scheme to be used to specify connection options as a redis:// URL or rediss:// URL.
   *
   * - redis - https://www.iana.org/assignments/uri-schemes/prov/redis
   * - rediss - https://www.iana.org/assignments/uri-schemes/prov/rediss
   *
   * @example
   * ```ts
   * // Connect to 127.0.0.1:6380, db 4, using password "authpassword":
   * 'redis://:authpassword@127.0.0.1:6380/4'
   * ```
   */
  cache_url: string

  /**
   * Optional queue Redis URL. If not provided, queue-related features will be disabled.
   */
  queue_url?: string

  /**
   * Function to be executed as soon as the client is created.
   *
   * @param client - The new client created
   */
  onClientCreated?: (client: Redis) => void

  /**
   * Function to be executed when it has an error.
   *
   * @param client - The redis client
   */
  onClientError?: (client: Redis) => void

  commandTimeout?: Duration
}
