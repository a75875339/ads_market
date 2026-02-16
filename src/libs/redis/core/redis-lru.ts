import {Redis} from 'ioredis'
import lru, {type Lru} from 'redis-lru'
import {Duration} from '../../../libs/domain/index.js'

import type {RedisLRUConfig} from './types.js'

export class RedisLru<T> {
  private lru: Lru<T>

  constructor(
    public readonly redis: Redis,
    public readonly config: RedisLRUConfig,
  ) {
    const extraParams = config.asLFU
      ? {
          score: (): number => 1,
          increment: true,
        }
      : {}

    this.lru = lru(redis, {
      namespace: config.keyPrefix,
      max: config.maxElements,
      maxAge: config.ttl.toMilliseconds(),
      ...extraParams,
    })
  }

  get(key: string): Promise<T | null> {
    return this.lru.get(key)
  }

  peek(key: string): Promise<T | null> {
    return this.lru.peek(key)
  }

  async values(): Promise<T[]> {
    const values = await this.lru.values()

    return values.filter(Boolean)
  }

  async keys(): Promise<string[]> {
    return this.lru.keys()
  }

  add(key: string, value: T, ttl?: Duration): Promise<void> {
    return this.lru.set(key, value, ttl?.toMilliseconds())
  }
}
