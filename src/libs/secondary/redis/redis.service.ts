import {Injectable} from '@nestjs/common'
import {Duration} from '../../domain/index.js'
import {RedisClient, RedisManagerService} from '../../redis/modules/index.js'
import {defaultRedlockOptions} from './constants.js'
import {RedisLock} from './redis-lock.js'
import type {RedlockOptions} from './types.js'

@Injectable()
export class RedisStorageService {
  constructor(
    private readonly redisManager: RedisManagerService,
    readonly redisClient: RedisClient,
  ) {}

  async expire(key: string, ttl: Duration) {
    return this.redisManager.expire(key, ttl)
  }

  async set<T>(
    key: string,
    value: Record<string, T> | T[] | T,
    ttl: Duration,
  ): Promise<void> {
    await this.redisManager.set(key, value, ttl)
  }

  async get<T = string>(key: string): Promise<T | null> {
    return this.redisManager.get<T>(key)
  }

  async removeByKeys(keys: string[]): Promise<void> {
    await this.redisManager.del(keys)
  }

  async getMulti<T = string>(keys: string[]): Promise<(T | null)[]> {
    return this.redisManager.mget<T>(keys)
  }

  async getAndDelete<T = string>(key: string): Promise<T | null> {
    return this.redisManager.getdel<T>(key)
  }

  async withCache<T>(
    key: string,
    ttl: Duration,
    fn: () => Promise<T>,
    {
      onHit,
      onMiss,
      force,
    }: {
      onHit?: (v: T) => void
      onMiss?: () => void
      force?: boolean
    } = {},
  ): Promise<T> {
    if (!force) {
      const cached = await this.get<T>(key)
      if (cached != null) {
        onHit?.(cached)
        return cached
      }
    }
    onMiss?.()
    const value = await fn()
    await this.set(key, value, ttl)
    return value
  }

  public static RedlockNotAcquiredError = new Error('redlock not acquired')

  async inRedlock<T>(
    lockKey: string,
    handler: () => Promise<T>,
    options: Partial<RedlockOptions> = {},
  ): Promise<T | null> {
    const lock = new RedisLock(this.redisClient)
    const {lockTtl, silent, retryCount, retryDelay} = {
      ...defaultRedlockOptions,
      ...options,
    }

    try {
      const ok = await lock.acquire(
        lockKey,
        lockTtl.toMilliseconds(),
        silent,
        retryCount,
        retryDelay.toMilliseconds(),
      )

      if (!ok) {
        if (silent) {
          return null
        } else {
          throw RedisStorageService.RedlockNotAcquiredError
        }
      }

      return await handler()
    } finally {
      await lock.release(lockKey)
    }
  }
}
